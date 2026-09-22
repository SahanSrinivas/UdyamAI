# UdyamAI — Architecture

**IDBI Innovate 2026 · Track 3: MSME Financial Health Card**
Canonical architecture document · Google Cloud · 22 Sep 2026

> Supersedes the AWS-shaped revision of 19 Aug 2026. `PRODUCTION_ARCHITECTURE.md` is an earlier
> GCP exploration kept for history; where the two disagree, this document wins.
> `GCP_RESOURCE_REQUEST.md` is the sandbox-request form derived from this.

---

## 1. Executive summary

UdyamAI is a **borrower-facing living Health Card** for India's 63 million MSMEs. Every
GST-registered business gets a continuously-refreshed 0–1000 score built from consented Account
Aggregator feeds, plus the specific quantified actions that raise it — *before* they apply for
credit. Lenders receive a pre-scored pipeline and post-sanction early-warning alerts.

**Architecture in one line: one stateless container on Cloud Run, and nothing else.**

| | |
|---|---|
| **Prototype, today** | Next.js 14 on Cloud Run · 1 service · 0 databases · 0 VPCs · scales to zero |
| **Production build** | React PWA on Cloud CDN, Django 5 on Cloud Run, Cloud SQL on a private IP |
| **Data** | 200 accounts · 32,349 real transactions · 100 ITR filings — **bundled into the image** |
| **Credit model** | Per-lender logistic regression, 7 weights, coefficients published on-screen |
| **Region** | asia-south1 (Mumbai) — regulatory requirement, not preference |
| **Services in the request path** | **1** |
| **Prototype cost** | **~USD 6 / month** (was USD 71 on AWS) |
| **Cost at 100,000 MSMEs** | **~₹0.55 / MSME / month** infrastructure |

**The cost thesis, in two parts.** First, the credit decision is *deliberately* a logistic
regression: interpretability is an RBI model-risk requirement, and it happens to eliminate the GPU
line item entirely. Second — and this is what changed when we left AWS — **3.7 MB of read-only
open data does not need a database.** Removing Postgres removed the VPC, the connector and the NAT
Gateway behind it, which together were 60% of the AWS bill. Regulatory discipline and cost
discipline point the same way, twice.

---

## 2. Design principles

1. **One region, no exceptions.** All data in asia-south1. If a second region is ever needed it is
   asia-south2 (Delhi), because that is also in India.
2. **The credit decision must be explainable to a regulator.** Only an auditable logistic
   regression decides. Heavier signals become *features* into it, never decisions themselves.
3. **Stateless request path.** Nothing in the request path holds state. Scaling is a number, not a
   redesign — and the floor of that number is zero.
4. **Consented or public. Never scraped.** Every data source is either AA-consented or an official
   public register. A hard product constraint, not a nice-to-have.
5. **Do not provision what the workload does not need.** Each growth step has a named trigger.
   Nothing is sized against a projection. The corollary — the one this revision acts on — is that
   a service nobody queries should not exist.

---

## 3. System architecture

### 3.1 What runs today

```
        MSME owner (low-end Android)          Lender desk (IDBI / SBI / HDFC)
                    │                                        │
                    └────────────────┬───────────────────────┘
                                     │ HTTPS · managed TLS
                                     ▼
        ┌────────────────────────────────────────────────────────┐
        │  Cloud Run  ·  udyamai  ·  asia-south1                  │
        │  Next.js 14 standalone · 1 vCPU / 512 MiB               │
        │  min-instances 0  →  max-instances 10                   │
        │  ~280 MB image from Artifact Registry                   │
        ├────────────────────────────────────────────────────────┤
        │  app/          SSR pages — dashboard, lender, apply     │
        │  app/api/      health-card · applications · ocen ·      │
        │                retrain · auth · debug/dataset           │
        │  lib/scoreEngine    4 sub-scores → 0–1000               │
        │  lib/mlModel        per-lender LR calibrator            │
        │  lib/agami/dataset  the corpus, parsed once per process │
        │  lib/ocen           Loan Agent protocol contract        │
        ├────────────────────────────────────────────────────────┤
        │  src/data/agami/*.json  → compiled into the bundle      │
        │     accounts 91 KB · transactions 3.5 MB · itr 35 KB    │
        │  /tmp/udyamai/                ← per-instance scratch    │
        │     pipeline.json · retrain.json                        │
        └───────────────────────┬────────────────────────────────┘
                                │ HTTPS, egress via Google's default route
                                ▼
                    ┌───────────────────────────┐
                    │  Gemini API               │
                    │  vernacular explanation   │
                    │  EN / HI / TE · optional  │
                    └───────────────────────────┘

  Supporting  ·  Artifact Registry (images)  ·  Cloud Build (CI/CD from main)
              ·  Secret Manager (one secret: the Gemini key)
              ·  Cloud Logging + Monitoring  ·  Cloud DNS (udyamai.in)
              ·  IAM service accounts only — no long-lived keys anywhere
```

**One service sits in the request path.** That is the number to quote when asked about
operational complexity. There is no load balancer, no VPC, no connector, no NAT gateway, no
database, no cache and no message broker — not because they were forgotten, but because at this
scale each one would be a moving part with nothing to do.

### 3.2 What production adds

```
   PWA (Cloud Storage + Cloud CDN)          Global External Load Balancer
                │                            └─ Cloud Armor · managed TLS
                └───────────────┬───────────────────┘
                                ▼
              ┌──────────────────────────────────────┐
              │  Cloud Run · Django 5 + DRF          │
              │  1–100 · Direct VPC egress           │
              │  --vpc-egress=private-ranges-only    │
              └──────────┬─────────────────┬─────────┘
                         │ private IP      │ public egress stays on
                         ▼                 │ Google's default route —
         ┌───────────────────────────┐     │ no Cloud NAT required
         │  Cloud SQL PostgreSQL 16  │     ▼
         │  private IP · no public   │   Vertex AI (Gemini, asia-south1)
         │  endpoint · HA · PITR     │   Cloud Storage · Firestore · BigQuery
         └───────────────────────────┘

   Cloud Run Jobs ◀── Cloud Scheduler   · Sun 02:00 IST — LR retrain
                                        · Daily 03:00 IST — bounce sweep
```

The application code does not know which of these two pictures it is running in. That is the
point of §2.3.

---

## 4. Google Cloud services — the complete list

### 4.1 In the request path

| Service | Configuration | Role | Chosen over |
|---|---|---|---|
| **Cloud Run** | 1 vCPU / 512 MiB, min 0 → max 10, concurrency 80 | The entire application. HTTPS, managed TLS, autoscaling, deploy-from-Artifact-Registry, revision-based rollback | **GKE Autopilot** — a control plane and a cluster to orchestrate one container. **App Engine standard** — a runtime we do not control, and a worse local-dev story than a Dockerfile. **Cloud Functions** — the unit here is a whole Next.js server, not a handler |

That is the table. There is one row in it.

### 4.2 Supporting

| Service | Configuration | Role |
|---|---|---|
| **Artifact Registry** | 1 repository, ~1 GB after cleanup policy | Container images |
| **Cloud Build** | Trigger on push to `main`, `cloudbuild.yaml` | Build → push → deploy. 120 free build-minutes/day covers this comfortably |
| **Secret Manager** | 1 secret (`udyamai-google-api-key`) | The Gemini key, mounted as a Cloud Run env var. There are no database credentials, because there is no database |
| **Cloud Logging + Monitoring** | 30-day retention, 3 alerts | 5xx rate · p95 latency · monthly spend |
| **Cloud DNS** | 1 managed zone | `udyamai.in` |
| **IAM** | Runtime service account, least privilege | No long-lived keys |
| **Cloud Billing budgets** | Alert at 50% / 90% / 100% | Spend guardrail |

### 4.3 Deferred until there is a reason

Named here so their absence reads as a decision rather than an omission:

| Service | Trigger that brings it in |
|---|---|
| Cloud SQL PostgreSQL | First real customer PII — the moment data stops being an open dataset |
| Firestore | Score history and event streams, once they outgrow per-request computation |
| Memorystore | A measured cache-hit opportunity, not a guess |
| Cloud Run Jobs + Scheduler | The moment retrain must happen on a schedule rather than on demand |
| Global LB + Cloud Armor + Cloud CDN | A second service, a custom WAF rule, or real traffic |
| Vertex AI | Production LLM serving — in-region prompts and a Cloud Audit Log per call |
| Cloud Storage | Consent artefacts and PDF exports, which arrive with AA integration |

### 4.4 Service count

**7 services: 4 billable at meaningful amounts + 3 at or near zero.** One sits in the request path.

| | Services |
|---|---|
| **Request path (1)** | Cloud Run |
| **Supporting, billable (4)** | Artifact Registry · Cloud Build · Cloud DNS · Cloud Logging |
| **Foundational, ~₹0 (3)** | IAM · Secret Manager · Billing budgets |

**Zero VMs. Zero databases. No load balancer, no Kubernetes, no NAT, no message broker.**

For comparison, the AWS revision of this document listed 15 services, 4 in the request path.

---

## 5. Data architecture

### 5.1 The 12 signals

The scoring differentiator is *where the data comes from*. Twelve signals in three rails, and only
the first rail is Account Aggregator — a distinction most submissions get wrong.

| Rail | Signals | Source | Mechanism |
|---|---|---|---|
| **Base 4** | GST returns · UPI flows · Bank statements · EPFO | AA network (Finvu / Sahamati) | Consent handle, ReBIT spec |
| **Sector 4** | Electricity draw · Certifications (ISO/FSSAI/Handloom) · Digital presence · Trade activity (e-way bills) | DISCOM FIPs, government registers | **Not AA** — AA carries financial FI-types only |
| **Alt-data 4** | Satellite crop imagery · POS velocity · Import records (ICEGATE) · TReDS participation | Specialised APIs | **Not AA** — commercial + public data partners |

These twelve feed four sub-scores → one 0–1000 score:

| Sub-score | Weight | Inputs |
|---|---|---|
| Revenue Stability | 30% | 12-month revenue variance, trend |
| Compliance | 25% | GSTR on-time rate, filing lag, EPFO status, bounces |
| Counterparty Risk | 25% | Top-buyer concentration, buyer/supplier diversity |
| Growth Momentum | 20% | Revenue + UPI trend, cash-buffer months, bounce penalty |

**Principle: consented or public, never scraped.** Sector and alt-data signals are sourced from
official registers or licensed partners — never harvested. This is the answer to the compliance
question a bank panel will ask.

### 5.2 The corpus

Three JSON files, committed to the repository and copied into the container image:

| Fixture | Size | Contents |
|---|---|---|
| `src/data/agami/accounts.json` | 91 KB | 200 bank-statement accounts across 30 institutions, 7 cities |
| `src/data/agami/transactions.json` | 3.5 MB | **32,349** parsed transactions · ₹2,369 Cr aggregate volume · **277 bounces** |
| `src/data/agami/itr.json` | 35 KB | 100 ITR filings — income, tax, late-filing flag (52 late filers), 6 linked to demo GSTINs |

Parsed transaction mix: OTHER 18,549 · NEFT 4,579 · UPI 3,823 · IMPS 2,582 · RTGS 1,509 ·
CHARGE 1,307.

Source: **AgamiAI open datasets, Apache 2.0**, attributed in-product. Not synthetic.
Regenerate with `npm run data:build` — Node only, no Python, no credentials, no database.

> **A correction carried over from the RDS build.** That revision reported 97,106 transactions.
> The true de-duplicated figure is **32,349**; `agami_transactions` had no uniqueness constraint
> and the ingest script was run three times, so each run appended the corpus again. The number in
> this document is the one the running application actually aggregates. Anywhere the old figure
> survives — a slide, a deck note — it should be corrected.

### 5.3 Why this is not a database

Every query the RDS build ran was a read-only aggregation over a fixed corpus that changes when we
choose to regenerate it. Specifically:

| Old SQL | Now |
|---|---|
| 5 aggregations over `agami_transactions` for one account | One pass over an array in `src/lib/agami/statements.ts` |
| `SELECT … WHERE linked_gstin = $1` | A `Map` lookup in `src/lib/agami/itrData.ts` |
| A CTE pair for per-account training features | Two passes in `src/lib/agami/lrRetrain.ts` |
| `SELECT … WHERE failed = TRUE ORDER BY txn_date DESC` | A pre-sorted array in `src/lib/agami/dataset.ts` |

The corpus parses and indexes **once per container instance** — measured at 48 ms — and every
request after that is a map lookup. Serving that from a managed Postgres instance would add a
network hop, a connection pool to tune, a credential to rotate, a VPC to place it in, a connector
to reach it and a NAT gateway for everything else. The honest description of that is not
"architecture"; it is a database kept because the previous architecture had one.

**What we gave up, stated plainly:** the data is now immutable at runtime and a refresh requires a
redeploy. For a fixed open dataset that is not a cost. It becomes one the moment real MSME records
arrive — see §4.3 and §10, Stage 2.

### 5.4 The two mutable things

| State | Where | Lifetime |
|---|---|---|
| Loan application pipeline | `/tmp/udyamai/pipeline.json` | Per instance; lost on recycle |
| LR retrain history | `/tmp/udyamai/retrain.json` | Per instance; a cold instance retrains from the corpus on first read |

Both go through **`src/lib/runtimeStore.ts`** — one file, ~30 lines, which is the entire swap
surface for Firestore or Cloud SQL later. Nothing above it knows where the bytes land.

The consequence, stated rather than hidden: an application submitted on instance A is invisible to
instance B. For a judged demo that is acceptable, and `--max-instances 1` removes it entirely for
the duration of a demo. It is not acceptable for a pilot, which is exactly why Stage 2 in §10
begins with Cloud SQL.

### 5.5 Rails we plug into

| Rail | Our role | Status |
|---|---|---|
| **Account Aggregator** | FIU (Financial Information User) | Finvu sandbox |
| **ULI** (RBIH) | Consumer of 64-lender pre-qualification | Not available to individuals — modelled |
| **OCEN 4.0** | **Loan Agent (LA)** | Protocol contract implemented (`/loan/search·offer·accept·status`) |

---

## 6. The credit decision path

This is the section a bank panel will interrogate hardest.

```
12 signals ──▶ 4 sub-scores ──▶ 0–1000 score ──▶ per-lender LR ──▶ P(approval) + quote
                                     │                  │
                                     │                  └── 7 weights, published on-screen
                                     └── deterministic, reproducible, no ML
```

**Every step is auditable.** The sub-scores are deterministic arithmetic over documented inputs.
The approval probability comes from a 7-weight logistic regression whose coefficients render in
the product's Model Card. There is no black box in the decision path.

**Where the LLM sits — and does not.** Gemini writes the *explanation* a borrower reads. It never
touches the score. If the API key is absent or the call times out (2.8 s budget), the score is
unchanged and a deterministic explanation renders instead. The LLM is a presentation layer over an
already-decided outcome.

**Retraining.** `POST /api/retrain` trains all three lender models over the corpus in **20 ms** and
persists weights, accuracy, AUC and sample count. Label noise is drawn from a **seeded PRNG**
(mulberry32, keyed on the lender name), so a given corpus always produces the same numbers — a
change from the RDS build, where `Math.random` meant every cold start reported different accuracy
for identical data. Current figures over 200 accounts at 300 epochs:

| Lender | AUC | Holdout accuracy |
|---|---:|---:|
| IDBI Bank | 0.728 | 66% |
| SBI | 0.818 | 74% |
| HDFC Bank | 0.847 | 82% |

**These are in-sample.** The holdout is sliced from the training set, so the figures are
optimistic and are labelled as such here and in §12. Fixing it is a `train_test_split`, and it is
on the port list rather than done quietly, because changing a reported model metric silently is
worse than reporting an honest caveat.

**Why this matters commercially:** RBI model-risk expectations push toward interpretable credit
models. We would have chosen an LR regardless — and it costs ₹0 in GPU.

---

## 7. Security and compliance

### 7.1 Regulatory mapping

| Requirement | How this architecture meets it |
|---|---|
| **RBI payment-data localisation** (DPSS.CO.OD.No.2785) | All storage and compute in asia-south1. No cross-region replication |
| **RBI Master Direction on IT Governance (2023)** | Single-region residency, encrypted at rest and in transit by default, audit log per credit decision |
| **RBI Digital Lending Guidelines** | We are an LSP and never touch customer funds — money moves lender → borrower directly via the OCEN disbursement partner |
| **DPDP Act 2023** | Consent lifecycle via AA; 72-hour deletion; consent artefacts in Cloud Storage with versioning *(Stage 2)* |
| **Sahamati / ReBIT** | Consent-handle-based pulls, full consent trail |
| **Model risk** | Only an interpretable LR decides; coefficients published in-product |

**The prototype's residency position is unusually simple: it holds no customer data at all.** The
corpus is a published open dataset and the only personal data in the system is a demo session
cookie. That changes at Stage 2, and §10 is where the controls arrive with it.

### 7.2 Controls

| Control | Implementation |
|---|---|
| Transport | Cloud Run terminates managed TLS. HTTP is not served |
| Secrets | Secret Manager → Cloud Run env var at start. No secrets in the image or in git. **One secret exists**, and it is not a credential to anything of ours |
| Identity | Dedicated runtime service account, least privilege. Zero long-lived keys |
| Container | Non-root user (`nextjs`, uid 1001), read-only image, writable `/tmp` only |
| Audit | Structured log line per score computation and per lender decision → Cloud Logging |
| Cost | Billing budget alerts; `--max-instances 10` is a hard ceiling on runaway spend |
| Supply chain | `npm ci` against a committed lockfile; images tagged by commit SHA, never `:latest`, so a deployed revision is traceable to exact bytes |

### 7.3 Network design — there is no private network, and that is the point

The AWS revision spent a page and ₹2,940/month proving the database was not on the internet. That
argument is now moot in the cleanest possible way: **there is no database.** Cloud Run holds no
inbound surface beyond one HTTPS endpoint, and holds no credentials that would make breaching it
interesting.

When Cloud SQL does arrive at Stage 2, the shape is:

```
  Cloud Run  ──Direct VPC egress──▶  VPC (10.20.0.0/16, asia-south1)
     │         --vpc-egress=                  │
     │         private-ranges-only            ▼
     │                              Cloud SQL PostgreSQL 16
     │                              private IP · no public IP
     │                              authorized networks: none
     │
     └── public egress (Gemini, AA network, DISCOM APIs)
         stays on Google's default route
```

**This is where Google Cloud is structurally cheaper than the AWS design, not just cheaper by
list price.** Attaching an App Runner VPC connector *removes* the service's default internet
access, so every third-party call then needs a NAT Gateway — ~USD 35/month, which was the single
largest line in the AWS budget and the reason that document spends 600 words justifying it. Cloud
Run's `private-ranges-only` egress routes **only RFC-1918 traffic** into the VPC; public egress
continues out Google's managed path. Private database, public third-party calls, **no NAT, no
second NAT for AZ redundancy, and nothing to fail over.**

That single behavioural difference removes a fixed ₹2,940/month, a documented single-point-of-
failure, and an entire section of this document.

---

## 8. Scalability

**The shape scales. The sizing is deliberately small.** These are different questions.

### 8.1 Tier ceilings

| Tier | Ceiling as configured | How it grows | Rewrite? |
|---|---|---|---|
| Cloud Run | 10 instances × 80 concurrent ≈ **800 concurrent** | Raise `--max-instances`; the default quota is 1,000 | No |
| Corpus in memory | 74 MiB per instance, constant | Bounded by the fixture size, not by traffic | No |
| Gemini API | Per-project RPM quota | Quota increase, or cache on `(gstin, score, lang)` | No |
| `/tmp` state | Per instance, ~MB | This is the tier that does not scale — see §5.4 | **Yes — Cloud SQL, Stage 2** |

**There is no database bottleneck, because there is no database.** The tier that genuinely does
not scale is `/tmp`, and it is named rather than buried.

### 8.2 Latency budget

Measured against the container image, not aspirational:

| Path | Measured / target |
|---|---|
| Cold start — Node boot + corpus index | **~48 ms** on top of Node boot |
| `/api/debug/dataset` (touches every fixture) | **~48 ms** cold, <5 ms warm |
| `POST /api/retrain` (3 lenders × 300 epochs × 200 samples) | **20 ms** |
| `/dashboard` full SSR render, warm | < 400 ms target |
| Explanation — cold (Gemini) | < 1,200 ms, hard-capped at 2.8 s then falls back |

Cold start is dominated by indexing 3.7 MB of bundled JSON. That is the price of having no
database, it is paid once per instance, and it is roughly an order of magnitude cheaper than the
round trip it replaces.

### 8.3 Three code decisions that make the small sizing hold

1. **Parse the corpus once per process.** `getDataset()` memoises into a module-level singleton;
   the 32,349 transactions are parsed through `parser.ts` exactly once per instance.
2. **Cache on `(gstin, score, lang)`.** A score changes at most daily; the explanation changes only
   when the score does. This removes Gemini from the hot path. Highest-leverage item not yet done.
3. **Load LR weights; never train in the request path.** `getLatestRuns()` reads persisted runs and
   only trains when an instance has none.

---

## 9. Cost

> List prices as of September 2026, asia-south1, before free tiers where noted. Verify against
> `cloud.google.com/products/calculator` before quoting externally.

### 9.1 Prototype

| Line item | Config | USD/mo | ₹/mo |
|---|---|---:|---:|
| **Cloud Run** | 1 vCPU / 512 MiB, min-instances 0, demo traffic | **~0** | **~0** |
| Gemini API | ~2,000 short completions | 4 | 340 |
| Artifact Registry | ~1 GB with a cleanup policy | 1 | 85 |
| Cloud DNS | 1 managed zone | 1 | 85 |
| Cloud Build | ~60 builds/mo, within 120 free min/day | 0 | 0 |
| Cloud Logging | 30-day retention, within 50 GiB free | 0 | 0 |
| Secret Manager · IAM · Budgets | 1 secret | 0 | 0 |
| **Total** | | **~6** | **~510** |

Cloud Run's monthly free tier — 2 million requests, 180,000 vCPU-seconds, 360,000 GiB-seconds —
comfortably covers a judged demo, so the compute line rounds to zero. **A service with
`min-instances 0` and no traffic costs nothing at all**, which is the property that makes leaving
the environment up until 31 October free rather than a monthly decision.

**Window total (20 Aug – 31 Oct, 2.4 months): ~USD 15 ≈ ₹1,250.**
**Requested with Demo Day headroom: ~USD 50 ≈ ₹4,200.**

**Against the AWS design this replaces: USD 71/month → USD 6/month, a 92% reduction.** The saving
is not a discount; it is three line items ceasing to exist:

| Removed | Was | Why it is gone |
|---|---:|---|
| NAT Gateway | USD 35/mo | Cloud Run's `private-ranges-only` egress needs no NAT (§7.3) |
| RDS + storage + backups | USD 16/mo | No database (§5.3) |
| App Runner warm instance | USD 8/mo | Scale-to-zero, and a ~48 ms corpus index instead of a 2–4 s cold start |

### 9.2 Demo Day (03 Sep)

`--min-instances 1` for the week removes the cold start entirely. At 1 vCPU / 512 MiB that is a
few dollars for seven days — inside the headroom above, and a single flag to set and unset:

```bash
gcloud run services update udyamai --region asia-south1 --min-instances 1   # before
gcloud run services update udyamai --region asia-south1 --min-instances 0   # after
```

### 9.3 Unit economics at scale

The number that matters to a bank is **cost per MSME per month**. It improves sharply with scale
because the architecture is stateless above the database — and because there is no fixed NAT line
dominating the small stages.

| Stage | MSMEs | Infra ₹/mo | **₹ / MSME / mo** |
|---|---|---:|---:|
| Prototype | 200 demo | 510 | 2.55 |
| Pilot (Stage 2) | 1,000 | 14,000 | 14.00 |
| Growth (Stage 3) | 10,000 | 24,000 | 2.40 |
| **Scale (Stage 4)** | **100,000** | **55,000** | **0.55** |

Stage 2 is the expensive step per-MSME, because that is where Cloud SQL, HA and the compliance
controls arrive for a still-small user base. That is the correct place to spend: it is the step
where real customer PII first exists.

**Separating infrastructure from per-transaction rail cost** — a distinction that matters, because
only the second scales linearly:

| At 100,000 MSMEs/month | ₹/mo | ₹/MSME |
|---|---:|---:|
| Google Cloud infrastructure | 55,000 | 0.55 |
| AA data pulls (₹0.50 × 100k) | 50,000 | 0.50 |
| Aadhaar eKYC (₹15 × 10k new) | 1,50,000 | 1.50 |
| SMS OTP (₹0.15 × 200k) | 30,000 | 0.30 |
| **Total cost of service** | **2,85,000** | **2.85** |

**Against revenue:** at ₹500 per pre-qualified converted lead and a 1% monthly conversion of a
100,000-MSME base = 1,000 leads = **₹5,00,000/month revenue against ₹2,85,000 cost.**
Gross margin ~43%, improving with scale because only ₹0.55 of the ₹2.85 is infrastructure — and
eKYC, the largest line, is one-time per MSME, not recurring.

**Cloud infrastructure is 19% of cost of service at scale.** The business is limited by rail
economics, not by cloud spend. That is the correct shape for a lending business.

---

## 10. Growth path

Every step has a **trigger**. Nothing is provisioned against a projection.

| Stage | Trigger | Add | +₹/mo |
|---|---|---|---|
| **1 · Prototype** | now | As documented above — one Cloud Run service, no database | — |
| **2 · Pilot** | **First real customer PII** (AA integration live) | Cloud SQL HA on a private IP, Direct VPC egress, Firestore for score history, Secret Manager rotation, Cloud Armor, 1-year audit retention | +13,500 |
| **3 · Growth** | Sustained traffic beyond demo | Global LB + Cloud CDN, PWA split to Cloud Storage, Django on a second Cloud Run service, Memorystore, Cloud SQL read replica | +10,000 |
| **4 · Scale** | Multi-lender OCEN production traffic | Cloud SQL HA upsize or AlloyDB, Pub/Sub + Cloud Run worker services, Cloud Run Jobs for retrain, BigQuery warehouse | +31,000 |
| **5 · Audited** | Regulated pilot / SOC 2 | Assured Workloads, VPC Service Controls, Security Command Center, per-decision immutable audit log | +2,000 |

**Nothing in this path is a rewrite.** Stage 2 changes one file (`src/lib/runtimeStore.ts`) and
adds a connection string. Stage 3 runs the identical container image behind a load balancer.
Stage 4 swaps the database behind the same wire protocol. The application code does not know which
stage it is in.

**The one genuine migration** is §5.3 in reverse: when real MSME records replace the open corpus,
`src/lib/agami/dataset.ts` grows a Cloud SQL-backed sibling and the query shapes it already
implements move back into SQL. They were written from that SQL, so the translation is mechanical
and the tests are the existing page renders.

---

## 11. Rejected alternatives

Included because "why not X" is the most common architecture-review question.

| Alternative | Why not |
|---|---|
| **Keeping Cloud SQL / any managed Postgres for the prototype** | 3.7 MB of read-only open data. A managed instance would add a network hop, a pool, a credential, a VPC and a connector to serve what a `Map` serves in microseconds — and would prevent scale-to-zero, turning a ₹0 idle month into a fixed bill |
| **GKE / GKE Autopilot** | A cluster to orchestrate one container. Cloud Run is the same primitive without the control plane, the node pool or the YAML |
| **Compute Engine VMs** | Nothing here needs a machine we patch. Managed containers remove an operational surface for less money |
| **App Engine standard** | A runtime we do not control, no `docker run` parity for local dev, and migration away is a rewrite rather than a redeploy |
| **Cloud Functions** | The deployable unit is a whole Next.js server with SSR pages, not an isolated handler |
| **Firestore instead of the bundled corpus** | Turns 32,349 rows of fixed data into 32,349 document reads billed per request, and makes a local dev environment require a network |
| **AlloyDB** | Correct at Stage 4 if Postgres becomes the bottleneck. At Stage 1 it is a bill for an empty instance |
| **BigQuery as the primary store** | Analytical engine, per-query pricing, seconds of latency. Right for the Stage 4 warehouse, wrong for a page render |
| **Vertex AI for training** | A 7-weight logistic regression trains in 20 ms in-process. Vertex would cost more than the rest of the stack to run a dot product |
| **Identity Platform / Firebase Auth** | Our identity is a **GSTIN**, not an email — and the session must carry role plus GSTIN claims. Django owns this in ~50 lines at Stage 2. A managed IdP adds a service boundary for no gain, and its SMS path hits the same DLT wall |
| **Global LB in front of one Cloud Run service** | ~USD 18/month for a forwarding rule to front a service that already has managed TLS and an anycast URL. Correct when there are two services or a Cloud Armor rule; overhead today |
| **Cloud NAT** | Not needed. `--vpc-egress=private-ranges-only` keeps public egress on Google's default route (§7.3). This is the single largest structural saving over the AWS design |
| **`--vpc-egress=all-traffic`** | Would route third-party calls through the VPC and reintroduce Cloud NAT — reinventing the AWS problem on Google Cloud. Only justified if egress IP allowlisting is ever demanded by a partner |
| **Multi-region** | Actively prohibited. RBI localisation requires Indian residency; multi-region outside India would be a compliance regression. asia-south2 (Delhi) is the only acceptable second region |
| **Staying on AWS Amplify** | Amplify SSR put compute on the critical path behind a build-time `.env.production` hack to get env vars into the Lambda runtime. Cloud Run takes env vars and secrets as configuration, which is what they are |

---

## 12. Delivery plan

### Phase 1 — what gets demoed

The Next.js application already renders every surface, ships `manifest.webmanifest`, and now
deploys as a single container. The remaining work is the Django port, not the demo.

| Step | State |
|---|---|
| Remove the database from the request path | **Done** — §5.3 |
| Bundle the real corpus, regenerable from source | **Done** — `npm run data:build` |
| Deterministic retrain metrics | **Done** — seeded PRNG, §6 |
| Cloud Run image + Cloud Build pipeline | **Done** — `Dockerfile`, `cloudbuild.yaml`, `DEPLOY.md` |
| Deploy to Cloud Run and verify `/api/debug/dataset` | Pending — one command, §DEPLOY.md |
| Service worker → the PWA claim becomes true | Pending |
| Cache Health Card + explanation on `(gstin, score, lang)` | Pending — §8.3 |
| Scaffold `api/` — Django 5 + DRF, models from the old `sql/schema.sql` | Phase 2 |
| Port `scoreEngine.ts` → `scoring/`; `mlModel.ts` + `lrRetrain.ts` → numpy **with a real split** | Phase 2 |
| OTP + JWT replacing the unsigned cookie | Phase 2 |
| Applications in Cloud SQL, not `/tmp` | Phase 2 |

### Phase 2

Vite + React PWA split · `vite-plugin-pwa` · retire Next.js at parity · Gemini API → Vertex AI for
in-region prompts and audit logs · Cloud SQL · DLT registration for SMS OTP.

### Known issues that must not survive the port

| Issue | Location | Fix |
|---|---|---|
| Application pipeline in `/tmp` — invisible across instances | `src/lib/runtimeStore.ts` | Cloud SQL. One file (§5.4) |
| Retrain holdout sliced from the training set — AUC is in-sample | `src/lib/agami/lrRetrain.ts` | `train_test_split`. Flagged in §6 rather than silently changed |
| Unsigned, `httpOnly:false` session cookie | `src/lib/auth.ts` | JWT |
| `/api/retrain` is public and writes on `GET` | `src/app/api/retrain/route.ts` | Do not port — Cloud Run Jobs + Cloud Scheduler |
| `/api/debug/dataset` is public | `src/app/api/debug/dataset/route.ts` | Read-only and leaks no secrets, but gate it behind IAM in production |

Resolved by this revision and listed so the port does not reintroduce them:

| Was | Now |
|---|---|
| `rejectUnauthorized: false` — DB TLS encrypted but unauthenticated | No database, no TLS trust decision to get wrong |
| `/api/debug/db` exposed connection diagnostics publicly | Deleted |
| Amplify's build-time `.env.production` env-var forwarding | Secret Manager → Cloud Run env |
| `Math.random` in the labeler — model metrics differed per cold start | Seeded PRNG |
| 97,106 transactions reported from triple-ingested rows | 32,349, de-duplicated and verifiable (§5.2) |

---

## Appendix · Repository layout

### Today

```
UdyamAI/
├── Dockerfile              Cloud Run image — Next.js standalone, non-root, /tmp state
├── amplify.yml             AWS Amplify SSR — the interim deploy target
├── cloudbuild.yaml         Cloud Build → Artifact Registry → Cloud Run
├── DEPLOY.md               First-time setup, sizing, rollback
├── scripts/
│   └── build_agami_fixtures.mjs   Hugging Face → src/data/agami/*.json
├── src/
│   ├── data/agami/         The corpus — accounts · transactions · itr
│   ├── app/                SSR pages + API routes
│   ├── components/         landing/ · motion/
│   └── lib/
│       ├── agami/          dataset · parser · statements · itrData · lrRetrain
│       ├── runtimeStore.ts The only mutable state — the Stage 2 swap surface
│       └── …               scoreEngine · mlModel · gstin · ocen · gemini · auth
└── docs/                   AA / ULI / OCEN treatments
```

### After the Phase 2 split

```
UdyamAI/
├── web/          React PWA — Vite + TS + Tailwind + framer-motion
│                 components/** port from src/components/** almost verbatim
│                 gstin.ts stays client-side (on-device checksum is a product feature)
├── api/          Django 5 + DRF — scoring/ · calibrator/ · agami/ · ocen/ · accounts/
├── jobs/         Cloud Run Jobs — retrain + bounce sweep
├── infra/        Terraform
└── scripts/      build_agami_fixtures.mjs
```

**The GSTIN checksum is duplicated on purpose** — TypeScript for the on-device validation the
landing page advertises, Python because client-side validation is never a trust boundary.
