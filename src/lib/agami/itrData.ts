/**
 * ITR data loader · reads the bundled AgamiAI Indian-Income-Tax-Returns corpus.
 *
 * Previously this hit Postgres and fell back to six hand-written sample rows
 * when DATABASE_URL was unset. The real filings are now committed under
 * src/data/agami/itr.json, so there is nothing to fall back to and nothing to
 * fabricate — the six demo GSTINs carry a `linkedGstin` stamped onto genuine
 * records at fixture-build time (see scripts/build_agami_fixtures.mjs).
 *
 * A GSTIN with no linked filing returns null and the dashboard simply omits
 * the ITR chip, which is the honest answer: we have not seen that taxpayer.
 */

import { getDataset, type ItrFiling } from "./dataset";

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

const MONTHS: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};

/** The corpus writes filing dates as "04-Sep-2023"; the UI wants ISO. */
function toIsoDate(raw: string | null): string | null {
  if (!raw) return null;
  const m = raw.match(/^(\d{2})-([A-Za-z]{3})-(\d{4})$/);
  if (!m) return raw.slice(0, 10);
  const month = MONTHS[m[2].toLowerCase()];
  return month ? `${m[3]}-${month}-${m[1]}` : raw;
}

function toRecord(f: ItrFiling): ItrRecord {
  return {
    pan: f.pan,
    name: f.name,
    entityType: f.entityType ?? "",
    form: f.form ?? "",
    assessmentYear: f.assessmentYear ?? "",
    filingDate: toIsoDate(f.filingDate),
    lateFiling: f.lateFiling,
    income: f.income,
    tax: f.tax,
    cess: f.cess,
    interest: f.interest,
    totalPayable: f.totalPayable,
  };
}

/** Get the ITR filing linked to a GSTIN, or null when none is linked. */
export async function getItrForGstin(gstin: string): Promise<ItrRecord | null> {
  const filing = getDataset().filingsByGstin.get(gstin.trim().toUpperCase());
  return filing ? toRecord(filing) : null;
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
