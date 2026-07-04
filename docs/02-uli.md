# Unified Lending Interface (ULI) — Cross-Lender Rail

**What it is:** RBI's "UPI-for-loans" — a standardized API platform run by RBI Innovation Hub (RBIH) that lets any lender pull consented financial + non-financial data on a borrower through one integration, instead of stitching 15 bureau/state/GST/land-records APIs individually.

Sometimes described publicly as the **Public Tech Platform for Frictionless Credit (PTPFC)** — same thing.

## Status (as of Dec 2025 / Jan 2026)

- **64 lenders onboarded** (41 banks + 23 NBFCs), up from 36 the year prior — [Business Standard](https://www.business-standard.com/finance/news/lenders-onboarded-on-uli-rises-to-64-from-36-last-year-125122900906_1.html)
- **136+ data services** available (up from ~50) — [MediaNama](https://www.medianama.com/2026/01/223-unified-lending-interface-64-lenders-136-data-services/)
- **12 loan journeys** supported
- Prior milestone: **600k+ loans, ₹27,000 cr disbursed** on ULI — [Business Standard, Dec 2024](https://www.business-standard.com/economy/news/over-600k-loans-worth-rs-27-000-cr-disbursed-on-uli-platform-rbi-report-124122600872_1.html)

## Data Services Available

- Aadhaar-based auth + verification
- **Digitised land records from 8 states** (Andhra, Bihar, Gujarat, Karnataka, Maharashtra, MP, Rajasthan, UP — roughly)
- **Satellite + geospatial data** (crop imagery, farm boundaries — Cropin, SatSure integrations)
- Property search
- Dairy insights (milk co-op payment data)
- Credit guarantee schemes info
- GSTN
- Bank statement analysis
- Transliteration services
- Credit bureau pulls

## Architecture

- Standardized APIs across the full loan lifecycle: identity → eligibility → application → disbursement
- Consent-based (rides on AA where applicable, direct API elsewhere)
- Plug-and-play — lender integrates once with ULI, gets access to all data providers

## Timeline

- **2023** — Pilot launched (Kisan Credit Card + dairy loans + MSME loans, Andhra + Karnataka)
- **2024** — Expansion to 36 lenders, formal ULI naming (Aug 2024)
- **2025-26** — National rollout in progress, 64 lenders live
- **Regulator:** RBIH (RBI Innovation Hub) — [rbihub.in/projects/unified-lending-interface](https://rbihub.in/projects/unified-lending-interface)

## Why ULI Matters for Our Health Card

- **Cross-lender pre-qualification** — one Health Card can quote against all 64 ULI lenders instead of 1 bank
- **Non-financial signals** — land records + satellite crop data extend credit to segments AA alone can't reach (small farmers, agri-MSMEs)
- **API standardization** — build once, plug into any bank's ULI adapter

## Developer Access

RBIH does not currently expose a public dev sandbox to individuals — access is via **lender onboarding**. For the hackathon, IDBI's sandbox APIs likely wrap ULI feeds. Plan B: simulate ULI responses using synthetic datasets provided.

## Deeper Reads

- [Nucleus Software — Transforming Lending with ULI](https://www.nucleussoftware.com/blog/transforming-lending-with-unified-lending-interface/)
- [Precisa — What You Must Know](https://precisa.in/blog/rbis-unified-lending-interface/)
- [EnKash — ULI Explainer](https://www.enkash.com/resources/blog/unified-lending-interface)
- [MediaNama — Scaling for Inclusive Credit](https://www.medianama.com/2025/06/223-india-unified-lending-interface-privacy-risks-inclusive-credit/)
