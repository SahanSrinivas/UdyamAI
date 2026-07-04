import { NextRequest, NextResponse } from "next/server";
import { getProfile } from "@/lib/mockData";
import { computeHealthCard } from "@/lib/scoreEngine";
import { explainScore, Language } from "@/lib/gemini";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const gstin = req.nextUrl.searchParams.get("gstin");
  const lang = (req.nextUrl.searchParams.get("lang") as Language) || "en";

  const profile = getProfile(gstin);
  const card = computeHealthCard(profile);
  const explanation = await explainScore(card, lang);

  return NextResponse.json({ ...card, explanation });
}
