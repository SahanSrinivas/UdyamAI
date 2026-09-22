/**
 * Real bank-statement data · read from the bundled AgamiAI corpus.
 *
 * These were five SQL aggregations against agami_transactions. They are now
 * the same five aggregations expressed over an in-memory array — identical
 * output shape, no network hop, no connection pool to tune.
 */

import { accountForGstin, getDataset, txnsForAccount, type Txn } from "./dataset";

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

/** `txn_date` is an ISO-ish string in the corpus; take the date part only. */
function isoDate(raw: string | null): string {
  return raw ? raw.slice(0, 10) : "";
}

function toRecentTxn(t: Txn): RecentTxn {
  return {
    date: isoDate(t.date),
    description: t.description,
    txnType: t.parsed.type,
    counterparty: t.parsed.counterparty,
    debit: t.debit,
    credit: t.credit,
    balance: t.balance,
    failed: t.failed,
  };
}

export async function getStatementForGstin(gstin: string): Promise<StatementSummary | null> {
  const account = accountForGstin(gstin);
  if (!account) return null;

  const txns = txnsForAccount(account.accountId);
  if (txns.length === 0) return null;

  let totalInflow = 0;
  let totalOutflow = 0;
  let bounceCount = 0;
  const byCounterparty = new Map<string, CounterpartyRollup>();
  const byType = new Map<string, { txnType: string; count: number; volume: number }>();

  for (const t of txns) {
    totalInflow += t.credit;
    totalOutflow += t.debit;
    if (t.failed) bounceCount++;

    const cp = t.parsed.counterparty;
    if (cp) {
      const cur = byCounterparty.get(cp) ?? { name: cp, inflow: 0, outflow: 0, txnCount: 0, net: 0 };
      cur.inflow += t.credit;
      cur.outflow += t.debit;
      cur.txnCount += 1;
      byCounterparty.set(cp, cur);
    }

    const type = t.parsed.type;
    const mix = byType.get(type) ?? { txnType: type, count: 0, volume: 0 };
    mix.count += 1;
    mix.volume += t.credit + t.debit;
    byType.set(type, mix);
  }

  const topCounterparties = [...byCounterparty.values()]
    .map((c) => ({ ...c, net: c.inflow - c.outflow }))
    .sort((a, b) => b.inflow + b.outflow - (a.inflow + a.outflow))
    .slice(0, 8);

  const recentTxns = [...txns]
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
    .slice(0, 8)
    .map(toRecentTxn);

  return {
    accountId: account.accountId,
    bankName: account.bankName ?? "",
    accountHolder: account.accountHolder ?? "",
    openingBalance: account.openingBalance,
    closingBalance: account.closingBalance,
    totalInflow,
    totalOutflow,
    txnCount: txns.length,
    uniqueCounterparties: byCounterparty.size,
    bounceCount,
    topCounterparties,
    recentTxns,
    typeMix: [...byType.values()].sort((a, b) => b.volume - a.volume),
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
  const { bounces, accountsById } = getDataset();
  return bounces.slice(0, limit).map((t) => {
    const account = accountsById.get(t.accountId);
    return {
      accountId: t.accountId,
      bankName: account?.bankName ?? "",
      accountHolder: account?.accountHolder ?? "",
      txnDate: isoDate(t.date),
      description: t.description,
      amount: t.debit + t.credit,
      txnType: t.parsed.type,
      counterparty: t.parsed.counterparty,
    };
  });
}
