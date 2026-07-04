"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, ArrowLeft, ArrowRight, Building2, Loader2, ShieldCheck } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { Wordmark } from "@/components/Logo";
import { DEMO_LENDERS } from "@/lib/auth";

const MAROON = "#78141e";

export default function LenderLogin() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-cream-fade" />}>
      <LenderLoginInner />
    </Suspense>
  );
}

function LenderLoginInner() {
  const search = useSearchParams();
  const mismatch = search.get("mismatch");
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit() {
    setError(null);
    setPending(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role: "lender", employeeId, password }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Sign-in failed");
      setPending(false);
      return;
    }
    window.location.assign("/lender");
  }

  return (
    <main className="min-h-screen bg-cream-fade">
      <TopNav />

      <section className="mx-auto flex max-w-2xl flex-col items-stretch px-6 py-12">
        <Link href="/login" className="mb-6 inline-flex w-fit items-center gap-1.5 text-[13px] text-black/60 hover:text-black">
          <ArrowLeft className="h-3.5 w-3.5" /> Back · choose role
        </Link>

        {mismatch === "customer" && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-400/40 bg-amber-100/70 p-4 text-[13px] text-amber-900">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <div className="font-semibold">You&rsquo;re currently signed in as an MSME.</div>
              <div className="mt-0.5 text-amber-900/80">
                To view the lender dashboard, sign in below with a bank employee ID. This will replace your current session.
              </div>
            </div>
          </div>
        )}

        <div className="rounded-3xl border border-black/10 bg-white/90 p-8 shadow-cream-card">
          <div className="flex items-center gap-3">
            <Wordmark variant="light" />
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-white"
              style={{ background: MAROON }}
            >
              <Building2 className="h-3 w-3" /> Lender sign in
            </span>
          </div>

          <h1 className="mt-6 font-serif text-[38px] leading-[1.0] tracking-tight text-black">
            Sign in to your MSME desk
          </h1>
          <p className="mt-2 text-[14px] text-black/60">
            Enter your bank employee ID and password. Production will federate with your bank's
            SSO (Okta / Azure AD) and enforce MFA.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-black/60">
                Employee ID
              </label>
              <input
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                placeholder="IDBI-MSME-2847"
                autoComplete="username"
                spellCheck={false}
                className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 font-mono text-base text-black outline-none placeholder:text-black/25 focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-black/60">
                Password
              </label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-base text-black outline-none placeholder:text-black/25 focus:border-black"
              />
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] font-medium text-rh-red">
                {error}
              </motion.div>
            )}

            <button
              onClick={submit}
              disabled={pending || !employeeId || !password}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[15px] font-semibold text-white disabled:opacity-50"
              style={{ background: MAROON }}
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              Sign in
            </button>

            <div className="inline-flex items-center gap-1.5 text-[11px] text-black/50">
              <ShieldCheck className="h-3 w-3" /> Session expires after 8 hours · MFA required in production
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-black/10 bg-white/70 p-5">
          <div className="text-[11px] font-bold uppercase tracking-widest text-black/50">
            Demo lender accounts (password: demo123)
          </div>
          <div className="mt-3 grid gap-2">
            {DEMO_LENDERS.map((l) => (
              <button
                key={l.employeeId}
                onClick={() => { setEmployeeId(l.employeeId); setPassword("demo123"); setError(null); }}
                className="flex items-center justify-between rounded-xl border border-black/10 bg-white/70 p-3 text-left hover:border-black/40"
              >
                <div>
                  <div className="font-mono text-[11px] text-black/60">{l.employeeId}</div>
                  <div className="mt-0.5 text-[13px] font-semibold text-black">{l.name}</div>
                </div>
                <div className="text-right text-[12px]">
                  <div className="font-semibold text-black/85">{l.bank}</div>
                  <div className="text-black/50">{l.desk}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 text-center text-[13px] text-black/60">
          New bank partner?{" "}
          <Link href="/signup/lender" className="font-semibold text-black underline">
            Register your MSME desk
          </Link>
        </div>
      </section>
    </main>
  );
}
