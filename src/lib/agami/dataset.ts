/**
 * Bundled AgamiAI dataset · the app's only data source.
 *
 * Replaces the AWS RDS Postgres pool that used to live in this directory. The
 * two AgamiAI open datasets (Apache 2.0) are downloaded once by
 * `scripts/build_agami_fixtures.mjs` and committed under src/data/agami/; this
 * module reads them off disk on first use, parses every transaction
 * description through `parser.ts`, and keeps the indexed result in process
 * memory for the life of the container.
 *
 * Why no database: every query the app ran was a read-only aggregation over a
 * fixed 3.7 MB corpus. A Postgres instance to serve that is a network hop, a
 * VPC connector, a credential and a bill for something a `Map` does in
 * microseconds — and removing it is what makes the service genuinely
 * stateless, so Cloud Run can scale it to zero.
 *
 * The one thing that is genuinely mutable — retrain runs — is handled in
 * `lrRetrain.ts`, which persists to the container's writable scratch.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseDescription, type ParsedTxn } from "./parser";

/** Override for containers that mount the fixtures somewhere other than cwd. */
const DATA_DIR = process.env.AGAMI_DATA_DIR ?? join(process.cwd(), "src", "data", "agami");

export type Account = {
  accountId: string;
  bankName: string | null;
  accountHolder: string | null;
  address: string | null;
  city: string | null;
  accountNumber: string | null;
  ifscCode: string | null;
  branchName: string | null;
  accountType: string | null;
  currency: string;
  openingBalance: number;
  closingBalance: number;
  startDate: string | null;
  endDate: string | null;
  statementDate: string | null;
};

export type Txn = {
  accountId: string;
  date: string | null;
  valueDate: string | null;
  description: string;
  chequeNo: string | null;
  debit: number;
  credit: number;
  balance: number;
  branchCode: string | null;
  failed: boolean;
  parsed: ParsedTxn;
};

export type ItrFiling = {
  pan: string;
  acknowledgementNumber: string;
  name: string;
  city: string | null;
  state: string | null;
  entityType: string | null;
  form: string | null;
  assessmentYear: string | null;
  filingDate: string | null;
  lateFiling: boolean;
  income: number;
  tax: number;
  cess: number;
  interest: number;
  loss: number;
  totalPayable: number;
  linkedGstin: string | null;
};

export type DatasetMeta = {
  bankSource: string;
  itrSource: string;
  license: string;
  accountCount: number;
  txnCount: number;
  bounceCount: number;
  filingCount: number;
};

type Dataset = {
  meta: DatasetMeta;
  accounts: Account[];
  accountsById: Map<string, Account>;
  txnsByAccount: Map<string, Txn[]>;
  bounces: Txn[];
  filings: ItrFiling[];
  filingsByGstin: Map<string, ItrFiling>;
};

type AccountsFixture = {
  source: string; license: string; accountCount: number; txnCount: number;
  accounts: Account[];
};
type TxnFixture = {
  source: string; columns: string[];
  byAccount: Record<string, Array<[
    string | null, string | null, string, string | null,
    number, number, number, string | null, 0 | 1,
  ]>>;
};
type ItrFixture = { source: string; license: string; filingCount: number; filings: ItrFiling[] };

let cached: Dataset | null = null;

function readFixture<T>(name: string): T {
  try {
    return JSON.parse(readFileSync(join(DATA_DIR, name), "utf8")) as T;
  } catch (err) {
    throw new Error(
      `Cannot read AgamiAI fixture ${name} from ${DATA_DIR}. ` +
      `Run \`npm run data:build\` to generate it, or set AGAMI_DATA_DIR. ` +
      `(${(err as Error).message})`
    );
  }
}

function build(): Dataset {
  const accountsFixture = readFixture<AccountsFixture>("accounts.json");
  const txnFixture = readFixture<TxnFixture>("transactions.json");
  const itrFixture = readFixture<ItrFixture>("itr.json");

  const accountsById = new Map(accountsFixture.accounts.map((a) => [a.accountId, a]));
  const txnsByAccount = new Map<string, Txn[]>();
  const bounces: Txn[] = [];
  let txnCount = 0;

  for (const [accountId, rows] of Object.entries(txnFixture.byAccount)) {
    const txns: Txn[] = rows.map((r) => {
      const debit = r[4];
      const credit = r[5];
      return {
        accountId,
        date: r[0],
        valueDate: r[1],
        description: r[2],
        chequeNo: r[3],
        debit,
        credit,
        balance: r[6],
        branchCode: r[7],
        failed: r[8] === 1,
        parsed: parseDescription(r[2], credit, debit),
      };
    });
    txnsByAccount.set(accountId, txns);
    txnCount += txns.length;
    for (const t of txns) if (t.failed) bounces.push(t);
  }

  // Newest first — matches the old `ORDER BY txn_date DESC NULLS LAST`.
  bounces.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

  const filingsByGstin = new Map<string, ItrFiling>();
  for (const f of itrFixture.filings) {
    if (f.linkedGstin) filingsByGstin.set(f.linkedGstin, f);
  }

  return {
    meta: {
      bankSource: accountsFixture.source,
      itrSource: itrFixture.source,
      license: accountsFixture.license,
      accountCount: accountsFixture.accounts.length,
      txnCount,
      bounceCount: bounces.length,
      filingCount: itrFixture.filings.length,
    },
    accounts: accountsFixture.accounts,
    accountsById,
    txnsByAccount,
    bounces,
    filings: itrFixture.filings,
    filingsByGstin,
  };
}

/** Parse + index once per process; every later call is a map lookup. */
export function getDataset(): Dataset {
  if (!cached) cached = build();
  return cached;
}

export function getDatasetMeta(): DatasetMeta {
  return getDataset().meta;
}

/**
 * Deterministic GSTIN → account mapping (FNV-1a over the GSTIN, modulo the
 * account pool). Carried over unchanged from the SQL era so a given demo GSTIN
 * still resolves to the same statement it always did.
 */
export function accountForGstin(gstin: string): Account | null {
  const { accounts } = getDataset();
  if (accounts.length === 0) return null;
  let h = 2166136261;
  for (let i = 0; i < gstin.length; i++) {
    h ^= gstin.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return accounts[h % accounts.length];
}

export function txnsForAccount(accountId: string): Txn[] {
  return getDataset().txnsByAccount.get(accountId) ?? [];
}
