# Account Aggregator (AA) — Data Layer

**What it is:** RBI-regulated framework (Sept 2021) that lets a user consent, once, to have their financial data pulled from banks/GST/insurance/EPFO and delivered to a lender via a licensed intermediary — no screen-scraping, no password sharing.

## Ecosystem Roles

| Role | Who | What they do |
|------|-----|--------------|
| **FIP** (Financial Information Provider) | Bank, MF, insurer, GSTN, EPFO | Holds the user's data, exposes it via standard API |
| **FIU** (Financial Information User) | Lender, wealth advisor — **your app** | Consumes data to make a decision |
| **AA** (Account Aggregator) | Licensed NBFC — Sahamati members: Finvu, OneMoney, CAMSFinserv, NADL, Perfios AA, Anumati, PhonePe AA | Orchestrates consent + encrypted data movement |

## Data You Can Pull (FI Types)

- Deposit accounts (savings, current) — transaction history
- Recurring / term deposits
- Mutual funds — holdings, NAV
- Equities — demat holdings
- Insurance policies
- **GST** — filings + returns via GSTN as FIP
- **EPFO** — payroll + PF contributions

For an MSME Health Card, the load-bearing feeds are: **current-account statement + GST returns + EPFO contributions**.

## Consent Flow (High Level)

1. FIU (your app) generates a consent request — purpose, data types, duration
2. Redirect user to AA
3. User picks their bank/GSTN account at AA, approves consent
4. AA fetches encrypted data from FIP(s), delivers to FIU
5. FIU decrypts with its private key, uses data, retains only per consent policy
6. Audit trail logged by AA for regulatory compliance

## Developer Sandboxes

**Finvu Sandbox** — [finvu.github.io/sandbox](https://finvu.github.io/sandbox/) · [Get Started](https://finvu.github.io/sandbox/get_started.html)
- Full REST API implementation of AA spec
- Get an API token by emailing `support@cookiejar.co.in`
- Passed in `client_api_key` header

**OneMoney FinPro (FIU) / FinShare (FIP)** — [docs.moneyone.in/tech](https://docs.moneyone.in/tech/) · [API docs](https://www.onemoney.in/docs/api/)
- Test mode by default → gives you a test FIU ID + API key
- Basic company + application details to register

**Sahamati how-to** — [Join the AA network](https://sahamati.org.in/how-to-join-the-account-aggregator-network-to-share-and-access-financial-data/)

## Standards
- ReBIT (Reserve Bank Information Technology) technical specs — AA API
- FI schema defined per FI Type

## Scale (Context for Pitch)
- ₹1.6 lakh crore in loans facilitated through AA in FY25 ([source](https://sahamati.org.in/))
- GSTIN-as-FIP unlocks live-invoice-based working-capital underwriting for MSMEs

## Deeper Reads
- [Sahamati "Lending through AA" Dec-2023 report (PDF)](https://sahamati.org.in/wp-content/uploads/2024/02/Lending-through-AA-Dec23-Sahamati-Report.pdf)
- [Ecosystem Participation Terms (PDF)](https://sahamati.org.in/wp-content/uploads/2022/04/FINAL-V-1.0-Sahamati-Account-Aggregator-Ecosystem-Participation-Terms.pdf)
- [Framework guide — productgrowth.in](https://productgrowth.in/insights/fintech/account-aggregator-framework-guide/)
