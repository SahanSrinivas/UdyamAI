const CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const CHARSET_LEN = CHARSET.length;

export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export const STATE_CODES: Record<string, string> = {
  "01": "Jammu & Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "25": "Daman & Diu",
  "26": "Dadra & Nagar Haveli",
  "27": "Maharashtra",
  "28": "Andhra Pradesh (Old)",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman & Nicobar",
  "36": "Telangana",
  "37": "Andhra Pradesh",
  "38": "Ladakh",
};

function computeChecksum(first14: string): string {
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const factor = i % 2 === 0 ? 1 : 2;
    const value = CHARSET.indexOf(first14[i]);
    if (value === -1) return "";
    const product = value * factor;
    sum += Math.floor(product / CHARSET_LEN) + (product % CHARSET_LEN);
  }
  const remainder = sum % CHARSET_LEN;
  const checkCode = (CHARSET_LEN - remainder) % CHARSET_LEN;
  return CHARSET[checkCode];
}

export type GstinValidation =
  | { ok: true; gstin: string; state: string; pan: string }
  | { ok: false; reason: string };

export function validateGstin(input: string): GstinValidation {
  const gstin = input.trim().toUpperCase();
  if (gstin.length === 0) return { ok: false, reason: "Enter a 15-character GSTIN" };
  if (gstin.length !== 15) return { ok: false, reason: `GSTIN must be 15 characters (got ${gstin.length})` };
  if (!GSTIN_REGEX.test(gstin)) return { ok: false, reason: "Format looks off — check state code and PAN block" };

  const stateCode = gstin.slice(0, 2);
  const state = STATE_CODES[stateCode];
  if (!state) return { ok: false, reason: `Unknown state code "${stateCode}"` };

  const expected = computeChecksum(gstin.slice(0, 14));
  if (expected !== gstin[14]) {
    return { ok: false, reason: "Checksum mismatch — this GSTIN is not valid" };
  }

  return { ok: true, gstin, state, pan: gstin.slice(2, 12) };
}

function hash32(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededRand(seed: number) {
  let state = seed || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

const SECTORS = [
  "Textile Wholesale",
  "Auto Components",
  "Precision Machining",
  "Agri Processing",
  "Building Materials",
  "Chemical Trading",
  "Electronics Assembly",
  "Food Processing",
];

const CITIES_BY_STATE: Record<string, string[]> = {
  "24": ["Surat, Gujarat", "Ahmedabad, Gujarat", "Rajkot, Gujarat"],
  "27": ["Pune, Maharashtra", "Nashik, Maharashtra", "Aurangabad, Maharashtra"],
  "29": ["Bengaluru, Karnataka", "Hubli, Karnataka", "Mysuru, Karnataka"],
  "33": ["Coimbatore, Tamil Nadu", "Madurai, Tamil Nadu", "Tiruppur, Tamil Nadu"],
  "36": ["Hyderabad, Telangana", "Warangal, Telangana"],
  "37": ["Visakhapatnam, Andhra Pradesh", "Vijayawada, Andhra Pradesh"],
  "09": ["Kanpur, Uttar Pradesh", "Noida, Uttar Pradesh", "Agra, Uttar Pradesh"],
};

export function generateSyntheticProfile(gstin: string) {
  const seed = hash32(gstin);
  const rand = seededRand(seed);

  const stateCode = gstin.slice(0, 2);
  const cityOptions = CITIES_BY_STATE[stateCode] ?? ["Metro City, India"];
  const city = cityOptions[Math.floor(rand() * cityOptions.length)];

  const vintageYears = 2 + Math.floor(rand() * 8);
  const sector = SECTORS[Math.floor(rand() * SECTORS.length)];
  const baseRev = 300000 + Math.floor(rand() * 1500000);
  const growth = 0.02 + rand() * 0.05;
  const noise = 0.08 + rand() * 0.14;
  const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
    const base = baseRev * Math.pow(1 + growth, i);
    const variance = 1 + (rand() - 0.5) * noise * 2;
    return Math.round(base * variance);
  });

  const topBuyerRevenueShare = 0.22 + rand() * 0.55;
  const gstFiledLate = Math.floor(rand() * 8);
  const gstFilingLagDays = gstFiledLate > 0 ? Math.floor(rand() * 15) : 0;
  const bounceCount90d = rand() > 0.72 ? Math.floor(rand() * 3) + 1 : 0;

  const upiInflow = monthlyRevenue.map((r) => Math.round(r * (0.55 + rand() * 0.15)));
  const upiOutflow = upiInflow.map((r) => Math.round(r * (0.88 + rand() * 0.08)));

  const tokenTail = gstin.slice(-4);
  return {
    gstin,
    legalName: `${sector.split(" ")[0]} Enterprise ${tokenTail}`,
    tradeName: `${sector.split(" ")[0]}${tokenTail.slice(0, 2)}`,
    city,
    sector,
    vintageYears,
    monthlyRevenue,
    gstFiledOnTime: 24 - gstFiledLate,
    gstFiledLate,
    gstFilingLagDays,
    topBuyerRevenueShare,
    buyerCount: 6 + Math.floor(rand() * 50),
    supplierCount: 4 + Math.floor(rand() * 20),
    currentAccountBalanceAvg: Math.round(baseRev * (0.2 + rand() * 0.6)),
    bounceCount90d,
    upiInflowMonthly: upiInflow,
    upiOutflowMonthly: upiOutflow,
    epfoActive: rand() > 0.3,
    epfoContributionMonthly: Math.round(baseRev * 0.03),
    existingLoanEmi: Math.round(baseRev * (0.04 + rand() * 0.05)),
    cibil: rand() > 0.5 ? 620 + Math.floor(rand() * 160) : null,
  };
}
