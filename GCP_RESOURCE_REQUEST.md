# UdyamAI — Google Cloud Resource Request (Hackathon Prototype)

Prepared 22 Sep 2026 · IDBI Innovate 2026, Track 3 (MSME Financial Health Card)
Supersedes `AWS_RESOURCE_REQUEST.md` (19 Aug 2026), which is withdrawn.

**Architecture: one stateless container on Cloud Run. No database.**
**Scope: production-*ready* prototype, not production scale.** Every line item earns its place in
a judged demo. Depth lives in `ARCHITECTURE.md`; this document is the form.

> **What changed since the August request.** The prototype no longer runs a database. The AgamiAI
> open datasets it reads are 3.7 MB of fixed, read-only data, so they are compiled into the
> container image instead of being served from a managed Postgres instance. That removed the
> database, the VPC, the connector and the NAT Gateway behind it — **USD 71/month of requested
> resources becomes USD 6/month**, and the service now scales to zero between demos.

---

## Part 1 — Form answers

### Track
**Track 3 — MSME Financial Health Card**

### Use case

UdyamAI is a borrower-facing "living Health Card" for Indian MSMEs. A GST-registered business gets
a continuously-refreshed 0–1000 financial health score built from consented Account Aggregator
feeds (bank statements, GST returns, EPFO), plus the specific quantified actions that will raise
it — *before* they ever file a loan application. Lenders see a pre-scored pipeline and
post-sanction early-warning alerts (score drop, NACH bounce).

The prototype is a **Next.js 14 application** — server-rendered pages plus API routes, installable
as a PWA — running as a single container on Cloud Run. It owns the score engine, the per-lender
logistic-regression calibrator and the OCEN protocol contract. Its data is real: 200 bank-statement
accounts, 32,349 parsed transactions and 100 ITR filings from the **AgamiAI Apache-2.0 open
datasets**, bundled into the image and aggregated in-process.

Demo-scale target: **~200 demo MSME profiles, 3 lender desks, a few thousand page views across
the judging window.**

### Google Cloud services required

☑ **Cloud Run** — the entire application, 1 service
☑ **Artifact Registry** — container images
☑ **Cloud Build** — CI/CD from `main`
☑ **Secret Manager** — one secret (the Gemini API key)
☑ **Cloud Logging + Cloud Monitoring** — logs, 3 alerts
☑ **Cloud DNS** — `udyamai.in`
☑ **IAM** — one runtime service account
☑ **Vertex AI** *(optional, Phase 2)* — in-region Gemini with per-call audit logs; the prototype
uses the Gemini API directly

☐ Compute Engine — *not required; no VMs anywhere*
☐ Cloud SQL — *not required at prototype stage; see Appendix A, Stage 2*
☐ GKE — *not required; one container does not need a cluster*
☐ VPC / Cloud NAT — *not required; nothing private to reach*

**7 services total: 4 billable at meaningful amounts + 3 at or near zero. One sits in the request
path (Cloud Run). Zero VMs, zero databases, no load balancer, no Kubernetes, no NAT.**

### Region preference

**Mumbai — asia-south1** (mandatory, not a preference — see justification)

### Estimated compute or storage size

| Resource | Size |
|---|---|
| Cloud Run — the application | **1 vCPU / 512 MiB**, min-instances **0** → max-instances 10, concurrency 80 |
| Measured steady-state memory | **74 MiB** RSS with the full corpus loaded and every page served |
| Artifact Registry | 1 repository, **~1 GB** with a cleanup policy (image is ~280 MB) |
| Bundled data (inside the image) | **3.7 MB** — 200 accounts · 32,349 transactions · 100 ITR filings |
| Per-instance scratch | `/tmp`, a few MB — demo loan pipeline and retrain history |
| Cloud Logging | 30-day retention, within the 50 GiB monthly free allotment |
| **Total persistent storage requested** | **~1 GB** |

The AWS request asked for ~28 GB and a 24×7 database instance. This one asks for a container
registry.

### Required duration (start date)
**20 August 2026**

### Required duration (end date)
**31 October 2026** (~2.4 months)

| Date | Milestone |
|---|---|
| 20 Aug 2026 | Induction session · environment provisioning begins |
| 21 Aug – 02 Sep 2026 | Prototype refinement — the build window |
| 24 Aug 2026 | Mentor architecture review |
| **03 Sep 2026** | **Virtual Demo Day — peak load event** |
| 19 Sep 2026 | Offline winner felicitation |
| 31 Oct 2026 | Requested end of access |

With `min-instances 0`, an idle month costs effectively nothing, so leaving the environment up
through 31 October for post-event lender conversations is free rather than a monthly decision.

### Estimated cost

**~USD 6 / month (~₹510)** → **~USD 15 (~₹1,250) for the 2.4-month window.**

Requested with headroom for the Demo Day traffic spike and a week of `min-instances 1`:
**~USD 50 (~₹4,200).**

Indicative asia-south1 list pricing; breakdown in Part 3. Cloud Run's monthly free tier
(2M requests, 180,000 vCPU-seconds, 360,000 GiB-seconds) covers demo traffic, so the compute line
rounds to zero and the largest remaining line is the Gemini API.

### Business or technical justification

**Business.** 70% of Indian MSME credit applications are rejected — overwhelmingly not because the
business is uncreditworthy, but because it cannot *prove* creditworthiness at the moment of
application. Every incumbent (Perfios, Jocata, Karza) sells scoring to the *bank*, at the instant
of application. Nobody has built the borrower-facing equivalent of Credit Karma for Indian MSMEs.
UdyamAI closes that gap: the MSME sees the score continuously, knows what to fix, and arrives at
the lender already qualified. For IDBI this converts a rejection-heavy funnel into a pre-scored
pipeline, and adds post-disbursement early-warning on the existing book — an NPA reduction lever,
not only an origination lever.

**Technical.** Every credit-bearing computation — the score engine, the LR calibrator, the OCEN
contract — is server-side, where it can be audited, versioned and logged. The delivery surface is
an installable PWA, chosen over native apps because MSME owners are on low-end Android with
constrained storage; an installable PWA reaches them where a 40 MB Play Store download does not.

**Why a single container with no database is the right prototype shape.** The prototype's data is
a published open dataset: 3.7 MB, read-only, and changing only when we choose to regenerate it.
Every query against it was a read-only aggregation. Serving that from a managed Postgres instance
would add a network hop, a connection pool, a credential, a VPC and a connector — and would
prevent scale-to-zero, converting a ₹0 idle month into a fixed monthly bill. The aggregations now
run in-process in microseconds against a corpus parsed once per instance in ~79 ms. Cloud SQL
enters at Stage 2, when real customer PII first exists and the data genuinely becomes mutable.

**Why Mumbai is non-negotiable.** Three binding constraints:

1. **RBI payment-data localisation** (DPSS.CO.OD.No.2785/06.08.005/2017-18) — payment-system data
   must be stored only in India.
2. **RBI Master Direction on IT Governance (2023)** and the **Digital Lending Guidelines** —
   lending-related customer data held by a Lending Service Provider must reside in India.
3. **DPDP Act 2023** consent lifecycle and 72-hour deletion obligations are materially easier to
   evidence with single-region residency.

The Account Aggregator network (Sahamati/Finvu) and the ULI rail (RBIH) both terminate in India,
so asia-south1 also keeps AA round-trip latency inside the budget the consent flow needs. Google
Cloud additionally offers **asia-south2 (Delhi)**, which means disaster recovery can stay in India
— the AWS design had to reach for Tokyo, which sat awkwardly against the residency argument.

**Why there is no GPU line item.** The credit decision is a 7-weight logistic regression *by
regulatory design* — it must stay interpretable to satisfy RBI model-risk expectations, and its
coefficients are published on-screen in the product. It trains in **20 ms** on CPU.

### Point of contact name
Srinivas Sahan Kolluri *(confirm exact spelling as it should appear)*

### Point of contact email
26sahan@gmail.com

### Point of contact phone number
`[TO FILL — +91 XXXXX XXXXX]`

### Which city do you belong to?
`[TO FILL]`

---

## Part 2 — Architecture (asia-south1)

The full treatment is in **`ARCHITECTURE.md`**. The short version:

```
   MSME owner                    Lender desk
        └──────────┬──────────────────┘
                   │ HTTPS · managed TLS
                   ▼
   ┌────────────────────────────────────────┐
   │  Cloud Run · udyamai · asia-south1      │
   │  Next.js 14 · 1 vCPU / 512 MiB          │
   │  min 0 → max 10 · ~280 MB image         │
   │  3.7 MB AgamiAI corpus inside the image │
   │  /tmp for demo pipeline + retrain runs  │
   └──────────────────┬─────────────────────┘
                      │ egress on Google's default route
                      ▼
              Gemini API · EN / HI / TE · optional

   Artifact Registry · Cloud Build · Secret Manager
   Cloud Logging + Monitoring · Cloud DNS · IAM
```

### Service selection and rationale

| Choice | Rejected alternative | Why |
|---|---|---|
| **Cloud Run** | GKE / GKE Autopilot | A control plane and a node pool to orchestrate one container |
| **Cloud Run** | Compute Engine | Nothing here needs a machine we patch |
| **Cloud Run** | App Engine standard | A runtime we do not control; no `docker run` parity for local dev |
| **Cloud Run** | Cloud Functions | The deployable unit is a whole Next.js server, not a handler |
| **Bundled corpus** | Cloud SQL / Firestore | 3.7 MB of read-only open data; a `Map` beats a network hop, and scale-to-zero survives |
| **Direct HTTPS egress** | VPC + Cloud NAT | Nothing private to reach. At Stage 2, `--vpc-egress=private-ranges-only` reaches a private-IP Cloud SQL **while public egress stays on Google's default route** — so no Cloud NAT, ever |
| **Cloud Run URL** | Global LB + Cloud CDN | ~USD 18/mo for a forwarding rule in front of a service that already has managed TLS. Correct at Stage 3 |
| **In-process LR** | Vertex AI Training | A 7-weight regression trains in 20 ms. Vertex would cost more than the rest of the stack to run a dot product |

**The NAT point is the one worth making to a reviewer.** On AWS, attaching an App Runner VPC
connector removes the service's default internet access, so every third-party call then requires a
NAT Gateway — USD 35/month, the single largest line in the withdrawn request. Cloud Run's
`private-ranges-only` egress routes only RFC-1918 traffic into the VPC. Private database, public
third-party calls, no NAT, and no second NAT for zone redundancy.

### Backend framework — recommendation

**Django 5 + DRF**, containerised, for the Phase 2 port. Three reasons, in order of weight:

1. **It is your muscle.** A hackathon is time-boxed; shipping speed dominates elegance. Betting a
   deadline on a framework you use daily is the correct risk posture.
2. **Django Admin is a free lender-ops UI.** The underwriting desk needs to view applications and
   record decisions — a product surface you would otherwise build by hand.
3. **Migrations.** When Cloud SQL arrives at Stage 2, Django migrations make the schema versioned
   and reproducible.

Pair it with `drf-spectacular` so `/api/schema/swagger-ui/` renders a live OpenAPI spec — showing
a judge the OCEN contract as executable documentation is worth more than it costs.

**The alternative:** FastAPI, if you want native async for the AA-pull and LLM calls and a smaller
image. Better for the *eventual* AA integration, where several slow third-party calls overlap.
Neither choice changes a single line item here — **Cloud Run runs whichever container you hand
it**, which is precisely why the framework decision can be deferred past this form.

### OTP and authentication — read this before Demo Day

Django will own OTP generation, which is the right call. **OTP *delivery* over SMS in India is the
trap.** Since TRAI's commercial-communication rules, any SMS to an Indian number must be sent
against a **DLT-registered** entity, sender ID and message template. That applies to every
provider, because the restriction sits at the telecom layer, not the vendor. Registration runs
days to weeks and needs entity documentation. **It will not complete before Demo Day.**

Plan the OTP path in three layers:

| Layer | Channel | Ready by Demo Day? | Service |
|---|---|---|---|
| **Demo** | Fixed code `123456`, shown on screen | Yes — already in the codebase | none |
| **Real, working** | **Email OTP** via SendGrid or Mailgun | Yes — domain verification takes minutes | third-party SMTP |
| **Production** | SMS / WhatsApp | No — DLT registration pending | MSG91 or Gupshup, later |

> Google Cloud has no first-party transactional-email service (the AWS design used SES here), so
> email OTP goes to a third-party SMTP provider. This costs nothing at demo volume and does not
> change any resource requested above.

Ship all three behind one `OtpChannel` interface so the switch is configuration, not a rewrite.
Demonstrating a working email OTP plus a stubbed SMS path with an honest note about DLT reads far
better to a bank panel than a fake SMS animation — IDBI's own people know the DLT process.

**Storage.** A small `OtpChallenge` model in Cloud SQL at Stage 2: hashed code, `expires_at`
(5 min), attempt counter, `consumed_at`. Store the **hash**, not the code, and throttle in the
database rather than in local memory — Cloud Run runs many instances, and in-process counters
diverge across them, which is precisely how OTP brute-force protection fails.

**Sessions.** DRF with `djangorestframework-simplejwt`: short-lived access token, refresh token,
signing key from Secret Manager. This replaces the current unsigned `httpOnly: false` cookie,
which can be hand-edited into a lender session from devtools.

---

## Part 3 — Cost estimate

> asia-south1 list prices as of September 2026, before free tiers where noted. Verify against
> `cloud.google.com/products/calculator` before quoting externally.

| Line item | Config | USD/mo | ₹/mo |
|---|---|---:|---:|
| **Cloud Run** | 1 vCPU / 512 MiB, min-instances 0, demo traffic | **~0** | **~0** |
| Gemini API | ~2,000 short completions | 4 | 340 |
| Artifact Registry | ~1 GB with cleanup policy | 1 | 85 |
| Cloud DNS | 1 managed zone | 1 | 85 |
| Cloud Build | ~60 builds/mo, within 120 free min/day | 0 | 0 |
| Cloud Logging | 30-day retention, within 50 GiB free | 0 | 0 |
| Secret Manager · IAM · Billing budgets | 1 secret | 0 | 0 |
| **Total** | | **~6** | **~510** |

**Window total (2.4 months): ~USD 15 ≈ ₹1,250.**
**Requested with Demo Day headroom: ~USD 50 ≈ ₹4,200.**

### Against the withdrawn AWS request

| | AWS (19 Aug) | Google Cloud (22 Sep) |
|---|---:|---:|
| Services | 15 | 7 |
| Services in the request path | 4 | **1** |
| Databases | 1 | **0** |
| VMs | 0 | 0 |
| NAT Gateways | 1 (USD 35/mo) | **0** |
| Idle cost with no traffic | ~USD 71/mo | **~USD 1/mo** |
| **Monthly** | **USD 71** | **USD 6** |
| **2.4-month window** | **USD 170** | **USD 15** |

The 92% reduction is not a pricing discount. Three line items stopped existing:

| Removed | Was | Why |
|---|---:|---|
| NAT Gateway | USD 35/mo | Cloud Run's `private-ranges-only` egress needs no NAT |
| RDS + storage + backups | USD 16/mo | 3.7 MB of read-only data is not a database workload |
| Always-warm API instance | USD 8/mo | Scale-to-zero, with a ~79 ms cold start instead of 2–4 s |

### Demo Day (03 September)

`--min-instances 1` for the week removes the cold start entirely — a few dollars for seven days,
inside the headroom above, and one flag to set and unset:

```bash
gcloud run services update udyamai --region asia-south1 --min-instances 1   # before
gcloud run services update udyamai --region asia-south1 --min-instances 0   # after
```

No database to upsize, because there is no database.

---

## Part 4 — Build order

**The constraint worth naming: the build window is short, and Demo Day is the event the programme
turns on.** So the sequencing moves the **backend** first — that is where OTP, the score engine and
the credit-bearing logic live, and it is what a bank panel will actually interrogate — and defers
the clean frontend split until after the pitch.

### Already done

| Step | Evidence |
|---|---|
| Database removed from the request path | `src/lib/agami/dataset.ts` · `ARCHITECTURE.md` §5.3 |
| Real corpus bundled and regenerable from source | `npm run data:build` |
| Deterministic retrain metrics (seeded PRNG) | `src/lib/agami/lrRetrain.ts` |
| Cloud Run image, build pipeline, deploy guide | `Dockerfile` · `cloudbuild.yaml` · `DEPLOY.md` |
| Architecture page rewritten for Google Cloud | `/architecture` |

### Phase 1 — before Demo Day

| # | Step | Why it is in this phase |
|---|---|---|
| 1 | `gcloud run deploy`; verify `/api/debug/dataset` | First deployable slice — do it early, not on day 12 |
| 2 | Scaffold `api/` — Django 5 + DRF | Everything downstream depends on the contract |
| 3 | Port `scoreEngine.ts` → `scoring/`; ship `/api/health-card/{gstin}` | The one endpoint the whole product hangs off |
| 4 | Port `mlModel.ts` + `lrRetrain.ts` → numpy, **with an honest train/test split** | Fixes the in-sample AUC before any number is quoted to a judge |
| 5 | OTP: `OtpChallenge` model + email channel + fixed demo code | The auth story, and email needs no DLT |
| 6 | JWT via `simplejwt`, replacing the cookie | Closes the forgeable-lender-session hole |
| 7 | Cloud SQL for applications, replacing `/tmp` | The lender "incoming applications" flow is cross-instance without it |
| 8 | Point the Next.js frontend at Django; delete the TS API routes | One frontend, one backend, no duplicated logic |
| 9 | Cache Health Card + explanation on `(gstin, score, lang)` | Takes the LLM off the hot path before a spike |
| 10 | Service worker + install prompt | Makes the PWA claim true |
| 11 | Retrain → Cloud Run Jobs + Cloud Scheduler; delete `/api/retrain` | Closes a public write-on-GET endpoint by deletion |
| 12 | Freeze; rehearse end to end | Reachable from the landing page's main CTA |

The last two days are rehearsal and buffer, not features. Protect them.

### Phase 2 — after Demo Day

| # | Step |
|---|---|
| 13 | Scaffold `web/` — Vite + React + TS; `components/**` port almost verbatim |
| 14 | `vite-plugin-pwa` — proper service worker, offline shell, cached Health Card |
| 15 | Retire the Next.js app once the Vite PWA reaches parity |
| 16 | Gemini API → Vertex AI behind the same interface — in-region prompts, audit log per call |
| 17 | Global LB + Cloud CDN + Cloud Armor once there are two services |
| 18 | DLT registration for SMS OTP; promote SMS from stub to live |

### Cut list, if the window gets tight

Drop in this order, and say so on stage rather than faking it: SMS OTP (email works, DLT is the
documented blocker) → Vertex AI (the Gemini API works) → the Vite rewrite (Next.js works) → the
counterparty graph and sector-signal panels (impressive, but not credit-bearing).

**Never cut:** the score engine, the OTP flow, the lender decision loop, and the security fixes in
steps 6, 7 and 11 — one of those costs nothing, because it is a thing you decline to port rather
than a thing you build.

---

## Appendix A — Growth path

Stated so the architecture reads as staged rather than thin. Nothing here is requested now.
Full version in `ARCHITECTURE.md` §10.

| Trigger | Add | Approx cost |
|---|---|---|
| **First real customer PII** (AA integration live) | Cloud SQL HA on a private IP, Direct VPC egress, Firestore for score history, Secret Manager rotation, Cloud Armor | +USD 160/mo |
| Sustained traffic beyond demo | Global LB + Cloud CDN, PWA split to Cloud Storage, Django on a second Cloud Run service, Memorystore | +USD 120/mo |
| Concurrent lender-desk usage | Cloud SQL read replica, cached Health Cards | +USD 70/mo |
| Multi-lender OCEN production traffic | Pub/Sub + Cloud Run worker services, Cloud Run Jobs for retrain, BigQuery warehouse | +USD 130/mo |
| Any audited pilot | 1-year log retention, Assured Workloads, VPC Service Controls, Security Command Center, per-decision immutable audit log | +USD 25/mo |

**Nothing in this path is a rewrite.** Stage 2 changes one file — `src/lib/runtimeStore.ts` — and
adds a connection string. Stage 3 runs the identical container image behind a load balancer.
Stage 4 swaps the database behind the same wire protocol.
