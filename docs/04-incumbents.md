# Incumbents — Who's Already in the MSME Credit-Data Space

Study these before you build. Two goals: **(a)** don't reinvent what they've productized, **(b)** know their gap so your USP lands with judges.

## Tech / Data Infrastructure (B2B — sell to banks)

### Perfios
- **What they do:** Bank statement analysis → cash-flow-based lending decisions. Now full stack — AA integration, GST parsing, ITR analysis, fraud detection.
- **How they sell:** Embedded in ~1000 lenders' underwriting pipelines. White-label.
- **Their gap for us:** B2B tooling, no borrower-facing UX. MSME never sees the Perfios score — the bank does.
- Site: [perfios.com](https://www.perfios.com/)

### Jocata
- **What they do:** Digital lending platform for banks — origination, underwriting, monitoring. Built India's first STP (Straight-Through Processing) SME loan flow for a major bank.
- **How they sell:** Enterprise SaaS to banks/NBFCs.
- **Their gap for us:** Same — infrastructure sold to the bank, not a product the MSME logs into.
- Site: [jocata.com](https://www.jocata.com/)

### Karza (Perfios acquired)
- GST + PAN + company data enrichment APIs. Same story — B2B.

### Signzy, HyperVerge
- KYC + video KYC + document extraction. Adjacent, not competitors.

## Direct Lenders (B2C — lend to MSMEs themselves)

### Lendingkart
- **What:** NBFC + tech platform. Own capital, own decisioning. AA + GST + bank statements.
- **Model:** One-shot application, one-shot decision.
- **Gap:** No dashboard for the MSME to improve their profile before applying. No cross-lender quoting.

### Indifi
- Similar — sector-focused (travel, hospitality, e-commerce sellers).

### FlexiLoans
- Digital-first MSME lender. GST + bank data.

### NeoGrowth
- Merchant-facing lender using POS/UPI data.

### Aye Finance
- Cluster-based MSME lending (physical + digital).

**Common gap across all lenders:** They're lenders, so they only care about your data at the moment of application. They're not incentivized to give you a living score you can improve — that would reduce their spread.

## The MSME-Facing Software Layer (Bookkeeping / Accounting)

### Khatabook, OkCredit
- **What:** Ledger apps for micro-merchants. ~30M+ downloads.
- **Relevance:** They *have* the users but haven't built a proper credit-scoring layer on top of their transaction data. Partnership target, not competitor.

### Vyapar, Tally on Cloud
- SMB accounting. Rich data, no scoring layer.

## Government / Public Rails

### PSB Loans in 59 Minutes ([psbloansin59minutes.com](https://www.psbloansin59minutes.com/))
- Government-backed marketplace, 20+ PSBs.
- Uses ITR, GST, bank data.
- **Gap:** Ugly UX, one-shot funnel, no ongoing engagement. Sanctions in 59 min *in principle* — real-world timelines much longer.

### TReDS (RXIL, M1xchange, Invoicemart)
- Invoice discounting exchanges for MSMEs.
- Adjacent — invoice-specific, not general credit scoring.

## The Real Gap We're Attacking

Nobody has built a **borrower-facing, always-on, gamified Health Card** that:
1. Sits between the MSME and multiple lenders (LA role in OCEN)
2. Continuously scores from AA + GST feeds
3. Tells them **specifically** what to fix to raise the score
4. Pre-qualifies them across banks via ULI/OCEN

Perfios/Jocata own the B2B rails. Lendingkart et al. own the transactional apply-once flow. Khatabook owns the users but not the credit layer. **The Credit-Karma-for-MSMEs slot is empty.**

## Pitch Framing Tip

Don't compete on "we score MSMEs better than Perfios." You'll lose — they've been doing it 15 years. Compete on **"we're the first MSME-facing product with a living score, powered by rails Perfios doesn't own (ULI + OCEN)."**
