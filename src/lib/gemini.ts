import { GoogleGenerativeAI } from "@google/generative-ai";
import type { HealthCard } from "./scoreEngine";

const API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
const GEMINI_TIMEOUT_MS = 2800;

export type Language = "en" | "hi" | "te";

const langLabel: Record<Language, string> = {
  en: "English",
  hi: "Hindi (Devanagari script)",
  te: "Telugu",
};

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race<T | null>([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

export async function explainScore(card: HealthCard, lang: Language = "en"): Promise<string> {
  if (!API_KEY) return offlineExplanation(card, lang);

  try {
    const bestLender = [...card.quotes].sort((a, b) => b.confidence - a.confidence)[0];
    const prompt = `You are a senior credit advisor at a bank writing a note to a small-business owner in ${langLabel[lang]}. Direct tone. No jargon. No preamble. Do not say "AI", "score card", "analysis". Speak to them, not about them. 3 short sentences maximum.

Sentence 1: State their score and the single biggest reason.
Sentence 2: State the one thing they should do this month, with the point gain.
Sentence 3: State the best lender and the confidence, framed as "Apply to X first — they'll likely say yes."

Facts:
- Business: ${card.profile.tradeName}, ${card.profile.city}
- Score: ${card.overall} / 1000 (${card.band})
- Biggest drag: ${card.topDrags[0]?.title ?? "none"} (costs ~${card.topDrags[0]?.impact ?? 0} points)
- Highest-impact action: ${card.topLifts[0]?.title ?? "keep filing on time"} (+${card.topLifts[0]?.impact ?? 0})
- Best lender: ${bestLender.lender} at ${Math.round(bestLender.confidence * 100)}% confidence

Return only the 3 sentences. No lists, no headers, no line breaks.`;

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await withTimeout(model.generateContent(prompt), GEMINI_TIMEOUT_MS);
    if (!result) return offlineExplanation(card, lang);
    return result.response.text().trim();
  } catch {
    return offlineExplanation(card, lang);
  }
}

function offlineExplanation(card: HealthCard, lang: Language): string {
  const bestLender = [...card.quotes].sort((a, b) => b.confidence - a.confidence)[0];
  if (lang === "hi") {
    return `${card.profile.tradeName} का स्कोर ${card.overall} है — मुख्य वजह: ${card.topDrags[0]?.title ?? "स्थिर रिकॉर्ड"}। इस महीने ${card.topLifts[0]?.title ?? "GST समय पर भरें"} — इससे स्कोर ${card.topLifts[0]?.impact ?? 20}+ अंक बढ़ेगा। ${bestLender.lender} की मंज़ूरी की सम्भावना ${Math.round(bestLender.confidence * 100)}% है — पहले वहाँ अप्लाई करें।`;
  }
  if (lang === "te") {
    return `${card.profile.tradeName} స్కోర్ ${card.overall} — ప్రధాన కారణం: ${card.topDrags[0]?.title ?? "స్థిర రికార్డ్"}. ఈ నెల ${card.topLifts[0]?.title ?? "GST సకాలంలో ఫైల్ చేయండి"} — స్కోర్ ${card.topLifts[0]?.impact ?? 20}+ పాయింట్లు పెరుగుతుంది. ${bestLender.lender} ఆమోదం అవకాశం ${Math.round(bestLender.confidence * 100)}% — ముందు అక్కడ దరఖాస్తు చేయండి.`;
  }
  return `${card.profile.tradeName} scores ${card.overall} — the single biggest drag is ${card.topDrags[0]?.title.toLowerCase() ?? "steady baseline"}. Focus this month on ${card.topLifts[0]?.title.toLowerCase() ?? "on-time GST filing"} — that alone lifts you ${card.topLifts[0]?.impact ?? 20}+ points. Apply to ${bestLender.lender} first — ${Math.round(bestLender.confidence * 100)}% chance of sanction based on your profile.`;
}
