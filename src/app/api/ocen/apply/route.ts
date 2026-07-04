import { NextRequest, NextResponse } from "next/server";
import { buildOcenFlow } from "@/lib/ocen";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || !body.gstin || !body.lender) {
    return NextResponse.json({ error: "gstin and lender required" }, { status: 400 });
  }
  const flow = buildOcenFlow({
    gstin: body.gstin,
    lender: body.lender,
    sanctionAmount: Number(body.sanctionAmount) || 1500000,
    ratePct: Number(body.ratePct) || 13.5,
    tenorMonths: Number(body.tenorMonths) || 36,
  });
  return NextResponse.json({ flow });
}
