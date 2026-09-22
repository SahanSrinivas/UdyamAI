# AgamiAI Deep Integration

Wires the two Hugging Face datasets — [Indian-Bank-Statements](https://huggingface.co/datasets/AgamiAI/Indian-Bank-Statements) and [Indian-Income-Tax-Returns](https://huggingface.co/datasets/AgamiAI/Indian-Income-Tax-Returns) — into UdyamAI.

Both are **Apache 2.0** licensed by AgamiAI Inc. and attributed in-product.

## Runtime shape

There is no database and no configuration. The corpus is committed under `src/data/agami/` and
compiled into the Cloud Run image, so a fresh clone renders every real-data panel on the first
`npm run dev` — the ITR chip, the bank-statement panel, the lender bounce feed and the retrain
badge. See `ARCHITECTURE.md` §5.3 for why this is not a database workload.

`src/lib/agami/dataset.ts` reads the three fixtures on first use, parses every transaction
description through `parser.ts`, indexes the result, and keeps it in process memory for the life
of the container — measured at **62–79 ms**, once per instance.

## Rebuilding the corpus

```bash
npm run data:build                                  # both datasets (~7 s)
node scripts/build_agami_fixtures.mjs --dataset itr # ITR only
node scripts/build_agami_fixtures.mjs --limit 40    # cap bank accounts
```

Node 18+ only. No Python, no `psycopg2`, no `datasets`, no credentials — the script fetches
straight from the Hugging Face CDN with `fetch`. Output is deterministic for a given dataset
revision, so a re-run with no upstream change produces no diff.

The build **fails loudly** if any of the six demo GSTINs stops resolving to an ITR record
upstream, rather than silently shipping a dashboard with a missing chip.

## What each module does

| File | Purpose |
|---|---|
| `scripts/build_agami_fixtures.mjs` | Hugging Face → `src/data/agami/*.json`. De-duplicates, normalises both transaction shapes, stamps the GSTIN→ITR linkage |
| `src/data/agami/accounts.json` | 200 accounts · 91 KB |
| `src/data/agami/transactions.json` | 32,349 transactions · 3.5 MB · columnar tuples keyed by account |
| `src/data/agami/itr.json` | 100 filings · 35 KB |
| `src/lib/agami/dataset.ts` | Loads, parses and indexes the corpus once per process. The single data entry point |
| `src/lib/agami/parser.ts` | Description parser (NEFT / RTGS / UPI / IMPS / CHEQUE / INTEREST / CHARGE) |
| `src/lib/agami/statements.ts` | Per-account rollups — inflow/outflow, counterparties, type mix, recent txns, bounces |
| `src/lib/agami/itrData.ts` | ITR lookup by linked GSTIN + score-impact helper |
| `src/lib/agami/lrRetrain.ts` | Feature extraction, seeded LR training, run history |
| `src/app/api/debug/dataset/route.ts` | Corpus health, row counts, GSTIN→ITR linkage, last retrain |

## Dataset schema

The Hugging Face metadata for Indian-Bank-Statements does not match its data, and the repository
ships **two different transaction shapes** across its four directories:

```
Digital_Type1 / Scanned_Type1        Digital_Type2 / Scanned_Type2
  date                                 transaction_id
  value_date                           date · value_date · txn_posted_date
  description                          description
  cheque_no                            cheque_no
  debit   (double | null)              cr_dr              "CR" | "DR"
  credit  (double | null)              transaction_amount (double)
  balance (double)                     available_balance  (double)
  branch_code                          branch_code
  failed  (bool)                       failed             (bool)
```

`normalizeTxn()` in the build script collapses both into nine fields —
`debit = amt if cr_dr == "DR" else 0`, `credit = amt if cr_dr == "CR" else 0` — so nothing
downstream has to care which shape a record came from.

The four directories carry the same statements twice (rendered digitally and scanned).
`account_number` is the natural key; the first occurrence wins, which is why 400 files yield
**200 unique accounts**.

## Linking ITR ↔ GSTIN

In production, a GSTIN's characters 3–12 *are* the PAN of the entity, so the join is direct:

```
linked_gstin  ⟷  pan == gstin.substring(2, 12)
```

The six **demo GSTINs** carry fabricated PANs that match no real filing, so the build script maps
them explicitly by legal name — the names the login cards in `src/lib/auth.ts` display:

| Demo GSTIN | ITR legal name | PAN | Form |
|---|---|---|---|
| `24AABCS1234R1Z8` | ORBIT TAR PRODUCTS | POKCO1004C | ITR-6 · AY 2025-26 |
| `37AAECV5678K1ZL` | ZENITH EXPORTS | RYHFZ8032N | ITR-5 · AY 2023-24 |
| `33AAJPM9012L1ZK` | PREMIER EXPORTS | QPACP9618T | ITR-6 · AY 2024-25 |
| `08AAECH2233N1ZH` | NOVA SOLUTIONS | CJUFN4927H | ITR-5 · AY 2025-26 |
| `09AAAPK4567P2Z3` | PRIME SOLUTIONS | EIEFP3365Z | ITR-5 · AY 2025-26 |
| `33AAHFK7890Q1ZH` | Riya Deshmukh | TOQPR2076V | ITR-4 · AY 2025-26 |

Ties (same legal name, different PAN) resolve to the most recent assessment year, then the lowest
acknowledgement number — so the mapping is stable across rebuilds. The table lives in
`GSTIN_TO_ITR_NAME` at the top of the build script.

A GSTIN with no linked filing returns `null` and the dashboard omits the ITR chip. That is the
honest answer: we have not seen that taxpayer.

## Retraining the LR calibrator

```bash
curl -X POST http://localhost:3000/api/retrain
```

Trains all three lender models over the corpus in **20 ms** and persists weights, accuracy, AUC
and sample count to `/tmp/udyamai/retrain.json` on the serving instance. A cold instance with no
history retrains on first read, so the dashboard badge never renders backed by nothing.

Label noise comes from a **seeded PRNG** (mulberry32, keyed on the lender name), so identical data
produces identical metrics — unlike the RDS build, where `Math.random` meant every cold start
reported different accuracy for the same corpus.

**The holdout is sliced from the training set, so these AUCs are in-sample and optimistic.** That
is a known issue on the Django port list, not a claim (`ARCHITECTURE.md` §6, §12).

## Cost note

₹0. The corpus is 3.7 MB inside a container image that scales to zero. The RDS build ran Aurora
Serverless v2 at roughly ₹4,500/month to serve the same rows.

## Real numbers in the committed corpus

| Fixture | Rows |
|---|---|
| `accounts.json` | 200 accounts · 30 bank names · 7 cities |
| `transactions.json` | **32,349** transactions · ₹2,369 Cr aggregate volume · **277 bounces** |
| `itr.json` | 100 unique filings (of 200 files — the other half are duplicate acknowledgement numbers) · 52 late filers · 6 linked to demo GSTINs |

Parsed transaction-type distribution:

> OTHER 18,549 · NEFT 4,579 · UPI 3,823 · IMPS 2,582 · RTGS 1,509 · CHARGE 1,307

> **Correction.** Earlier revisions of this file reported **97,106** transactions. That figure was
> an artefact: `agami_transactions` had no uniqueness constraint and the ingest script was run
> three times, so each run appended the corpus again (32,349 × 3 ≈ 97,047). **32,349 is the
> de-duplicated count**, and it is what the running application aggregates. Correct the old figure
> anywhere it survives — slides, deck notes, the pitch.
