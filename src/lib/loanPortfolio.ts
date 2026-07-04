/**
 * Synthetic loan portfolio per lender.
 * Deterministic — same lender → same book, so demo is reproducible.
 * ~50 loans/lender covering the full DPD spectrum.
 */

import { computeHealthCard } from "./scoreEngine";
import { listProfiles, MSME_PROFILES } from "./mockData";

export type NpaStage = "STANDARD" | "SMA-0" | "SMA-1" | "SMA-2" | "NPA";

export type SanctionedLoan = {
  loanId: string;
  msmeGstin: string;
  msmeName: string;
  sector: string;
  city: string;
  lender: string;

  sanctionAmount: number;
  outstandingPrincipal: number;
  ratePct: number;
  tenorMonths: number;
  monthsSinceDisbursal: number;
  emiPaid: number;
  bounceCount: number;
  disbursalDate: string;

  dpd: number;
  stage: NpaStage;

  scoreAtSanction: number;
  currentScore: number;
  scoreDelta: number;

  alert: {
    severity: "warning" | "critical";
    reason: string;
    firedAt: string;
  } | null;
};

const SECTORS = [
  "Textile Wholesale",
  "Auto Components",
  "Precision Machining",
  "Handloom & Textiles",
  "Leather Goods",
  "Micro Retail (Kirana)",
  "Agri Processing",
  "Chemical Trading",
  "Electronics Assembly",
  "Food Processing",
];

const CITIES = [
  "Surat, Gujarat",
  "Ahmedabad, Gujarat",
  "Coimbatore, Tamil Nadu",
  "Visakhapatnam, Andhra Pradesh",
  "Hyderabad, Telangana",
  "Kanpur, Uttar Pradesh",
  "Jaipur, Rajasthan",
  "Chennai, Tamil Nadu",
  "Pune, Maharashtra",
  "Warangal, Telangana",
];

const FIRST_NAMES = [
  "Rajesh", "Anil", "Vikram", "Priya", "Muthu", "Anantha", "Faizal", "Sunita",
  "Ramesh", "Deepak", "Karthik", "Meera", "Neha", "Rakesh", "Sanjay", "Ravi",
];

const LAST_NAMES = [
  "Traders", "Enterprises", "Industries", "Textiles", "CNC Works",
  "Suppliers", "Corp", "Weaves", "Machines", "Foods", "Metals",
];

// Deterministic PRNG per (lender + index)
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

function fakeGstin(rand: () => number): string {
  const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const stateCodes = ["24", "27", "29", "33", "36", "37", "09", "08", "07"];
  const state = stateCodes[Math.floor(rand() * stateCodes.length)];
  const pan = Array.from({ length: 5 }, () => CHARSET[Math.floor(rand() * 26)]).join("") +
              Array.from({ length: 4 }, () => Math.floor(rand() * 10)).join("") +
              CHARSET[Math.floor(rand() * 26)];
  const entity = 1 + Math.floor(rand() * 9);
  const check = CHARSET[Math.floor(rand() * 26)];
  return `${state}${pan}${entity}Z${check}`;
}

function stageFromDpd(dpd: number): NpaStage {
  if (dpd === 0) return "STANDARD";
  if (dpd <= 30) return "SMA-0";
  if (dpd <= 60) return "SMA-1";
  if (dpd <= 90) return "SMA-2";
  return "NPA";
}

function generateLoan(lender: string, i: number): SanctionedLoan {
  const rand = rng(seed(lender + "-" + i));

  // Deliberately weave in some of our known MSMEs so click-through demos work
  const known = listProfiles();
  let msmeGstin: string;
  let msmeName: string;
  let sector: string;
  let city: string;
  let currentScoreOverride: number | null = null;

  if (i < known.length) {
    const p = known[i];
    msmeGstin = p.gstin;
    msmeName = p.tradeName;
    sector = p.sector;
    city = p.city;
    const card = computeHealthCard(p);
    currentScoreOverride = card.overall;
  } else {
    msmeGstin = fakeGstin(rand);
    const first = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
    const suffix = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)];
    msmeName = `${first} ${suffix}`;
    sector = SECTORS[Math.floor(rand() * SECTORS.length)];
    city = CITIES[Math.floor(rand() * CITIES.length)];
  }

  const sanctionAmount = Math.round((5 + rand() * 45) * 100000) / 1 * 10; // ₹5L to ₹50L, rounded
  const ratePct = +(11 + rand() * 4.5).toFixed(2);
  const tenorMonths = [24, 36, 48, 60][Math.floor(rand() * 4)];
  const monthsSinceDisbursal = 1 + Math.floor(rand() * (tenorMonths - 1));
  const emiPaid = monthsSinceDisbursal;
  const outstandingPrincipal = Math.round(sanctionAmount * (1 - monthsSinceDisbursal / tenorMonths));

  const disbursalDate = new Date(Date.now() - monthsSinceDisbursal * 30 * 86400 * 1000)
    .toISOString().slice(0, 10);

  // DPD distribution — most standard, some SMA, few NPA
  const dpdRoll = rand();
  let dpd = 0;
  if (dpdRoll > 0.9) dpd = 90 + Math.floor(rand() * 30);
  else if (dpdRoll > 0.82) dpd = 60 + Math.floor(rand() * 30);
  else if (dpdRoll > 0.72) dpd = 30 + Math.floor(rand() * 30);
  else if (dpdRoll > 0.6) dpd = 1 + Math.floor(rand() * 29);

  const bounceCount = dpd > 0 ? 1 + Math.floor(rand() * 3) : 0;
  const stage = stageFromDpd(dpd);

  const scoreAtSanction = 600 + Math.floor(rand() * 220);
  const scoreDelta = dpd > 30 ? -(50 + Math.floor(rand() * 90)) : Math.floor(rand() * 40) - 10;
  const currentScore = currentScoreOverride ?? Math.max(300, scoreAtSanction + scoreDelta);

  // Alert logic — score drops ≥80 or SMA-2/NPA
  let alert: SanctionedLoan["alert"] = null;
  if (stage === "NPA") {
    alert = { severity: "critical", reason: `${dpd}d overdue · Slippage risk`, firedAt: hoursAgo(rand() * 24) };
  } else if (stage === "SMA-2") {
    alert = { severity: "critical", reason: `${dpd}d past due · Watch`, firedAt: hoursAgo(rand() * 48) };
  } else if (scoreDelta <= -80) {
    alert = { severity: "warning", reason: `Score dropped ${Math.abs(scoreDelta)} pts`, firedAt: hoursAgo(rand() * 72) };
  } else if (bounceCount >= 2) {
    alert = { severity: "warning", reason: `${bounceCount} bounces recently`, firedAt: hoursAgo(rand() * 96) };
  }

  return {
    loanId: `LN-${lender.slice(0, 4).toUpperCase()}-${String(i + 1).padStart(5, "0")}`,
    msmeGstin, msmeName, sector, city,
    lender,
    sanctionAmount, outstandingPrincipal, ratePct, tenorMonths,
    monthsSinceDisbursal, emiPaid, bounceCount, disbursalDate,
    dpd, stage,
    scoreAtSanction, currentScore, scoreDelta,
    alert,
  };
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 3600 * 1000).toISOString();
}

const cache = new Map<string, SanctionedLoan[]>();

export function getPortfolio(lender: string, size = 50): SanctionedLoan[] {
  const key = `${lender}-${size}`;
  if (cache.has(key)) return cache.get(key)!;
  const loans = Array.from({ length: size }, (_, i) => generateLoan(lender, i));
  cache.set(key, loans);
  return loans;
}

export function getAlerts(lender: string): SanctionedLoan[] {
  return getPortfolio(lender)
    .filter((l) => l.alert !== null)
    .sort((a, b) => {
      const rank = (s: SanctionedLoan) => (s.alert?.severity === "critical" ? 0 : 1);
      return rank(a) - rank(b);
    });
}

export type PortfolioStats = {
  totalLoans: number;
  totalAum: number;
  outstandingAum: number;
  standardCount: number;
  sma0Count: number;
  sma1Count: number;
  sma2Count: number;
  npaCount: number;
  npaPct: number;
  atRiskPct: number;
  activeAlerts: number;
};

export function getPortfolioStats(lender: string): PortfolioStats {
  const p = getPortfolio(lender);
  const byStage: Record<NpaStage, number> = {
    STANDARD: 0, "SMA-0": 0, "SMA-1": 0, "SMA-2": 0, NPA: 0,
  };
  for (const l of p) byStage[l.stage]++;
  const totalAum = p.reduce((s, l) => s + l.sanctionAmount, 0);
  const outstandingAum = p.reduce((s, l) => s + l.outstandingPrincipal, 0);
  const activeAlerts = p.filter((l) => l.alert !== null).length;
  const atRisk = byStage["SMA-1"] + byStage["SMA-2"] + byStage["NPA"];

  return {
    totalLoans: p.length,
    totalAum,
    outstandingAum,
    standardCount: byStage.STANDARD,
    sma0Count: byStage["SMA-0"],
    sma1Count: byStage["SMA-1"],
    sma2Count: byStage["SMA-2"],
    npaCount: byStage.NPA,
    npaPct: p.length ? (byStage.NPA / p.length) * 100 : 0,
    atRiskPct: p.length ? (atRisk / p.length) * 100 : 0,
    activeAlerts,
  };
}
