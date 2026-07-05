/**
 * AWS RDS Postgres pool.
 * Falls back to null when DATABASE_URL is not set (local dev without DB).
 */

import { Pool } from "pg";

let cached: Pool | null = null;

export function getPool(): Pool | null {
  if (!process.env.DATABASE_URL) return null;
  if (cached) return cached;

  const isRds = process.env.DATABASE_URL.includes("amazonaws.com") ||
                process.env.DATABASE_URL.includes("rds.");
  cached = new Pool({
    connectionString: process.env.DATABASE_URL,
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
