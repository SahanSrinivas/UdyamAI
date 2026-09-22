# Deploying UdyamAI to Cloud Run

**One container. No database. No VPC. No connector.**

The whole app — SSR pages, API routes, the AgamiAI corpus, the LR calibrator —
is a single stateless Next.js container. That is the entire reason this
document is short.

---

## 0. What you need once

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud config set run/region asia-south1        # Mumbai — RBI data residency

gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com

gcloud artifacts repositories create udyamai \
  --repository-format=docker \
  --location=asia-south1 \
  --description="UdyamAI container images"
```

`asia-south1` (Mumbai) is a requirement, not a preference — see
[ARCHITECTURE.md](ARCHITECTURE.md) §2. `asia-south2` (Delhi) is the only
acceptable second region, because it is also in India.

---

## 1. The Gemini key

The vernacular explanation (EN / HI / TE) calls the Gemini API. Without a key
the app serves a deterministic offline explanation and everything else works,
so this step is optional for a first deploy.

```bash
echo -n "YOUR_GEMINI_KEY" | gcloud secrets create udyamai-google-api-key \
  --data-file=- --replication-policy=automatic

# Let the Cloud Run service account read it
PROJECT_NUMBER=$(gcloud projects describe "$(gcloud config get-value project)" \
  --format='value(projectNumber)')
gcloud secrets add-iam-policy-binding udyamai-google-api-key \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role=roles/secretmanager.secretAccessor
```

---

## 2. Deploy

### Fastest — build from source

Cloud Build picks up the `Dockerfile` automatically.

```bash
gcloud run deploy udyamai \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --port 8080 \
  --cpu 1 --memory 512Mi \
  --min-instances 0 --max-instances 10 \
  --concurrency 80 \
  --set-secrets=GOOGLE_API_KEY=udyamai-google-api-key:latest
```

Drop the `--set-secrets` line if you skipped step 1.

### Reproducible — the pipeline

`cloudbuild.yaml` builds, pushes an immutable tag to Artifact Registry, and
deploys that tag — never `:latest`, so a rollback points at the exact bytes it
shipped. Trigger builds tag by commit SHA; a manual submit falls back to the
Cloud Build ID.

```bash
gcloud builds submit --config cloudbuild.yaml \
  --substitutions=_REGION=asia-south1,_SERVICE=udyamai
```

Point a Cloud Build trigger at `main` with the same config and every push ships
a revision.

### Locally, exactly as Cloud Run runs it

```bash
docker build -t udyamai .
docker run --rm -p 8080:8080 -e GOOGLE_API_KEY=... udyamai
open http://localhost:8080
```

---

## 3. Verify

```bash
URL=$(gcloud run services describe udyamai --region asia-south1 \
  --format='value(status.url)')

curl -s "$URL/api/debug/dataset" | jq '{status, dataset, load_ms}'
```

A healthy service reports 200 accounts, 32,349 transactions, 277 bounces and
100 ITR filings:

```json
{
  "status": "OK · bundled AgamiAI corpus loaded, no database in the request path",
  "dataset": { "accountCount": 200, "txnCount": 32349, "bounceCount": 277, "filingCount": 100 },
  "load_ms": 81
}
```

Then click through the demo:

| Surface | URL | Sign-in |
|---|---|---|
| Landing | `$URL/` | — |
| MSME dashboard | `$URL/dashboard?gstin=24AABCS1234R1Z8` | GSTIN above, OTP `123456` |
| Lender desk | `$URL/lender` | `IDBI-MSME-2847` / `demo123` |
| Architecture | `$URL/architecture` | — |
| Retrain | `curl -X POST "$URL/api/retrain"` | — |

---

## 4. Sizing, and why

| Setting | Value | Reason |
|---|---|---|
| `--memory` | **512Mi** | Measured, not guessed: the container sits at **74 MiB** RSS after loading the full corpus and serving every page plus repeated retrains. 512Mi is already four times the headroom needed; 1Gi is worth paying for only if you bundle a much larger slice. |
| `--cpu` | **1** | One core renders the dashboard — the heaviest page — comfortably. A full three-lender retrain over 200 accounts takes **20 ms**. |
| `--min-instances` | **0** | Nothing is stateful, so idle should cost nothing. Set `1` before a live demo to remove the ~1s cold start. |
| `--max-instances` | **10** | A cap, not a target. Raise it when there is traffic to justify it. |
| `--concurrency` | **80** | SSR is not CPU-bound here; the default is fine. |

Cold start is dominated by reading and parsing 3.7 MB of JSON — measured at ~80 ms on
top of Node boot in the container. That is the cost of having no database, and it is a good
trade.

---

## 5. What is *not* here, deliberately

- **No Cloud SQL, no Firestore, no connector.** The app reads its data from its
  own image. See [ARCHITECTURE.md](ARCHITECTURE.md) §4 for when that stops
  being true and what replaces it.
- **No VPC, no Serverless VPC Access connector.** Nothing private to reach.
- **No secrets beyond the Gemini key.** There are no database credentials to
  rotate, because there is no database.

### The one caveat

Two things *are* mutable: the loan-application pipeline and the LR retrain
history. Both write to `/tmp/udyamai` on the serving instance
(`src/lib/runtimeStore.ts`), which means:

- an application submitted on instance A is not visible to instance B, and
- both are lost when an instance recycles.

For a prototype demo that is correct behaviour and costs nothing. For anything
real, `src/lib/runtimeStore.ts` is the single file to change — swap it for
Firestore or Cloud SQL and nothing above it moves. If you are demoing to judges
and want the pipeline to behave, deploy with `--max-instances 1` so there is
only ever one writer.

---

## 6. Rollback

Revisions are immutable and traffic is a split, so rollback is instant:

```bash
gcloud run revisions list --service udyamai --region asia-south1
gcloud run services update-traffic udyamai \
  --region asia-south1 --to-revisions REVISION_NAME=100
```

---

## 7. Custom domain

```bash
gcloud run domain-mappings create \
  --service udyamai --domain udyamai.in --region asia-south1
```

For anything beyond a single service — Cloud CDN, Cloud Armor, a shared
anycast IP — put a Global External Application Load Balancer in front with a
serverless NEG instead. The `/architecture` page's Deploy tab lists the full
production shape.

---

## Refreshing the bundled data

The corpus is committed, so a deploy never touches the network for data. To
pull a newer snapshot of the AgamiAI datasets:

```bash
npm run data:build     # rewrites src/data/agami/*.json
npm run build          # confirm it still builds
git add src/data/agami && git commit -m "chore(data): refresh AgamiAI corpus"
```

The build fails loudly if any of the six demo GSTINs stops resolving to an ITR
record upstream, rather than silently shipping a dashboard with a missing chip.
