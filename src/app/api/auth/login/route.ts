import { NextRequest, NextResponse } from "next/server";
import {
  DEMO_OTP,
  SESSION_COOKIE,
  SESSION_TTL_HOURS,
  encodeSession,
  findCustomer,
  findLender,
  type Session,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.role) return NextResponse.json({ error: "role required" }, { status: 400 });

  let session: Session | null = null;

  if (body.role === "customer") {
    const cust = findCustomer(body.gstin || "");
    if (!cust) return NextResponse.json({ error: "GSTIN not registered · use a demo GSTIN" }, { status: 401 });
    if (body.otp !== DEMO_OTP) {
      return NextResponse.json({ error: `Invalid OTP · demo OTP is ${DEMO_OTP}` }, { status: 401 });
    }
    session = {
      role: "customer",
      id: cust.gstin,
      displayName: cust.name,
      gstin: cust.gstin,
      loginAt: new Date().toISOString(),
    };
  } else if (body.role === "lender") {
    const lender = findLender(body.employeeId || "", body.password || "");
    if (!lender) return NextResponse.json({ error: "Invalid employee ID or password" }, { status: 401 });
    session = {
      role: "lender",
      id: lender.employeeId,
      displayName: lender.name,
      employeeId: lender.employeeId,
      bank: lender.bank,
      loginAt: new Date().toISOString(),
    };
  } else {
    return NextResponse.json({ error: "unknown role" }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true, session });
  res.cookies.set(SESSION_COOKIE, encodeSession(session), {
    httpOnly: false, // demo — production should be httpOnly + secure
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_HOURS * 3600,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
