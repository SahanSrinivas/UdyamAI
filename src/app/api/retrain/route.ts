import { NextResponse } from "next/server";
import { retrainAll } from "@/lib/agami/lrRetrain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Retrain the LR calibrator on the bundled AgamiAI corpus.
 * GET · POST both work — one-shot job, no auth for demo.
 *
 * Results land in this instance's writable scratch, so a retrain is visible to
 * whichever container served it. Production moves this behind Cloud Scheduler
 * → Cloud Run Jobs and writes the runs to a real store.
 */
async function runRetrain() {
  const started = Date.now();
  const runs = await retrainAll();

  if (runs.length === 0) {
    return NextResponse.json({
      status: "no data · the bundled AgamiAI corpus is empty (run `npm run data:build`)",
      elapsedMs: Date.now() - started,
    }, { status: 200 });
  }

  return NextResponse.json({
    status: "ok",
    elapsedMs: Date.now() - started,
    samples: runs[0].sample_count,
    runs: runs.map((r) => ({
      lender: r.lender,
      accuracy: r.accuracy,
      auc: r.auc,
      sampleCount: r.sample_count,
      weights: r.weights,
    })),
  });
}

export async function GET() { return runRetrain(); }
export async function POST() { return runRetrain(); }
