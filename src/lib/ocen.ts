/**
 * OCEN 4.0 (Open Credit Enablement Network) — Loan Agent (LA) ↔ Lender flow.
 * Endpoint shapes mirror iSPIRT's published protocol.
 * We simulate the full loan lifecycle deterministically for the demo.
 */

export type LoanPurpose = "working_capital" | "term_loan" | "invoice_finance";

export type SearchRequest = {
  txnId: string;
  timestamp: string;
  gstin: string;
  purpose: LoanPurpose;
  amount: number;
  tenorMonths: number;
  cashflowRefs: { fipId: string; consentHandle: string }[];
  gstRefs: { returnPeriod: string; hash: string }[];
};

export type OfferResponse = {
  txnId: string;
  timestamp: string;
  lender: string;
  offerId: string;
  productCode: string;
  sanctionedAmount: number;
  ratePct: number;
  tenorMonths: number;
  processingFeePct: number;
  validForHours: number;
  terms: string[];
};

export type AcceptRequest = {
  txnId: string;
  timestamp: string;
  offerId: string;
  eSignRef: string;
  eMandateRef: string;
};

export type StatusResponse = {
  txnId: string;
  timestamp: string;
  status: "sanctioned" | "under_review" | "rejected";
  disbursalRef: string;
  disbursalWindowHours: number;
};

export type OcenStep =
  | { name: "search"; direction: "la->lender"; endpoint: string; payload: SearchRequest }
  | { name: "offer"; direction: "lender->la"; endpoint: string; payload: OfferResponse }
  | { name: "accept"; direction: "la->lender"; endpoint: string; payload: AcceptRequest }
  | { name: "status"; direction: "lender->la"; endpoint: string; payload: StatusResponse };

const LENDER_BASE: Record<string, string> = {
  "IDBI Bank": "https://ocen.idbi.example/v4",
  SBI: "https://ocen.sbi.example/v4",
  "HDFC Bank": "https://ocen.hdfc.example/v4",
};

const PRODUCT_CODE: Record<string, string> = {
  "IDBI Bank": "IDBI-MSME-WC-24",
  SBI: "SBI-SMART-OD-11",
  "HDFC Bank": "HDFC-BGL-48",
};

function txn(): string {
  const raw = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  return `UAI-${raw.toUpperCase().slice(0, 14)}`;
}

function iso(offsetMs = 0): string {
  return new Date(Date.now() + offsetMs).toISOString();
}

export function buildOcenFlow(input: {
  gstin: string;
  lender: string;
  sanctionAmount: number;
  ratePct: number;
  tenorMonths: number;
}): OcenStep[] {
  const t = txn();
  const base = LENDER_BASE[input.lender] ?? "https://ocen.lender.example/v4";
  const offerId = `OFR-${t.slice(-6)}`;

  const search: SearchRequest = {
    txnId: t,
    timestamp: iso(0),
    gstin: input.gstin,
    purpose: "working_capital",
    amount: input.sanctionAmount,
    tenorMonths: input.tenorMonths,
    cashflowRefs: [
      { fipId: "IDFC-FIRST-FIP", consentHandle: "CH-3F9A1E" },
      { fipId: "GSTN-FIP", consentHandle: "CH-8B22C0" },
    ],
    gstRefs: [
      { returnPeriod: "2026-05", hash: "sha256:9c1e...b3f" },
      { returnPeriod: "2026-06", hash: "sha256:e774...09a" },
    ],
  };

  const offer: OfferResponse = {
    txnId: t,
    timestamp: iso(420),
    lender: input.lender,
    offerId,
    productCode: PRODUCT_CODE[input.lender] ?? "GENERIC-01",
    sanctionedAmount: input.sanctionAmount,
    ratePct: input.ratePct,
    tenorMonths: input.tenorMonths,
    processingFeePct: 0.5,
    validForHours: 72,
    terms: [
      "Prepayment permitted after 6 months (0.5% fee)",
      "Auto-debit via e-NACH mandatory",
      "Post-disbursement AA consent to be maintained",
    ],
  };

  const accept: AcceptRequest = {
    txnId: t,
    timestamp: iso(1100),
    offerId,
    eSignRef: "ESI-C-" + Math.random().toString(36).slice(2, 9).toUpperCase(),
    eMandateRef: "NACH-" + Math.random().toString(36).slice(2, 9).toUpperCase(),
  };

  const status: StatusResponse = {
    txnId: t,
    timestamp: iso(1900),
    status: "sanctioned",
    disbursalRef: "DIS-" + Math.random().toString(36).slice(2, 9).toUpperCase(),
    disbursalWindowHours: 24,
  };

  return [
    { name: "search", direction: "la->lender", endpoint: `${base}/loan/search`, payload: search },
    { name: "offer", direction: "lender->la", endpoint: `${base}/loan/offer`, payload: offer },
    { name: "accept", direction: "la->lender", endpoint: `${base}/loan/accept`, payload: accept },
    { name: "status", direction: "lender->la", endpoint: `${base}/loan/status`, payload: status },
  ];
}
