import type { MSMEProfile } from "./mockData";
import { hash32, seededRand } from "./gstin";

// Public-footprint dossier the AI agent assembles for a lender. In
// production each source is a crawler / API behind the agent; for the demo
// the report is synthesised deterministically from the GSTIN so the same
// MSME always tells the same story, and its tone tracks the credit profile
// (bounces and buyer concentration surface as negative chatter).

export type Sentiment = "positive" | "neutral" | "negative";

export type OsintItem = {
  text: string;
  meta: string;
  sentiment: Sentiment;
};

export type OsintSource = {
  key: string;
  label: string;
  handle: string;
  scanning: string;
  metrics: { label: string; value: string }[];
  items: OsintItem[];
};

export type OsintReport = {
  reputationScore: number; // 0-100
  sentiment: Record<Sentiment, number>; // percentages, sum 100
  itemsScanned: number;
  sources: OsintSource[];
  greenFlags: string[];
  redFlags: string[];
  summary: string;
};

const fmt = (n: number) =>
  n >= 100000 ? `${(n / 100000).toFixed(1)}L` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`;

export function buildOsintReport(p: MSMEProfile): OsintReport {
  const rand = seededRand(hash32(`osint:${p.gstin}`));
  const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)];
  const between = (lo: number, hi: number) => Math.round(lo + rand() * (hi - lo));

  const town = p.city.split(",")[0];
  const handle = p.tradeName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const stressed = p.bounceCount90d > 0;
  const concentrated = p.topBuyerRevenueShare > 0.5;
  const growing = p.monthlyRevenue.slice(-3).reduce((a, b) => a + b, 0) > p.monthlyRevenue.slice(0, 3).reduce((a, b) => a + b, 0);
  const scale = Math.max(1, Math.round(p.monthlyRevenue.slice(-1)[0] / 100000));

  const followers = between(800, 4000) * Math.min(6, scale);
  const rating = Math.min(4.9, Math.max(3.1, 4.6 - (stressed ? 0.6 : 0) - rand() * 0.4));
  const reviews = between(40, 320);

  const instagram: OsintSource = {
    key: "instagram",
    label: "Instagram",
    handle: `@${handle}`,
    scanning: "Reading posts, reels and comment threads",
    metrics: [
      { label: "Followers", value: fmt(followers) },
      { label: "Posts / month", value: `${between(4, 22)}` },
      { label: "Engagement", value: `${(1.5 + rand() * 4).toFixed(1)}%` },
    ],
    items: [
      { text: `New ${p.sector.toLowerCase()} range launched — dispatching pan-India from ${town}.`, meta: `${between(2, 9)} days ago · ${between(120, 900)} likes`, sentiment: "positive" },
      { text: "Behind the scenes at our unit — team of " + between(12, 60) + " working double shifts this season.", meta: `${between(2, 5)} weeks ago · ${between(80, 600)} likes`, sentiment: "positive" },
      stressed
        ? { text: "Comment: \"Still waiting on my order from last month, no reply on DM.\"", meta: "Customer comment · 3 weeks ago", sentiment: "negative" }
        : { text: "Comment: \"Third order this year, quality consistent as always.\"", meta: "Customer comment · 1 week ago", sentiment: "positive" },
    ],
  };

  const twitter: OsintSource = {
    key: "twitter",
    label: "X / Twitter",
    handle: `@${handle}_in`,
    scanning: "Searching mentions, replies and hashtags",
    metrics: [
      { label: "Mentions (90d)", value: `${between(15, 140)}` },
      { label: "Followers", value: fmt(Math.round(followers / 4)) },
      { label: "Complaint rate", value: `${stressed ? between(8, 18) : between(1, 5)}%` },
    ],
    items: [
      { text: `Shout-out from a ${town} buyer collective for on-time delivery during festive rush.`, meta: "Mention · 1 month ago", sentiment: "positive" },
      concentrated
        ? { text: `Thread speculating on ${p.topBuyers[0]?.name ?? "their anchor buyer"} renegotiating vendor terms across the cluster.`, meta: "Industry thread · 2 weeks ago", sentiment: "negative" }
        : { text: `Tagged in a ${p.sector.toLowerCase()} cluster post on export-ready MSMEs.`, meta: "Mention · 3 weeks ago", sentiment: "neutral" },
    ],
  };

  const linkedin: OsintSource = {
    key: "linkedin",
    label: "LinkedIn",
    handle: p.legalName,
    scanning: "Mapping promoters, headcount and hiring",
    metrics: [
      { label: "Employees listed", value: `${between(8, 70)}` },
      { label: "Open roles", value: `${growing ? between(2, 8) : between(0, 1)}` },
      { label: "Promoter tenure", value: `${p.vintageYears + between(2, 10)} yrs` },
    ],
    items: [
      growing
        ? { text: `Hiring for production supervisor and accounts executive in ${town}.`, meta: "Job post · 10 days ago", sentiment: "positive" }
        : { text: "No new hiring activity in the last 6 months.", meta: "Hiring signal", sentiment: "neutral" },
      { text: `Promoter previously ran a ${p.sector.toLowerCase()} trading firm — no adverse history found.`, meta: "Promoter background", sentiment: "positive" },
    ],
  };

  const google: OsintSource = {
    key: "reviews",
    label: "Google Business & JustDial",
    handle: `${p.tradeName}, ${town}`,
    scanning: "Aggregating ratings and review text",
    metrics: [
      { label: "Rating", value: `${rating.toFixed(1)} ★` },
      { label: "Reviews", value: `${reviews}` },
      { label: "Owner replies", value: `${between(40, 95)}%` },
    ],
    items: [
      { text: "\"Fair pricing, owner personally handles bulk orders.\"", meta: "5★ · 2 months ago", sentiment: "positive" },
      stressed
        ? { text: "\"Advance paid, delivery delayed twice. Got it finally but no communication.\"", meta: "2★ · 5 weeks ago", sentiment: "negative" }
        : { text: "\"Godown is organised, stock always available.\"", meta: "4★ · 3 weeks ago", sentiment: "positive" },
    ],
  };

  const news: OsintSource = {
    key: "news",
    label: "News articles",
    handle: `${between(3, 11)} articles indexed`,
    scanning: "Crawling regional and trade press",
    metrics: [
      { label: "Articles (24m)", value: `${between(3, 11)}` },
      { label: "Adverse media", value: stressed && concentrated ? "1" : "0" },
      { label: "Languages", value: pick(["EN · HI", "EN · Regional", "EN"]) },
    ],
    items: [
      { text: `${town} ${p.sector.toLowerCase()} cluster sees demand pick-up; ${p.tradeName} among units adding capacity.`, meta: "Regional business daily · 4 months ago", sentiment: growing ? "positive" : "neutral" },
      { text: `${p.tradeName} featured in state MSME department's list of GST-compliant units.`, meta: "Trade portal · 9 months ago", sentiment: "positive" },
      ...(stressed && concentrated
        ? [{ text: `Payment delays reported across ${p.sector.toLowerCase()} suppliers after anchor buyer slowdown.`, meta: "Sector news · 6 weeks ago", sentiment: "negative" as Sentiment }]
        : []),
    ],
  };

  const legal: OsintSource = {
    key: "legal",
    label: "MCA21 & eCourts",
    handle: "Registry + litigation search",
    scanning: "Checking ROC filings, charges and court cases",
    metrics: [
      { label: "Open charges", value: `${p.existingLoanEmi > 0 ? 1 : 0}` },
      { label: "Court cases", value: stressed && rand() > 0.5 ? "1 (civil)" : "0" },
      { label: "Director DIN status", value: "Active" },
    ],
    items: [
      { text: "No insolvency, NCLT or wilful-defaulter listing against firm or promoters.", meta: "Litigation screen", sentiment: "positive" },
      p.existingLoanEmi > 0
        ? { text: "One existing charge registered in favour of a scheduled bank (working capital).", meta: "ROC charge register", sentiment: "neutral" }
        : { text: "No charges registered against firm assets.", meta: "ROC charge register", sentiment: "positive" },
    ],
  };

  const sources = [instagram, twitter, linkedin, google, news, legal];
  const all = sources.flatMap((s) => s.items);
  const count = (s: Sentiment) => all.filter((i) => i.sentiment === s).length;
  const pos = Math.round((count("positive") / all.length) * 100);
  const neg = Math.round((count("negative") / all.length) * 100);

  const reputationScore = Math.max(
    35,
    Math.min(96, Math.round(55 + pos * 0.45 - neg * 0.9 + (rating - 4) * 10 + between(-3, 3)))
  );

  const greenFlags = [
    `Active digital presence across ${sources.length - 1} public channels`,
    `${rating.toFixed(1)}★ average across ${reviews} customer reviews`,
    "Clean litigation and wilful-defaulter screen",
    ...(growing ? ["Hiring activity consistent with revenue growth in GST data"] : []),
  ];
  const redFlags = [
    ...(stressed ? ["Delivery-delay complaints coincide with recent bounces in bank data"] : []),
    ...(concentrated ? ["Public chatter on anchor-buyer slowdown — matches concentration risk"] : []),
  ];

  const summary =
    `${p.tradeName} has a ${reputationScore >= 75 ? "strong" : reputationScore >= 60 ? "moderate" : "weak"} public footprint. ` +
    `Online activity is consistent with a ${p.vintageYears}-year-old ${p.sector.toLowerCase()} business in ${town}` +
    (growing ? ", and hiring plus product posts corroborate the revenue growth seen in GST filings. " : ". ") +
    (redFlags.length
      ? `Watch: ${redFlags.length} signal${redFlags.length > 1 ? "s" : ""} that echo stress already visible in the financial data — worth a question at the credit interview.`
      : "No adverse signals found that contradict the financial data.");

  return {
    reputationScore,
    sentiment: { positive: pos, negative: neg, neutral: 100 - pos - neg },
    itemsScanned: between(380, 1400),
    sources,
    greenFlags,
    redFlags,
    summary,
  };
}
