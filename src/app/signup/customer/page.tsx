"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { Wordmark } from "@/components/Logo";
import { validateGstin } from "@/lib/gstin";

export default function CustomerSignup() {
  const [gstin, setGstin] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function submit() {
    setError(null);
    if (!name.trim()) return setError("Owner name required");
    if (!/^\+?91?\s?\d{10}$/.test(phone.replace(/[^\d+]/g, ""))) {
      return setError("Enter a valid Indian mobile number");
    }
    const v = validateGstin(gstin);
    if (!v.ok) return setError(v.reason);
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
            <span className="rounded-full bg-black px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-rh-lime">
              MSME sign up
            </span>
          </div>

          <AnimatePresence mode="wait">
            {done ? (
              <motion.div key="done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-rh-lime/20 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-black">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                </div>
                <h1 className="mt-4 font-serif text-[36px] leading-[1.0] text-black">
                  You're in, {name.split(" ")[0]}.
                </h1>
                <p className="mt-3 text-[14px] leading-relaxed text-black/70">
                  We've queued your onboarding. Production would email an eKYC link and pull your
                  AA consent within the next 60 seconds. For this demo, sign in directly with your
                  GSTIN and OTP <span className="font-mono font-bold">123456</span>.
                </p>
                <Link
                  href={`/login/customer`}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-black px-6 py-3 text-[14px] font-semibold text-white hover:bg-black/85"
                >
                  Go to sign-in <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h1 className="mt-6 font-serif text-[38px] leading-[1.0] tracking-tight text-black">
                  Tell us about your business
                </h1>
                <p className="mt-2 text-[14px] text-black/60">
                  Three fields. No bureau score. No audited books.
                </p>

                <div className="mt-6 space-y-4">
                  <Field label="Owner name">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Rajesh Patel"
                      autoComplete="name"
                      className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-base text-black outline-none focus:border-black"
                    />
                  </Field>

                  <Field label="Mobile · UPI-linked">
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98250 42391"
                      inputMode="tel"
                      autoComplete="tel"
                      className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 font-mono text-base text-black outline-none focus:border-black"
                    />
                  </Field>

                  <Field label="GSTIN · 15 characters">
                    <input
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 15))}
                      placeholder="24AABCS1234R1Z8"
                      autoComplete="off"
                      spellCheck={false}
                      className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 font-mono text-base text-black outline-none focus:border-black"
                    />
                  </Field>

                  {error && (
                    <div className="text-[13px] font-medium text-rh-red">{error}</div>
                  )}

                  <button
                    onClick={submit}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-black py-3 text-[15px] font-semibold text-white hover:bg-black/85"
                  >
                    Create MSME account <ArrowRight className="h-4 w-4" />
                  </button>

                  <div className="text-[11px] leading-relaxed text-black/50">
                    By signing up you consent to a read-only AA data pull for score computation.
                    Production uses Digio Aadhaar eKYC and Sahamati-compliant AA handshake.
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-5 text-center text-[13px] text-black/60">
          Already registered?{" "}
          <Link href="/login/customer" className="font-semibold text-black underline">
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
