import Link from "next/link";
import { ArrowRight, Building2, User } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { Logo } from "@/components/Logo";

export default function LoginRolePage() {
  return (
    <main className="min-h-screen bg-cream-fade">
      <TopNav />

      <section className="mx-auto max-w-4xl px-6 py-16">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex justify-center">
            <Logo size={56} variant="chip" />
          </div>
          <div className="text-[13px] font-semibold uppercase tracking-[0.18em] text-black/60">
            Log in to UdyamAI
          </div>
          <h1 className="mt-3 font-serif text-[46px] leading-[0.98] tracking-tight text-black sm:text-[60px]">
            Who are you today?
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-[15px] text-black/60">
            UdyamAI works two ways — for the MSME who needs credit, and for the bank who lends it.
            Pick your side to sign in.
          </p>
          <div className="mt-4 text-[13px] text-black/60">
            New here?{" "}
            <Link href="/signup" className="font-semibold text-black underline">
              Create an account
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/login/customer"
            className="group relative overflow-hidden rounded-3xl border border-black/10 bg-white/80 p-8 transition hover:border-black/40 hover:bg-white"
          >
            <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-rh-lime/0 blur-3xl transition group-hover:bg-rh-lime/30" />
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-black text-rh-lime">
              <User className="h-5 w-5" />
            </div>
            <div className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-black/60">
              MSME · Business owner
            </div>
            <div className="mt-2 font-serif text-[26px] leading-[1.02] tracking-tight text-black">
              I want to see my Health Card
            </div>
            <div className="mt-3 text-[13px] leading-relaxed text-black/60">
              GST-registered business? Enter your GSTIN + OTP and see your live 0-1000
              score, top drags, top lifts, and pre-qualified quotes from 64 lenders.
            </div>
            <div className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-semibold text-black">
              Sign in as MSME <ArrowRight className="h-4 w-4" />
            </div>
          </Link>

          <Link
            href="/login/lender"
            className="group relative overflow-hidden rounded-3xl border border-black/10 bg-white/80 p-8 transition hover:border-black/40 hover:bg-white"
          >
            <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-black/0 blur-3xl transition group-hover:bg-black/10" />
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#78141e] text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#78141e]">
              Lender · Bank employee
            </div>
            <div className="mt-2 font-serif text-[26px] leading-[1.02] tracking-tight text-black">
              I want to see my MSME pipeline
            </div>
            <div className="mt-3 text-[13px] leading-relaxed text-black/60">
              IDBI, SBI, HDFC MSME desk? Enter your employee ID + password to see your
              LR-ranked pre-qualified pipeline, rejection analytics, and portfolio signals.
            </div>
            <div className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#78141e]">
              Sign in as Lender <ArrowRight className="h-4 w-4" />
            </div>
          </Link>
        </div>

        <div className="mt-10 rounded-2xl border border-black/10 bg-white/60 p-5 text-[12px] leading-relaxed text-black/60">
          <span className="font-semibold text-black">Prototype note:</span> this is a synthetic-data
          demo. Production will use Aadhaar-based eKYC (Digio / Signzy) for MSMEs and enterprise SSO
          for bank employees. IDBI shortlisting on Jul 21 unlocks the real sandbox APIs on Jul 22.
        </div>
      </section>
    </main>
  );
}
