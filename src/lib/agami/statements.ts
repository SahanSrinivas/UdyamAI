/**
 * Real bank-statement data · queried from AWS RDS agami_transactions.
 * Every GSTIN gets a deterministic account mapping so demo profiles
 * always resolve to the same statement.
 */

import { query } from "./db";

export type CounterpartyRollup = {
  name: string;
  inflow: number;
  outflow: number;
  txnCount: number;
  net: number;
};

export type RecentTxn = {
  date: string;
  description: string;
  txnType: string;
  counterparty: string | null;
  debit: number;
  credit: number;
  balance: number;
  failed: boolean;
};

export type StatementSummary = {
  accountId: string;
  bankName: string;
  accountHolder: string;
  openingBalance: number;
  closingBalance: number;
  totalInflow: number;
  totalOutflow: number;
  txnCount: number;
  uniqueCounterparties: number;
  bounceCount: number;
  topCounterparties: CounterpartyRollup[];
  recentTxns: RecentTxn[];
  typeMix: { txnType: string; count: number; volume: number }[];
};

/** Pick a real account for each GSTIN — hashed deterministic index. */
async function pickAccountForGstin(gstin: string): Promise<string | null> {
  // Deterministic hash-based offset into the account pool
  let h = 2166136261;
  for (let i = 0; i < gstin.length; i++) {
    h ^= gstin.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  const rows = await query<{ account_id: string; total: string }>(
    `SELECT account_id, COUNT(*) OVER () AS total
       FROM agami_accounts
       ORDER BY account_id
       LIMIT 1 OFFSET $1`,
    [h % 200]
  );
  return rows[0]?.account_id ?? null;
}

export async function getStatementForGstin(gstin: string): Promise<StatementSummary | null> {
  const accountId = await pickAccountForGstin(gstin);
  if (!accountId) return null;

  const [accRows, aggRows, cpRows, txnRows, typeRows] = await Promise.all([
    query<{ bank_name: string; account_holder: string; opening_balance: string; closing_balance: string }>(
      `SELECT bank_name, account_holder, opening_balance, closing_balance
         FROM agami_accounts WHERE account_id = $1`,
      [accountId]
    ),
    query<{ inflow: string; outflow: string; n: string; cp: string; bounces: string }>(
      `SELECT COALESCE(SUM(credit),0) AS inflow,
              COALESCE(SUM(debit),0) AS outflow,
              COUNT(*)::bigint AS n,
              COUNT(DISTINCT counterparty) FILTER (WHERE counterparty IS NOT NULL) AS cp,
              SUM(CASE WHEN failed THEN 1 ELSE 0 END)::bigint AS bounces
         FROM agami_transactions WHERE account_id = $1`,
      [accountId]
    ),
    query<{ counterparty: string; inflow: string; outflow: string; n: string }>(
      `SELECT counterparty,
              COALESCE(SUM(credit),0) AS inflow,
              COALESCE(SUM(debit),0)  AS outflow,
              COUNT(*)::bigint AS n
         FROM agami_transactions
        WHERE account_id = $1 AND counterparty IS NOT NULL
        GROUP BY counterparty
        ORDER BY SUM(credit) + SUM(debit) DESC
        LIMIT 8`,
      [accountId]
    ),
    query<{ txn_date: Date; description: string; txn_type: string; counterparty: string | null; debit: string; credit: string; balance: string; failed: boolean }>(
      `SELECT txn_date, description, txn_type, counterparty, debit, credit, balance, failed
         FROM agami_transactions
        WHERE account_id = $1
        ORDER BY txn_date DESC NULLS LAST
        LIMIT 8`,
      [accountId]
    ),
    query<{ txn_type: string; n: string; volume: string }>(
      `SELECT txn_type,
              COUNT(*)::bigint AS n,
              COALESCE(SUM(credit + debit),0) AS volume
         FROM agami_transactions
        WHERE account_id = $1
        GROUP BY txn_type
        ORDER BY volume DESC`,
      [accountId]
    ),
  ]);

  const acc = accRows[0];
  const agg = aggRows[0];
  if (!acc || !agg) return null;

  return {
    accountId,
    bankName: acc.bank_name,
    accountHolder: acc.account_holder,
    openingBalance: Number(acc.opening_balance || 0),
    closingBalance: Number(acc.closing_balance || 0),
    totalInflow: Number(agg.inflow || 0),
    totalOutflow: Number(agg.outflow || 0),
    txnCount: Number(agg.n || 0),
    uniqueCounterparties: Number(agg.cp || 0),
    bounceCount: Number(agg.bounces || 0),
    topCounterparties: cpRows.map((r) => ({
      name: r.counterparty,
      inflow: Number(r.inflow),
      outflow: Number(r.outflow),
      txnCount: Number(r.n),
      net: Number(r.inflow) - Number(r.outflow),
    })),
    recentTxns: txnRows.map((r) => ({
      date: r.txn_date ? new Date(r.txn_date).toISOString().slice(0, 10) : "",
      description: r.description,
      txnType: r.txn_type,
      counterparty: r.counterparty,
      debit: Number(r.debit || 0),
      credit: Number(r.credit || 0),
      balance: Number(r.balance || 0),
      failed: r.failed,
    })),
    typeMix: typeRows.map((r) => ({
      txnType: r.txn_type,
      count: Number(r.n),
      volume: Number(r.volume),
    })),
  };
}

/** Bounce transactions across all accounts — for the lender's live alert view. */
export type BounceAlert = {
  accountId: string;
  bankName: string;
  accountHolder: string;
  txnDate: string;
  description: string;
  amount: number;
  txnType: string;
  counterparty: string | null;
};

export async function getRecentBounces(limit = 20): Promise<BounceAlert[]> {
  const rows = await query<{
    account_id: string; bank_name: string; account_holder: string;
    txn_date: Date; description: string; debit: string; credit: string;
    txn_type: string; counterparty: string | null;
  }>(
    `SELECT t.account_id, a.bank_name, a.account_holder,
            t.txn_date, t.description, t.debit, t.credit, t.txn_type, t.counterparty
       FROM agami_transactions t
       JOIN agami_accounts a ON a.account_id = t.account_id
      WHERE t.failed = TRUE
      ORDER BY t.txn_date DESC NULLS LAST
      LIMIT $1`,
    [limit]
  );
  return rows.map((r) => ({
    accountId: r.account_id,
    bankName: r.bank_name,
    accountHolder: r.account_holder,
    txnDate: r.txn_date ? new Date(r.txn_date).toISOString().slice(0, 10) : "",
    description: r.description,
    amount: Number(r.debit || 0) + Number(r.credit || 0),
    txnType: r.txn_type,
    counterparty: r.counterparty,
  }));
}
