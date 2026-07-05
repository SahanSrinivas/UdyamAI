import Link from "next/link";
import { ArrowLeft, Landmark, FileText, Users, RefreshCw } from "lucide-react";
import { getProfile, MSMEProfile } from "@/lib/mockData";
import { computeHealthCard } from "@/lib/scoreEngine";
import { explainScore, Language } from "@/lib/gemini";
import { validateGstin, generateSyntheticProfile } from "@/lib/gstin";
import { getMarketSnapshot } from "@/lib/marketData";
import { ScoreCard } from "@/components/motion/ScoreCard";
import { SubScoreGrid } from "@/components/motion/SubScoreGrid";
import { NudgePanel } from "@/components/motion/NudgePanel";
import { LoanQuotesGrid } from "@/components/motion/LoanQuotesGrid";
import { LangToggle } from "@/components/motion/LangToggle";
import { ExplanationCard } from "@/components/motion/ExplanationCard";
import { MarketStrip } from "@/components/motion/MarketStrip";
import { ModelCard } from "@/components/motion/ModelCard";
import { ProfileTypeBanner } from "@/components/motion/ProfileTypeBanner";
import { ScoreSparkline } from "@/components/motion/ScoreSparkline";
import { SectorCohort } from "@/components/motion/SectorCohort";
import { CounterpartyGraph } from "@/components/motion/CounterpartyGraph";
import { ApplicationTimeline } from "@/components/motion/ApplicationTimeline";
import { AlternativeSignals } from "@/components/motion/AlternativeSignals";
import { ItrVerifiedChip } from "@/components/motion/ItrVerifiedChip";
import { getSectorSignals } from "@/lib/sectorSignals";
import { getItrForGstin, itrSignalImpact } from "@/lib/agami/itrData";
import { TopNav } from "@/components/TopNav";
import { getAllModels } from "@/lib/mlModel";
import { PROFILE_TYPE_LABEL } from "@/lib/mockData";
import { getHistory } from "@/lib/applicationHistory";
import { ArrowUpRight, LogOut } from "lucide-react";

export const dynamic = "force-dynamic";

type Search = { gstin?: string; lang?: string };

function resolveProfile(gstinParam?: string): MSMEProfile {
  if (!gstinParam) return getProfile(undefined);
  const known = getProfile(gstinParam);
  if (known.gstin === gstinParam) return known;
  const v = validateGstin(gstinParam);
  if (v.ok) return generateSyntheticProfile(v.gstin) as MSMEProfile;
  return known;
}

export default async function Dashboard({ searchParams }: { searchParams: Search }) {
  const profile = resolveProfile(searchParams.gstin);
  const lang = (searchParams.lang as Language) || "en";
  const card = computeHealthCard(profile);
  const [explanation, market] = await Promise.all([explainScore(card, lang), getMarketSnapshot()]);
  const models = getAllModels();
  const history = getHistory(profile.gstin, card.overall);
  const sectorSignals = getSectorSignals(profile.sector);
  const itr = await getItrForGstin(profile.gstin);
  const itrImpact = itr ? itrSignalImpact(itr) : null;

  return (
    <main className="min-h-screen bg-black">
      <TopNav />
      <MarketStrip snap={market} />

      {/* Overview — MIST light */}
      <section className="bg-mist-fade">
        <div className="mx-auto max-w-[1600px] px-6 pt-10 pb-16">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/" className="inline-flex items-center gap-2 text-[15px] font-semibold text-black/80 hover:text-black">
              <ArrowLeft className="h-4 w-4" /> All profiles
            </Link>
            <div className="flex items-center gap-2">
              <LangToggleLight gstin={profile.gstin} current={lang} />
              <Link
                href="/logout"
                className="inline-flex items-center gap-1.5 rounded-full border-2 border-red-500 bg-red-50 px-5 py-2 text-[13px] font-bold text-red-700 transition hover:bg-red-500 hover:text-white"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </Link>
            </div>
          </div>

          <div className="mt-8">
            <ProfileTypeBanner profile={profile} />
          </div>

          <div className="mt-2 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="text-[13px] font-semibold uppercase tracking-[0.18em] text-black/60">
                MSME Health Card
              </div>
              <div className="mt-3 font-serif text-[52px] leading-[0.98] tracking-serif text-black md:text-[68px]">
                {profile.tradeName}
              </div>
              <div className="mt-3 text-[15px] text-black/70">
                {profile.legalName} · GSTIN {profile.gstin} · {profile.city}
              </div>
              <div className="text-[15px] text-black/60">
                {profile.sector} · {profile.vintageYears} years in business · {PROFILE_TYPE_LABEL[profile.profileType]}
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[380px_1fr]">
            <div className="flex flex-col gap-6">
              <ScoreCard overall={card.overall} band={card.band} />
              <ScoreSparkline
                history={profile.scoreHistory}
                lastEvent={profile.lastEvent}
                lastRefreshedIso={profile.lastRefreshedIso}
              />
            </div>
            <div className="flex flex-col gap-6">
              <ExplanationCard text={explanation} theme="light" />
              <SubScoreGrid subScores={card.subScores} theme="light" />
              <SectorCohort profile={profile} />
            </div>
          </div>
        </div>
      </section>

      {/* Application timeline — cream */}
      <section className="bg-cream-fade">
        <div className="mx-auto max-w-[1600px] px-6 py-16">
          <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <div className="text-[13px] font-semibold uppercase tracking-[0.18em] text-black/60">
                Application history · then vs now
              </div>
              <h2 className="mt-2 font-serif text-[42px] leading-[0.98] tracking-serif text-black sm:text-[52px]">
                What if you applied today?
              </h2>
            </div>
            <Link
              href="/apply"
              className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-[14px] font-semibold text-white hover:bg-black/85"
            >
              Apply for a loan <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <ApplicationTimeline history={history} currentScore={card.overall} />
        </div>
      </section>

      {/* Sector-adaptive alternative signals — cream */}
      <section className="bg-cream-fade">
        <div className="mx-auto max-w-[1600px] px-6 py-16">
          <div className="mb-6">
            <div className="text-[13px] font-semibold uppercase tracking-[0.18em] text-black/60">
              Alternative signals · sector-adaptive
            </div>
            <h2 className="mt-2 font-serif text-[42px] leading-[0.98] tracking-serif text-black sm:text-[56px]">
              Beyond the traditional documents.
            </h2>
          </div>
          <AlternativeSignals sector={profile.sector} signals={sectorSignals} />

          {itr && itrImpact && (
            <div className="mt-8 max-w-3xl">
              <ItrVerifiedChip itr={itr} impact={itrImpact.impact} status={itrImpact.status} />
            </div>
          )}
        </div>
      </section>

      {/* UPI counterparty graph — mist */}
      <section className="bg-mist-fade">
        <div className="mx-auto max-w-[1600px] px-6 py-16">
          <div className="mb-8">
            <div className="text-[13px] font-semibold uppercase tracking-[0.18em] text-black/60">
              Counterparty risk
            </div>
            <h2 className="mt-3 font-serif text-[42px] leading-[0.98] tracking-serif text-black sm:text-[56px]">
              Where the money comes from.
            </h2>
          </div>
          <CounterpartyGraph profile={profile} />
        </div>
      </section>

      {/* Nudges — dark */}
      <section className="border-t border-line bg-black">
        <div className="mx-auto max-w-[1600px] px-6 py-16">
          <div className="mb-8">
            <div className="text-[13px] font-semibold uppercase tracking-[0.18em] text-muted">
              What to fix. What to keep.
            </div>
            <h2 className="mt-3 font-serif text-[42px] leading-[0.98] tracking-serif text-base-50 sm:text-[56px]">
              The next move.
            </h2>
          </div>
          <NudgePanel drags={card.topDrags} lifts={card.topLifts} />
        </div>
      </section>

      {/* Loan Quotes — SAND light */}
      <section className="bg-sand-fade">
        <div className="mx-auto max-w-[1600px] px-6 py-20">
          <div className="mb-10 flex flex-col items-start justify-between gap-2 md:flex-row md:items-end">
            <div>
              <div className="text-[13px] font-semibold uppercase tracking-[0.18em] text-black/60">
                Pre-qualified quotes
              </div>
              <h2 className="mt-3 font-serif text-[46px] leading-[0.98] tracking-serif text-black sm:text-[60px]">
                Three lenders match
                <br />
                <span className="italic text-black/60">today.</span>
              </h2>
            </div>
            <div className="text-[14px] text-black/60">Sorted by approval confidence</div>
          </div>
          <LoanQuotesGrid quotes={card.quotes} theme="light" gstin={profile.gstin} />
        </div>
      </section>

      {/* Model transparency — sage */}
      <section className="bg-sage-fade">
        <div className="mx-auto max-w-[1600px] px-6 py-16">
          <ModelCard models={models} />
        </div>
      </section>

      {/* Data used — dark */}
      <section className="border-t border-line bg-black">
        <div className="mx-auto max-w-[1600px] px-6 py-16">
          <div className="mb-8">
            <div className="text-[13px] font-semibold uppercase tracking-[0.18em] text-white/60">
              Data used
            </div>
            <h2 className="mt-3 font-serif text-[36px] leading-[0.98] tracking-serif text-white sm:text-[48px]">
              Every data point, sourced.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DataCard
              icon={<Landmark className="h-5 w-5" />}
              label="Bank statement"
              value="Via AA"
              detail="Last 12 months · 1,842 txns"
            />
            <DataCard
              icon={<FileText className="h-5 w-5" />}
              label="GST returns"
              value="GSTR-1 + 3B"
              detail="24 months · GSTN as FIP"
            />
            <DataCard
              icon={<Users className="h-5 w-5" />}
              label="EPFO"
              value={profile.epfoActive ? "Active" : "Not enrolled"}
              detail={
                profile.epfoActive
                  ? "Monthly contributions verified"
                  : "Missing — reduces Compliance score"
              }
              tone={profile.epfoActive ? "ok" : "warn"}
            />
            <DataCard
              icon={<RefreshCw className="h-5 w-5" />}
              label="Refresh"
              value="Every 30 days"
              detail="Auto-pull via AA consent"
            />
          </div>
        </div>
      </section>

      <footer className="border-t border-line bg-black">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-2 px-6 py-8 text-[14px] font-medium text-white/70 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 UdyamAI. All rights reserved.</span>
          <span>Made in India · Built for IDBI Innovate 2026</span>
        </div>
      </footer>
    </main>
  );
}

function LangToggleLight({ gstin, current }: { gstin: string; current: string }) {
  return <LangToggle gstin={gstin} current={current} theme="light" />;
}

function DataCard({
  icon,
  label,
  value,
  detail,
  tone = "neutral",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  tone?: "neutral" | "ok" | "warn";
}) {
  const iconBg =
    tone === "ok"
      ? "bg-rh-lime/15 text-rh-lime"
      : tone === "warn"
        ? "bg-rh-amber/15 text-rh-amber"
        : "bg-white/8 text-white/85";
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.09] bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-5 backdrop-blur">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" aria-hidden />
      <div className="flex items-start justify-between">
        <div className={`grid h-10 w-10 place-items-center rounded-xl ${iconBg}`}>{icon}</div>
        {tone === "ok" && (
          <span className="rounded-full bg-rh-lime/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-rh-lime">
            Live
          </span>
        )}
        {tone === "warn" && (
          <span className="rounded-full bg-rh-amber/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-rh-amber">
            Gap
          </span>
        )}
      </div>
      <div className="mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
        {label}
      </div>
      <div className="mt-1.5 text-[20px] font-semibold leading-tight text-white">{value}</div>
      <div className="mt-1.5 text-[13px] leading-relaxed text-white/60">{detail}</div>
    </div>
  );
}
