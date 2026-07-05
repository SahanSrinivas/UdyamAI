# AgamiAI Deep Integration

Wires the two Hugging Face datasets — [Indian-Bank-Statements](https://huggingface.co/datasets/AgamiAI/Indian-Bank-Statements) (10k current accounts, 1.37GB) and [Indian-Income-Tax-Returns](https://huggingface.co/datasets/AgamiAI/Indian-Income-Tax-Returns) (200 filings) — into UdyamAI.

## Runtime shape

- **DB not set:** the ITR chip on the customer dashboard renders from a **6-entry sample** hard-coded in `src/lib/agami/itrData.ts` so the demo works without any infra.
- **DATABASE_URL set:** the ITR chip queries Postgres. LR retraining reads real transaction distributions from `agami_transactions` and `agami_itr`. Counterparty graphs, UPI/NEFT parsing, bounce detection — all sourced from real data.

## One-time DB setup (AWS RDS Postgres)

Once your RDS instance is provisioned:

```bash
# 1. Add to .env.local
DATABASE_URL=postgres://user:pass@your-rds.rds.amazonaws.com:5432/udyamai

# 2. Create schema
psql "$DATABASE_URL" -f sql/schema.sql

# 3. Install Python deps (locally, one-time)
pip install datasets psycopg2-binary python-dotenv

# 4. Ingest datasets from Hugging Face → Postgres
python3 scripts/ingest_agami.py --dataset itr             # 200 ITR filings (~30s)
python3 scripts/ingest_agami.py --dataset bank --limit 500   # 500 accounts first (test)
python3 scripts/ingest_agami.py --dataset bank            # full 10k accounts (~15 min)
```

## What each module does

| File | Purpose |
|---|---|
| `sql/schema.sql` | Postgres tables — `agami_accounts` · `agami_transactions` · `agami_itr` · `lr_training_runs` |
| `scripts/ingest_agami.py` | Fetches HF datasets, parses descriptions, batch-inserts. Uses `execute_values` for speed. |
| `src/lib/agami/db.ts` | Pool singleton — silently disables when `DATABASE_URL` is unset. Auto-detects RDS for SSL. |
| `src/lib/agami/parser.ts` | Description parser (NEFT / RTGS / UPI / IMPS / CHEQUE / INTEREST) — mirrors the Python |
| `src/lib/agami/itrData.ts` | ITR loader with DB fallback to sample records + score-impact helper |
| `src/lib/agami/lrRetrain.ts` | Feature extraction from real data + persistent training runs |
| `src/components/motion/ItrVerifiedChip.tsx` | Dashboard chip — gross income · tax paid · effective rate · impact |

## Linking ITR ↔ GSTIN

The GSTIN's chars 3-12 are the PAN of the entity. So:

```sql
UPDATE agami_itr
   SET linked_gstin = subq.gstin
  FROM (SELECT gstin FROM msme_profiles) subq
 WHERE agami_itr.pan = SUBSTRING(subq.gstin FROM 3 FOR 10);
```

Same trick for `agami_accounts.linked_gstin` if we ever have a real MSME → account mapping.

## Retraining the LR calibrator

Once the tables are populated:

```typescript
import { extractTrainingRows, persistTrainingRun } from "@/lib/agami/lrRetrain";
// Then run through your existing batch-GD trainer in src/lib/mlModel.ts
// but feed it the extracted rows instead of the synthetic sampler.
```

Persist the resulting weights via `persistTrainingRun("IDBI Bank", weights, acc, auc, N, epochs)`. In the LR inference path, load the latest run per lender at server start.

## Cost note (AWS RDS)

For prototype: `db.t4g.micro` Multi-AZ = ~₹2,500/month. Enough for the 10k accounts + 200 ITRs. Upgrade to `db.t4g.medium` for production traffic.

## Licence attribution

Both datasets are **Apache 2.0** licensed by AgamiAI Inc. We attribute the source on the dashboard's ITR chip: *"AgamiAI Indian-Income-Tax-Returns (200-row open dataset, Apache 2.0)"*.
