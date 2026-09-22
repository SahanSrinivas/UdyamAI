# UdyamAI — MSME Financial Health, in real time.

**Submission for IDBI Innovate 2026 · Track 3: MSME Financial Health Card**

> *"Every GST-registered business in India gets a live Health Score. See where you stand with 64 lenders — before you apply."*

UdyamAI is a **borrower-facing living Health Card** for Indian MSMEs. Every month the MSME sees a 0–1000 score computed from Account Aggregator + GST + UPI + EPFO + ITR feeds, plus the specific quantified actions that will raise it — before they ever file a loan application. On the other side, lenders get a real portfolio dashboard with post-sanction bounce monitoring wired to real bank-statement feeds.

Named after India's official MSME registration ID (Udyam) so bank officers recognise the product on sight; the AI suffix signals the live scoring, real-data retrain, and vernacular explanation layer.

**Deploy:** one stateless container on Google Cloud Run — see [DEPLOY.md](DEPLOY.md).

## The insight

Every current player scores you **at the moment you apply.** Perfios / Jocata / Karza sell that scoring engine to banks. Lendingkart / Indifi lend once and move on. **Nobody has built a Credit-Karma-style borrower-facing product for Indian MSMEs.** That slot is worth billions.

## Product surfaces

- **Landing** (`/`) — hero, live market strip, insight, GSTIN input with on-device checksum validation, 6 sample MSMEs (each linked to real ITR filings), how-it-works, comparison
- **Health Card** (`/dashboard`) — animated 4-sub-score dashboard, LLM explanation in EN / HI / TE, ITR-verified chip pulled from real filings, live Bank Statements panel over 32k real transactions, sector-adaptive alternative signals, counterparty graph, application history "then vs now", 3 pre-qualified loan quotes ranked by confidence, live retrain badge with per-lender AUC, transparent LR coefficient audit
- **Lender view** (`/lender`) — portfolio dashboard, incoming applications, and **real bounce-detection alerts** over every failed transaction in the corpus
- **Health Card API** (`/api/health-card?gstin=…`) — the score engine as a JSON endpoint
- **Retrain API** (`/api/retrain`) — one-shot LR retrain over the real transaction distribution
- **Dataset diagnostic** (`/api/debug/dataset`) — corpus health, row counts, GSTIN→ITR linkage, last retrain

## Real data pipeline (not mocked, and no database)

The three demo surfaces judges will look at — dashboard, lender view, ML card — all read the
**AgamiAI open datasets** (Apache 2.0), bundled into the container image and aggregated in-process:

| Source | Rows | Fixture |
|---|---|---|
| AgamiAI Indian-Bank-Statements → parsed | 200 accounts / **32,349 transactions** / 277 bounces | `src/data/agami/accounts.json`, `transactions.json` |
| AgamiAI Indian-Income-Tax-Returns | 100 filings, 6 linked to demo GSTINs | `src/data/agami/itr.json` |
| LR retrain runs | per-lender · per-invocation | `/tmp/udyamai/retrain.json` on the serving instance |

`npm run data:build` regenerates all three straight from Hugging Face — no Python, no credentials,
no database. Every SQL aggregation the RDS build ran is now the same aggregation over an in-memory
array: 3.7 MB of data does not need a Postgres instance, a VPC connector and a bill to serve it,
and removing all three is what lets the service scale to zero on Cloud Run.

The retrain endpoint trains a logistic regression per lender (IDBI / SBI / HDFC) against the real
transaction distribution — bounces, top-counterparty share, UPI count, avg credit / debit,
opening → closing balance delta. Weights, holdout accuracy, and AUC are persisted every run.
Label noise comes from a seeded PRNG, so the numbers are reproducible rather than re-rolled on
every cold start.

Current numbers (200 accounts, 300 epochs): **IDBI AUC 0.728 · SBI AUC 0.818 · HDFC AUC 0.847**.

## Live integrations

| Integration | What | Endpoint |
|---|---|---|
| **Bundled AgamiAI corpus** | Real ITR + bank-statement data read from the image, indexed once per process | `src/lib/agami/dataset.ts` |
| **AgamiAI HuggingFace datasets** | ITR filings + bank statements pulled straight from the HF CDN | `scripts/build_agami_fixtures.mjs` |
| **LR retrain pipeline** | 300-epoch batch-GD LR trained on real feature distributions | `src/lib/agami/lrRetrain.ts`, `POST /api/retrain` |
| **Bounce detection** | Every `failed` transaction in the corpus, surfaced on the lender view | `src/components/motion/BounceAlertsPanel.tsx` |
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
npm install
cp .env.example .env.local        # GOOGLE_API_KEY for the vernacular explanation
npm run dev
```

Open http://localhost:3000

There is nothing else to set up — no database, no connection string, no ingest step. The AgamiAI
corpus is committed, so a fresh clone renders every real-data panel on the first run. Without a
`GOOGLE_API_KEY` the app falls back to a deterministic offline explanation; everything else works
fully.

## Refresh the bundled data (optional)

```bash
npm run data:build                 # re-pulls both AgamiAI datasets → src/data/agami/*.json
curl -X POST http://localhost:3000/api/retrain
```

The build fails loudly if any of the six demo GSTINs stops resolving to an ITR record upstream,
rather than silently shipping a dashboard with a missing chip.

## Deploy

One stateless container on **Google Cloud Run** in `asia-south1` (Mumbai):

```bash
gcloud run deploy udyamai --source . --region asia-south1 --allow-unauthenticated
```

Full setup — Artifact Registry, Secret Manager, the Cloud Build pipeline, sizing and rollback —
is in **[DEPLOY.md](DEPLOY.md)**. `Dockerfile` and `cloudbuild.yaml` are the only deploy artefacts;
there is no VPC, no connector and no database to provision.

## Repo layout

```
IDBI-Innovate/
├── docs/                            # AA / ULI / OCEN treatments + action plan
├── scripts/
│   └── build_agami_fixtures.mjs     # HF → src/data/agami/*.json (no DB, no Python)
├── src/
│   ├── data/agami/                  # the committed corpus — accounts, transactions, itr
│   ├── app/
│   │   ├── page.tsx                 # landing
│   │   ├── dashboard/page.tsx       # health card (borrower)
│   │   ├── lender/page.tsx          # portfolio + bounce alerts (lender)
│   │   ├── api/
│   │   │   ├── health-card/         # JSON endpoint
│   │   │   ├── retrain/             # LR retrain over the bundled corpus
│   │   │   └── debug/dataset/       # corpus + retrain diagnostic
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── landing/                 # Hero, SampleCards, HowItWorks, CompareTable, GstinInput
│   │   └── motion/                  # ScoreCard, SubScoreGrid, LoanQuotesGrid, ExplanationCard,
│   │                                # ItrVerifiedChip, BankStatementsPanel, BounceAlertsPanel,
│   │                                # RetrainBadge, ModelCard, AlternativeSignals, ...
│   └── lib/
│       ├── agami/                   # dataset, parser, itrData, statements, lrRetrain
│       ├── runtimeStore.ts          # the only mutable state — swap here for Firestore
│       ├── mockData.ts              # 6 handcrafted sample MSMEs linked to real ITR names
│       ├── scoreEngine.ts           # 4-sub-score deterministic engine
│       ├── mlModel.ts               # synthetic LR calibrator (audit story)
│       ├── gstin.ts                 # checksum + synthetic profile generator
│       ├── marketData.ts            # Frankfurter FX pull + fallbacks
│       ├── gemini.ts                # LLM explainer (EN / HI / TE)
│       ├── auth.ts                  # demo customers + lenders
│       ├── motion.ts                # framer-motion variants
│       └── utils.ts
├── Dockerfile                        # Cloud Run image (Next.js standalone)
├── cloudbuild.yaml                   # Cloud Build → Artifact Registry → Cloud Run
├── DEPLOY.md
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
- [x] Cloud Run deploy artefacts ready (`Dockerfile`, `cloudbuild.yaml`, `DEPLOY.md`)
- [x] Real data pipeline (AgamiAI → bundled corpus → retrain → dashboard)
- [ ] 10-slide PDF deck (paste into hack2skill template)
- [ ] Registered on hack2skill by **9 Jul 2026**
