"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Building2, CheckCircle2, ShieldCheck } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { Wordmark } from "@/components/Logo";

const MAROON = "#78141e";

export default function LenderSignup() {
  const [bank, setBank] = useState("IDBI Bank");
  const [branch, setBranch] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [manager, setManager] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function submit() {
    setError(null);
    if (!bank.trim() || !branch.trim() || !employeeId.trim() || !manager.trim()) {
      return setError("All four fields required");
    }
    if (!/@/.test(manager)) return setError("Manager email must be a valid email");
    setDone(true);
  }

  return (
    <main className="min-h-screen bg-cream-fade">
      <TopNav />

      <section className="mx-auto flex max-w-2xl flex-col items-stretch px-6 py-12">
        <Link href="/signup" className="mb-6 inline-flex w-fit items-center gap-1.5 text-[13px] text-black/60 hover:text-black">
          <ArrowLeft className="h-3.5 w-3.5" /> Back · choose role
        </Link>

        <div className="rounded-3xl border border-black/10 bg-white/90 p-8 shadow-cream-card">
          <div className="flex items-center gap-3">
            <Wordmark variant="light" />
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-white"
              style={{ background: MAROON }}
            >
              <Building2 className="h-3 w-3" /> Lender sign up
            </span>
          </div>

          <AnimatePresence mode="wait">
            {done ? (
              <motion.div key="done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div
                  className="mt-6 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white"
                  style={{ background: MAROON }}
                >
                  <ShieldCheck className="h-3.5 w-3.5" /> Pending manager approval
                </div>
                <h1 className="mt-4 font-serif text-[36px] leading-[1.0] text-black">
                  Registration submitted.
                </h1>
                <p className="mt-3 text-[14px] leading-relaxed text-black/70">
                  We've emailed <span className="font-mono font-bold">{manager}</span> for
                  manager approval and initiated the enterprise DPA (Data Processing Agreement)
                  workflow. Access is provisioned within 48 hours in production. For this demo,
                  sign in with any existing lender account.
                </p>
                <Link
                  href="/login/lender"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-[14px] font-semibold text-white"
                  style={{ background: MAROON }}
                >
                  Go to lender sign-in <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h1 className="mt-6 font-serif text-[38px] leading-[1.0] tracking-tight text-black">
                  Register your MSME lending desk
                </h1>
                <p className="mt-2 text-[14px] text-black/60">
                  Four fields, then manager approval. Production also verifies your NBFC/PSP
                  license and completes RBI-compliant DPA sign-off.
                </p>

                <div className="mt-6 space-y-4">
                  <Field label="Bank / NBFC">
                    <select
                      value={bank}
                      onChange={(e) => setBank(e.target.value)}
                      className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-base text-black outline-none focus:border-black"
                    >
                      <option>IDBI Bank</option>
                      <option>State Bank of India</option>
                      <option>HDFC Bank</option>
                      <option>ICICI Bank</option>
                      <option>Axis Bank</option>
                      <option>Kotak Mahindra</option>
                      <option>Bandhan Bank</option>
                      <option>Yes Bank</option>
                    </select>
                  </Field>

                  <Field label="Branch · City">
                    <input
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      placeholder="Nariman Point, Mumbai"
                      className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-base text-black outline-none focus:border-black"
                    />
                  </Field>

                  <Field label="Employee ID">
                    <input
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                      placeholder="IDBI-MSME-2847"
                      spellCheck={false}
                      className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 font-mono text-base text-black outline-none focus:border-black"
                    />
                  </Field>

                  <Field label="Manager · email for approval">
                    <input
                      value={manager}
                      onChange={(e) => setManager(e.target.value)}
                      placeholder="head.msme@idbibank.co.in"
                      type="email"
                      autoComplete="off"
                      className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-base text-black outline-none focus:border-black"
                    />
                  </Field>

                  {error && (
                    <div className="text-[13px] font-medium text-rh-red">{error}</div>
                  )}

                  <button
                    onClick={submit}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[15px] font-semibold text-white"
                    style={{ background: MAROON }}
                  >
                    Submit for manager approval <ArrowRight className="h-4 w-4" />
                  </button>

                  <div className="inline-flex items-center gap-1.5 text-[11px] text-black/50">
                    <ShieldCheck className="h-3 w-3" /> Requires manager approval · production also verifies license + DPA
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-5 text-center text-[13px] text-black/60">
          Already registered?{" "}
          <Link href="/login/lender" className="font-semibold text-black underline">
            Sign in
          </Link>
        </div>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-black/60">
        {label}
      </label>
      {children}
    </div>
  );
}
