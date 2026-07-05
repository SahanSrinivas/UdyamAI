import { NextResponse } from "next/server";
import { extractTrainingRows, trainLR, persistTrainingRun } from "@/lib/agami/lrRetrain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Retrain LR calibrator on real Postgres data.
 * GET · POST both work — one-shot job, no auth for demo.
 */
async function runRetrain() {
  const started = Date.now();
  const samples = await extractTrainingRows();
  if (samples.length === 0) {
    return NextResponse.json({
      status: "no data · agami_transactions is empty",
      elapsedMs: Date.now() - started,
    }, { status: 200 });
  }

  const lenders: Array<"IDBI Bank" | "SBI" | "HDFC Bank"> = ["IDBI Bank", "SBI", "HDFC Bank"];
  const results = [];
  for (const lender of lenders) {
    const run = trainLR(lender, samples);
    await persistTrainingRun(lender, run.weights, run.accuracy, run.auc,
                              run.sampleCount, run.epochsRun);
    results.push({
      lender,
      accuracy: run.accuracy,
      auc: run.auc,
      sampleCount: run.sampleCount,
      weights: run.weights,
    });
  }

  return NextResponse.json({
    status: "ok",
    elapsedMs: Date.now() - started,
    samples: samples.length,
    runs: results,
  });
}

export async function GET() { return runRetrain(); }
export async function POST() { return runRetrain(); }
