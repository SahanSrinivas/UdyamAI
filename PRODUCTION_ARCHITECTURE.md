# UdyamAI — Production Architecture

The Next.js app in this repo is the **prototype** for IDBI Innovate. What follows is the production build we'd ship post-selection. Every choice below is optimized for the specific constraints of Indian regulated fintech: RBI data residency, DPDP Act compliance, RBI IT Framework, and lender-side integrations.

---

## Client tier

| Surface | Stack | Why |
|---|---|---|
| **iOS** | SwiftUI + Combine + Swift Concurrency | Native performance for the Health Card animations, Aadhaar eKYC SDK works cleanest on native, App Clips for one-tap GSTIN lookup |
| **Android** | Kotlin + Jetpack Compose + Coroutines | Same reasoning as iOS — vernacular text rendering (Hindi / Telugu / Tamil) is best on native |
| **Web PWA** | Next.js 14 (App Router) + React + Tailwind + framer-motion | This is what we already have. Ship it as the primary desktop / low-friction experience |
| **Alt: single-codebase** | React Native + Expo | If team is one person, RN covers iOS + Android from one codebase. Trade-off: 15% perf hit on animations |
| **Distribution** | Play Store + App Store, plus embedded SDK for **Khatabook / OkCredit / Vyapar** | 30M+ MSMEs already live in Khatabook — embed the Health Card instead of chasing installs |

---

## API tier (Django-first)

The backend is where the real work happens. Django is the right choice because we have Django muscle and the ecosystem for regulated fintech (`django-oauth-toolkit`, `django-audit-log`, `django-encrypted-model-fields`) is unmatched.

| Component | Choice | Notes |
|---|---|---|
| **Web framework** | Django 5 + DRF (Django REST Framework) | Async views on the score / quote endpoints, sync elsewhere |
| **Real-time** | Django Channels + Redis pub/sub | Push score updates over WebSocket when AA feeds arrive |
| **Task queue** | Celery + Redis broker | Monthly AA refresh, LR model retraining, batch quote scoring |
| **Auth** | `django-allauth` + Firebase Auth for mobile session, OTP via MSG91 | OAuth 2.0 outbound for OCEN |
| **Aadhaar KYC** | Digio / Signzy SDK | Regulator-approved eKYC providers, ~₹15 per verification |
| **Rate limiting** | `django-ratelimit` + Cloud Armor | Protect the GSTIN validation + score endpoints |
| **Admin** | Django Admin (customized) | Ops UI for the underwriting desk without building a separate app |

---

## Data tier

Two-database split because MSME profile data and financial transaction data have very different shapes and compliance requirements.

| Store | Choice | What lives here |
|---|---|---|
| **MongoDB Atlas** (asia-south1) | M30 → M60 as we scale | Score history, event stream, UPI counterparty graphs (naturally document-shaped, semi-structured, high write throughput) |
| **Cloud SQL Postgres** | High Availability, PITR enabled | Users, KYC docs, loan applications, OCEN transaction log, AA consent artifacts (transactional, audit-critical) |
| **Memorystore Redis** | Standard tier | Celery broker, session cache, rate-limit counters, live market ticker cache |
| **BigQuery** | On-demand pricing | ML training data warehouse, cohort analytics, sector benchmarks (denormalized fact tables) |
| **Cloud Storage** | asia-south1, CMEK-encrypted | Consent-artifact PDFs, KYC docs, e-signed loan agreements |

---

## AI / ML tier

| Layer | Choice | Why |
|---|---|---|
| **LLM (vernacular explainer)** | **Gemini 2.0 Flash via Vertex AI** (not consumer API) | Vertex gives enterprise SLA, higher quota, `asia-south1` residency, and audit logs |
| **Score classifier** | Per-lender logistic regression, retrained weekly on real outcomes | Same architecture as the prototype's `mlModel.ts`, ported to `scikit-learn` and served via Cloud Run |
| **Cash-flow forecast** | Vertex AI AutoML Tabular (LSTM under the hood) | 90-day liquidity projection per MSME, feeds repayment-capacity signal |
| **UPI graph analysis** | **Neo4j Aura** (or Cloud Spanner Graph) | Real counterparty concentration + circular-payment-ring detection via graph algorithms |
| **Fraud detection** | OpenAI-style embedding search on GSTR-1 invoice text | Circular billing detection via cosine similarity between invoice descriptions |
| **Model registry** | Vertex AI Model Registry | Every LR retrain versioned; model cards regenerated automatically |

**Regulatory note:** we keep the credit decision model interpretable (LR only). LSTM / graph outputs are *features* into the LR, not the final decision — this stays the audit-first story for RBI.

---

## Integration rails (the regulated pipes)

| Rail | Provider | Auth model |
|---|---|---|
| **Account Aggregator** | Finvu · OneMoney · Sahamati network | Signed onboarding, ReBIT spec, mTLS |
| **GSTN** | Direct as FIP via AA | Consent handle |
| **EPFO** | Direct as FIP via AA | Consent handle |
| **ULI** | RBIH Public Tech Platform | Lender onboarding, mTLS |
| **OCEN** | iSPIRT Loan Agent (LA) registration | Signed federation cert, OAuth 2.0 |
| **CIBIL / Experian** | Bureau APIs (optional, only when hasBureau=true) | mTLS |
| **UPI counterparty data** | NPCI (via AA + supplementary via M2P for enrichment) | Consent handle |

---

## Notifications + coaching

| Channel | Provider | Use case |
|---|---|---|
| **Push (mobile)** | Firebase Cloud Messaging | Score update, event trigger, monthly nudge |
| **WhatsApp Business API** | Gupshup / 360dialog | Vernacular coaching bot (Hindi / Telugu) — this is the Khatabook-scale distribution wedge |
| **SMS** | MSG91 | OTP + score-refresh confirmation |
| **Email** | SendGrid / SES | Monthly Health Card PDF export |

---

## Deployment (GCP-first)

We already have GCP muscle. Everything runs on Cloud Run except the Postgres and the ML training jobs.

| Service | Runtime | Notes |
|---|---|---|
| Django API | **Cloud Run** (2–100 instances, auto-scale) | Container image built via Cloud Build |
| Score serving (LR inference) | **Cloud Run** separate service | Isolated for low-latency inference, warmed pool |
| LR training | **Vertex AI Custom Training** | Runs weekly on BigQuery outcome data |
| Static + PWA | **Vercel** (or Cloud Run + CDN) | Next.js still on Vercel is fine — one less thing to manage |
| Postgres | **Cloud SQL Postgres 15** HA | asia-south1, PITR enabled, CMEK |
| MongoDB | **MongoDB Atlas** M30 | asia-south1, VPC-peered to GCP |
| Redis | **Memorystore for Redis** | Standard tier |
| Object storage | **Cloud Storage** | Signed URLs for KYC docs |
| CDN | **Cloud CDN** | Serves PWA assets globally |
| Secrets | **Secret Manager** | API keys, mTLS certs, Aadhaar keys |
| CI/CD | **Cloud Build + GitHub Actions** | Deploy on merge to main |
| Observability | Sentry (errors) + **Cloud Monitoring / Logging** + Datadog (APM if budget) | 30-day retention on logs, alerting on p99 latency |
| WAF | **Cloud Armor** | Protects the public endpoints |
| DNS | **Cloud DNS** | udyamai.credit, udyamai.in |

---

## Compliance stack

| Requirement | How we meet it |
|---|---|
| **RBI IT Framework** (2023) | Data residency in asia-south1, CMEK on all stores, audit log for every score decision |
| **DPDP Act 2023** | Consent lifecycle managed via AA, deletion within 72h on request, PII vault separated from operational DB |
| **RBI Digital Lending Guidelines** | LSP (us) never touches customer funds — money moves lender → borrower directly via OCEN Disbursement Partner |
| **Sahamati Rulebook** | ReBIT-compliant AA calls, signed responses, complete consent trail |
| **SOC 2 Type II** | Target within 12 months — Vanta / Drata for automation |
| **ISO 27001** | Target within 18 months |
| **Model risk (RBI PRISM guidelines)** | Only auditable LR in the credit decision. LSTM / graph outputs are inputs to LR, not decisions themselves |
| **Business continuity** | Cross-region backups nightly to asia-northeast1, RPO 15 min, RTO 4 hours |

---

## Full request path — MSME opens the app

```
[iOS/Android/PWA]
    │
    ▼ HTTPS + Firebase JWT
[Cloud Armor · WAF]
    │
    ▼ TLS termination
[Cloud Run · Django API]
    │
    ├─▶ [Cloud SQL · Postgres]      user + consent artefacts
    ├─▶ [MongoDB Atlas]             score history + events
    ├─▶ [Memorystore Redis]         session cache
    │
    ├─▶ [Cloud Run · LR Inference]  → predict(P(approval)) per lender
    │       │
    │       └─▶ [Vertex AI Model Registry]  latest weekly LR weights
    │
    ├─▶ [Vertex AI · Gemini 2.0 Flash]  vernacular explanation (EN/HI/TE)
    │
    └─▶ [Celery worker on Cloud Run]
            │
            ├─▶ [Finvu / OneMoney AA]    consented data pull
            ├─▶ [GSTN via AA]            GSTR-1 + 3B
            ├─▶ [EPFO via AA]            active-contribution check
            ├─▶ [UPI graph — Neo4j Aura] counterparty concentration
            └─▶ [ULI — RBIH]             cross-lender pre-qualification

[Lender clicks "Apply via OCEN"]
    │
    ▼ OAuth 2.0 + mTLS
[iSPIRT OCEN endpoint]
    │
    ├─▶ /loan/search → Lender
    ├─▶ /loan/offer  ← Lender
    ├─▶ /loan/accept → Lender
    └─▶ /loan/status ← Lender (webhook — feeds portfolio quality signal back)
```

---

## Phased build plan

### Phase 1 · Months 0–3 (post-selection)
Solo-buildable. Ship the real backend.

- Migrate score engine from `mlModel.ts` (TypeScript) → **Python scikit-learn** in Django
- Set up Django REST Framework + Postgres + MongoDB + Redis on GCP Cloud Run
- Wire real **Finvu AA sandbox** integration end-to-end
- Wire **Gemini 2.0 Flash via Vertex AI** (asia-south1)
- Keep Next.js PWA as-is, point at real Django backend
- Real Aadhaar eKYC via Digio
- Real GSTIN validation via public GSTN portal (fallback to on-device checksum)
- Basic Cloud Monitoring, Sentry, uptime alerts
- **Milestone: end-to-end live at 100 pilot MSMEs**

### Phase 2 · Months 3–6
Add mobile + start scaling.

- Ship **React Native** iOS + Android (or SwiftUI + Kotlin if we have the team)
- Firebase Cloud Messaging for push notifications
- WhatsApp Business API via Gupshup for vernacular coaching bot
- Start weekly LR retraining pipeline in Vertex AI
- Real **OCEN LA registration** with iSPIRT + first live lender partner (targeting IDBI)
- Cloud Armor + WAF hardening
- SOC 2 gap assessment starts
- **Milestone: 5,000 MSMEs, 1 live lender, ₹10 Cr disbursed**

### Phase 3 · Months 6–12
Scale + differentiation.

- **UPI counterparty graph** in Neo4j Aura — real concentration + ring detection
- **Cash-flow LSTM** on Vertex AI AutoML — 90-day liquidity forecast
- Embedded SDK for **Khatabook / Vyapar** partnership
- Full **SOC 2 Type II** audit
- **ISO 27001** kickoff
- 3+ live lenders on OCEN
- Sector cohort benchmarks (real cohorts, not synthetic percentile)
- **Milestone: 50,000 MSMEs, ₹200 Cr AUM, breakeven on unit economics**

### Phase 4 · Months 12–24
Big-bet moves.

- RBI RegTech sandbox partnership
- Insurance rail on the same AA infra
- International expansion — Indonesia (UMK), Vietnam
- **Milestone: 500,000 MSMEs, ₹5,000 Cr AUM, Series A ready**

---

## Cost at 100k monthly-active MSMEs

Rough all-in estimate in INR / month:

| Line item | Monthly cost |
|---|---|
| Cloud Run (Django API + LR inference) | ₹40k |
| Cloud SQL Postgres (HA) | ₹25k |
| MongoDB Atlas M30 | ₹30k |
| Memorystore Redis | ₹8k |
| Vertex AI · Gemini 2.0 Flash inference (~5 calls / MSME) | ₹1.5 L |
| Finvu AA data pulls (₹0.50 / consent × 100k) | ₹50k |
| WhatsApp Business API (Gupshup) | ₹15k |
| SMS OTP (MSG91) | ₹5k |
| Aadhaar eKYC (Digio, ₹15 × 10k new / month) | ₹1.5 L |
| Neo4j Aura Professional | ₹25k |
| Cloud Storage + CDN + egress | ₹15k |
| Sentry + Monitoring + Datadog | ₹15k |
| **Total OPEX at 100k MAU** | **~₹4.8 L / month** |

**Per-MSME cost: ₹4.8** — sustainable with 1 lender paying ₹500 per pre-qualified converted lead × 1,000 conversions / month = ₹5L revenue.

---

## Team you need to hire (Phase 2 onwards)

| Role | Why | Hire by |
|---|---|---|
| **Backend engineer** (Django / GCP) | Real integrations, scale | Month 3 |
| **Mobile engineer** (React Native or iOS / Android split) | Mobile shipping | Month 4 |
| **Data engineer** | Feature pipelines, BigQuery, Vertex training | Month 6 |
| **ML engineer** | LSTM cash-flow model, LR retraining infra | Month 6 |
| **DevOps / SRE** | GCP hardening, SOC 2 prep | Month 6 |
| **Compliance officer** | RBI + DPDP + SOC 2 | Month 6 |
| **BD / partnerships** | Lender onboarding, Khatabook deal | Month 4 |
| **CTO co-founder** | If you're not doing this alone | ASAP |

**Solo → Phase 1 is realistic** because the Next.js prototype gives you a real UX to point at while you build the Django backend behind it. Ship the Django Real Data Version at Month 3.

---

## Migration path from this repo → production

The Next.js prototype is not throwaway. It becomes:

- **The PWA client** — points at the real Django API instead of local Next.js API routes
- **The design system** — everything under `src/components/` transfers as-is
- **The scoring rules** — `src/lib/scoreEngine.ts` and `src/lib/mlModel.ts` port to Python cleanly
- **The OCEN protocol shapes** — `src/lib/ocen.ts` is the exact API contract to build against

What we throw away:
- `src/lib/mockData.ts` — replaced by real AA-fetched profiles
- `src/lib/gstin.ts` synthetic profile generator — replaced by real Finvu data
- The `/api/*` Next routes — replaced by Django endpoints

Everything else — the entire UI, the design system, the OCEN drawer, the Model Card, the Nudge Panel — is production-ready code. Not throwaway.
