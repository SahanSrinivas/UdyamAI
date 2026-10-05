import type { MSMEProfile } from "./mockData";
import { predictApproval, type ApprovalPrediction } from "./mlModel";

export type SubScore = {
  key: string;
  label: string;
  score: number;
  weight: number;
  color: string;
  summary: string;
};

export type Nudge = {
  title: string;
  impact: number;
  category: string;
  detail: string;
  timeframe: string;
};

export type LoanQuote = {
  lender: string;
  product: string;
  amount: number;
  tenorMonths: number;
  ratePct: number;
  confidence: number;
  reasons: string[];
  prediction: ApprovalPrediction;
};

export type HealthCard = {
  profile: MSMEProfile;
  overall: number;
  band: "Excellent" | "Strong" | "Fair" | "Weak";
  subScores: SubScore[];
  topDrags: Nudge[];
  topLifts: Nudge[];
  quotes: LoanQuote[];
  narrative: string;
};

const clamp = (n: number, lo = 0, hi = 1000) => Math.max(lo, Math.min(hi, n));

function sum(xs: number[]) {
  return xs.reduce((a, b) => a + b, 0);
}
function mean(xs: number[]) {
  return xs.length ? sum(xs) / xs.length : 0;
}
function stdev(xs: number[]) {
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
}
function trend(xs: number[]) {
  if (xs.length < 2) return 0;
  const first = mean(xs.slice(0, Math.floor(xs.length / 2)));
  const last = mean(xs.slice(-Math.floor(xs.length / 2)));
  if (first === 0) return 0;
  return (last - first) / first;
}

// ── Factors ──────────────────────────────────────────────────────────────
// Every sub-score is a weighted blend of normalised factors in [0, 1].
// `extractFactors` reads them off a profile; `scoreFromFactors` turns them
// into sub-scores. The dashboard simulator drives the same function with
// slider values, so what the demo shows is exactly what the engine computes.

export type FactorKey =
  | "revenueStability"
  | "revenueGrowth"
  | "gstOnTime"
  | "filingTimeliness"
  | "epfoCoverage"
  | "buyerDiversification"
  | "buyerBase"
  | "supplierBase"
  | "upiGrowth"
  | "cashBuffer"
  | "bounceFree";

export type Factors = Record<FactorKey, number>;

export type SubScoreKey = "revenue" | "compliance" | "counterparty" | "growth";

export type FactorDef = {
  key: FactorKey;
  label: string;
  source: string;
  /** How 0% and 100% read in plain terms. */
  scale: [string, string];
};

export const FACTOR_DEFS: FactorDef[] = [
  { key: "revenueStability", label: "Revenue stability", source: "GSTR-1 · 12 months", scale: ["Swings ≥40% month to month", "Flat, predictable revenue"] },
  { key: "revenueGrowth", label: "Revenue growth", source: "GSTR-1 · H1 vs H2", scale: ["−30% decline", "+80% growth"] },
  { key: "gstOnTime", label: "GST filed on time", source: "GSTN · 24 returns", scale: ["0 of 24 on time", "24 of 24 on time"] },
  { key: "filingTimeliness", label: "Filing lag", source: "GSTN · avg delay", scale: ["20+ days late", "Filed by due date"] },
  { key: "epfoCoverage", label: "EPFO coverage", source: "EPFO · ECR", scale: ["Not enrolled", "Contributions verified"] },
  { key: "buyerDiversification", label: "Buyer diversification", source: "GSTR-1 · top buyer share", scale: ["One buyer = 100% revenue", "No dominant buyer"] },
  { key: "buyerBase", label: "Buyer count", source: "GSTR-1 · unique buyers", scale: ["0 buyers", "40+ buyers"] },
  { key: "supplierBase", label: "Supplier base", source: "GSTR-2B · unique suppliers", scale: ["0 suppliers", "15+ suppliers"] },
  { key: "upiGrowth", label: "UPI inflow growth", source: "AA · bank statement", scale: ["−30% decline", "+80% growth"] },
  { key: "cashBuffer", label: "Cash buffer", source: "AA · avg CA balance", scale: ["No buffer", "1.5+ months of outflow"] },
  { key: "bounceFree", label: "Bounce-free record", source: "AA · NACH / cheque returns", scale: ["5+ bounces in 90d", "Zero bounces"] },
];

export const SUBSCORE_DEFS: {
  key: SubScoreKey;
  label: string;
  weight: number;
  color: string;
  summary: string;
  parts: { factor: FactorKey; weight: number; transform?: (v: number) => number; note?: string }[];
}[] = [
  {
    key: "revenue",
    label: "Revenue Stability",
    weight: 0.3,
    color: "#00b054",
    summary: "12-month revenue variance and growth trend",
    parts: [
      { factor: "revenueStability", weight: 0.65 },
      // Revenue growth is capped at +60% here (vs +80% in Growth Momentum).
      { factor: "revenueGrowth", weight: 0.35, transform: (v) => Math.min(1, (v * 1.1) / 0.9), note: "capped at +60%" },
    ],
  },
  {
    key: "compliance",
    label: "Compliance",
    weight: 0.25,
    color: "#324b7f",
    summary: "GSTR filings, EPFO status, cheque bounces",
    parts: [
      { factor: "gstOnTime", weight: 0.55 },
      { factor: "filingTimeliness", weight: 0.3 },
      // Missing EPFO costs 20% of this slice, not all of it.
      { factor: "epfoCoverage", weight: 0.15, transform: (v) => 0.8 + 0.2 * v, note: "floor 80%" },
    ],
  },
  {
    key: "counterparty",
    label: "Counterparty Risk",
    weight: 0.25,
    color: "#f5b400",
    summary: "Buyer / supplier concentration and diversity",
    parts: [
      { factor: "buyerDiversification", weight: 0.55 },
      { factor: "buyerBase", weight: 0.3 },
      { factor: "supplierBase", weight: 0.15 },
    ],
  },
  {
    key: "growth",
    label: "Growth Momentum",
    weight: 0.2,
    color: "#5a72a3",
    summary: "UPI velocity, cash buffer, forward trajectory",
    parts: [
      { factor: "revenueGrowth", weight: 0.35 },
      { factor: "upiGrowth", weight: 0.25 },
      { factor: "cashBuffer", weight: 0.25 },
      { factor: "bounceFree", weight: 0.15 },
    ],
  },
];

const unit = (n: number) => Math.max(0, Math.min(1, n));
// Growth trend normalised over [−30%, +80%].
const growthUnit = (g: number) => (Math.max(-0.3, Math.min(0.8, g)) + 0.3) / 1.1;

export function extractFactors(p: MSMEProfile): Factors {
  const cv = stdev(p.monthlyRevenue) / (mean(p.monthlyRevenue) || 1);
  const filings = p.gstFiledOnTime + p.gstFiledLate;
  const bufferMonths = p.currentAccountBalanceAvg / (mean(p.upiOutflowMonthly) || 1);
  return {
    revenueStability: unit(1 - cv * 2.5),
    revenueGrowth: growthUnit(trend(p.monthlyRevenue)),
    gstOnTime: filings ? p.gstFiledOnTime / filings : 0,
    filingTimeliness: unit(1 - p.gstFilingLagDays / 20),
    epfoCoverage: p.epfoActive ? 1 : 0,
    buyerDiversification: unit(1 - p.topBuyerRevenueShare),
    buyerBase: unit(p.buyerCount / 40),
    supplierBase: unit(p.supplierCount / 15),
    upiGrowth: growthUnit(trend(p.upiInflowMonthly)),
    cashBuffer: unit(bufferMonths / 1.5),
    bounceFree: unit(1 - p.bounceCount90d * 0.2),
  };
}

export type ScoreBreakdown = {
  overall: number;
  band: HealthCard["band"];
  subScores: {
    key: SubScoreKey;
    label: string;
    weight: number;
    color: string;
    summary: string;
    score: number;
    parts: { factor: FactorKey; weight: number; value: number; points: number; note?: string }[];
  }[];
};

export function scoreFromFactors(f: Factors): ScoreBreakdown {
  const subScores = SUBSCORE_DEFS.map((d) => {
    const parts = d.parts.map((pt) => {
      const value = pt.transform ? pt.transform(unit(f[pt.factor])) : unit(f[pt.factor]);
      return { factor: pt.factor, weight: pt.weight, value, points: 1000 * pt.weight * value, note: pt.note };
    });
    const score = Math.round(clamp(sum(parts.map((x) => x.points))));
    return { key: d.key, label: d.label, weight: d.weight, color: d.color, summary: d.summary, score, parts };
  });
  const overall = Math.round(subScores.reduce((acc, s) => acc + s.score * s.weight, 0));
  return { overall, band: bandFor(overall), subScores };
}

export function bandFor(score: number): HealthCard["band"] {
  if (score >= 800) return "Excellent";
  if (score >= 650) return "Strong";
  if (score >= 500) return "Fair";
  return "Weak";
}

function nudgesFor(p: MSMEProfile, subs: SubScore[]): { drags: Nudge[]; lifts: Nudge[] } {
  const drags: Nudge[] = [];
  const lifts: Nudge[] = [];

  if (p.gstFiledLate > 0) {
    const impact = Math.min(60, p.gstFiledLate * 8 + p.gstFilingLagDays * 2);
    drags.push({
      title: `Late GST filing ${p.gstFilingLagDays > 0 ? `by ${p.gstFilingLagDays} days` : ""}`,
      impact,
      category: "Compliance",
      detail: `You filed GSTR-3B late ${p.gstFiledLate}× in the last 24 months. Lenders read late filing as cash-flow stress.`,
      timeframe: "Last 24 months",
    });
    lifts.push({
      title: "File GSTR-3B on the 20th every month",
      impact,
      category: "Compliance",
      detail: `Consistent on-time filing for 3 cycles will lift your Compliance sub-score by ~${impact} points.`,
      timeframe: "Next 90 days",
    });
  }

  if (p.topBuyerRevenueShare > 0.5) {
    const impact = Math.round((p.topBuyerRevenueShare - 0.5) * 200);
    drags.push({
      title: `${Math.round(p.topBuyerRevenueShare * 100)}% revenue from one buyer`,
      impact,
      category: "Counterparty Risk",
      detail: "Single-buyer concentration is the #1 predictor of MSME default. Losing this buyer would break your cash flow.",
      timeframe: "Current",
    });
    lifts.push({
      title: "Add 2 new buyers >₹1L/mo in next quarter",
      impact,
      category: "Counterparty Risk",
      detail: "Diversifying to <40% top-buyer share unlocks a full band jump for most lenders.",
      timeframe: "Next 90 days",
    });
  }

  if (p.bounceCount90d > 0) {
    const impact = p.bounceCount90d * 25;
    drags.push({
      title: `${p.bounceCount90d} cheque/NACH bounce${p.bounceCount90d > 1 ? "s" : ""} in 90 days`,
      impact,
      category: "Compliance",
      detail: "Bounces are a hard rejection trigger for most PSU lenders regardless of turnover.",
      timeframe: "Last 90 days",
    });
    lifts.push({
      title: "Maintain a ₹50k buffer + auto-sweep",
      impact,
      category: "Compliance",
      detail: "3 clean cycles wipe the bounce penalty from your score.",
      timeframe: "Next 90 days",
    });
  }

  const revGrowth = trend(p.monthlyRevenue);
  if (revGrowth > 0.15) {
    lifts.push({
      title: `Revenue growing ${Math.round(revGrowth * 100)}% year-on-year`,
      impact: Math.round(revGrowth * 300),
      category: "Growth",
      detail: "You are in the top quartile for your sector — mention this in your loan application.",
      timeframe: "Trailing 12 months",
    });
  }

  const bufferMonths = p.currentAccountBalanceAvg / (mean(p.upiOutflowMonthly) || 1);
  if (bufferMonths < 0.5) {
    drags.push({
      title: "Cash buffer < 2 weeks of outflow",
      impact: 40,
      category: "Liquidity",
      detail: "Lenders want to see at least 3 weeks of average outflow parked in your CA.",
      timeframe: "Current",
    });
    lifts.push({
      title: "Hold ₹" + Math.round(mean(p.upiOutflowMonthly) * 0.75 / 1000) + "k rolling in CA",
      impact: 40,
      category: "Liquidity",
      detail: "Set a sweep-out threshold — never let CA close a day under this floor.",
      timeframe: "Immediate",
    });
  }

  drags.sort((a, b) => b.impact - a.impact);
  lifts.sort((a, b) => b.impact - a.impact);
  return { drags: drags.slice(0, 3), lifts: lifts.slice(0, 3) };
}

function quotesFor(p: MSMEProfile, subs: SubScore[], overall: number): LoanQuote[] {
  const trailingRev = sum(p.monthlyRevenue.slice(-12));
  const baseAmount = Math.min(5000000, Math.max(500000, Math.round(trailingRev * 0.15 / 100000) * 100000));

  const subMap = {
    revenue: subs[0].score,
    compliance: subs[1].score,
    counterparty: subs[2].score,
    growth: subs[3].score,
  };

  const bare: Omit<LoanQuote, "confidence" | "prediction">[] = [
    {
      lender: "IDBI Bank",
      product: "MSME Working Capital",
      amount: baseAmount,
      tenorMonths: 36,
      ratePct: 12.5 + (1000 - overall) * 0.004,
      reasons: [
        `Revenue trend of ${Math.round(trend(p.monthlyRevenue) * 100)}% supports repayment`,
        `${p.vintageYears}-year vintage clears IDBI's 24-month floor`,
      ],
    },
    {
      lender: "SBI",
      product: "SME Smart Score OD",
      amount: Math.round(baseAmount * 0.7),
      tenorMonths: 24,
      ratePct: 11.8 + (1000 - overall) * 0.003,
      reasons: [
        "SBI weights on-time GST filing heavily",
        p.topBuyerRevenueShare < 0.5 ? "Buyer diversification meets SBI norm" : "Buyer concentration flag — may reduce sanction",
      ],
    },
    {
      lender: "HDFC Bank",
      product: "Business Growth Loan",
      amount: Math.round(baseAmount * 1.1),
      tenorMonths: 48,
      ratePct: 13.9 + (1000 - overall) * 0.005,
      reasons: [
        "HDFC prefers 3+ year vintage — you qualify",
        p.bounceCount90d === 0 ? "Zero bounces = HDFC green flag" : `${p.bounceCount90d} bounce(s) — HDFC may downgrade`,
      ],
    },
  ];

  return bare.map((q) => {
    const amountRatio = trailingRev > 0 ? q.amount / trailingRev : 0.3;
    const pred = predictApproval(q.lender, subMap, amountRatio, q.tenorMonths);
    return { ...q, confidence: pred.probability, prediction: pred };
  });
}

function narrativeFor(p: MSMEProfile, overall: number, band: HealthCard["band"], drags: Nudge[], lifts: Nudge[]): string {
  const parts: string[] = [];
  parts.push(
    `${p.tradeName} scores ${overall} (${band}). ${p.city.split(",")[0]} · ${p.sector} · ${p.vintageYears}y vintage.`
  );
  if (drags[0]) parts.push(`Biggest drag: ${drags[0].title.toLowerCase()} — costs ~${drags[0].impact} points.`);
  if (lifts[0]) parts.push(`Fastest lift: ${lifts[0].title.toLowerCase()} in ${lifts[0].timeframe.toLowerCase()}.`);
  const growth = Math.round(trend(p.monthlyRevenue) * 100);
  if (growth > 15) parts.push(`Trailing revenue is up ${growth}% — this is your headline number for the loan interview.`);
  return parts.join(" ");
}

export function computeHealthCard(profile: MSMEProfile): HealthCard {
  const breakdown = scoreFromFactors(extractFactors(profile));
  const subScores: SubScore[] = breakdown.subScores.map(({ key, label, score, weight, color, summary }) => ({
    key,
    label,
    score,
    weight,
    color,
    summary,
  }));

  const { overall, band } = breakdown;
  const { drags, lifts } = nudgesFor(profile, subScores);
  const quotes = quotesFor(profile, subScores, overall);
  const narrative = narrativeFor(profile, overall, band, drags, lifts);

  return {
    profile,
    overall,
    band,
    subScores,
    topDrags: drags,
    topLifts: lifts,
    quotes,
    narrative,
  };
}
