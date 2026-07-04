# Action Plan — From Reading to Submission

## Phase 0 — Day 1 (Reading, ~6-8 hrs)

Sequential, in this order:

1. **AA overview + consent flow** — Sahamati site + `01-account-aggregator.md`
2. **Finvu sandbox get-started** — [finvu.github.io/sandbox/get_started.html](https://finvu.github.io/sandbox/get_started.html) → email for token
3. **ULI current state** — Nucleus Software blog + `02-uli.md`
4. **OCEN 4.0 roles + LA model** — iSPIRT GitHub + `03-ocen.md`
5. **Incumbent scan** — Perfios / Jocata / Lendingkart product pages, 20 min each — `04-incumbents.md`
6. **IDBI submission format** — [hack2skill event page](https://hack2skill.com/event/idbinnovate) — verify what stage 1 needs (idea + deck? prototype?)

Output of Day 1: a 1-page "we know what we're building" note.

## Phase 1 — Idea Submission (Round 1)

Typical hack2skill Round-1 asks for:
- Problem statement
- Solution abstract
- USP
- Tech stack
- Team

**Draft artifacts:**
- 10-slide deck (problem → gap → solution → USP → tech → team → why-us)
- 90-second video walkthrough of Figma mockup
- One-liner: *"MSME Financial Health Card — the always-on credit dashboard that pre-qualifies you for loans across 64 lenders via AA + ULI + OCEN."*

## Phase 2 — Shortlisted (if you make it)

You get IDBI sandbox APIs + synthetic datasets. Build:

### MVP scope (2-3 weeks realistic)
- **Frontend:** Next.js or SwiftUI (you have BabyFly SwiftUI muscle) — MSME dashboard
- **Backend:** Django or FastAPI (your stack) — score engine + AA integration
- **Data:**
  - Mock AA feed (use Finvu sandbox or IDBI synthetic dataset)
  - Mock GST returns
  - Mock lender-quote responses (simulate OCEN LA → Lender call)
- **Score engine:**
  - Rule-based v1 (transparent, judge-friendly)
  - LLM layer for "why did my score change" explanations (Gemini — you already use it in AarogyaGrid)
- **Nudge engine:** Rule-based "file GSTR-1 by X for +12 points"

### What to skip in MVP
- Real ULI integration (unavailable to individuals)
- Real e-sign / e-NACH
- Real disbursement
- Multi-lender quoting — mock 3 lenders

### What to over-invest in
- **The dashboard UX** — this is your differentiator. Make it feel like Credit Karma, not like a bank portal.
- **The rejection-explanation LLM flow** in Hindi/Telugu — judges love vernacular.
- **The "score improvement" gamified path** — the wow moment.

## Phase 3 — Final Pitch

Pitch structure (10 min):
1. Hook (30s): "70% of MSME loan apps rejected. Not because they're not creditworthy — because they can't prove it in time. We fix that."
2. Problem (1m)
3. Live demo (4m) — Health Card dashboard → score drops → LLM explains why → nudge → improved score → apply → 3 lender quotes
4. Market gap + USP (1m) — nobody has a *borrower-facing* living score
5. Tech + rails (1m) — AA + ULI + OCEN diagram
6. Business model + traction plan (1m) — banks pay per pre-qualified lead
7. Team + ask (30s)

## Risk / Kill Criteria

Kill and switch tracks if any of these are true by Day 3:
- IDBI sandbox doesn't include AA-shaped data (fall back to Finvu sandbox — should still be fine)
- Team can't get a working Finvu sandbox token in 48h → build 100% on synthetic data
- Someone else's submission is obviously stronger on this exact track → pivot to Track 5 (Novel Idea) with same core

## Success Criteria for Round 1

Not "we won." "We built a coherent 10-slide narrative that clearly shows we understand AA/ULI/OCEN better than any team pitching a wealth-avatar-chatbot." That gets you shortlisted.
