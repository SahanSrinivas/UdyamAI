import type { MSMEProfile } from "./mockData";
import { hash32, seededRand } from "./gstin";

// Public-footprint dossier the AI agent assembles for a lender. In
// production each source is a crawler / API behind the agent; for the demo
// the report is synthesised deterministically from the GSTIN so the same
// MSME always tells the same story — a healthy, growing digital business.

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

export type SaasTool = {
  name: string;
  category: string;
  since: string;
  signal: string;
};

export type OsintReport = {
  reputationScore: number; // 0-100
  sentiment: Record<Sentiment, number>; // percentages, sum 100
  itemsScanned: number;
  sources: OsintSource[];
  presence: {
    followers: number[]; // 12 months, all channels
    growthPct: number;
    rating: number;
    reviews: number;
  };
  saas: {
    adoptionScore: number; // 0-100
    percentile: number;
    tools: SaasTool[];
    spendTrend: number[]; // 6 quarters, ₹k / month
  };
  employment: {
    headcount: number[]; // 12 months, EPFO members
    growthPct: number;
    openRoles: number;
    newHires90d: number;
  };
  greenFlags: string[];
  redFlags: string[];
  summary: string;
  logs: string[];
};

const fmt = (n: number) =>
  n >= 100000 ? `${(n / 100000).toFixed(1)}L` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`;

const MONTHS = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];

export function buildOsintReport(p: MSMEProfile): OsintReport {
  const rand = seededRand(hash32(`osint:${p.gstin}`));
  const between = (lo: number, hi: number) => Math.round(lo + rand() * (hi - lo));
  const rising = (start: number, monthly: number, n: number) => {
    const out = [start];
    for (let i = 1; i < n; i++) out.push(Math.round(out[i - 1] * (1 + monthly * (0.6 + rand() * 0.8))));
    return out;
  };

  const town = p.city.split(",")[0];
  const sector = p.sector.toLowerCase();
  const handle = p.tradeName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const scale = Math.max(1, Math.round(p.monthlyRevenue.slice(-1)[0] / 100000));

  // ── Trends ──
  const followers = rising(between(900, 2500) * Math.min(5, scale), 0.06 + rand() * 0.03, 12);
  const followerGrowth = Math.round((followers[11] / followers[0] - 1) * 100);
  const headcount = rising(between(9, 28), 0.025 + rand() * 0.02, 12);
  const headGrowth = Math.round((headcount[11] / headcount[0] - 1) * 100);
  const openRoles = between(3, 9);
  const spendTrend = rising(between(6, 14), 0.12 + rand() * 0.06, 6);
  const rating = 4.4 + rand() * 0.5;
  const reviews = between(140, 520);
  const engagement = (3.5 + rand() * 3).toFixed(1);
  const lastFollowers = followers[11];

  const tools: SaasTool[] = [
    { name: "Tally Prime", category: "Accounting", since: `${2024 - Math.min(p.vintageYears, 4)}`, signal: "Books reconcile with GSTR-3B" },
    { name: "Zoho Inventory", category: "Inventory & ERP", since: "2023", signal: "SKU-level stock tracking" },
    { name: "GST e-Invoicing (IRP)", category: "Compliance", since: "2023", signal: `${between(180, 900)} IRNs generated / month` },
    { name: "Razorpay Payment Links", category: "Collections", since: "2024", signal: "Digital collections up month on month" },
    { name: "WhatsApp Business API", category: "Customer engagement", since: "2024", signal: `${between(1, 4)}.${between(1, 9)}k buyer chats / month` },
    { name: "IndiaMART Leader", category: "B2B marketplace", since: "2025", signal: `${between(40, 160)} verified leads / month` },
    { name: "Google Workspace", category: "Productivity", since: "2024", signal: `${headcount[11]} active seats` },
  ];

  // ── Sources ──
  const sources: OsintSource[] = [
    {
      key: "instagram",
      label: "Instagram",
      handle: `@${handle}`,
      scanning: "Reading posts, reels and comment threads",
      metrics: [
        { label: "Followers", value: fmt(lastFollowers) },
        { label: "Posts / month", value: `${between(12, 26)}` },
        { label: "Engagement", value: `${engagement}%` },
      ],
      items: [
        { text: `New ${sector} range launched — dispatching pan-India from ${town}.`, meta: `${between(2, 9)} days ago · ${between(400, 1800)} likes`, sentiment: "positive" },
        { text: `Behind the scenes: team of ${headcount[11]} running double shifts to meet festive demand.`, meta: `${between(2, 5)} weeks ago · ${between(300, 1200)} likes`, sentiment: "positive" },
        { text: "Comment: \"Third order this year, quality consistent as always.\"", meta: "Customer comment · 1 week ago", sentiment: "positive" },
      ],
    },
    {
      key: "twitter",
      label: "X / Twitter",
      handle: `@${handle}_in`,
      scanning: "Searching mentions, replies and hashtags",
      metrics: [
        { label: "Mentions (90d)", value: `${between(60, 220)}` },
        { label: "Followers", value: fmt(Math.round(lastFollowers / 3)) },
        { label: "Complaint rate", value: `${(0.4 + rand()).toFixed(1)}%` },
      ],
      items: [
        { text: `Shout-out from a ${town} buyer collective for on-time delivery during the festive rush.`, meta: "Mention · 1 month ago", sentiment: "positive" },
        { text: `Featured in a ${sector} cluster thread on export-ready MSMEs.`, meta: "Industry thread · 3 weeks ago", sentiment: "positive" },
      ],
    },
    {
      key: "linkedin",
      label: "LinkedIn",
      handle: p.legalName,
      scanning: "Mapping promoters, headcount and hiring",
      metrics: [
        { label: "Employees", value: `${headcount[11]}` },
        { label: "Open roles", value: `${openRoles}` },
        { label: "Headcount YoY", value: `+${headGrowth}%` },
      ],
      items: [
        { text: `Hiring production supervisor, sales executive and accounts lead in ${town}.`, meta: "Job posts · this month", sentiment: "positive" },
        { text: `Promoter has ${p.vintageYears + between(4, 12)} years in ${sector}; no adverse history found.`, meta: "Promoter background", sentiment: "positive" },
      ],
    },
    {
      key: "reviews",
      label: "Google Business & JustDial",
      handle: `${p.tradeName}, ${town}`,
      scanning: "Aggregating ratings and review text",
      metrics: [
        { label: "Rating", value: `${rating.toFixed(1)} ★` },
        { label: "Reviews", value: `${reviews}` },
        { label: "Owner replies", value: `${between(82, 98)}%` },
      ],
      items: [
        { text: "\"Fair pricing, owner personally handles bulk orders.\"", meta: "5★ · 2 months ago", sentiment: "positive" },
        { text: "\"Godown is organised, stock always available, GST bill on the spot.\"", meta: "5★ · 3 weeks ago", sentiment: "positive" },
      ],
    },
    {
      key: "news",
      label: "News articles",
      handle: `${between(6, 14)} articles indexed`,
      scanning: "Crawling regional and trade press",
      metrics: [
        { label: "Articles (24m)", value: `${between(6, 14)}` },
        { label: "Adverse media", value: "0" },
        { label: "Languages", value: "EN · Regional" },
      ],
      items: [
        { text: `${town} ${sector} cluster sees demand pick-up; ${p.tradeName} among units adding capacity.`, meta: "Regional business daily · 4 months ago", sentiment: "positive" },
        { text: `${p.tradeName} listed in state MSME department's roll of GST-compliant units.`, meta: "Trade portal · 9 months ago", sentiment: "positive" },
        { text: `Sector outlook: ${sector} orders expected to grow through FY27.`, meta: "Trade journal · 2 months ago", sentiment: "neutral" },
      ],
    },
    {
      key: "legal",
      label: "MCA21 & eCourts",
      handle: "Registry + litigation search",
      scanning: "Checking ROC filings, charges and court cases",
      metrics: [
        { label: "Court cases", value: "0" },
        { label: "Wilful defaulter", value: "No" },
        { label: "Director DIN", value: "Active" },
      ],
      items: [
        { text: "No insolvency, NCLT or wilful-defaulter listing against firm or promoters.", meta: "Litigation screen", sentiment: "positive" },
        { text: "Annual ROC filings up to date for the last 3 financial years.", meta: "MCA21 filing history", sentiment: "positive" },
      ],
    },
  ];

  const all = sources.flatMap((s) => s.items);
  const pos = Math.round((all.filter((i) => i.sentiment === "positive").length / all.length) * 100);
  const neg = 0;
  const itemsScanned = between(1800, 3600);
  const adoptionScore = between(78, 92);
  const percentile = between(82, 95);
  const reputationScore = between(84, 93);

  const logs = [
    `agent.init  model=udyam-osint-v3  target=${p.gstin}`,
    `resolve     legal_name="${p.legalName}"  city=${town}`,
    `spawn       6 crawler agents · 3 enrichment workers`,
    `instagram   @${handle} → ${between(180, 420)} posts · ${between(2, 6)}k comments`,
    `twitter     ${between(60, 220)} mentions · ${between(10, 40)} threads`,
    `linkedin    ${headcount[11]} employees · ${openRoles} open roles · promoter graph built`,
    `reviews     ${reviews} reviews across Google Business, JustDial`,
    `news        ${between(40, 90)} articles crawled · ${between(6, 14)} entity matches`,
    `mca21       CIN verified · charges register parsed`,
    `ecourts     0 cases across district + high courts`,
    `saas        fingerprinting stack → ${tools.length} tools detected`,
    `epfo        ECR trail ${MONTHS[0]}→${MONTHS[11]} · headcount +${headGrowth}%`,
    `nlp         indic-sentiment on ${itemsScanned.toLocaleString("en-IN")} items · 3 languages`,
    `crosscheck  public signals ↔ GST + AA data · 0 contradictions`,
    `synthesise  writing credit-officer brief…`,
  ];

  const greenFlags = [
    `Digital reach up ${followerGrowth}% in 12 months across ${sources.length - 1} channels`,
    `Headcount grew ${headcount[0]} → ${headcount[11]} (+${headGrowth}%), corroborated by EPFO`,
    `${tools.length} business SaaS tools in use — top ${100 - percentile}% of ${sector} peers`,
    `${rating.toFixed(1)}★ average across ${reviews} customer reviews`,
    "Clean litigation, NCLT and wilful-defaulter screen",
  ];

  const summary =
    `${p.tradeName} has a strong, growing public footprint. Social reach is up ${followerGrowth}% year on year with ${engagement}% engagement, ` +
    `and the team has expanded from ${headcount[0]} to ${headcount[11]} people with ${openRoles} roles open now. ` +
    `The business runs on a modern stack — accounting, e-invoicing, digital collections and a B2B storefront — which matches the clean GST and bank data. ` +
    `No adverse media, litigation or defaulter listings found. Public signals support the credit case.`;

  return {
    reputationScore,
    sentiment: { positive: pos, negative: neg, neutral: 100 - pos - neg },
    itemsScanned,
    sources,
    presence: { followers, growthPct: followerGrowth, rating, reviews },
    saas: { adoptionScore, percentile, tools, spendTrend },
    employment: { headcount, growthPct: headGrowth, openRoles, newHires90d: headcount[11] - headcount[8] },
    greenFlags,
    redFlags: [],
    summary,
    logs,
  };
}

export const OSINT_MONTHS = MONTHS;
