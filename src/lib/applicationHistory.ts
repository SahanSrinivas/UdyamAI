/**
 * 12-month application history per MSME.
 * Deterministic — same GSTIN → same story.
 * Every profile has 3-6 prior applications: some rejected, some approved-but-declined.
 */

export type ApplicationDecision =
  | { kind: "rejected"; reason: string }
  | { kind: "approved"; sanctioned: number; ratePct: number; taken: boolean; declinedReason?: string }
  | { kind: "withdrawn"; reason: string };

export type HistoricalApplication = {
  id: string;
  date: string; // ISO
  monthsAgo: number;
  lender: string;
  amountRequested: number;
  purpose: "working_capital" | "term_loan" | "invoice_finance" | "equipment";
  scoreAtTime: number;
  decision: ApplicationDecision;
};

function seed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(s: number) {
  let state = s >>> 0 || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

const REJECT_REASONS = [
  "Insufficient documentation · no audited financials",
  "GST filing gaps · 3 late returns in 12 months",
  "Buyer concentration · top 1 buyer > 75% revenue",
  "No CIBIL score · bureau file too thin",
  "NACH bounce history · 3 bounces in 90d",
  "Revenue trend below sector median",
  "Existing EMI-to-income ratio > 40%",
];

const APPROVED_DECLINED = [
  "Rate too high · found cheaper offer",
  "Sanction < requested · gap too wide",
  "Tenor too short · rejected offer",
];

const WITHDRAW_REASONS = [
  "Buyer paid early · working capital no longer needed",
  "Applied elsewhere · faster response",
];

const LENDERS_POOL = [
  "State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank",
  "Kotak Mahindra", "Bandhan Bank", "Yes Bank", "Indian Bank",
  "Bank of Baroda", "Canara Bank", "Punjab National Bank",
];

const PURPOSES: HistoricalApplication["purpose"][] = [
  "working_capital", "term_loan", "invoice_finance", "equipment",
];

export function getHistory(gstin: string, currentScore: number): HistoricalApplication[] {
  const rand = rng(seed(gstin));
  const n = 3 + Math.floor(rand() * 4); // 3-6 applications
  const items: HistoricalApplication[] = [];

  const scoreImprovementPerMonth = Math.max(1, (currentScore - 500) / 12);

  for (let i = 0; i < n; i++) {
    const monthsAgo = 1 + Math.floor(rand() * 14); // spread over ~15 months
    const date = new Date(Date.now() - monthsAgo * 30 * 86400 * 1000).toISOString().slice(0, 10);
    const lender = LENDERS_POOL[Math.floor(rand() * LENDERS_POOL.length)];
    const amount = Math.round((3 + rand() * 25) * 100000);
    const purpose = PURPOSES[Math.floor(rand() * PURPOSES.length)];
    const scoreAtTime = Math.max(350, Math.round(currentScore - monthsAgo * scoreImprovementPerMonth * (0.7 + rand() * 0.6)));

    // Decision biased on scoreAtTime
    const roll = rand();
    let decision: ApplicationDecision;
    if (scoreAtTime < 550) {
      // low score → almost always rejected
      decision = { kind: "rejected", reason: REJECT_REASONS[Math.floor(rand() * REJECT_REASONS.length)] };
    } else if (scoreAtTime < 680) {
      if (roll < 0.75) {
        decision = { kind: "rejected", reason: REJECT_REASONS[Math.floor(rand() * REJECT_REASONS.length)] };
      } else if (roll < 0.9) {
        decision = { kind: "withdrawn", reason: WITHDRAW_REASONS[Math.floor(rand() * WITHDRAW_REASONS.length)] };
      } else {
        decision = {
          kind: "approved",
          sanctioned: Math.round(amount * (0.6 + rand() * 0.3)),
          ratePct: +(14 + rand() * 3).toFixed(2),
          taken: false,
          declinedReason: APPROVED_DECLINED[Math.floor(rand() * APPROVED_DECLINED.length)],
        };
      }
    } else {
      if (roll < 0.35) {
        decision = { kind: "rejected", reason: REJECT_REASONS[Math.floor(rand() * REJECT_REASONS.length)] };
      } else {
        const taken = roll > 0.65;
        decision = {
          kind: "approved",
          sanctioned: Math.round(amount * (0.85 + rand() * 0.15)),
          ratePct: +(11.5 + rand() * 2.5).toFixed(2),
          taken,
          declinedReason: taken ? undefined : APPROVED_DECLINED[Math.floor(rand() * APPROVED_DECLINED.length)],
        };
      }
    }

    items.push({
      id: `HIST-${gstin.slice(-4)}-${String(i + 1).padStart(3, "0")}`,
      date,
      monthsAgo,
      lender,
      amountRequested: amount,
      purpose,
      scoreAtTime,
      decision,
    });
  }

  return items.sort((a, b) => a.monthsAgo - b.monthsAgo);
}

export function summarizeHistory(history: HistoricalApplication[]) {
  const rejected = history.filter((h) => h.decision.kind === "rejected").length;
  const approved = history.filter((h) => h.decision.kind === "approved").length;
  const withdrawn = history.filter((h) => h.decision.kind === "withdrawn").length;
  const taken = history.filter((h) => h.decision.kind === "approved" && h.decision.taken).length;
  return { total: history.length, rejected, approved, withdrawn, taken };
}
