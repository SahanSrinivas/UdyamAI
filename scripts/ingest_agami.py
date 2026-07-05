#!/usr/bin/env python3
"""Ingest AgamiAI HuggingFace datasets into Postgres.

Requires:
    pip install datasets huggingface_hub psycopg2-binary python-dotenv

Usage:
    export DATABASE_URL=postgres://user:pass@your-rds.rds.amazonaws.com:5432/postgres
    python3 scripts/ingest_agami.py --dataset itr             # 200 rows via datasets
    python3 scripts/ingest_agami.py --dataset bank            # via direct JSON fetch
    python3 scripts/ingest_agami.py --dataset all
    python3 scripts/ingest_agami.py --dataset bank --limit 500   # cap accounts

Notes:
- ITR dataset loads cleanly via `datasets.load_dataset`
- Bank Statements dataset has a schema mismatch in HF metadata (declared
  credit/debit vs actual cr_dr + transaction_amount). We bypass the datasets
  library and download individual JSON files via `huggingface_hub`.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path

# Environment
try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parent.parent / ".env.local")
except ImportError:
    pass

try:
    import psycopg2
    from psycopg2.extras import execute_values
except ImportError:
    sys.exit("pip install psycopg2-binary")

try:
    from datasets import load_dataset
except ImportError:
    sys.exit("pip install datasets")

try:
    from huggingface_hub import hf_hub_download, list_repo_files
except ImportError:
    sys.exit("pip install huggingface_hub")


DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    sys.exit("Set DATABASE_URL — see AGAMI_INTEGRATION.md")


BANK_REPO = "AgamiAI/Indian-Bank-Statements"
ITR_REPO = "AgamiAI/Indian-Income-Tax-Returns"


# ─── Description parser · matches src/lib/agami/parser.ts ───────

NEFT_RE = re.compile(r"NEFT\s+(Cr|Dr)-?([A-Z0-9]+)?-?([A-Z0-9]+)?-?(.*?)(?:--|$)", re.I)
RTGS_RE = re.compile(r"RTGS\s+(Cr|Dr)-?([A-Z0-9]+)?-?([A-Z0-9]+)?-?(.*?)(?:--|$)", re.I)
UPI_RE = re.compile(r"UPI[/-](CR|DR)[/-](\d+)?[/-]?([^/]+)?[/-]?(.+)?", re.I)
IMPS_RE = re.compile(r"IMPS[/-]([^/]+)[/-]?(CR|DR)[/-]?([^/]+)?[/-]?(.+)?", re.I)
CHEQUE_RE = re.compile(r"CHEQUE\s+(PAID|CLEARED|RETURNED|BOUNCED)", re.I)
INTEREST_RE = re.compile(r"INTEREST\s+(CR|DR|CREDIT|CHARGE)", re.I)


def parse_description(desc: str, cr_dr: str) -> dict:
    """Extract txn_type, direction, counterparty, ifsc, ref_number.

    Uses cr_dr (from the dataset's cr_dr field) as the primary direction hint
    when regex fails to disambiguate.
    """
    d = (desc or "").strip()
    cr_dr = (cr_dr or "").upper()
    direction = "in" if cr_dr == "CR" else "out" if cr_dr == "DR" else "unknown"

    m = NEFT_RE.search(d)
    if m:
        return {"type": "NEFT", "direction": "in" if m.group(1).upper() == "CR" else "out",
                "ref_number": m.group(2), "ifsc": m.group(3),
                "counterparty": clean_name(m.group(4))}

    m = RTGS_RE.search(d)
    if m:
        return {"type": "RTGS", "direction": "in" if m.group(1).upper() == "CR" else "out",
                "ref_number": m.group(2), "ifsc": m.group(3),
                "counterparty": clean_name(m.group(4))}

    m = UPI_RE.search(d)
    if m:
        return {"type": "UPI", "direction": "in" if m.group(1).upper() == "CR" else "out",
                "ref_number": m.group(2), "ifsc": None,
                "counterparty": clean_name(m.group(3) or m.group(4))}

    m = IMPS_RE.search(d)
    if m:
        return {"type": "IMPS", "direction": "in" if m.group(2) and m.group(2).upper() == "CR" else "out",
                "ref_number": None, "ifsc": None,
                "counterparty": clean_name(m.group(4) or m.group(1))}

    if CHEQUE_RE.search(d):
        return {"type": "CHEQUE", "direction": direction, "ref_number": None,
                "ifsc": None, "counterparty": None}

    if INTEREST_RE.search(d):
        return {"type": "INTEREST", "direction": direction, "ref_number": None,
                "ifsc": None, "counterparty": None}

    if re.search(r"CHARGE|GST", d, re.I):
        return {"type": "CHARGE", "direction": "out", "ref_number": None,
                "ifsc": None, "counterparty": None}

    return {"type": "OTHER", "direction": direction, "ref_number": None,
            "ifsc": None, "counterparty": None}


def clean_name(s):
    if not s:
        return None
    s = s.strip().rstrip("-").rstrip(":")
    if len(s) < 2:
        return None
    return s[:120]


def normalize_ts(v):
    if v is None: return None
    if isinstance(v, datetime): return v
    if isinstance(v, str):
        for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d",
                    "%d-%b-%Y", "%d/%m/%Y"):
            try: return datetime.strptime(v, fmt)
            except ValueError: continue
    return None


def normalize_date(v):
    ts = normalize_ts(v)
    return ts.date() if ts else None


CITY_KEYWORDS = ["Mumbai", "Delhi", "Bangalore", "Bengaluru", "Pune", "Chennai",
                 "Kolkata", "Hyderabad", "Ahmedabad", "Jaipur", "Surat", "Coimbatore",
                 "Kanpur", "Nagpur", "Vizag", "Visakhapatnam", "Kochi", "Lucknow"]


def derive_city(addr: str):
    if not addr:
        return None
    a = addr.upper()
    for c in CITY_KEYWORDS:
        if c.upper() in a:
            return c
    return None


# ─── Bank statements ingestion (JSON files via HF hub) ─────────

def ingest_bank_statements(conn, limit=None):
    print(f"Listing files in {BANK_REPO}...")
    files = list_repo_files(BANK_REPO, repo_type="dataset")
    json_files = [f for f in files if f.endswith(".json")]
    if limit:
        json_files = json_files[:limit]
    print(f"  {len(json_files)} JSON files to fetch")

    with conn.cursor() as cur:
        accs, txns = [], []
        n_ok = 0

        for i, path in enumerate(json_files):
            try:
                fp = hf_hub_download(BANK_REPO, path, repo_type="dataset")
                with open(fp) as f:
                    rec = json.load(f)
            except Exception as e:
                print(f"  ! skip {path}: {e}", file=sys.stderr)
                continue

            acc_id = rec.get("account_number") or rec.get("customer_id") or f"ACC-{i}"
            accs.append((
                acc_id, rec.get("bank_name"), rec.get("account_holder"),
                rec.get("account_holder_address"), rec.get("account_number"),
                rec.get("ifsc_code"), rec.get("micr_code"), rec.get("branch_name"),
                rec.get("branch_code"), rec.get("branch_phone"), rec.get("account_type"),
                rec.get("currency", "INR"), rec.get("customer_id"),
                rec.get("opening_balance"), rec.get("closing_balance"),
                normalize_ts(rec.get("start_date")), normalize_ts(rec.get("end_date")),
                normalize_ts(rec.get("statement_date")), rec.get("interest_rate"),
                derive_city(rec.get("account_holder_address", "") or rec.get("branch_name", "")),
                None,
            ))

            for t in (rec.get("transactions") or []):
                cr_dr = (t.get("cr_dr") or "").upper()
                amt = float(t.get("transaction_amount") or 0.0)
                debit = amt if cr_dr == "DR" else 0.0
                credit = amt if cr_dr == "CR" else 0.0
                bal = t.get("available_balance") or t.get("balance") or 0.0
                parsed = parse_description(t.get("description", ""), cr_dr)
                txns.append((
                    acc_id, normalize_ts(t.get("date")), normalize_date(t.get("value_date")),
                    t.get("description"), t.get("cheque_no"),
                    debit, credit, bal, t.get("branch_code"),
                    bool(t.get("failed")), parsed["type"], parsed["direction"],
                    parsed["counterparty"], parsed["ifsc"], parsed["ref_number"],
                ))
            n_ok += 1

            if len(accs) >= 100:
                _flush(cur, accs, txns)
                conn.commit()
                print(f"  {n_ok:4} accounts · {len(txns):>5} txns / batch", flush=True)
                accs, txns = [], []

        if accs:
            _flush(cur, accs, txns)
            conn.commit()

    print(f"✓ Ingested {n_ok} bank statement accounts")


def _flush(cur, accs, txns):
    execute_values(cur, """
        INSERT INTO agami_accounts (
            account_id, bank_name, account_holder, account_holder_address,
            account_number, ifsc_code, micr_code, branch_name, branch_code,
            branch_phone, account_type, currency, customer_id,
            opening_balance, closing_balance, start_date, end_date,
            statement_date, interest_rate, city, linked_gstin
        ) VALUES %s
        ON CONFLICT (account_id) DO NOTHING
    """, accs, page_size=100)

    execute_values(cur, """
        INSERT INTO agami_transactions (
            account_id, txn_date, value_date, description, cheque_no,
            debit, credit, balance, branch_code, failed,
            txn_type, direction, counterparty, counterparty_ifsc, ref_number
        ) VALUES %s
    """, txns, page_size=500)


# ─── ITR ingestion ──────────────────────────────────────────────

def ingest_itr(conn):
    print(f"Loading {ITR_REPO}...")
    ds = load_dataset(ITR_REPO, split="train")
    rows = []

    for rec in ds:
        f = rec.get("financials") or {}
        rows.append((
            rec.get("pan"), rec.get("acknowledgement_number"),
            rec.get("name"), rec.get("address"), rec.get("area"),
            rec.get("city"), rec.get("state"), rec.get("pincode"),
            rec.get("state_code"), rec.get("country_code", "91-INDIA"),
            rec.get("aadhaar"), rec.get("entity"), rec.get("form"),
            rec.get("assessment_year"),
            normalize_date(rec.get("filing_date")),
            normalize_ts(rec.get("filing_time")),
            bool(rec.get("late_filing")), rec.get("signatory"),
            f.get("income"), f.get("tax"), f.get("cess"),
            f.get("interest"), f.get("loss"), f.get("total_payable"),
            None,
        ))

    with conn.cursor() as cur:
        execute_values(cur, """
            INSERT INTO agami_itr (
                pan, acknowledgement_number, name, address, area, city, state,
                pincode, state_code, country_code, aadhaar, entity_type, form,
                assessment_year, filing_date, filing_time, late_filing, signatory,
                income, tax, cess, interest, loss, total_payable, linked_gstin
            ) VALUES %s
            ON CONFLICT (acknowledgement_number) DO NOTHING
        """, rows, page_size=200)
        conn.commit()

    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM agami_itr")
        print(f"✓ agami_itr now has {cur.fetchone()[0]} records")


# ─── Entrypoint ─────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dataset", choices=["bank", "itr", "all"], default="all")
    ap.add_argument("--limit", type=int, default=None,
                    help="Cap on bank account JSON files")
    args = ap.parse_args()

    conn = psycopg2.connect(DATABASE_URL, sslmode="require")
    try:
        if args.dataset in ("itr", "all"):
            ingest_itr(conn)
        if args.dataset in ("bank", "all"):
            ingest_bank_statements(conn, args.limit)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
