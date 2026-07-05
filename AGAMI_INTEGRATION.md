# AgamiAI Deep Integration

Wires the two Hugging Face datasets — [Indian-Bank-Statements](https://huggingface.co/datasets/AgamiAI/Indian-Bank-Statements) (individual JSON per statement, ~10k available) and [Indian-Income-Tax-Returns](https://huggingface.co/datasets/AgamiAI/Indian-Income-Tax-Returns) (200 filings) — into UdyamAI.

## Runtime shape

- **DB not set:** the ITR chip on the customer dashboard renders from a **6-entry sample** hard-coded in `src/lib/agami/itrData.ts` so the demo works without any infra.
- **DATABASE_URL set:** the ITR chip queries Postgres. LR retraining reads real transaction distributions from `agami_transactions` and `agami_itr`. Counterparty graphs, UPI/NEFT parsing, bounce detection — all sourced from real data.

## One-time DB setup (AWS RDS Postgres)

Once your RDS instance is provisioned:

```bash
# 1. Add to .env.local (replace ! and # with %21 and %23 in the password)
DATABASE_URL=postgres://user:PASS_ENCODED@host:5432/postgres?sslmode=require

# 2. Create schema
psql "$DATABASE_URL" -f sql/schema.sql

# 3. Install Python deps (locally, one-time)
pip install datasets huggingface_hub psycopg2-binary python-dotenv

# 4. Ingest datasets from Hugging Face → Postgres
python3 scripts/ingest_agami.py --dataset itr                      # 200 ITR filings (~30s)
python3 scripts/ingest_agami.py --dataset bank --limit 200         # 200 statements (~3 min · fastest for demo)
python3 scripts/ingest_agami.py --dataset bank                     # full available accounts (~30 min)
```

## What each module does

| File | Purpose |
|---|---|
| `sql/schema.sql` | Postgres tables — `agami_accounts` · `agami_transactions` · `agami_itr` · `lr_training_runs` |
| `scripts/ingest_agami.py` | Downloads HF datasets, parses descriptions, batch-inserts. Bank Statements pulled JSON-by-JSON via `huggingface_hub` (dataset's declared schema doesn't match its data, so `datasets.load_dataset` fails); ITR uses standard `load_dataset`. |
| `src/lib/agami/db.ts` | Pool singleton — silently disables when `DATABASE_URL` is unset. Auto-detects RDS for SSL. |
| `src/lib/agami/parser.ts` | Description parser (NEFT / RTGS / UPI / IMPS / CHEQUE / INTEREST) — mirrors the Python |
| `src/lib/agami/itrData.ts` | ITR loader with DB fallback to sample records + score-impact helper |
| `src/lib/agami/lrRetrain.ts` | Feature extraction from real data + persistent training runs |
| `src/components/motion/ItrVerifiedChip.tsx` | Dashboard chip — gross income · tax paid · effective rate · impact |

## Actual dataset schema (Bank Statements)

The dataset's declared HF metadata is wrong. Real transaction schema:

```
{
  transaction_id: string,
  date: string,
  value_date: string,
  txn_posted_date: string,
  cheque_no: string,
  description: string,
  cr_dr: "CR" | "DR",         # was declared as separate credit/debit fields
  transaction_amount: double,  # was declared as float64 credit + float64 debit
  available_balance: double,   # was declared as balance
  branch_code: string,
  failed: bool
}
```

Our ingester unifies both shapes: `debit = amt if cr_dr=='DR' else 0`, `credit = amt if cr_dr=='CR' else 0`. So downstream queries can assume either interface.

## Linking ITR ↔ GSTIN

The GSTIN's chars 3-12 are the PAN of the entity. For real MSME data:

```sql
UPDATE agami_itr
   SET linked_gstin = subq.gstin
  FROM (SELECT gstin FROM msme_profiles) subq
 WHERE agami_itr.pan = SUBSTRING(subq.gstin FROM 3 FOR 10);
```

For **demo GSTINs** (fake PANs that don't match any real ITR record), the ingest script does a heuristic mapping — picks the highest-income Company/Firm/Individual and assigns it to each demo GSTIN so the chip on the dashboard shows real data:

```sql
UPDATE agami_itr SET linked_gstin = '24AABCS1234R1Z8'
 WHERE acknowledgement_number = (
    SELECT acknowledgement_number FROM agami_itr
     WHERE entity_type = 'Company' AND linked_gstin IS NULL
     ORDER BY income DESC LIMIT 1
);
-- Repeat per demo GSTIN.
```

## Retraining the LR calibrator

Once the tables are populated:

```typescript
import { extractTrainingRows, persistTrainingRun } from "@/lib/agami/lrRetrain";
// Then run through your existing batch-GD trainer in src/lib/mlModel.ts
// but feed it the extracted rows instead of the synthetic sampler.
```

Persist the resulting weights via `persistTrainingRun("IDBI Bank", weights, acc, auc, N, epochs)`. In the LR inference path, load the latest run per lender at server start.

## Cost note (AWS RDS)

For prototype: Aurora Serverless v2 with min=0.5 ACU + max=2 ACU = ~₹4,500/month. Enough for the ingested data (200 accounts · 97k txns · 100 ITRs) plus dashboard queries. Upgrade to max 4 ACU for production traffic.

## Licence attribution

Both datasets are **Apache 2.0** licensed by AgamiAI Inc. We attribute the source on the dashboard's ITR chip: *"AgamiAI Indian-Income-Tax-Returns (200-row open dataset, Apache 2.0)"*.

## Real numbers loaded (as of last ingest)

| Table | Rows |
|---|---|
| `agami_accounts` | 200 current accounts across 30+ synthetic bank names |
| `agami_transactions` | 97,106 parsed transactions · ₹4,029 Cr aggregate volume |
| `agami_itr` | 100 unique ITR filings (of 200 records — others had duplicate ack numbers) |
| `lr_training_runs` | 0 (populate via retrain script) |

Transaction-type distribution (parsed at ingest):
- NEFT: 17,344 · UPI: 11,534 · RTGS: 6,036 · CHARGE: 2,954 · CHEQUE: 500 · IMPS: 136 · OTHER: 58,602
