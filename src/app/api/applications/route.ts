import { NextRequest, NextResponse } from "next/server";
import {
  createApplication,
  listApplications,
  listApplicationsForCustomer,
  listApplicationsForLender,
} from "@/lib/applicationPipeline";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const gstin = req.nextUrl.searchParams.get("gstin");
  const lender = req.nextUrl.searchParams.get("lender");
  if (gstin) {
    const items = await listApplicationsForCustomer(gstin);
    return NextResponse.json({ items });
  }
  if (lender) {
    const items = await listApplicationsForLender(lender);
    return NextResponse.json({ items });
  }
  const items = await listApplications();
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.gstin || !body?.msmeName || !body?.requestedAmount) {
    return NextResponse.json({ error: "gstin, msmeName, requestedAmount required" }, { status: 400 });
  }
  const app = await createApplication(body);
  return NextResponse.json({ ok: true, application: app });
}
