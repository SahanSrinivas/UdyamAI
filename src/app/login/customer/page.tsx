"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { Wordmark } from "@/components/Logo";
import { WhatsAppOtpCard } from "@/components/motion/WhatsAppOtpCard";
import { validateGstin } from "@/lib/gstin";
import { DEMO_CUSTOMERS, DEMO_OTP } from "@/lib/auth";

type Channel = "whatsapp" | "sms" | "voice";

export default function CustomerLogin() {
  const search = useSearchParams();
  const mismatch = search.get("mismatch");
  const [step, setStep] = useState<"gstin" | "otp">("gstin");
  const [gstin, setGstin] = useState("");
  const [otp, setOtp] = useState("");
  const [phone, setPhone] = useState("");
  const [channel, setChannel] = useState<Channel>("whatsapp");
  const [seconds, setSeconds] = useState(300);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (step !== "otp") return;
    const id = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [step]);

  function handleGstinChange(v: string) {
    const next = v.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 15);
    setGstin(next);
    setError(null);
  }

  function nextStep() {
    const v = validateGstin(gstin);
    if (!v.ok) return setError(v.reason);
    const known = DEMO_CUSTOMERS.find((c) => c.gstin === v.gstin);
    if (!known) {
      return setError("GSTIN not in the demo book · pick from suggestions below");
    }
    setError(null);
    setPhone(known.phone);
    setSeconds(300);
    setStep("otp");
  }

  async function submitOtp() {
    setError(null);
    setPending(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role: "customer", gstin, otp }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Sign-in failed");
      setPending(false);
      return;
    }
    window.location.assign(`/dashboard?gstin=${gstin}`);
  }

  function resend() {
    setSeconds(300);
    setOtp("");
    setError(null);
  }

  return (
    <main className="min-h-screen bg-cream-fade">
      <TopNav />

      <section className="mx-auto flex max-w-2xl flex-col items-stretch px-6 py-12">
        <Link href="/login" className="mb-6 inline-flex w-fit items-center gap-1.5 text-[13px] text-black/60 hover:text-black">
          <ArrowLeft className="h-3.5 w-3.5" /> Back · choose role
        </Link>

        {mismatch === "lender" && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-400/40 bg-amber-100/70 p-4 text-[13px] text-amber-900">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <div className="font-semibold">You&rsquo;re currently signed in as a lender.</div>
              <div className="mt-0.5 text-amber-900/80">
                To view the MSME Health Card, sign in below with a GSTIN. This will replace your current session.
              </div>
            </div>
          </div>
        )}

        <div className="rounded-3xl border border-black/10 bg-white/90 p-8 shadow-cream-card">
          <div className="flex items-center gap-3">
            <Wordmark variant="light" />
            <span className="rounded-full bg-black px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-rh-lime">
              MSME sign in
            </span>
          </div>

          <h1 className="mt-6 font-serif text-[38px] leading-[1.0] tracking-tight text-black">
            {step === "gstin" ? "Verify your GSTIN" : "Enter the code"}
          </h1>
          <p className="mt-2 text-[14px] text-black/60">
            {step === "gstin"
              ? "We check your GSTIN with the official RBI 15-char checksum on-device. Nothing is sent until you press Continue."
              : `Code sent via ${channel === "whatsapp" ? "WhatsApp" : channel === "sms" ? "SMS" : "voice call"}. For this demo, the OTP is ${DEMO_OTP}.`}
          </p>

          {step === "gstin" ? (
            <div className="mt-6 space-y-3">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-black/60">
                GSTIN
              </label>
              <input
                value={gstin}
                onChange={(e) => handleGstinChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && nextStep()}
                placeholder="24AABCS1234R1Z8"
                spellCheck={false}
                autoComplete="off"
                className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 font-mono text-lg text-black outline-none placeholder:text-black/25 focus:border-black"
              />

              {error && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] font-medium text-rh-red">
                  {error}
                </motion.div>
              )}

              <button
                onClick={nextStep}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-black py-3 text-[15px] font-semibold text-white hover:bg-black/85"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              {/* WhatsApp / SMS / Voice delivery preview */}
              <WhatsAppOtpCard
                phone={phone}
                otp={DEMO_OTP}
                channel={channel}
                onChangeChannel={(c) => { setChannel(c); resend(); }}
                seconds={seconds}
              />

              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-black/60">
                  Enter the 6-digit code
                </label>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={(e) => e.key === "Enter" && submitOtp()}
                  placeholder="••••••"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-center font-mono text-2xl tracking-[0.4em] text-black outline-none placeholder:text-black/20 focus:border-black"
                />
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] font-medium text-rh-red">
                  {error}
                </motion.div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setStep("gstin")}
                  className="rounded-xl border border-black/15 bg-white px-4 py-3 text-[14px] font-semibold text-black/70 hover:text-black"
                >
                  Back
                </button>
                <button
                  onClick={submitOtp}
                  disabled={pending || otp.length !== 6}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-black py-3 text-[15px] font-semibold text-white disabled:opacity-50 hover:bg-black/85"
                >
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Sign in
                </button>
              </div>

              <div className="flex items-center justify-between text-[12px]">
                <button
                  onClick={resend}
                  disabled={seconds > 240}
                  className="font-semibold text-black underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:text-black/40 disabled:no-underline"
                >
                  Resend on {channel === "whatsapp" ? "WhatsApp" : channel === "sms" ? "SMS" : "voice"}
                </button>
                <span className="text-black/50 tabular">
                  {seconds > 0 ? `Retry in ${Math.max(0, seconds - 240)}s` : "You can retry"}
                </span>
              </div>
            </div>
          )}
        </div>

        {step === "gstin" && (
          <div className="mt-6 rounded-2xl border border-black/10 bg-white/70 p-5">
            <div className="text-[11px] font-bold uppercase tracking-widest text-black/50">
              Demo GSTINs (any accepts OTP {DEMO_OTP})
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {DEMO_CUSTOMERS.map((c) => (
                <button
                  key={c.gstin}
                  onClick={() => { setGstin(c.gstin); setStep("gstin"); setError(null); }}
                  className="rounded-xl border border-black/10 bg-white/70 p-3 text-left hover:border-black/40"
                >
                  <div className="font-mono text-[11px] text-black/60">{c.gstin}</div>
                  <div className="mt-1 text-[13px] font-semibold text-black">{c.name}</div>
                  <div className="mt-0.5 text-[11px] text-black/60">{c.phone}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 text-center text-[13px] text-black/60">
          Not registered?{" "}
          <Link href="/signup/customer" className="font-semibold text-black underline">
            Sign up as MSME
          </Link>
        </div>
      </section>
    </main>
  );
}
