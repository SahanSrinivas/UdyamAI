import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeSession, SESSION_COOKIE } from "@/lib/auth";

const CUSTOMER_ROUTES = ["/dashboard"];
const LENDER_ROUTES = ["/lender"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  const session = decodeSession(cookie);

  const needsCustomer = CUSTOMER_ROUTES.some((p) => pathname.startsWith(p));
  const needsLender = LENDER_ROUTES.some((p) => pathname.startsWith(p));

  if (!needsCustomer && !needsLender) return NextResponse.next();

  if (!session) {
    // Not signed in — route to the appropriate login page
    const url = req.nextUrl.clone();
    url.pathname = needsLender ? "/login/lender" : "/login/customer";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (needsCustomer && session.role !== "customer") {
    // Lender clicked "For MSMEs" → let them sign in with an MSME account
    const url = req.nextUrl.clone();
    url.pathname = "/login/customer";
    url.searchParams.set("mismatch", session.role);
    return NextResponse.redirect(url);
  }
  if (needsLender && session.role !== "lender") {
    // Customer clicked "For Lenders" → let them sign in with a lender account
    const url = req.nextUrl.clone();
    url.pathname = "/login/lender";
    url.searchParams.set("mismatch", session.role);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/lender/:path*"],
};
