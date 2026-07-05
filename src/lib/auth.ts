/**
 * Prototype auth — cookie-based session with two demo roles.
 * Production: replace with JWT + OAuth 2.0 + Aadhaar eKYC via Digio.
 * The shape of the session mirrors what the real system will carry.
 */

export type UserRole = "customer" | "lender";

export type Session = {
  role: UserRole;
  id: string;
  displayName: string;
  gstin?: string; // customers only
  employeeId?: string; // lenders only
  bank?: string; // lenders only
  loginAt: string;
};

export const SESSION_COOKIE = "udyamai_session";
export const SESSION_TTL_HOURS = 8;

// Demo credential book — for Round 1 only.
// Production: Postgres + hashed passwords + Aadhaar OTP.
export const DEMO_CUSTOMERS = [
  { gstin: "24AABCS1234R1Z8", name: "Rajesh Patel · Shreeji Silks",
    legalName: "Orbit Tar Products Pvt Ltd", phone: "+91 98250 42391" },
  { gstin: "37AAECV5678K1ZL", name: "Anil Rao · VizagParts",
    legalName: "Zenith Exports (Firm)", phone: "+91 89430 11208" },
  { gstin: "33AAJPM9012L1ZK", name: "Muthu Ramaswamy · Muthu CNC",
    legalName: "Premier Exports Pvt Ltd", phone: "+91 98422 76103" },
  { gstin: "08AAECH2233N1ZH", name: "Anantha Devi · Anantha Weaves",
    legalName: "Nova Solutions (Firm)", phone: "+91 94140 55871" },
  { gstin: "09AAAPK4567P2Z3", name: "Faizal Ahmed · Kanpur Leather",
    legalName: "Prime Solutions (Firm)", phone: "+91 93365 22107" },
  { gstin: "33AAHFK7890Q1ZH", name: "Selvi & Kumar · Kirana Circle",
    legalName: "Riya Deshmukh (Proprietor)", phone: "+91 90031 74428" },
];

export const DEMO_LENDERS = [
  { employeeId: "IDBI-MSME-2847", password: "demo123", name: "Priya Sharma", bank: "IDBI Bank", desk: "MSME Lending Desk" },
  { employeeId: "SBI-SME-1024", password: "demo123", name: "Vikram Menon", bank: "State Bank of India", desk: "SME Underwriting" },
  { employeeId: "HDFC-BGL-8891", password: "demo123", name: "Neha Kulkarni", bank: "HDFC Bank", desk: "Business Growth Loans" },
];

export const DEMO_OTP = "123456";

export function findCustomer(gstin: string) {
  return DEMO_CUSTOMERS.find((c) => c.gstin.toUpperCase() === gstin.trim().toUpperCase()) || null;
}

export function findLender(employeeId: string, password: string) {
  const l = DEMO_LENDERS.find(
    (x) => x.employeeId.toUpperCase() === employeeId.trim().toUpperCase()
  );
  if (!l) return null;
  if (l.password !== password) return null;
  return l;
}

export function encodeSession(s: Session): string {
  return encodeURIComponent(JSON.stringify(s));
}

export function decodeSession(raw: string | undefined): Session | null {
  if (!raw) return null;
  try {
    const s = JSON.parse(decodeURIComponent(raw)) as Session;
    const t = new Date(s.loginAt).getTime();
    if (Date.now() - t > SESSION_TTL_HOURS * 3600 * 1000) return null;
    return s;
  } catch {
    return null;
  }
}
