/**
 * Bank statement description parser · mirrors scripts/ingest_agami.py
 *
 * Sample inputs:
 *   "NEFT Cr-784950453790-ICIC0SF0002-CONSTRUCTION SOLUTIONS LTD--"
 *   "NEFT Dr-471179370408-HDFC0009038-RIDDHI RAVAL"
 *   "UPI/CR/23485834923/PhonePe/user@ybl"
 *   "IMPS/P2A/CR/HDFC/1234"
 *   "CHEQUE PAID"
 *   "INTEREST CREDIT"
 */

export type TxnType =
  | "NEFT" | "RTGS" | "UPI" | "IMPS"
  | "CHEQUE" | "INTEREST" | "CHARGE" | "CASH" | "OTHER";

export type ParsedTxn = {
  type: TxnType;
  direction: "in" | "out" | "unknown";
  counterparty: string | null;
  ifsc: string | null;
  refNumber: string | null;
};

const NEFT = /NEFT\s+(Cr|Dr)-?([A-Z0-9]+)?-?([A-Z0-9]+)?-?(.*?)(?:--|$)/i;
const RTGS = /RTGS\s+(Cr|Dr)-?([A-Z0-9]+)?-?([A-Z0-9]+)?-?(.*?)(?:--|$)/i;
const UPI = /UPI[/-](CR|DR)[/-](\d+)?[/-]?([^/]+)?[/-]?(.+)?/i;
const IMPS = /IMPS[/-]([^/]+)[/-]?(CR|DR)[/-]?([^/]+)?[/-]?(.+)?/i;
const CHEQUE = /CHEQUE\s+(PAID|CLEARED|RETURNED|BOUNCED)/i;
const INTEREST = /INTEREST\s+(CR|DR|CREDIT|CHARGE)/i;

function cleanName(s: string | null | undefined): string | null {
  if (!s) return null;
  const t = s.trim().replace(/[-:]+$/, "").trim();
  if (t.length < 2) return null;
  return t.slice(0, 120);
}

export function parseDescription(desc: string, credit = 0, debit = 0): ParsedTxn {
  const d = (desc || "").trim();
  const direction: ParsedTxn["direction"] =
    credit > 0 ? "in" : debit > 0 ? "out" : "unknown";

  let m = d.match(NEFT);
  if (m) {
    return { type: "NEFT",
      direction: m[1].toUpperCase() === "CR" ? "in" : "out",
      refNumber: m[2] ?? null, ifsc: m[3] ?? null,
      counterparty: cleanName(m[4]) };
  }
  m = d.match(RTGS);
  if (m) {
    return { type: "RTGS",
      direction: m[1].toUpperCase() === "CR" ? "in" : "out",
      refNumber: m[2] ?? null, ifsc: m[3] ?? null,
      counterparty: cleanName(m[4]) };
  }
  m = d.match(UPI);
  if (m) {
    return { type: "UPI",
      direction: m[1].toUpperCase() === "CR" ? "in" : "out",
      refNumber: m[2] ?? null, ifsc: null,
      counterparty: cleanName(m[3] || m[4]) };
  }
  m = d.match(IMPS);
  if (m) {
    return { type: "IMPS",
      direction: m[2]?.toUpperCase() === "CR" ? "in" : "out",
      refNumber: null, ifsc: null,
      counterparty: cleanName(m[4] || m[1]) };
  }
  if (CHEQUE.test(d)) {
    return { type: "CHEQUE", direction, counterparty: null, ifsc: null, refNumber: null };
  }
  if (INTEREST.test(d)) {
    return { type: "INTEREST", direction, counterparty: null, ifsc: null, refNumber: null };
  }
  if (/CHARGE|GST/i.test(d)) {
    return { type: "CHARGE", direction: "out", counterparty: null, ifsc: null, refNumber: null };
  }
  return { type: "OTHER", direction, counterparty: null, ifsc: null, refNumber: null };
}

/** Aggregate parsed transactions into counterparty-level rollups. */
export function rollUpCounterparties(txns: Array<{
  parsed: ParsedTxn;
  credit: number;
  debit: number;
}>) {
  const map = new Map<string, { name: string; inflow: number; outflow: number; count: number }>();
  for (const t of txns) {
    const name = t.parsed.counterparty;
    if (!name) continue;
    const cur = map.get(name) ?? { name, inflow: 0, outflow: 0, count: 0 };
    cur.inflow += t.credit;
    cur.outflow += t.debit;
    cur.count += 1;
    map.set(name, cur);
  }
  return Array.from(map.values()).sort((a, b) => b.inflow - a.inflow);
}
