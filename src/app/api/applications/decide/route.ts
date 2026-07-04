import { NextRequest, NextResponse } from "next/server";
import { decideOnApplication } from "@/lib/applicationPipeline";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.applicationId || !body?.lender || !body?.decision) {
    return NextResponse.json({ error: "applicationId, lender, decision required" }, { status: 400 });
  }
  const updated = await decideOnApplication(body.applicationId, body.lender, body.decision, {
    reason: body.reason,
    decidedBy: body.decidedBy,
    confidence: Number(body.confidence) || 0,
    ratePct: Number(body.ratePct) || 0,
    sanctionAmount: Number(body.sanctionAmount) || 0,
  });
  if (!updated) return NextResponse.json({ error: "application not found" }, { status: 404 });
  return NextResponse.json({ ok: true, application: updated });
}
