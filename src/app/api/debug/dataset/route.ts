import { NextResponse } from "next/server";
import { getDataset } from "@/lib/agami/dataset";
import { getLatestRuns } from "@/lib/agami/lrRetrain";
import { RUNTIME_DATA_DIR } from "@/lib/runtimeStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Diagnostic endpoint · GET /api/debug/dataset
 *
 * Replaces the old /api/debug/db, which existed to work out why an SSR Lambda
 * could not reach a private RDS instance. There is no network in the data path
 * any more, so the only things that can go wrong are a missing fixture file or
 * a read-only scratch directory. Both are reported here.
 *
 * Doubles as the Cloud Run startup probe: it touches every fixture, so a 200
 * means the container can actually serve the dashboard.
 */
export async function GET() {
  const report: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    node_env: process.env.NODE_ENV,
    cloud_run_service: process.env.K_SERVICE ?? null,
    cloud_run_revision: process.env.K_REVISION ?? null,
    runtime_data_dir: RUNTIME_DATA_DIR,
  };

  try {
    const t0 = Date.now();
    const ds = getDataset();
    report.load_ms = Date.now() - t0;
    report.dataset = ds.meta;
    report.linked_demo_gstins = [...ds.filingsByGstin.entries()].map(([gstin, f]) => ({
      gstin, pan: f.pan, name: f.name, form: f.form, assessmentYear: f.assessmentYear,
    }));

    const sample = ds.accounts[0];
    report.sample_account = sample
      ? { accountId: sample.accountId, bankName: sample.bankName,
          txnCount: ds.txnsByAccount.get(sample.accountId)?.length ?? 0 }
      : null;
  } catch (err) {
    report.status = "FAIL";
    report.error = (err as Error).message;
    report.hint = "Run `npm run data:build` to regenerate src/data/agami/, or point AGAMI_DATA_DIR at the fixtures.";
    return NextResponse.json(report, { status: 500 });
  }

  try {
    const runs = await getLatestRuns();
    report.retrain_runs = runs.map((r) => ({
      lender: r.lender, startedAt: r.started_at, sampleCount: r.sample_count,
      accuracy: r.accuracy, auc: r.auc,
    }));
  } catch (err) {
    report.retrain_error = (err as Error).message;
    report.retrain_hint = `Cannot write to ${RUNTIME_DATA_DIR}. On Cloud Run this must be under /tmp; set UDYAMAI_DATA_DIR if the image mounts it elsewhere.`;
  }

  report.status = "OK · bundled AgamiAI corpus loaded, no database in the request path";
  return NextResponse.json(report, { status: 200 });
}
