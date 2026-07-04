import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getProfile } from "@/lib/mockData";
import { computeHealthCard } from "@/lib/scoreEngine";
import { SESSION_COOKIE, decodeSession } from "@/lib/auth";
import { TopNav } from "@/components/TopNav";
import { ApplyForm } from "@/components/motion/ApplyForm";

export const dynamic = "force-dynamic";

export default async function ApplyPage() {
  const session = decodeSession(cookies().get(SESSION_COOKIE)?.value);
  if (!session || session.role !== "customer" || !session.gstin) {
    redirect("/login/customer?next=/apply");
  }
  const profile = getProfile(session.gstin);
  const card = computeHealthCard(profile);
  const ranked = [...card.quotes].sort((a, b) => b.confidence - a.confidence);

  return (
    <main className="min-h-screen bg-cream-fade">
      <TopNav />
      <section className="mx-auto max-w-4xl px-6 py-10">
        <Link href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-black/60 hover:text-black">
          ← Back to Health Card
        </Link>
        <div className="mb-8">
          <div className="text-[13px] font-semibold uppercase tracking-[0.18em] text-black/60">
            Apply for a loan
          </div>
          <h1 className="mt-3 font-serif text-[46px] leading-[0.98] tracking-tight text-black sm:text-[56px]">
            One form. {ranked.length} pre-qualified lenders.
          </h1>
          <p className="mt-3 max-w-xl text-[15px] text-black/60">
            Your Health Card is already attached. You&rsquo;re pre-approved by our LR calibrator —
            pick who you want to see it, and one of them will sanction within 24 hours.
          </p>
        </div>

        <ApplyForm
          gstin={profile.gstin}
          msmeName={profile.tradeName}
          city={profile.city}
          sector={profile.sector}
          overall={card.overall}
          subScores={{
            revenue: card.subScores[0].score,
            compliance: card.subScores[1].score,
            counterparty: card.subScores[2].score,
            growth: card.subScores[3].score,
          }}
          quotes={ranked.map((q) => ({
            lender: q.lender,
            confidence: q.confidence,
            ratePct: q.ratePct,
            sanctionAmount: q.amount,
            tenorMonths: q.tenorMonths,
          }))}
        />
      </section>
    </main>
  );
}
