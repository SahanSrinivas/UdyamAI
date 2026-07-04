/**
 * Live application pipeline — file-backed JSON storage.
 * Customer submits → lender sees.
 *
 * Production: replace with Postgres + Kafka topic per lender. Same shape.
 */

import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), ".data");
const PIPELINE_FILE = path.join(DATA_DIR, "pipeline.json");

export type LoanPurpose = "working_capital" | "term_loan" | "invoice_finance" | "equipment";

export type DocumentBundle = {
  gstinVerified: boolean;
  aaConsent: boolean;
  bankStatement12mo: boolean;
  gstr3bLast6Months: boolean;
  gstr1LastMonth: boolean;
  epfoLinked: boolean;
  itrUploaded: boolean;
};

export type LenderDecision = {
  lender: string;
  status: "pending" | "approved" | "rejected";
  confidence: number;
  ratePct: number;
  sanctionAmount: number;
  reason?: string;
  decidedAt?: string;
  decidedBy?: string;
};

export type LiveApplication = {
  applicationId: string;
  gstin: string;
  msmeName: string;
  city: string;
  sector: string;

  requestedAmount: number;
  purpose: LoanPurpose;
  tenorMonths: number;

  scoreAtSubmit: number;
  subScores: { revenue: number; compliance: number; counterparty: number; growth: number };

  documents: DocumentBundle;
  submittedTo: string[];
  submittedAt: string;
  status: "submitted" | "under_review" | "approved" | "rejected";

  decisions: LenderDecision[];
};

async function ensureFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(PIPELINE_FILE);
  } catch {
    await fs.writeFile(PIPELINE_FILE, "[]", "utf-8");
  }
}

async function readAll(): Promise<LiveApplication[]> {
  await ensureFile();
  const raw = await fs.readFile(PIPELINE_FILE, "utf-8");
  try {
    return JSON.parse(raw) as LiveApplication[];
  } catch {
    return [];
  }
}

async function writeAll(items: LiveApplication[]) {
  await ensureFile();
  await fs.writeFile(PIPELINE_FILE, JSON.stringify(items, null, 2), "utf-8");
}

function generateId(): string {
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `APP-${t}-${r}`;
}

export async function createApplication(input: Omit<LiveApplication, "applicationId" | "submittedAt" | "status" | "decisions">): Promise<LiveApplication> {
  const all = await readAll();
  const now = new Date().toISOString();
  const app: LiveApplication = {
    ...input,
    applicationId: generateId(),
    submittedAt: now,
    status: "submitted",
    decisions: input.submittedTo.map((lender) => ({
      lender,
      status: "pending",
      confidence: 0,
      ratePct: 0,
      sanctionAmount: 0,
    })),
  };
  all.unshift(app);
  await writeAll(all.slice(0, 500)); // cap
  return app;
}

export async function listApplications(): Promise<LiveApplication[]> {
  return readAll();
}

export async function listApplicationsForLender(lender: string): Promise<LiveApplication[]> {
  const all = await readAll();
  return all.filter((a) => a.submittedTo.includes(lender));
}

export async function listApplicationsForCustomer(gstin: string): Promise<LiveApplication[]> {
  const all = await readAll();
  return all.filter((a) => a.gstin === gstin);
}

export async function getApplication(id: string): Promise<LiveApplication | null> {
  const all = await readAll();
  return all.find((a) => a.applicationId === id) ?? null;
}

export async function decideOnApplication(
  applicationId: string,
  lender: string,
  decision: "approved" | "rejected",
  meta: { reason?: string; decidedBy?: string; confidence: number; ratePct: number; sanctionAmount: number }
): Promise<LiveApplication | null> {
  const all = await readAll();
  const app = all.find((a) => a.applicationId === applicationId);
  if (!app) return null;
  const d = app.decisions.find((x) => x.lender === lender);
  if (!d) return null;
  d.status = decision;
  d.reason = meta.reason;
  d.decidedBy = meta.decidedBy;
  d.confidence = meta.confidence;
  d.ratePct = meta.ratePct;
  d.sanctionAmount = meta.sanctionAmount;
  d.decidedAt = new Date().toISOString();

  // Roll up app status
  const anyApproved = app.decisions.some((x) => x.status === "approved");
  const allDone = app.decisions.every((x) => x.status !== "pending");
  if (anyApproved) app.status = "approved";
  else if (allDone) app.status = "rejected";
  else app.status = "under_review";

  await writeAll(all);
  return app;
}
