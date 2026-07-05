/**
 * LR retraining on real AgamiAI transaction distribution.
 *
 * Reads real bank-statement data (aggregate per account) from Postgres,
 * derives features, runs batch-GD logistic regression per lender, and
 * persists the trained weights to lr_training_runs.
 *
 * The synthetic labeler mirrors published underwriting preferences per
 * lender (SBI heavy on compliance, HDFC on growth+vintage, IDBI on revenue
 * stability). Same shape as src/lib/mlModel.ts synthetic sampler — but
 * features come from real distributions.
 */

import { getPool, query } from "./db";

export type Features = [number, number, number, number, number, number];
export type LabeledSample = { features: Features; label: number };

const LABEL_HEURISTICS = {
  "IDBI Bank": { wRev: 3.2, wComp: 2.4, wCtr: 1.8, wGro: 2.0, wAmt: -1.5, wTen: -0.3, bias: -3.2 },
  SBI:         { wRev: 2.4, wComp: 3.8, wCtr: 2.6, wGro: 1.4, wAmt: -1.8, wTen: -0.4, bias: -3.5 },
  "HDFC Bank": { wRev: 2.6, wComp: 2.2, wCtr: 2.0, wGro: 2.4, wAmt: -1.6, wTen: -0.2, bias: -3.0 },
} as const;

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

/** Extract per-account training rows from Postgres. */
export async function extractTrainingRows(): Promise<Array<{ features: Features }>> {
  const rows = await query<{
    account_id: string;
    n_txns: string; avg_credit: string; avg_debit: string;
    n_upi: string; n_bounces: string;
    top_cp_share: string; cp_count: string;
    opening: string; closing: string;
  }>(
    `WITH per_acc AS (
       SELECT t.account_id,
              COUNT(*)::bigint AS n_txns,
              AVG(COALESCE(t.credit, 0))::double precision AS avg_credit,
              AVG(COALESCE(t.debit, 0))::double precision AS avg_debit,
              SUM(CASE WHEN t.txn_type = 'UPI' THEN 1 ELSE 0 END)::bigint AS n_upi,
              SUM(CASE WHEN t.failed THEN 1 ELSE 0 END)::bigint AS n_bounces,
              COUNT(DISTINCT t.counterparty) FILTER (WHERE t.counterparty IS NOT NULL)::bigint AS cp_count
         FROM agami_transactions t
        GROUP BY t.account_id
     ),
     top_cp AS (
       SELECT account_id, MAX(inflow) AS top_inflow, SUM(inflow) AS total_inflow FROM (
         SELECT account_id, counterparty, SUM(credit) AS inflow
           FROM agami_transactions
          WHERE counterparty IS NOT NULL
          GROUP BY account_id, counterparty
       ) x
       GROUP BY account_id
     )
     SELECT p.account_id, p.n_txns, p.avg_credit, p.avg_debit, p.n_upi, p.n_bounces,
            p.cp_count,
            CASE WHEN t.total_inflow > 0 THEN t.top_inflow / t.total_inflow ELSE 0 END AS top_cp_share,
            a.opening_balance AS opening, a.closing_balance AS closing
       FROM per_acc p
       LEFT JOIN top_cp t ON t.account_id = p.account_id
       JOIN agami_accounts a ON a.account_id = p.account_id`
  );

  const samples: Array<{ features: Features }> = [];
  for (const r of rows) {
    const avgCredit = Number(r.avg_credit);
    const avgDebit = Number(r.avg_debit);
    const nBounces = Number(r.n_bounces);
    const cpCount = Number(r.cp_count);
    const topCpShare = Number(r.top_cp_share) || 0;
    const opening = Math.max(1, Number(r.opening));
    const closing = Number(r.closing);

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

function labelFor(lender: keyof typeof LABEL_HEURISTICS, f: Features, noise: number): number {
  const h = LABEL_HEURISTICS[lender];
  const linear = h.bias + h.wRev * f[0] + h.wComp * f[1] + h.wCtr * f[2] +
                 h.wGro * f[3] + h.wAmt * f[4] + h.wTen * f[5];
  return Math.random() < sigmoid(linear + noise) ? 1 : 0;
}

export function trainLR(lender: keyof typeof LABEL_HEURISTICS,
                       samples: Array<{ features: Features }>,
                       epochs = 300, lr = 0.4) {
  const labeled: LabeledSample[] = samples.map((s) => ({
    features: s.features,
    label: labelFor(lender, s.features, (Math.random() - 0.5) * 0.6),
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

export async function persistTrainingRun(
  lender: string, weights: number[],
  accuracy: number, auc: number,
  sampleCount: number, epochsRun: number
) {
  const pool = getPool();
  if (!pool) return;
  await pool.query(
    `INSERT INTO lr_training_runs
       (lender, sample_count, epochs, accuracy, auc, weights, feature_names)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [lender, sampleCount, epochsRun, accuracy, auc, JSON.stringify(weights),
      ["bias", "revenue", "compliance", "counterparty", "growth", "amountRatio", "tenor"]]
  );
}

export type RetrainRun = {
  lender: string; started_at: string; sample_count: number; epochs: number;
  accuracy: number; auc: number; weights: number[];
};

export async function getLatestRuns(): Promise<RetrainRun[]> {
  const rows = await query<{
    lender: string; started_at: Date; sample_count: number; epochs: number;
    accuracy: number; auc: number; weights: string;
  }>(
    `WITH latest AS (
       SELECT lender, MAX(started_at) AS last_run
         FROM lr_training_runs
        GROUP BY lender
     )
     SELECT r.lender, r.started_at, r.sample_count, r.epochs, r.accuracy, r.auc, r.weights
       FROM lr_training_runs r
       JOIN latest l ON l.lender = r.lender AND l.last_run = r.started_at
      ORDER BY r.lender`
  );
  return rows.map((r) => ({
    lender: r.lender,
    started_at: new Date(r.started_at).toISOString(),
    sample_count: Number(r.sample_count),
    epochs: Number(r.epochs),
    accuracy: Number(r.accuracy),
    auc: Number(r.auc),
    weights: typeof r.weights === "string" ? JSON.parse(r.weights) : r.weights,
  }));
}
