export type ProfileType = "MATURE" | "NTC" | "NTB" | "THIN_FILE";

export type ScoreEvent = {
  label: string;
  delta: number;
  when: string; // human-readable relative
};

export type MSMEProfile = {
  gstin: string;
  legalName: string;
  tradeName: string;
  city: string;
  sector: string;
  vintageYears: number;

  monthlyRevenue: number[];
  gstFiledOnTime: number;
  gstFiledLate: number;
  gstFilingLagDays: number;

  topBuyerRevenueShare: number;
  buyerCount: number;
  supplierCount: number;

  currentAccountBalanceAvg: number;
  bounceCount90d: number;
  upiInflowMonthly: number[];
  upiOutflowMonthly: number[];

  epfoActive: boolean;
  epfoContributionMonthly: number;

  existingLoanEmi: number;
  cibil: number | null;

  // NTC / NTB / thin-file signalling
  profileType: ProfileType;
  hasBureau: boolean;
  bankRelationshipMonths: number;

  // near-real-time proof
  scoreHistory: number[]; // 12 monthly scores
  lastRefreshedIso: string;
  lastEvent: ScoreEvent;

  // UPI counterparty graph
  topBuyers: { name: string; revenueShare: number }[];

  // sector cohort
  sectorCohortPercentile: number; // 0-100 where this MSME sits
};

export const MSME_PROFILES: Record<string, MSMEProfile> = {
  "24AABCS1234R1Z8": {
    gstin: "24AABCS1234R1Z8",
    legalName: "Shreeji Textile Traders",
    tradeName: "Shreeji Silks",
    city: "Surat, Gujarat",
    sector: "Textile Wholesale",
    vintageYears: 4,
    monthlyRevenue: [820000, 780000, 910000, 1050000, 980000, 1120000, 1180000, 1240000, 1160000, 1290000, 1320000, 1410000],
    gstFiledOnTime: 20,
    gstFiledLate: 4,
    gstFilingLagDays: 6,
    topBuyerRevenueShare: 0.42,
    buyerCount: 38,
    supplierCount: 12,
    currentAccountBalanceAvg: 340000,
    bounceCount90d: 1,
    upiInflowMonthly: [640000, 610000, 720000, 830000, 780000, 890000, 940000, 990000, 920000, 1030000, 1050000, 1120000],
    upiOutflowMonthly: [590000, 570000, 660000, 760000, 720000, 810000, 850000, 890000, 850000, 940000, 950000, 1010000],
    epfoActive: true,
    epfoContributionMonthly: 24000,
    existingLoanEmi: 42000,
    cibil: null,
    profileType: "MATURE",
    hasBureau: false,
    bankRelationshipMonths: 48,
    scoreHistory: [612, 628, 641, 655, 664, 678, 691, 702, 715, 728, 735, 748],
    lastRefreshedIso: hoursAgo(2),
    lastEvent: { label: "GSTR-3B filed on time", delta: 14, when: "2 hours ago" },
    topBuyers: [
      { name: "Reliance Retail", revenueShare: 0.42 },
      { name: "Aditya Birla Fashion", revenueShare: 0.18 },
      { name: "Trends by Reliance", revenueShare: 0.12 },
      { name: "Fabindia", revenueShare: 0.09 },
      { name: "Local wholesale (12)", revenueShare: 0.19 },
    ],
    sectorCohortPercentile: 68,
  },
  "37AAECV5678K1ZL": {
    gstin: "37AAECV5678K1ZL",
    legalName: "Vizag Auto Parts Pvt Ltd",
    tradeName: "VizagParts",
    city: "Visakhapatnam, Andhra Pradesh",
    sector: "Auto Components",
    vintageYears: 3,
    monthlyRevenue: [430000, 460000, 510000, 490000, 580000, 620000, 590000, 640000, 680000, 720000, 690000, 760000],
    gstFiledOnTime: 18,
    gstFiledLate: 6,
    gstFilingLagDays: 11,
    topBuyerRevenueShare: 0.78,
    buyerCount: 8,
    supplierCount: 6,
    currentAccountBalanceAvg: 118000,
    bounceCount90d: 3,
    upiInflowMonthly: [310000, 340000, 380000, 360000, 430000, 460000, 440000, 480000, 510000, 540000, 520000, 580000],
    upiOutflowMonthly: [290000, 320000, 350000, 340000, 410000, 430000, 420000, 460000, 490000, 510000, 500000, 550000],
    epfoActive: true,
    epfoContributionMonthly: 18000,
    existingLoanEmi: 28000,
    cibil: 682,
    profileType: "MATURE",
    hasBureau: true,
    bankRelationshipMonths: 36,
    scoreHistory: [610, 598, 585, 570, 562, 555, 548, 541, 535, 530, 526, 521],
    lastRefreshedIso: hoursAgo(4),
    lastEvent: { label: "3rd NACH bounce in 90d", delta: -25, when: "4 hours ago" },
    topBuyers: [
      { name: "Bharat Auto Assembly", revenueShare: 0.78 },
      { name: "Local dealer 1", revenueShare: 0.08 },
      { name: "Local dealer 2", revenueShare: 0.06 },
      { name: "Retail (4)", revenueShare: 0.08 },
    ],
    sectorCohortPercentile: 24,
  },
  "33AAJPM9012L1ZK": {
    gstin: "33AAJPM9012L1ZK",
    legalName: "Muthu Machine Tools",
    tradeName: "Muthu CNC",
    city: "Coimbatore, Tamil Nadu",
    sector: "Precision Machining",
    vintageYears: 5,
    monthlyRevenue: [1420000, 1380000, 1510000, 1620000, 1580000, 1690000, 1740000, 1810000, 1770000, 1880000, 1920000, 2010000],
    gstFiledOnTime: 24,
    gstFiledLate: 0,
    gstFilingLagDays: 0,
    topBuyerRevenueShare: 0.31,
    buyerCount: 62,
    supplierCount: 18,
    currentAccountBalanceAvg: 620000,
    bounceCount90d: 0,
    upiInflowMonthly: [980000, 940000, 1050000, 1130000, 1090000, 1180000, 1210000, 1260000, 1230000, 1310000, 1340000, 1400000],
    upiOutflowMonthly: [880000, 850000, 950000, 1020000, 990000, 1070000, 1090000, 1140000, 1120000, 1180000, 1210000, 1260000],
    epfoActive: true,
    epfoContributionMonthly: 46000,
    existingLoanEmi: 68000,
    cibil: 741,
    profileType: "MATURE",
    hasBureau: true,
    bankRelationshipMonths: 60,
    scoreHistory: [795, 802, 810, 818, 823, 829, 834, 838, 842, 845, 846, 847],
    lastRefreshedIso: hoursAgo(1),
    lastEvent: { label: "Zero-bounce cycle · Q4 closed", delta: 8, when: "1 hour ago" },
    topBuyers: [
      { name: "Tata AutoComp Systems", revenueShare: 0.31 },
      { name: "Bosch India", revenueShare: 0.18 },
      { name: "Sundaram Fasteners", revenueShare: 0.14 },
      { name: "Ashok Leyland Vendors", revenueShare: 0.11 },
      { name: "Rest (58 buyers)", revenueShare: 0.26 },
    ],
    sectorCohortPercentile: 91,
  },

  // ────────────────────────────────────────────────────────────
  // NTC / NTB / THIN-FILE cohort — the credit-invisible 14M
  // ────────────────────────────────────────────────────────────

  "08AAECH2233N1ZH": {
    gstin: "08AAECH2233N1ZH",
    legalName: "Anantha Handloom Traders",
    tradeName: "Anantha Weaves",
    city: "Jaipur, Rajasthan",
    sector: "Handloom & Textiles",
    vintageYears: 2,
    // Only 18 months of GST activity - short but consistent
    monthlyRevenue: [180000, 195000, 210000, 225000, 240000, 265000, 285000, 310000, 335000, 360000, 385000, 415000],
    gstFiledOnTime: 18,
    gstFiledLate: 0,
    gstFilingLagDays: 0,
    topBuyerRevenueShare: 0.36,
    buyerCount: 14,
    supplierCount: 8,
    currentAccountBalanceAvg: 78000,
    bounceCount90d: 0,
    upiInflowMonthly: [140000, 152000, 164000, 176000, 188000, 208000, 224000, 244000, 264000, 284000, 304000, 328000],
    upiOutflowMonthly: [130000, 141000, 152000, 163000, 174000, 192000, 208000, 226000, 244000, 262000, 280000, 302000],
    epfoActive: false,
    epfoContributionMonthly: 0,
    existingLoanEmi: 0,
    cibil: null,
    profileType: "NTC",
    hasBureau: false,
    bankRelationshipMonths: 18,
    scoreHistory: [485, 502, 518, 534, 549, 563, 578, 592, 607, 619, 630, 641],
    lastRefreshedIso: hoursAgo(3),
    lastEvent: { label: "GSTR-3B filed on time (13th cycle)", delta: 12, when: "3 hours ago" },
    topBuyers: [
      { name: "Fabindia Jaipur", revenueShare: 0.36 },
      { name: "Anokhi Prints", revenueShare: 0.22 },
      { name: "Cottage Emporium", revenueShare: 0.14 },
      { name: "Local buyers (11)", revenueShare: 0.28 },
    ],
    sectorCohortPercentile: 45,
  },

  "09AAAPK4567P2Z3": {
    gstin: "09AAAPK4567P2Z3",
    legalName: "Kanpur Leather Co",
    tradeName: "Kanpur Leather",
    city: "Kanpur, Uttar Pradesh",
    sector: "Leather Goods",
    vintageYears: 3,
    monthlyRevenue: [520000, 540000, 580000, 610000, 640000, 675000, 700000, 725000, 750000, 780000, 810000, 845000],
    gstFiledOnTime: 22,
    gstFiledLate: 2,
    gstFilingLagDays: 3,
    topBuyerRevenueShare: 0.29,
    buyerCount: 26,
    supplierCount: 11,
    currentAccountBalanceAvg: 210000,
    bounceCount90d: 0,
    upiInflowMonthly: [380000, 395000, 425000, 445000, 470000, 495000, 515000, 535000, 555000, 575000, 600000, 625000],
    upiOutflowMonthly: [350000, 365000, 390000, 410000, 435000, 455000, 470000, 490000, 510000, 530000, 550000, 575000],
    epfoActive: true,
    epfoContributionMonthly: 18000,
    existingLoanEmi: 0,
    cibil: null,
    profileType: "NTB",
    hasBureau: false,
    bankRelationshipMonths: 4,
    scoreHistory: [598, 610, 621, 632, 642, 651, 659, 667, 673, 680, 685, 691],
    lastRefreshedIso: hoursAgo(5),
    lastEvent: { label: "New AA consent linked (SBI CA)", delta: 6, when: "5 hours ago" },
    topBuyers: [
      { name: "Woodland Retail", revenueShare: 0.29 },
      { name: "Metro Shoes", revenueShare: 0.21 },
      { name: "Bata Vendors", revenueShare: 0.16 },
      { name: "Khadi Bhandar", revenueShare: 0.10 },
      { name: "Others (22)", revenueShare: 0.24 },
    ],
    sectorCohortPercentile: 58,
  },

  "33AAHFK7890Q1ZH": {
    gstin: "33AAHFK7890Q1ZH",
    legalName: "Chennai Kirana Circle",
    tradeName: "Kirana Circle",
    city: "Chennai, Tamil Nadu",
    sector: "Micro Retail (Kirana)",
    vintageYears: 2,
    monthlyRevenue: [95000, 108000, 118000, 128000, 135000, 148000, 158000, 172000, 185000, 198000, 212000, 228000],
    gstFiledOnTime: 8,
    gstFiledLate: 4,
    gstFilingLagDays: 5,
    topBuyerRevenueShare: 0.06, // super-diversified: retail customers
    buyerCount: 380, // UPI transaction counterparties
    supplierCount: 6,
    currentAccountBalanceAvg: 44000,
    bounceCount90d: 0,
    upiInflowMonthly: [88000, 100000, 110000, 120000, 127000, 139000, 149000, 162000, 175000, 188000, 202000, 218000],
    upiOutflowMonthly: [82000, 92000, 101000, 110000, 118000, 129000, 138000, 150000, 162000, 175000, 187000, 202000],
    epfoActive: false,
    epfoContributionMonthly: 0,
    existingLoanEmi: 0,
    cibil: null,
    profileType: "THIN_FILE",
    hasBureau: false,
    bankRelationshipMonths: 8,
    scoreHistory: [455, 468, 480, 491, 502, 514, 525, 537, 548, 559, 570, 582],
    lastRefreshedIso: hoursAgo(1),
    lastEvent: { label: "94% UPI-based revenue verified", delta: 11, when: "1 hour ago" },
    topBuyers: [
      { name: "380 retail via UPI", revenueShare: 0.94 },
      { name: "Zoho lunch tie-up", revenueShare: 0.06 },
    ],
    sectorCohortPercentile: 52,
  },
};

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 3600 * 1000).toISOString();
}

export const DEFAULT_GSTIN = "24AABCS1234R1Z8";

export function getProfile(gstin: string | undefined | null): MSMEProfile {
  if (gstin && MSME_PROFILES[gstin]) return MSME_PROFILES[gstin];
  return MSME_PROFILES[DEFAULT_GSTIN];
}

export function listProfiles(): MSMEProfile[] {
  return Object.values(MSME_PROFILES);
}

export const PROFILE_TYPE_LABEL: Record<ProfileType, string> = {
  MATURE: "Established",
  NTC: "NTC · No credit history",
  NTB: "NTB · New to bank",
  THIN_FILE: "Thin file · UPI-heavy",
};
