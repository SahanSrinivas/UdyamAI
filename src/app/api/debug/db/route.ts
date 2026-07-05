import { NextResponse } from "next/server";
import { Pool } from "pg";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Diagnostic endpoint · GET /api/debug/db
 * Reports:
 *   - Whether DATABASE_URL env var is present (host masked, password hidden)
 *   - Whether we can open a Postgres connection
 *   - Whether the schema tables exist
 *   - Whether the demo GSTIN linkage exists
 *   - Whether the ITR query returns a real record
 */
export async function GET() {
  const report: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    node_env: process.env.NODE_ENV,
    aws_lambda: !!process.env.AWS_LAMBDA_FUNCTION_NAME,
    amplify_region: process.env.AWS_REGION ?? null,
  };

  const url = process.env.DATABASE_URL;
  if (!url) {
    report.env_var_present = false;
    report.hint = "DATABASE_URL is undefined. Confirm it's saved in Amplify Console → App settings → Environment variables and that a redeploy happened AFTER saving.";
    return NextResponse.json(report, { status: 200 });
  }

  // Mask the URL — never leak the full password
  report.env_var_present = true;
  const masked = url.replace(/:([^@:]+)@/, ":****@");
  report.database_url_masked = masked;

  // Check that URL points to RDS
  const isRds = url.includes("amazonaws.com") || url.includes("rds.");
  report.detected_as_rds = isRds;

  // Strip sslmode from URL — see comment in src/lib/agami/db.ts
  const cleanUrl = isRds
    ? url.replace(/([?&])sslmode=[^&]+&?/, "$1").replace(/[?&]$/, "")
    : url;
  report.sslmode_stripped = cleanUrl !== url;

  // Try to connect
  const pool = new Pool({
    connectionString: cleanUrl,
    ssl: isRds ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: 8000,
    max: 1,
  });

  try {
    const t0 = Date.now();
    const version = await pool.query("SELECT version() AS v, current_database() AS db, current_user AS u");
    report.connection_ms = Date.now() - t0;
    report.postgres_version = String(version.rows[0].v).slice(0, 80);
    report.database = version.rows[0].db;
    report.user = version.rows[0].u;

    // Check tables
    const tables = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
    );
    report.tables = tables.rows.map((r) => r.table_name);

    // Check ITR record counts
    try {
      const itrCount = await pool.query("SELECT COUNT(*) AS n FROM agami_itr");
      report.itr_row_count = Number(itrCount.rows[0].n);

      const linked = await pool.query(
        "SELECT linked_gstin, pan, name FROM agami_itr WHERE linked_gstin IS NOT NULL ORDER BY linked_gstin"
      );
      report.linked_demo_gstins = linked.rows;
    } catch (e) {
      report.itr_error = String(e);
    }

    // Try the actual query itrData.ts would run
    try {
      const demoQuery = await pool.query(
        `SELECT pan, name, entity_type, form, assessment_year, income
           FROM agami_itr
          WHERE linked_gstin = $1
          LIMIT 1`,
        ["24AABCS1234R1Z8"]
      );
      report.itr_lookup_24AABCS1234R1Z8 = demoQuery.rows[0] ?? "no match";
    } catch (e) {
      report.demo_lookup_error = String(e);
    }

    report.status = "OK · Postgres is reachable and returning data";
  } catch (err) {
    const e = err as Error & { code?: string };
    report.status = "FAIL";
    report.error = {
      name: e.name,
      message: e.message,
      code: e.code,
    };
    // Common troubleshooting hints
    if (e.message.includes("timeout")) {
      report.hint = "Connection timed out. Check RDS Security Group inbound rules — port 5432 must allow 0.0.0.0/0 (or Amplify's egress).";
    } else if (e.message.includes("password authentication")) {
      report.hint = "Password rejected. The DATABASE_URL env var may be wrong. Confirm no line breaks were introduced and %21 / %23 are used for ! and #.";
    } else if (e.message.includes("no pg_hba.conf entry")) {
      report.hint = "SSL is required. Ensure the URL ends with ?sslmode=require or set ssl in the pool.";
    } else if (e.message.includes("self-signed") || e.message.includes("certificate")) {
      report.hint = "SSL cert issue — our pool sets rejectUnauthorized:false when host contains amazonaws.com; verify that condition matches.";
    }
  } finally {
    await pool.end().catch(() => {});
  }

  return NextResponse.json(report, { status: 200 });
}
