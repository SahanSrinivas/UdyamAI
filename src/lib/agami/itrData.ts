/**
 * ITR data loader — reads from Postgres if DATABASE_URL is set,
 * otherwise falls back to a small in-memory sample so the demo works
 * without a database.
 *
 * Once you provision AWS RDS and run:
 *     python3 scripts/ingest_agami.py --dataset itr
 * the full 200-record dataset is available. In production you'd link
 * ITR records to GSTINs via PAN matching.
 */

import { query } from "./db";

export type ItrRecord = {
  pan: string;
  name: string;
  entityType: string;         // Individual · Firm · Company
  form: string;               // ITR-4 · ITR-5 · ITR-6
  assessmentYear: string;
  filingDate: string | null;
  lateFiling: boolean;
  income: number;             // ₹
  tax: number;
  cess: number;
  interest: number;
  totalPayable: number;
};

// Sample subset baked into the app — deterministic mapping from GSTIN to ITR
// so demo profiles always show a matching record.
const SAMPLE_ITR: Record<string, ItrRecord> = {
  "24AABCS1234R1Z8": {
    pan: "AABCS1234R", name: "Shreeji Silks Pvt Ltd", entityType: "Company",
    form: "ITR-6", assessmentYear: "2024-25", filingDate: "2024-08-14",
    lateFiling: false, income: 14200000, tax: 3550000, cess: 142000,
    interest: 0, totalPayable: 3692000,
  },
  "37AAECV5678K1ZL": {
    pan: "AAECV5678K", name: "Vizag Auto Parts", entityType: "Firm",
    form: "ITR-5", assessmentYear: "2024-25", filingDate: "2024-09-28",
    lateFiling: true, income: 7100000, tax: 1420000, cess: 56800,
    interest: 42000, totalPayable: 1518800,
  },
  "33AAJPM9012L1ZK": {
    pan: "AAJPM9012L", name: "Muthu Machine Tools", entityType: "Company",
    form: "ITR-6", assessmentYear: "2024-25", filingDate: "2024-07-30",
    lateFiling: false, income: 21500000, tax: 5375000, cess: 215000,
    interest: 0, totalPayable: 5590000,
  },
  "08AAECH2233N1ZH": {
    // NTC — recent registration, first filing
    pan: "AAECH2233N", name: "Anantha Weaves", entityType: "Firm",
    form: "ITR-5", assessmentYear: "2024-25", filingDate: "2024-08-05",
    lateFiling: false, income: 3800000, tax: 760000, cess: 30400,
    interest: 0, totalPayable: 790400,
  },
  "09AAAPK4567P2Z3": {
    pan: "AAAPK4567P", name: "Kanpur Leather Co", entityType: "Firm",
    form: "ITR-5", assessmentYear: "2024-25", filingDate: "2024-08-31",
    lateFiling: false, income: 8600000, tax: 1720000, cess: 68800,
    interest: 0, totalPayable: 1788800,
  },
  "33AAHFK7890Q1ZH": {
    // Thin file · lower reported income (kirana)
    pan: "AAHFK7890Q", name: "Chennai Kirana Circle", entityType: "Individual",
    form: "ITR-4", assessmentYear: "2024-25", filingDate: "2024-09-15",
    lateFiling: false, income: 2100000, tax: 315000, cess: 12600,
    interest: 0, totalPayable: 327600,
  },
};

/** Get ITR for a GSTIN via linked_gstin in DB, else fall back to sample. */
export async function getItrForGstin(gstin: string): Promise<ItrRecord | null> {
  // Try DB first
  try {
    const rows = await query<{
      pan: string; name: string; entity_type: string; form: string;
      assessment_year: string; filing_date: Date | null; late_filing: boolean;
      income: string; tax: string; cess: string; interest: string; total_payable: string;
    }>(
      `SELECT pan, name, entity_type, form, assessment_year, filing_date,
              late_filing, income, tax, cess, interest, total_payable
         FROM agami_itr
        WHERE linked_gstin = $1
        ORDER BY assessment_year DESC
        LIMIT 1`,
      [gstin]
    );
    if (rows.length > 0) {
      const r = rows[0];
      return {
        pan: r.pan, name: r.name, entityType: r.entity_type, form: r.form,
        assessmentYear: r.assessment_year,
        filingDate: r.filing_date ? r.filing_date.toISOString().slice(0, 10) : null,
        lateFiling: r.late_filing,
        income: Number(r.income), tax: Number(r.tax), cess: Number(r.cess),
        interest: Number(r.interest), totalPayable: Number(r.total_payable),
      };
    }
  } catch (err) {
    // DB not reachable or table missing — silent fallback
  }
  // Sample fallback
  return SAMPLE_ITR[gstin] ?? null;
}

/** How much of a positive score signal does this ITR contribute? */
export function itrSignalImpact(itr: ItrRecord): {
  impact: string;
  status: "positive" | "warning" | "neutral";
} {
  if (itr.lateFiling) {
    return {
      impact: `Late-filed AY ${itr.assessmentYear} · Compliance -8 pts`,
      status: "warning",
    };
  }
  const inrCr = itr.income / 10000000;
  if (inrCr >= 2) {
    return { impact: `+15 pts on Revenue Stability · verified ₹${inrCr.toFixed(2)} Cr`, status: "positive" };
  }
  if (inrCr >= 0.5) {
    return { impact: `+8 pts on Compliance · consistent filer`, status: "positive" };
  }
  return { impact: `+4 pts · first-time filer verified`, status: "neutral" };
}
