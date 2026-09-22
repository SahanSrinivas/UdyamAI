/**
 * LR retraining on the real AgamiAI transaction distribution.
 *
 * Reads per-account aggregates from the bundled corpus, derives features, runs
 * batch-GD logistic regression per lender, and persists the trained weights.
 *
 * Two things changed when RDS was removed:
 *
 *   1. Feature extraction is the same aggregation it always was — grouped by
 *      account, one pass over 32k transactions — just expressed in TypeScript
 *      rather than SQL.
 *   2. `lr_training_runs` is now a JSON file in the container's writable
 *      scratch (see src/lib/runtimeStore.ts). Runs survive within an instance
 *      and are lost when it recycles, at which point the next read retrains
 *      from the corpus. The badge therefore always has something real to show,
 *      and no instance ever serves a number it did not compute.
 *
 * The synthetic labeler mirrors published underwriting preferences per lender
 * (SBI heavy on compliance, HDFC on growth+vintage, IDBI on revenue
 * stability). Same shape as src/lib/mlModel.ts synthetic sampler — but
 * features come from real distributions, and the label noise is drawn from a
 * seeded PRNG so a given corpus always produces the same accuracy and AUC.
 */

import { promises as fs } from "fs";
import { getDataset } from "./dataset";
import { RUNTIME_DATA_DIR, runtimeFile } from "../runtimeStore";

export type Features = [number, number, number, number, number, number];
export type LabeledSample = { features: Features; label: number };

const LABEL_HEURISTICS = {
  "IDBI Bank": { wRev: 3.2, wComp: 2.4, wCtr: 1.8, wGro: 2.0, wAmt: -1.5, wTen: -0.3, bias: -3.2 },
  SBI:         { wRev: 2.4, wComp: 3.8, wCtr: 2.6, wGro: 1.4, wAmt: -1.8, wTen: -0.4, bias: -3.5 },
  "HDFC Bank": { wRev: 2.6, wComp: 2.2, wCtr: 2.0, wGro: 2.4, wAmt: -1.6, wTen: -0.2, bias: -3.0 },
} as const;

export type Lender = keyof typeof LABEL_HEURISTICS;
export const LENDERS: Lender[] = ["IDBI Bank", "SBI", "HDFC Bank"];

const FEATURE_NAMES = [
  "bias", "revenue", "compliance", "counterparty", "growth", "amountRatio", "tenor",
];

const RUNS_FILE = runtimeFile("retrain.json");
const MAX_RUNS = 200;

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

/** mulberry32 — small, fast, and reproducible, which Math.random is not. */
function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFor(lender: string): number {
  let h = 2166136261;
  for (let i = 0; i < lender.length; i++) {
    h ^= lender.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

/**
 * Extract per-account training rows from the bundled corpus.
 *
 * The SQL this replaces was a CTE pair: per-account aggregates joined to each
 * account's largest counterparty by inflow. Same two passes here.
 */
export async function extractTrainingRows(): Promise<Array<{ features: Features }>> {
  const { accounts, txnsByAccount } = getDataset();
  const samples: Array<{ features: Features }> = [];

  for (const account of accounts) {
    const txns = txnsByAccount.get(account.accountId) ?? [];
    if (txns.length === 0) continue;

    let sumCredit = 0;
    let sumDebit = 0;
    let nBounces = 0;
    const inflowByCp = new Map<string, number>();

    for (const t of txns) {
      sumCredit += t.credit;
      sumDebit += t.debit;
      if (t.failed) nBounces++;
      const cp = t.parsed.counterparty;
      if (cp) inflowByCp.set(cp, (inflowByCp.get(cp) ?? 0) + t.credit);
    }

    const avgCredit = sumCredit / txns.length;
    const avgDebit = sumDebit / txns.length;
    const cpCount = inflowByCp.size;
    const inflows = [...inflowByCp.values()];
    const totalInflow = inflows.reduce((a, b) => a + b, 0);
    const topCpShare = totalInflow > 0 ? Math.max(...inflows) / totalInflow : 0;
    const opening = Math.max(1, account.openingBalance);
    const closing = account.closingBalance;

    const revenue = Math.min(1, avgCredit / 1_000_000);
    const compliance = Math.max(0, 1 - nBounces * 0.15);
    const counterparty = Math.max(0, 1 - topCpShare) * Math.min(1, cpCount / 40);
    const growth = closing > opening ? Math.min(1, (closing - opening) / opening) : 0;
    const amountRatio = 0.2 + (avgDebit > 0 ? Math.min(0.4, avgDebit / 500_000) : 0);
    const tenorNorm = 0.6;

    samples.push({
      features: [revenue, compliance, counterparty, growth, amountRatio, tenorNorm],
    });
  }

  return samples;
}

function labelFor(lender: Lender, f: Features, noise: number, rand: () => number): number {
  const h = LABEL_HEURISTICS[lender];
  const linear = h.bias + h.wRev * f[0] + h.wComp * f[1] + h.wCtr * f[2] +
                 h.wGro * f[3] + h.wAmt * f[4] + h.wTen * f[5];
  return rand() < sigmoid(linear + noise) ? 1 : 0;
}

export function trainLR(lender: Lender,
                        samples: Array<{ features: Features }>,
                        epochs = 300, lr = 0.4) {
  const rand = seededRandom(seedFor(lender));
  const labeled: LabeledSample[] = samples.map((s) => ({
    features: s.features,
    label: labelFor(lender, s.features, (rand() - 0.5) * 0.6, rand),
  }));

  let w = [0, 0, 0, 0, 0, 0, 0];
  const N = labeled.length;
  if (N === 0) return { weights: w, accuracy: 0, auc: 0.5, sampleCount: 0, epochsRun: 0 };

  for (let e = 0; e < epochs; e++) {
    const g = [0, 0, 0, 0, 0, 0, 0];
    for (const s of labeled) {
      const z = w[0] + w[1] * s.features[0] + w[2] * s.features[1] + w[3] * s.features[2]
                     + w[4] * s.features[3] + w[5] * s.features[4] + w[6] * s.features[5];
      const err = sigmoid(z) - s.label;
      g[0] += err;
      for (let i = 0; i < 6; i++) g[i + 1] += err * s.features[i];
    }
    for (let i = 0; i < 7; i++) w[i] -= (lr * g[i]) / N;
  }

  const holdSize = Math.min(200, Math.floor(N * 0.25));
  const hold = labeled.slice(0, holdSize);
  let correct = 0;
  const scored: { p: number; y: number }[] = [];
  for (const s of hold) {
    const z = w[0] + w[1] * s.features[0] + w[2] * s.features[1] + w[3] * s.features[2]
                   + w[4] * s.features[3] + w[5] * s.features[4] + w[6] * s.features[5];
    const p = sigmoid(z);
    scored.push({ p, y: s.label });
    if ((p >= 0.5 ? 1 : 0) === s.label) correct++;
  }
  const pos = scored.filter((s) => s.y === 1);
  const neg = scored.filter((s) => s.y === 0);
  let wins = 0;
  for (const p of pos) for (const n of neg) if (p.p > n.p) wins++; else if (p.p === n.p) wins += 0.5;
  const auc = pos.length && neg.length ? wins / (pos.length * neg.length) : 0.5;

  return {
    weights: w,
    accuracy: hold.length ? correct / hold.length : 0,
    auc,
    sampleCount: N,
    epochsRun: epochs,
  };
}

// ─── Run history ────────────────────────────────────────────────

export type RetrainRun = {
  lender: string;
  started_at: string;
  sample_count: number;
  epochs: number;
  accuracy: number;
  auc: number;
  weights: number[];
  feature_names: string[];
};

async function readRuns(): Promise<RetrainRun[]> {
  try {
    return JSON.parse(await fs.readFile(RUNS_FILE, "utf-8")) as RetrainRun[];
  } catch {
    return [];
  }
}

async function writeRuns(runs: RetrainRun[]) {
  await fs.mkdir(RUNTIME_DATA_DIR, { recursive: true });
  await fs.writeFile(RUNS_FILE, JSON.stringify(runs.slice(0, MAX_RUNS), null, 2), "utf-8");
}

export async function persistTrainingRun(
  lender: string, weights: number[],
  accuracy: number, auc: number,
  sampleCount: number, epochsRun: number
): Promise<RetrainRun> {
  const run: RetrainRun = {
    lender,
    started_at: new Date().toISOString(),
    sample_count: sampleCount,
    epochs: epochsRun,
    accuracy,
    auc,
    weights,
    feature_names: FEATURE_NAMES,
  };
  const runs = await readRuns();
  runs.unshift(run);
  await writeRuns(runs);
  return run;
}

/** Train every lender once and persist the result. Used by /api/retrain. */
export async function retrainAll(): Promise<RetrainRun[]> {
  const samples = await extractTrainingRows();
  if (samples.length === 0) return [];

  const fresh: RetrainRun[] = [];
  for (const lender of LENDERS) {
    const run = trainLR(lender, samples);
    fresh.push(await persistTrainingRun(lender, run.weights, run.accuracy, run.auc,
                                        run.sampleCount, run.epochsRun));
  }
  return fresh;
}

/**
 * Latest run per lender. A cold instance has no history, so it trains one —
 * 200 samples × 300 epochs is a few milliseconds, and it means the dashboard
 * never renders a retrain badge backed by nothing.
 */
export async function getLatestRuns(): Promise<RetrainRun[]> {
  let runs = await readRuns();
  if (runs.length === 0) {
    await retrainAll();
    runs = await readRuns();
  }

  const latest = new Map<string, RetrainRun>();
  for (const run of runs) {
    const seen = latest.get(run.lender);
    if (!seen || run.started_at > seen.started_at) latest.set(run.lender, run);
  }
  return [...latest.values()].sort((a, b) => a.lender.localeCompare(b.lender));
}
