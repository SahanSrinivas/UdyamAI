# UdyamAI — MSME Financial Health, in real time.

**Submission for IDBI Innovate 2026 · Track 3: MSME Financial Health Card**

> *"Every GST-registered business in India gets a live Health Score. See where you stand with 64 lenders — before you apply."*

UdyamAI is a **borrower-facing living Health Card** for Indian MSMEs. Every month the MSME sees a 0–1000 score computed from Account Aggregator + GST + UPI + EPFO + ITR feeds, plus the specific quantified actions that will raise it — before they ever file a loan application. On the other side, lenders get a real portfolio dashboard with post-sanction bounce monitoring wired to real bank-statement feeds.

Named after India's official MSME registration ID (Udyam) so bank officers recognise the product on sight; the AI suffix signals the live scoring, real-data retrain, and vernacular explanation layer.

**Live:** [https://main.d3ijnc0ydmm7t9.amplifyapp.com/](https://main.d3ijnc0ydmm7t9.amplifyapp.com/)

## The insight

Every current player scores you **at the moment you apply.** Perfios / Jocata / Karza sell that scoring engine to banks. Lendingkart / Indifi lend once and move on. **Nobody has built a Credit-Karma-style borrower-facing product for Indian MSMEs.** That slot is worth billions.

## Product surfaces

- **Landing** (`/`) — hero, live market strip, insight, GSTIN input with on-device checksum validation, 6 sample MSMEs (each linked to real ITR filings), how-it-works, comparison
- **Health Card** (`/dashboard`) — animated 4-sub-score dashboard, LLM explanation in EN / HI / TE, ITR-verified chip pulled from real filings, live Bank Statements panel over 97k real transactions, sector-adaptive alternative signals, counterparty graph, application history "then vs now", 3 pre-qualified loan quotes ranked by confidence, live retrain badge with per-lender AUC, transparent LR coefficient audit
- **Lender view** (`/lender`) — portfolio dashboard, incoming applications, and **real bounce-detection alerts** wired to `agami_transactions.failed = TRUE`
- **Health Card API** (`/api/health-card?gstin=…`) — the score engine as a JSON endpoint
- **Retrain API** (`/api/retrain`) — one-shot LR retrain over real RDS data, persists to `lr_training_runs`
- **DB Debug** (`/api/debug/db`) — end-to-end connectivity + row-count diagnostic

## Real data pipeline (not mocked)

The three demo surfaces judges will look at — dashboard, lender view, ML card — all pull from **AWS Aurora Serverless v2 Postgres** loaded with the **AgamiAI open datasets** (Apache 2.0):

| Source | Rows | Table |
|---|---|---|
| AgamiAI Indian-Bank-Statements → parsed | 200 accounts / **97,106 transactions** | `agami_accounts`, `agami_transactions` |
| AgamiAI Indian-Income-Tax-Returns | 100 filings | `agami_itr` |
| LR retrain runs | per-lender · per-invocation | `lr_training_runs` |

The retrain endpoint trains a logistic regression per lender (IDBI / SBI / HDFC) against the real transaction distribution — bounces, top-counterparty share, UPI count, avg credit / debit, opening → closing balance delta. Weights, holdout accuracy, and AUC are persisted every run.

Current live numbers (200 accounts): **IDBI AUC 0.749 · SBI AUC 0.845 · HDFC AUC 0.829**.

## Live integrations

| Integration | What | Endpoint |
|---|---|---|
| **AWS RDS (Aurora Serverless v2)** | Real ITR + bank-statement store, us-east-2, PostgreSQL 18.3 | `src/lib/agami/db.ts` |
| **AgamiAI HuggingFace datasets** | ITR filings + bank statements ingested via `huggingface_hub` | `scripts/ingest_agami.py` |
| **LR retrain pipeline** | 300-epoch batch-GD LR trained on real feature distributions | `src/lib/agami/lrRetrain.ts`, `POST /api/retrain` |
| **Bounce detection** | `agami_transactions.failed = TRUE` streamed to lender view | `src/components/motion/BounceAlertsPanel.tsx` |
| **GSTIN checksum** | On-device validation using the official 15-char algorithm | `src/lib/gstin.ts` |
| **Deterministic profile synthesis** | Any valid GSTIN → hash-seeded realistic profile | `src/lib/gstin.ts` |
| **FX / market strip** | Live USD/INR from Frankfurter (300s revalidate) | `api.frankfurter.dev` |
| **Gemini explainer** | `gemini-1.5-flash` in EN / HI / TE, direct-tone prompt | `src/lib/gemini.ts` |
| **Score engine** | Deterministic 4-sub-score model, transparent for audit | `src/lib/scoreEngine.ts` |

## Rails we build on

- **AA** — Account Aggregator for consented data pull (production: Finvu / Sahamati)
- **ULI** — RBI's Unified Lending Interface (64 lenders, 136 data services as of Dec 2025)
- **OCEN 4.0** — our app is a **Loan Agent (LA)** in OCEN terms

Technical treatment: see `docs/`.

## Design

- **Palette:** cream / mist / sage / sand fades on the borrower flow; black + `#DCFB6D` (rh-lime) for lender + retrain badge — Robinhood-inspired
- **Type:** Inter for UI, serif display for headline scale, tabular figures for all numbers
- **Motion:** framer-motion for score ring, count-up, sub-score bar fill, stagger, layout-shared language pill, hover lift on cards — all respect `prefers-reduced-motion`

## Run locally

```bash
cd /Users/sahan_kolluri/Pegasus/Work/IDBI-Innovate
npm install
cp .env.example .env.local        # GEMINI_API_KEY for LLM · DATABASE_URL for RDS
npm run dev
```

Open http://localhost:3000

Without a `DATABASE_URL`, the app runs entirely on the synthetic/deterministic path — the RDS-backed panels and retrain badge simply do not render. Without a `GEMINI_API_KEY` the app falls back to a deterministic offline explanation. Everything else works fully.

## Ingest real data (one-time)

```bash
# Loads AgamiAI ITR + bank statements into your Postgres
python scripts/ingest_agami.py

# Trigger a retrain against the freshly loaded rows
curl -X POST https://<your-deploy>/api/retrain
```

## Deploy

Currently hosted on **AWS Amplify Hosting (SSR)** with auto-deploy from `main`:

```
https://main.d3ijnc0ydmm7t9.amplifyapp.com/
```

`amplify.yml` forwards `DATABASE_URL`, `GEMINI_API_KEY`, and `GOOGLE_API_KEY` into `.env.production` at build time so SSR runtime has access.

## Repo layout

```
IDBI-Innovate/
├── docs/                            # AA / ULI / OCEN treatments + action plan
├── scripts/
│   └── ingest_agami.py              # HF → Postgres loader (ITR + bank statements)
├── sql/
│   └── schema.sql                   # agami_accounts, agami_transactions, agami_itr, lr_training_runs
├── src/
│   ├── app/
│   │   ├── page.tsx                 # landing
│   │   ├── dashboard/page.tsx       # health card (borrower)
│   │   ├── lender/page.tsx          # portfolio + bounce alerts (lender)
│   │   ├── api/
│   │   │   ├── health-card/         # JSON endpoint
│   │   │   ├── retrain/             # LR retrain over real RDS data
│   │   │   └── debug/db/            # connectivity diagnostic
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── landing/                 # Hero, SampleCards, HowItWorks, CompareTable, GstinInput
│   │   └── motion/                  # ScoreCard, SubScoreGrid, LoanQuotesGrid, ExplanationCard,
│   │                                # ItrVerifiedChip, BankStatementsPanel, BounceAlertsPanel,
│   │                                # RetrainBadge, ModelCard, AlternativeSignals, ...
│   └── lib/
│       ├── agami/                   # db, itrData, statements, lrRetrain
│       ├── mockData.ts              # 6 handcrafted sample MSMEs linked to real ITR names
│       ├── scoreEngine.ts           # 4-sub-score deterministic engine
│       ├── mlModel.ts               # synthetic LR calibrator (audit story)
│       ├── gstin.ts                 # checksum + synthetic profile generator
│       ├── marketData.ts            # Frankfurter FX pull + fallbacks
│       ├── gemini.ts                # LLM explainer (EN / HI / TE)
│       ├── auth.ts                  # demo customers + lenders
│       ├── motion.ts                # framer-motion variants
│       └── utils.ts
├── amplify.yml
├── package.json
├── tailwind.config.ts
└── README.md
```

## Demo credentials

**Customers** (OTP `123456`):

| GSTIN | Trading name | Files ITR as |
|---|---|---|
| `24AABCS1234R1Z8` | Rajesh Patel · Shreeji Silks | Orbit Tar Products Pvt Ltd |
| `37AAECV5678K1ZL` | Anil Rao · VizagParts | Zenith Exports (Firm) |
| `33AAJPM9012L1ZK` | Muthu Ramaswamy · Muthu CNC | Premier Exports Pvt Ltd |
| `08AAECH2233N1ZH` | Anantha Devi · Anantha Weaves | Nova Solutions (Firm) |
| `09AAAPK4567P2Z3` | Faizal Ahmed · Kanpur Leather | Prime Solutions (Firm) |
| `33AAHFK7890Q1ZH` | Selvi & Kumar · Kirana Circle | Riya Deshmukh (Proprietor) |

**Lenders** (password `demo123`): `IDBI-MSME-2847` · `SBI-SME-1024` · `HDFC-BGL-8891`

## Round 1 submission checklist

- [x] GitHub repo pushed
- [x] AWS Amplify deploy live
- [x] Real data pipeline (AgamiAI → RDS → retrain → dashboard)
- [ ] 10-slide PDF deck (paste into hack2skill template)
- [ ] Registered on hack2skill by **9 Jul 2026**
