/**
 * LR retraining on real AgamiAI transaction distribution.
 *
 * Once Postgres is populated, this queries the real bank statement + ITR data,
 * derives per-account features (revenue, bounces, UPI velocity, buyer count),
 * uses the ITR income + late-filing flag as approval/default labels,
 * and retrains the per-lender logistic regression.
 *
 * The output weights get persisted to lr_training_runs so we can point the
 * live model.getModel() at the latest run instead of the synthetic
 * cold-start weights baked into mlModel.ts.
 */

import { query } from "./db";
import { getPool } from "./db";

export type FeatureRow = {
  revenue: number;
  compliance: number;
  counterparty: number;
  growth: number;
  amountRatio: number;
  tenor: number;
  approved: number;
};

/** Derive training rows per account from the Postgres tables. */
export async function extractTrainingRows(
  limit = 5000
): Promise<FeatureRow[]> {
  const pool = getPool();
  if (!pool) return [];

  const rows = await query<{
    account_id: string;
    n_txns: string;
    avg_credit: string;
    avg_debit: string;
    n_upi: string;
    n_neft: string;
    n_bounces: string;
    top_cp_share: string;
    cp_count: string;
    closing: string;
    opening: string;
    late_filing: boolean | null;
    income: string | null;
  }>(
    `WITH a AS (
       SELECT a.account_id, a.opening_balance AS opening, a.closing_balance AS closing,
              i.late_filing, i.income
         FROM agami_accounts a
         LEFT JOIN agami_itr i ON i.linked_gstin = a.linked_gstin
        LIMIT $1
     ),
     t AS (
       SELECT t.account_id,
              COUNT(*) AS n_txns,
              AVG(COALESCE(credit, 0)) AS avg_credit,
              AVG(COALESCE(debit, 0)) AS avg_debit,
              SUM(CASE WHEN txn_type = 'UPI' THEN 1 ELSE 0 END) AS n_upi,
              SUM(CASE WHEN txn_type = 'NEFT' THEN 1 ELSE 0 END) AS n_neft,
              SUM(CASE WHEN failed THEN 1 ELSE 0 END) AS n_bounces,
              COUNT(DISTINCT counterparty) AS cp_count
         FROM agami_transactions t
        GROUP BY t.account_id
     ),
     cp AS (
       SELECT account_id,
              counterparty,
              SUM(credit) AS inflow,
              ROW_NUMBER() OVER (PARTITION BY account_id ORDER BY SUM(credit) DESC) AS rk
         FROM agami_transactions
        WHERE counterparty IS NOT NULL
        GROUP BY account_id, counterparty
     ),
     top_cp AS (
       SELECT account_id, inflow AS top_inflow FROM cp WHERE rk = 1
     )
     SELECT a.account_id, t.n_txns, t.avg_credit, t.avg_debit, t.n_upi, t.n_neft,
            t.n_bounces, t.cp_count, a.opening, a.closing, a.late_filing, a.income,
            COALESCE(tc.top_inflow, 0) / NULLIF(SUM(COALESCE(t.avg_credit, 0)) OVER (), 0) AS top_cp_share
       FROM a
       JOIN t ON t.account_id = a.account_id
       LEFT JOIN top_cp tc ON tc.account_id = a.account_id`,
    [limit]
  );

  return rows.map((r) => {
    // Map raw metrics into normalized 0-1000 sub-scores
    const nTxns = Number(r.n_txns) || 0;
    const avgCredit = Number(r.avg_credit) || 0;
    const nUpi = Number(r.n_upi) || 0;
    const nBounces = Number(r.n_bounces) || 0;
    const cpCount = Number(r.cp_count) || 0;
    const closing = Number(r.closing) || 0;
    const opening = Number(r.opening) || 1;
    const topCpShare = Number(r.top_cp_share) || 0;
    const income = Number(r.income) || 0;

    const revenue = Math.min(1, avgCredit / 1_000_000);
    const compliance = Math.max(0, 1 - nBounces * 0.15) * (r.late_filing ? 0.7 : 1);
    const counterparty = Math.max(0, 1 - topCpShare) * Math.min(1, cpCount / 40);
    const growth = closing > opening ? Math.min(1, (closing - opening) / opening) : 0;

    // Synthetic label: approved when income > median AND no bounces AND not late-filed
    const approved =
      (income > 5_000_000 && nBounces === 0 && !r.late_filing) ||
      (income > 15_000_000 && !r.late_filing)
        ? 1 : 0;

    return {
      revenue: revenue * 1000,
      compliance: compliance * 1000,
      counterparty: counterparty * 1000,
      growth: growth * 1000,
      amountRatio: 0.25 + (nUpi / Math.max(1, nTxns)) * 0.5,
      tenor: 36,
      approved,
    };
  });
}

/** Store a training run snapshot in Postgres. */
export async function persistTrainingRun(
  lender: string,
  weights: number[],
  accuracy: number,
  auc: number,
  sampleCount: number,
  epochs: number
) {
  const pool = getPool();
  if (!pool) return;
  await pool.query(
    `INSERT INTO lr_training_runs
      (lender, sample_count, epochs, accuracy, auc, weights, feature_names)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [lender, sampleCount, epochs, accuracy, auc, JSON.stringify(weights),
      ["bias", "revenue", "compliance", "counterparty", "growth", "amountRatio", "tenor"]]
  );
}
