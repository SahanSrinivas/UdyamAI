# OCEN — Open Credit Enablement Network

**What it is:** Open protocol (iSPIRT-driven, not a government mandate) that connects **Lenders ↔ Loan Agents ↔ Borrowers** via standardized APIs. Think "Open Banking for lending" — any app can become a loan-distribution channel without becoming a lender.

## Current Version: **OCEN 4.0**

Explicit design goal per iSPIRT: *"Cambrian explosion of cash-flow-based loan products across MSME sectors."* — [ProductNation](https://pn.ispirt.in/open-credit-enablement-network-ocen/)

## Roles

| Role | What they do | Example |
|------|-------------|---------|
| **Borrower** | MSME / individual seeking credit | Surat textile trader |
| **Loan Agent (LA)** — formerly LSP | Borrower's advocate; discovers offers, curates them. **This is what your Health Card app is.** | Khatabook, OkCredit, or your app |
| **Lender** | Regulated entity that owns the credit product | IDBI, SBI, NBFC |
| **Derived Data Partner (DDP)** | Supplies non-obvious underwriting signals (analytics, benchmarks) | Perfios (bank stmt), Karza (GST), your Health Card scoring engine can be a DDP |
| **Collections Partner (CP)** | Recovery | ARC / collection agencies |
| **Disbursement Partner (DP)** | Purpose-controlled disbursement, supplier payments | For invoice-financing → pays supplier directly |
| **KYC Partner** | Identity verification | Signzy, HyperVerge |
| **CDS** (Credit Decision Service) | Underwriting logic engine | Bank in-house or third-party |

## Loan Lifecycle (Where APIs Slot In)

1. **Onboarding** — Borrower authenticates via LA
2. **Consent + data fetch** — LA pulls AA + GST data
3. **Offer discovery** — LA queries multiple Lenders → they respond with quotes
4. **Borrower selection** — Borrower picks offer via LA
5. **KYC + e-sign** — KYC Partner + eSign / Aadhaar eSign
6. **e-NACH / e-mandate** — For auto-debit repayment
7. **Disbursement** — Direct-to-borrower or via DP
8. **Servicing** — LA continues to show status
9. **Collections** — CP handles if delinquent

## Integration Points

- Bureau pulls (CIBIL, Experian, Equifax, CRIF)
- Account Aggregator data (see `01-account-aggregator.md`)
- E-signature + e-NACH for repayment
- Supplier catalog integration (for invoice financing)
- ULI (see `02-uli.md`) for cross-lender data

## Building a Loan Agent App (Our App)

The **Loan Agent** role is exactly what the MSME Health Card is:
1. Onboard the MSME (KYC via KYC Partner)
2. Get consent → pull AA + GSTN data
3. Compute the Health Score (this is your DDP-ish IP)
4. Query multiple lenders via OCEN → surface offers
5. Handle e-sign + e-mandate + disbursement handoff

## Documentation

- **GitHub (canonical)** — [github.com/iSPIRT/OCEN-Documentation](https://github.com/iSPIRT/OCEN-Documentation)
- Docs site: [ocen.dev](https://ocen.dev/)
- ProductNation overview — [OCEN intro](https://pn.ispirt.in/open-credit-enablement-network-ocen/)
- Third Open House on API specs — [pn.ispirt.in third-open-house](https://pn.ispirt.in/ispirt-third-open-house-on-ocen-api-specifications-next-steps/)

## Caveat

OCEN is **iSPIRT-standard, not RBI-mandated** — adoption is voluntary. Some lenders integrate directly bank-to-LA without full OCEN spec. For the hackathon: mention OCEN alignment as a differentiator ("built on open standards"), but be ready to demo with mock lender APIs.
