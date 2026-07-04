/**
 * Sector-adaptive alternative signals.
 *
 * Bank credit evaluation has traditionally relied on GST + bank statements +
 * financials — signals every MSME can produce, but that miss the ways different
 * verticals actually operate. A manufacturing MSME's electricity draw verifies
 * real production. A food MSME's FSSAI license is more predictive than filings.
 *
 * This module defines a signal matrix per MSME sector. The dashboard picks the
 * appropriate set based on the profile's sector — textile MSMEs see
 * TReDS + Handloom Mark, food MSMEs see FSSAI + cold-chain, etc.
 *
 * In production these come from the real APIs listed in the `source` field.
 */

export type SignalStatus = "positive" | "neutral" | "warning";
export type SignalCategory = "usage" | "compliance" | "presence" | "trade";

export type AlternativeSignal = {
  key: string;
  label: string;
  category: SignalCategory;
  source: string;
  value: string;
  status: SignalStatus;
  impact: string;
};

const SECTOR_SIGNALS: Record<string, AlternativeSignal[]> = {
  "Textile Wholesale": [
    { key: "electricity", label: "Electricity consumption", category: "usage",
      source: "GUVNL DISCOM API", value: "1,847 kWh/mo · steady 6mo",
      status: "positive", impact: "+18 pts on Growth" },
    { key: "treds", label: "TReDS participation", category: "trade",
      source: "RXIL · M1xchange", value: "Active · 34 invoices discounted",
      status: "positive", impact: "+12 pts on Counterparty" },
    { key: "waterbill", label: "Water bill · dyeing unit", category: "usage",
      source: "Surat Municipal", value: "₹8,400/mo · consistent",
      status: "positive", impact: "Verified physical operations" },
    { key: "digital", label: "Digital presence", category: "presence",
      source: "IndiaMART + Google Business", value: "4.2★ · 128 reviews · verified seller",
      status: "positive", impact: "+8 pts on Growth" },
  ],
  "Auto Components": [
    { key: "electricity", label: "Industrial power draw", category: "usage",
      source: "AP Southern Power DISCOM", value: "3,240 kWh/mo · 22% YoY",
      status: "positive", impact: "+14 pts on Growth" },
    { key: "oem-ties", label: "OEM vendor tie-ups", category: "trade",
      source: "Public disclosures + GSTN", value: "Bharat Auto Assembly (Tier-1)",
      status: "warning", impact: "Concentration flag · 1 buyer" },
    { key: "iso", label: "ISO/TS 16949 certification", category: "compliance",
      source: "TÜV / BSI", value: "Active · valid till 2027",
      status: "positive", impact: "+10 pts on Compliance" },
    { key: "eway", label: "E-way bill volume", category: "trade",
      source: "GST Network", value: "1,203 e-way bills / month",
      status: "positive", impact: "Physical shipping verified" },
  ],
  "Precision Machining": [
    { key: "electricity", label: "Industrial power draw", category: "usage",
      source: "TANGEDCO API", value: "5,120 kWh/mo · steady",
      status: "positive", impact: "+22 pts on Growth" },
    { key: "imports", label: "Machinery import records", category: "trade",
      source: "ICEGATE (Customs)", value: "€480k Yamazaki CNC · 2024",
      status: "positive", impact: "+15 pts · verified capex" },
    { key: "factory-act", label: "Factory Act compliance", category: "compliance",
      source: "TN Labour Dept", value: "Active · 48 registered workers",
      status: "positive", impact: "+8 pts on Compliance" },
    { key: "iso", label: "ISO 9001:2015 certification", category: "compliance",
      source: "BSI India", value: "Active · until 2026",
      status: "positive", impact: "+8 pts on Compliance" },
  ],
  "Handloom & Textiles": [
    { key: "electricity", label: "Electricity · light industry", category: "usage",
      source: "JVVNL API", value: "620 kWh/mo · low but consistent",
      status: "neutral", impact: "Operations verified" },
    { key: "handloom", label: "Handloom Mark certification", category: "compliance",
      source: "Ministry of Textiles", value: "Active · Category-1 unit",
      status: "positive", impact: "+12 pts · scheme eligibility" },
    { key: "fpo", label: "SFAC / Weavers Cooperative", category: "presence",
      source: "SFAC portal", value: "Member · Jaipur Weavers Cluster",
      status: "positive", impact: "+8 pts on Counterparty" },
    { key: "gi", label: "Geographical Indication (GI)", category: "compliance",
      source: "GI Registry", value: "Blue Pottery Jaipur · registered",
      status: "positive", impact: "Premium pricing eligibility" },
  ],
  "Leather Goods": [
    { key: "electricity", label: "Electricity consumption", category: "usage",
      source: "UPPCL API", value: "1,240 kWh/mo · rising 8% YoY",
      status: "positive", impact: "+10 pts on Growth" },
    { key: "cetp", label: "Common Effluent Treatment (CETP)", category: "compliance",
      source: "UP Pollution Control Board", value: "Enrolled · Kanpur Leather Zone",
      status: "positive", impact: "+8 pts on environmental compliance" },
    { key: "exports", label: "DGFT export authorization", category: "trade",
      source: "DGFT · IEC portal", value: "IEC active · 3 shipments YTD",
      status: "positive", impact: "Export-house benefits" },
    { key: "coldstor", label: "Skin storage capacity", category: "usage",
      source: "State inspection records", value: "18 tonnes cold storage",
      status: "positive", impact: "Verified scale of operations" },
  ],
  "Micro Retail (Kirana)": [
    { key: "pos", label: "POS transaction velocity", category: "usage",
      source: "Pine Labs · Mswipe · Paytm", value: "₹1.8L/day · 380 txns avg",
      status: "positive", impact: "+14 pts on Revenue Stability" },
    { key: "ondc", label: "ONDC seller registration", category: "presence",
      source: "ONDC network", value: "Active seller · 4-star rating",
      status: "positive", impact: "+8 pts on Digital presence" },
    { key: "fssai", label: "FSSAI license", category: "compliance",
      source: "FSSAI portal", value: "Active state license · SSAI-33002",
      status: "positive", impact: "Food-safety compliance verified" },
    { key: "digital", label: "Google Business presence", category: "presence",
      source: "Google + WhatsApp Business", value: "3.8★ rating · 340 reviews",
      status: "positive", impact: "+6 pts · verified live business" },
  ],
  "Agri Processing": [
    { key: "electricity", label: "Cold-storage power", category: "usage",
      source: "State DISCOM API", value: "2,150 kWh/mo · seasonal peaks",
      status: "positive", impact: "+12 pts · scale verified" },
    { key: "satellite", label: "Satellite crop imagery", category: "trade",
      source: "SatSure / Cropin (via ULI)", value: "1,240 acres tracked · sowing verified",
      status: "positive", impact: "+15 pts · farmer network" },
    { key: "fpo", label: "FPO membership", category: "presence",
      source: "SFAC portal", value: "Member · 340-farmer collective",
      status: "positive", impact: "+10 pts on Counterparty diversification" },
    { key: "apeda", label: "APEDA export registration", category: "trade",
      source: "APEDA portal", value: "Registered exporter · basmati grade-A",
      status: "positive", impact: "Export-house benefits" },
  ],
  "Food Processing": [
    { key: "fssai", label: "FSSAI Central License", category: "compliance",
      source: "FSSAI portal", value: "Active · turnover > ₹20 Cr license",
      status: "positive", impact: "+12 pts on Compliance" },
    { key: "coldchain", label: "Cold-chain records", category: "usage",
      source: "State food safety dept", value: "Verified · 2 refrigerated trucks",
      status: "positive", impact: "+10 pts · verified logistics" },
    { key: "haccp", label: "HACCP certification", category: "compliance",
      source: "BSI / TÜV India", value: "Active · valid till 2027",
      status: "positive", impact: "+8 pts on food safety" },
    { key: "electricity", label: "Processing plant power", category: "usage",
      source: "State DISCOM API", value: "4,820 kWh/mo · steady",
      status: "positive", impact: "+15 pts on Growth" },
  ],
  "Chemical Trading": [
    { key: "cpcb", label: "CPCB pollution compliance", category: "compliance",
      source: "Central Pollution Control Board", value: "Consent-to-Operate active",
      status: "positive", impact: "+10 pts · environmental compliance" },
    { key: "dg-license", label: "Dangerous Goods (DG) license", category: "compliance",
      source: "State Fire Dept", value: "Active · Class-B storage",
      status: "positive", impact: "Regulatory compliance verified" },
    { key: "storage", label: "Storage capacity", category: "usage",
      source: "State inspection records", value: "12,000 L segregated storage",
      status: "positive", impact: "+8 pts · scale verified" },
    { key: "insurance", label: "Product liability insurance", category: "compliance",
      source: "IRDAI / insurer disclosures", value: "₹5 Cr cover · Active",
      status: "positive", impact: "+6 pts · risk mitigation" },
  ],
  "Construction": [
    { key: "rera", label: "RERA registration", category: "compliance",
      source: "State RERA portal", value: "Registered · 3 active projects",
      status: "positive", impact: "+15 pts on Compliance" },
    { key: "materials", label: "Cement + steel purchase", category: "trade",
      source: "GSTN HSN analysis", value: "₹18 L/mo materials · rising",
      status: "positive", impact: "+10 pts · verified pipeline" },
    { key: "labour", label: "Labour Cess payments", category: "compliance",
      source: "Building & Other Construction Workers Welfare Board", value: "Active · timely",
      status: "positive", impact: "+8 pts · welfare compliance" },
    { key: "eway", label: "E-way bill volume", category: "trade",
      source: "GST Network", value: "540 e-way bills/mo",
      status: "positive", impact: "Verified project activity" },
  ],
};

const DEFAULT_SIGNALS: AlternativeSignal[] = [
  { key: "electricity", label: "Power consumption", category: "usage",
    source: "State DISCOM API", value: "Data available on Aadhaar-tagged connection",
    status: "neutral", impact: "Sector-agnostic base signal" },
  { key: "digital", label: "Digital presence", category: "presence",
    source: "Google Business + LinkedIn", value: "Verified live business",
    status: "positive", impact: "+5 pts on Growth" },
  { key: "eway", label: "E-way bill volume", category: "trade",
    source: "GST Network", value: "Available",
    status: "positive", impact: "Physical activity verified" },
  { key: "epfo", label: "EPFO contributions", category: "compliance",
    source: "EPFO India", value: "Active",
    status: "positive", impact: "Payroll verified" },
];

export function getSectorSignals(sector: string): AlternativeSignal[] {
  return SECTOR_SIGNALS[sector] ?? DEFAULT_SIGNALS;
}

export function isSectorMapped(sector: string): boolean {
  return sector in SECTOR_SIGNALS;
}

export const SUPPORTED_SECTORS = Object.keys(SECTOR_SIGNALS);
