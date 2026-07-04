import Link from "next/link";
import { ArrowRight, Building2, MessageCircle, User, Sparkles } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { Logo } from "@/components/Logo";

export default function SignupRolePage() {
  return (
    <main className="min-h-screen bg-cream-fade">
      <TopNav />

      <section className="mx-auto max-w-4xl px-6 py-16">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex justify-center">
            <Logo size={56} variant="chip" />
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-black px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-rh-lime">
            <Sparkles className="h-3 w-3" /> Sign up · free preview
          </div>
          <h1 className="mt-4 font-serif text-[46px] leading-[0.98] tracking-tight text-black sm:text-[60px]">
            Get started with UdyamAI.
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-[15px] text-black/60">
            Two roles, two accounts. Pick the one that describes you.
          </p>
          <div className="mt-4 text-[13px] text-black/60">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-black underline">
              Log in
            </Link>
          </div>
        </div>

        {/* WhatsApp onboarding — hero row */}
        <Link
          href="/onboarding"
          className="group mb-4 flex items-center justify-between gap-6 overflow-hidden rounded-3xl bg-[#075E54] p-6 text-white transition hover:bg-[#0d7466]"
        >
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#25D366]">
              <MessageCircle className="h-7 w-7 text-white" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-[#25D366]">
                Recommended · 78% of Indian users prefer this
              </div>
              <div className="mt-1 font-serif text-[24px] leading-tight tracking-tight">
                Sign up in WhatsApp
              </div>
              <div className="mt-1 text-[13px] text-white/80">
                GSTIN · Aadhaar KYC · AA consent · Health Score · Loan apply — all in one WhatsApp chat, 3 minutes.
              </div>
            </div>
          </div>
          <ArrowRight className="hidden h-6 w-6 shrink-0 transition group-hover:translate-x-1 sm:block" />
        </Link>

        <div className="mb-3 text-center text-[11px] font-semibold uppercase tracking-widest text-black/40">
          Or sign up via web
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/signup/customer"
            className="group relative overflow-hidden rounded-3xl border border-black/10 bg-white/85 p-8 transition hover:border-black/40 hover:bg-white"
          >
            <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-rh-lime/0 blur-3xl transition group-hover:bg-rh-lime/30" />
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-black text-rh-lime">
              <User className="h-5 w-5" />
            </div>
            <div className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-black/60">
              MSME · Business owner
            </div>
            <div className="mt-2 font-serif text-[26px] leading-[1.02] tracking-tight text-black">
              Sign up as MSME
            </div>
            <div className="mt-3 text-[13px] leading-relaxed text-black/60">
              GSTIN + business name + mobile OTP. Aadhaar-eKYC in production via Digio.
              No bureau score required. Score is live in under 2 minutes.
            </div>
            <ul className="mt-5 space-y-1 text-[12px] text-black/70">
              <li>· Live 0–1000 Health Score</li>
              <li>· Pre-qualified quotes from 64 lenders</li>
              <li>· Vernacular explanations (EN · HI · TE)</li>
            </ul>
            <div className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-semibold text-black">
              Continue as MSME <ArrowRight className="h-4 w-4" />
            </div>
          </Link>

          <Link
            href="/signup/lender"
            className="group relative overflow-hidden rounded-3xl border border-black/10 bg-white/85 p-8 transition hover:border-black/40 hover:bg-white"
          >
            <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-black/0 blur-3xl transition group-hover:bg-black/10" />
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#78141e] text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#78141e]">
              Lender · Bank / NBFC
            </div>
            <div className="mt-2 font-serif text-[26px] leading-[1.02] tracking-tight text-black">
              Register your MSME desk
            </div>
            <div className="mt-3 text-[13px] leading-relaxed text-black/60">
              Bank name + branch + employee ID + manager approval. Production onboarding
              requires PSP / NBFC license verification and RBI-compliant DPA sign-off.
            </div>
            <ul className="mt-5 space-y-1 text-[12px] text-black/70">
              <li>· Ranked pre-qualified MSME pipeline</li>
              <li>· LR-calibrated approval confidence</li>
              <li>· Post-sanction OCEN webhook monitoring</li>
            </ul>
            <div className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#78141e]">
              Continue as Lender <ArrowRight className="h-4 w-4" />
            </div>
          </Link>
        </div>
      </section>
    </main>
  );
}
