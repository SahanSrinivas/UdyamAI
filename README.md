# UdyamAI — MSME Financial Health, in real time.

**Submission for IDBI Innovate 2026 · Track 3: MSME Financial Health Card**

> *"Every GST-registered business in India gets a live Health Score. See where you stand with 64 lenders — before you apply."*

UdyamAI is a **borrower-facing living Health Card** for Indian MSMEs. Every month the MSME sees a 0–1000 score computed from Account Aggregator + GST + UPI + EPFO feeds, plus the specific quantified actions that will raise it — before they ever file a loan application.

Named after India's official MSME registration ID (Udyam) so bank officers recognise the product on sight; the AI suffix signals the live scoring and vernacular explanation layer.

## The insight

Every current player scores you **at the moment you apply.** Perfios / Jocata / Karza sell that scoring engine to banks. Lendingkart / Indifi lend once and move on. **Nobody has built a Credit-Karma-style borrower-facing product for Indian MSMEs.** That slot is worth billions.

## Product surfaces

- **Landing** (`/`) — hero, live market strip, insight, GSTIN input with on-device checksum validation, 3 sample MSMEs, how-it-works, comparison
- **Health Card** (`/dashboard`) — animated 4-sub-score dashboard, LLM explanation in EN / HI / TE, top drags + top lifts, 3 pre-qualified loan quotes ranked by confidence
- **API** (`/api/health-card?gstin=…`) — the score engine as a JSON endpoint

## Live integrations (not mocked)

| Integration | What | Endpoint |
|---|---|---|
| GSTIN checksum | On-device validation using the official 15-char algorithm — accepts any real GSTIN | `src/lib/gstin.ts` |
| Deterministic profile synthesis | Any valid GSTIN → hash-seeded realistic profile (revenue trend, GST filings, UPI velocity) | `src/lib/gstin.ts` |
| FX / market strip | Live USD/INR from Frankfurter public API (300s revalidate) | `api.frankfurter.dev` |
| Gemini explainer | `gemini-1.5-flash` in EN / HI / TE, prompt is direct-tone (not AI-styled) | `src/lib/gemini.ts` |
| Score engine | Deterministic 4-sub-score model, transparent for judges to audit | `src/lib/scoreEngine.ts` |

## Rails we build on

- **AA** — Account Aggregator for consented data pull
- **ULI** — RBI's Unified Lending Interface (64 lenders, 136 data services as of Dec 2025)
- **OCEN 4.0** — our app is a **Loan Agent (LA)** in OCEN terms

Technical treatment: see `docs/`.

## Design

- **Palette:** pure `#000000` background, `#00D93E` primary accent — Robinhood-style
- **Type:** Inter variable, tight tracking on display sizes, tabular figures for all numbers
- **Motion:** framer-motion for score ring, count-up, sub-score bar fill, stagger, layout-shared language pill — all respect `prefers-reduced-motion`

## Run locally

```bash
cd /Users/sahan_kolluri/Pegasus/Work/IDBI-Innovate
npm install
cp .env.example .env.local        # optional — GEMINI_API_KEY for live LLM
npm run dev
```

Open http://localhost:3000

Without a Gemini key, the app uses a deterministic offline explanation. Everything else works fully.

## Deploy

```bash
npx vercel --prod
```

Or push to GitHub and connect at [vercel.com/new](https://vercel.com/new).

## Repo layout

```
IDBI-Innovate/
├── docs/                       # AA / ULI / OCEN treatments + action plan
├── src/
│   ├── app/
│   │   ├── page.tsx            # landing
│   │   ├── dashboard/page.tsx  # health card
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── api/health-card/    # JSON endpoint
│   ├── components/
│   │   ├── BrandMark.tsx
│   │   ├── landing/            # Hero, SampleCards, HowItWorks, CompareTable, GstinInput
│   │   └── motion/             # ScoreCard, SubScoreGrid, NudgePanel, LoanQuotesGrid, LangToggle, ExplanationCard, MarketStrip, CountUp
│   └── lib/
│       ├── mockData.ts         # 3 handcrafted sample MSMEs
│       ├── scoreEngine.ts      # 4-sub-score deterministic engine
│       ├── gstin.ts            # checksum + synthetic profile generator
│       ├── marketData.ts       # Frankfurter FX pull + fallbacks
│       ├── gemini.ts           # LLM explainer (EN / HI / TE)
│       ├── motion.ts           # framer-motion variants
│       └── utils.ts
├── package.json
├── tailwind.config.ts
└── README.md
```

## Round 1 submission checklist

- [ ] GitHub repo pushed
- [ ] Vercel deploy live
- [ ] 10-slide PDF deck (paste into hack2skill template)
- [ ] Registered on hack2skill by **9 Jul 2026**
