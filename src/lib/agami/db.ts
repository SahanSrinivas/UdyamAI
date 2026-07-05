/**
 * AWS RDS Postgres pool.
 * Falls back to null when DATABASE_URL is not set (local dev without DB).
 *
 * SSL handling: RDS Aurora presents a certificate chain signed by AWS's
 * internal root CA. Node.js won't trust it by default, so we set
 * rejectUnauthorized:false. We ALSO strip `sslmode=require` from the URL
 * before passing it to pg — otherwise pg's URL-parsed sslmode overrides
 * the pool ssl option and re-enables strict cert verification, which
 * fails with SELF_SIGNED_CERT_IN_CHAIN.
 */

import { Pool } from "pg";

let cached: Pool | null = null;

function stripSslMode(url: string): string {
  return url.replace(/([?&])sslmode=[^&]+&?/, "$1").replace(/[?&]$/, "");
}

export function getPool(): Pool | null {
  if (!process.env.DATABASE_URL) return null;
  if (cached) return cached;

  const raw = process.env.DATABASE_URL;
  const isRds = raw.includes("amazonaws.com") || raw.includes("rds.");
  const url = isRds ? stripSslMode(raw) : raw;

  cached = new Pool({
    connectionString: url,
    ssl: isRds ? { rejectUnauthorized: false } : undefined,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
  return cached;
}

export async function query<T extends Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const pool = getPool();
  if (!pool) return [];
  const res = await pool.query<T>(sql, params);
  return res.rows;
}
