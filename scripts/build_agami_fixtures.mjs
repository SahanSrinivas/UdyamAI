#!/usr/bin/env node
/**
 * Build bundled AgamiAI fixtures · replaces the old Postgres ingest.
 *
 * Downloads the two AgamiAI open datasets (Apache 2.0) straight from the
 * Hugging Face CDN and writes them into src/data/agami/ as plain JSON. The
 * app reads those files at runtime, so there is no database anywhere in the
 * request path — which is what lets the whole thing run as one stateless
 * Cloud Run container.
 *
 * Usage:
 *   node scripts/build_agami_fixtures.mjs                 # both datasets
 *   node scripts/build_agami_fixtures.mjs --dataset itr
 *   node scripts/build_agami_fixtures.mjs --limit 40      # cap bank accounts
 *
 * No Python, no psycopg2, no credentials. Re-run it whenever you want to
 * refresh the bundled slice; the output is deterministic for a given dataset
 * revision, so a re-run with no upstream change produces no diff.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "src", "data", "agami");

const BANK_REPO = "AgamiAI/Indian-Bank-Statements";
const ITR_REPO = "AgamiAI/Indian-Income-Tax-Returns";
const LICENSE = "apache-2.0";
const CONCURRENCY = 12;

/**
 * GSTIN → ITR linkage. In the RDS build this lived in agami_itr.linked_gstin,
 * populated by a one-off matcher. It is a fixed six-row mapping, so it belongs
 * in source: these are the legal names the login cards in src/lib/auth.ts show.
 * Matched on the dataset's own `name` field — the build fails loudly if a name
 * stops resolving, rather than silently dropping the ITR chip.
 */
const GSTIN_TO_ITR_NAME = {
  "24AABCS1234R1Z8": "ORBIT TAR PRODUCTS",
  "37AAECV5678K1ZL": "ZENITH EXPORTS",
  "33AAJPM9012L1ZK": "PREMIER EXPORTS",
  "08AAECH2233N1ZH": "NOVA SOLUTIONS",
  "09AAAPK4567P2Z3": "PRIME SOLUTIONS",
  "33AAHFK7890Q1ZH": "RIYA DESHMUKH",
};

const CITY_KEYWORDS = [
  "Mumbai", "Delhi", "Bangalore", "Bengaluru", "Pune", "Chennai", "Kolkata",
  "Hyderabad", "Ahmedabad", "Jaipur", "Surat", "Coimbatore", "Kanpur",
  "Nagpur", "Vizag", "Visakhapatnam", "Kochi", "Lucknow",
];

// ─── HF fetch helpers ───────────────────────────────────────────

async function hfTree(repo) {
  const url = `https://huggingface.co/api/datasets/${repo}/tree/main?recursive=true&limit=1000`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`tree ${repo}: ${res.status} ${res.statusText}`);
  const tree = await res.json();
  return tree
    .filter((e) => e.type === "file" && e.path.endsWith(".json"))
    .map((e) => e.path)
    .sort();
}

async function hfJson(repo, path, attempt = 0) {
  const url = `https://huggingface.co/datasets/${repo}/resolve/main/${encodeURI(path)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.json();
  } catch (err) {
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 400 * 2 ** attempt));
      return hfJson(repo, path, attempt + 1);
    }
    throw new Error(`fetch ${path}: ${err.message}`);
  }
}

/** Fetch every path with bounded concurrency, preserving input order. */
async function fetchAll(repo, paths, label) {
  const out = new Array(paths.length);
  let next = 0;
  let done = 0;
  async function worker() {
    while (next < paths.length) {
      const i = next++;
      out[i] = await hfJson(repo, paths[i]);
      if (++done % 50 === 0 || done === paths.length) {
        process.stdout.write(`\r  ${label}: ${done}/${paths.length}`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  process.stdout.write("\n");
  return out;
}

// ─── Normalisation ──────────────────────────────────────────────

function deriveCity(address) {
  if (!address) return null;
  const upper = address.toUpperCase();
  return CITY_KEYWORDS.find((c) => upper.includes(c.toUpperCase())) ?? null;
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * The dataset ships two transaction shapes across its four directories:
 *   Type1 → debit / credit / balance
 *   Type2 → cr_dr + transaction_amount / available_balance
 * Both collapse to the same nine fields.
 */
function normalizeTxn(t) {
  const crDr = String(t.cr_dr ?? "").toUpperCase();
  const amount = t.transaction_amount != null ? num(t.transaction_amount) : null;
  const debit = amount != null ? (crDr === "DR" ? amount : 0) : num(t.debit);
  const credit = amount != null ? (crDr === "CR" ? amount : 0) : num(t.credit);
  return [
    t.date ?? null,
    t.value_date ?? null,
    t.description ?? "",
    t.cheque_no || null,
    debit,
    credit,
    num(t.available_balance ?? t.balance),
    t.branch_code || null,
    t.failed ? 1 : 0,
  ];
}

const TXN_COLUMNS = [
  "date", "valueDate", "description", "chequeNo",
  "debit", "credit", "balance", "branchCode", "failed",
];

function writeJson(name, payload) {
  mkdirSync(OUT_DIR, { recursive: true });
  const body = JSON.stringify(payload);
  writeFileSync(join(OUT_DIR, name), body + "\n");
  console.log(`  → src/data/agami/${name}  (${(Buffer.byteLength(body) / 1024).toFixed(0)} KB)`);
}

// ─── Bank statements ────────────────────────────────────────────

async function buildBank(limit) {
  console.log(`Bank statements · ${BANK_REPO}`);
  const paths = await hfTree(BANK_REPO);
  const records = await fetchAll(BANK_REPO, paths, "statements");

  // The repo carries the same statements twice — once rendered digitally and
  // once scanned. Account number is the natural key; first occurrence wins so
  // the result is stable regardless of directory ordering.
  const accounts = [];
  const byAccount = {};
  const seen = new Set();
  let skipped = 0;

  for (const rec of records) {
    const accountId = rec.account_number || rec.customer_id;
    if (!accountId) { skipped++; continue; }
    if (seen.has(accountId)) continue;
    seen.add(accountId);

    accounts.push({
      accountId,
      bankName: rec.bank_name ?? null,
      accountHolder: rec.account_holder ?? null,
      address: rec.account_holder_address ?? null,
      city: deriveCity(rec.account_holder_address || rec.branch_name || ""),
      accountNumber: rec.account_number ?? null,
      ifscCode: rec.ifsc_code ?? null,
      branchName: rec.branch_name ?? null,
      accountType: rec.account_type ?? null,
      currency: rec.currency ?? "INR",
      openingBalance: num(rec.opening_balance),
      closingBalance: num(rec.closing_balance),
      startDate: rec.start_date ?? null,
      endDate: rec.end_date ?? null,
      statementDate: rec.statement_date ?? null,
    });
    byAccount[accountId] = (rec.transactions ?? []).map(normalizeTxn);
  }

  accounts.sort((a, b) => a.accountId.localeCompare(b.accountId));
  const kept = limit ? accounts.slice(0, limit) : accounts;
  const keptIds = new Set(kept.map((a) => a.accountId));
  for (const id of Object.keys(byAccount)) {
    if (!keptIds.has(id)) delete byAccount[id];
  }

  const txnCount = Object.values(byAccount).reduce((n, t) => n + t.length, 0);
  const bounceCount = Object.values(byAccount)
    .reduce((n, txns) => n + txns.filter((t) => t[8] === 1).length, 0);

  console.log(`  ${records.length} files · ${kept.length} unique accounts · ` +
              `${txnCount} transactions · ${bounceCount} bounces` +
              (skipped ? ` · ${skipped} skipped (no account number)` : ""));

  const meta = { source: BANK_REPO, license: LICENSE, accountCount: kept.length, txnCount };
  writeJson("accounts.json", { ...meta, accounts: kept });
  writeJson("transactions.json", { ...meta, columns: TXN_COLUMNS, byAccount });
}

// ─── ITR filings ────────────────────────────────────────────────

async function buildItr() {
  console.log(`ITR filings · ${ITR_REPO}`);
  const paths = await hfTree(ITR_REPO);
  const records = await fetchAll(ITR_REPO, paths, "filings");

  const byAck = new Map();
  for (const rec of records) {
    const ack = rec.acknowledgement_number;
    if (!ack || byAck.has(ack)) continue;
    const fin = rec.financials ?? {};
    byAck.set(ack, {
      pan: rec.pan,
      acknowledgementNumber: ack,
      name: rec.name,
      city: rec.city ?? null,
      state: rec.state ?? null,
      entityType: rec.entity ?? null,
      form: rec.form ?? null,
      assessmentYear: rec.assessment_year ?? null,
      filingDate: rec.filing_date ?? null,
      lateFiling: Boolean(rec.late_filing),
      income: num(fin.income),
      tax: num(fin.tax),
      cess: num(fin.cess),
      interest: num(fin.interest),
      loss: num(fin.loss),
      totalPayable: num(fin.total_payable),
      linkedGstin: null,
    });
  }

  const filings = [...byAck.values()]
    .sort((a, b) => a.acknowledgementNumber.localeCompare(b.acknowledgementNumber));

  // Attach the six demo GSTINs. Ties (same legal name, different PAN) resolve
  // to the most recent assessment year, then the lowest acknowledgement number.
  const missing = [];
  for (const [gstin, legalName] of Object.entries(GSTIN_TO_ITR_NAME)) {
    const matches = filings
      .filter((f) => (f.name ?? "").toUpperCase() === legalName)
      .sort((a, b) =>
        String(b.assessmentYear).localeCompare(String(a.assessmentYear)) ||
        a.acknowledgementNumber.localeCompare(b.acknowledgementNumber));
    if (matches.length === 0) { missing.push(`${gstin} → "${legalName}"`); continue; }
    matches[0].linkedGstin = gstin;
    console.log(`  linked ${gstin} → ${matches[0].name} (${matches[0].pan}, ` +
                `${matches[0].form}, AY ${matches[0].assessmentYear})`);
  }
  if (missing.length) {
    throw new Error(
      `No ITR record matches these demo GSTINs:\n    ${missing.join("\n    ")}\n` +
      `  The upstream dataset changed. Update GSTIN_TO_ITR_NAME in this script\n` +
      `  and the legalName fields in src/lib/auth.ts to match.`
    );
  }

  console.log(`  ${records.length} files · ${filings.length} unique filings`);
  writeJson("itr.json", {
    source: ITR_REPO, license: LICENSE, filingCount: filings.length, filings,
  });
}

// ─── Entrypoint ─────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dataset = args.includes("--dataset")
    ? args[args.indexOf("--dataset") + 1] : "all";
  const limit = args.includes("--limit")
    ? Number(args[args.indexOf("--limit") + 1]) : null;

  if (!["all", "bank", "itr"].includes(dataset)) {
    throw new Error("--dataset must be one of: all, bank, itr");
  }

  const started = Date.now();
  if (dataset === "itr" || dataset === "all") await buildItr();
  if (dataset === "bank" || dataset === "all") await buildBank(limit);
  console.log(`Done in ${((Date.now() - started) / 1000).toFixed(1)}s`);
}

main().catch((err) => {
  console.error(`\n✗ ${err.message}`);
  process.exit(1);
});
