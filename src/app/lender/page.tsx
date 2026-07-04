import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowUpRight, Download, Building2, TrendingUp, PieChart, AlertTriangle, LogOut } from "lucide-react";
import { listProfiles, PROFILE_TYPE_LABEL, type MSMEProfile } from "@/lib/mockData";
import { computeHealthCard } from "@/lib/scoreEngine";
import { predictApproval } from "@/lib/mlModel";
import { getMarketSnapshot } from "@/lib/marketData";
import { getPortfolio, getAlerts, getPortfolioStats } from "@/lib/loanPortfolio";
import { SESSION_COOKIE, decodeSession } from "@/lib/auth";
import { TopNav } from "@/components/TopNav";
import { MarketStrip } from "@/components/motion/MarketStrip";
import { LenderPortfolio } from "@/components/motion/LenderPortfolio";
import { IncomingApplications } from "@/components/motion/IncomingApplications";
import { formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";

type EnrichedLead = {
  profile: MSMEProfile;
  overall: number;
  confidence: number;
  suggestedAmount: number;
  ratePct: number;
  weakSubScore: string;
};

function enrichLeadsForIDBI(profiles: MSMEProfile[]): EnrichedLead[] {
  return profiles.map((p) => {
    const card = computeHealthCard(p);
    const trailingRev = p.monthlyRevenue.slice(-12).reduce((s, x) => s + x, 0);
    const suggestedAmount = Math.min(5000000, Math.max(500000, Math.round((trailingRev * 0.15) / 100000) * 100000));
    const pred = predictApproval(
      "IDBI Bank",
      {
        revenue: card.subScores[0].score,
        compliance: card.subScores[1].score,
        counterparty: card.subScores[2].score,
        growth: card.subScores[3].score,
      },
      suggestedAmount / (trailingRev || 1),
      36
    );
    const weak = [...card.subScores].sort((a, b) => a.score - b.score)[0];
    return {
      profile: p,
      overall: card.overall,
      confidence: pred.probability,
      suggestedAmount,
      ratePct: 12.5 + (1000 - card.overall) * 0.004,
      weakSubScore: weak.label,
    };
  });
}

function distribution(leads: EnrichedLead[]) {
  const buckets: Record<string, number> = {};
  for (const l of leads) buckets[l.weakSubScore] = (buckets[l.weakSubScore] || 0) + 1;
  const total = leads.length;
  return Object.entries(buckets)
    .map(([label, count]) => ({ label, count, pct: (count / total) * 100 }))
    .sort((a, b) => b.count - a.count);
}

function sectorMix(leads: EnrichedLead[]) {
  const buckets: Record<string, number> = {};
  for (const l of leads) buckets[l.profile.sector] = (buckets[l.profile.sector] || 0) + 1;
  const total = leads.length;
  return Object.entries(buckets)
    .map(([label, count]) => ({ label, count, pct: (count / total) * 100 }))
    .sort((a, b) => b.count - a.count);
}

export default async function LenderDashboard() {
  const session = decodeSession(cookies().get(SESSION_COOKIE)?.value);
  const bankName = session?.bank || "IDBI Bank";
  const bankerName = session?.displayName || "Priya Sharma";

  const profiles = listProfiles();
  const [leads, market] = [enrichLeadsForIDBI(profiles), await getMarketSnapshot()];
  const ranked = [...leads].sort((a, b) => b.confidence - a.confidence);

  const portfolioStats = getPortfolioStats(bankName);
  const portfolioAlerts = getAlerts(bankName);
  const portfolioLoans = getPortfolio(bankName);

  const totalLeads = leads.length;
  const avgConf = leads.reduce((s, l) => s + l.confidence, 0) / totalLeads;
  const projectedAum = leads.reduce((s, l) => s + l.suggestedAmount * l.confidence, 0);
  const invisibleShare = leads.filter((l) => l.profile.profileType !== "MATURE").length / totalLeads;
  const rejectionMix = distribution(leads);
  const sectors = sectorMix(leads);

  return (
    <main className="min-h-screen bg-black">
      <TopNav />
      <MarketStrip snap={market} />

      {/* Header — dark */}
      <section className="border-b border-line bg-black">
        <div className="mx-auto max-w-[1600px] px-6 pt-10 pb-8">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="text-[13px] font-semibold uppercase tracking-[0.18em] text-muted">
                Lender view · MSME Lending Desk
              </div>
              <div className="mt-2 font-serif text-[46px] leading-[0.98] tracking-serif text-base-50 md:text-[56px]">
                <span className="italic text-muted">Underwriting for</span> {bankName}
              </div>
              <div className="mt-2 text-[13px] text-muted-strong">Signed in as {bankerName}</div>
              <div className="mt-2 text-[15px] text-muted-strong">
                Pre-qualified pipeline · UdyamAI-calibrated · refreshed on AA consent
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/logout"
                className="inline-flex items-center gap-1.5 rounded-full border-2 border-rh-red bg-rh-red/10 px-5 py-2 text-[13px] font-bold text-rh-red transition hover:bg-rh-red hover:text-white"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full border border-line-strong bg-base-900 px-4 py-2 text-[13px] font-semibold text-base-50 transition hover:border-muted-soft"
              >
                Borrower view
              </Link>
              <a
                href={`data:application/json;charset=utf-8,${encodeURIComponent(
                  JSON.stringify(
                    {
                      bank: "IDBI Bank",
                      generatedAt: new Date().toISOString(),
                      leads: ranked.map((l) => ({
                        gstin: l.profile.gstin,
                        tradeName: l.profile.tradeName,
                        sector: l.profile.sector,
                        city: l.profile.city,
                        profileType: l.profile.profileType,
                        healthScore: l.overall,
                        approvalConfidence: l.confidence,
                        suggestedSanction: l.suggestedAmount,
                        indicativeRate: l.ratePct,
                        weakestDimension: l.weakSubScore,
                      })),
                    },
                    null,
                    2
                  )
                )}`}
                download="udyamai-idbi-pipeline.json"
                className="inline-flex items-center gap-2 rounded-full bg-rh-lime px-4 py-2 text-[13px] font-semibold text-black transition hover:bg-rh-lime-bright"
              >
                <Download className="h-3.5 w-3.5" /> Export pipeline
              </a>
            </div>
          </div>

          {/* KPI row */}
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi
              icon={<PieChart className="h-4 w-4" />}
              label="Total book AUM"
              value={formatINR(portfolioStats.totalAum)}
              sub={`${portfolioStats.totalLoans} sanctioned loans`}
            />
            <Kpi
              icon={<TrendingUp className="h-4 w-4" />}
              label="Avg approval confidence"
              value={`${(avgConf * 100).toFixed(1)}%`}
              sub="Weighted by LR calibrator"
              accent="lime"
            />
            <Kpi
              icon={<AlertTriangle className="h-4 w-4" />}
              label="Active alerts"
              value={portfolioStats.activeAlerts.toString()}
              sub={`${portfolioStats.npaPct.toFixed(1)}% NPA · ${portfolioStats.atRiskPct.toFixed(1)}% at-risk`}
              accent="amber"
            />
            <Kpi
              icon={<Building2 className="h-4 w-4" />}
              label="Credit-invisible share"
              value={`${Math.round(invisibleShare * 100)}%`}
              sub="NTC / NTB / thin-file"
            />
          </div>
        </div>
      </section>

      {/* Incoming applications (live) + Portfolio book — sand light */}
      <section className="bg-sand-fade">
        <div className="mx-auto max-w-[1600px] space-y-8 px-6 py-14">
          <div>
            <div className="text-[13px] font-semibold uppercase tracking-[0.18em] text-black/60">
              Real-time queue
            </div>
            <h2 className="mt-2 font-serif text-[42px] leading-[0.98] tracking-serif text-black sm:text-[56px]">
              What just landed on your desk.
            </h2>
          </div>
          <IncomingApplications lender={bankName} decidedBy={bankerName} />

          <div>
            <div className="text-[13px] font-semibold uppercase tracking-[0.18em] text-black/60">
              Existing book · {portfolioStats.totalLoans} loans · {formatINR(portfolioStats.totalAum)} AUM
            </div>
            <h2 className="mt-2 font-serif text-[42px] leading-[0.98] tracking-serif text-black sm:text-[52px]">
              Portfolio health.
            </h2>
          </div>
          <LenderPortfolio
            stats={portfolioStats}
            alerts={portfolioAlerts}
            loans={portfolioLoans}
          />
        </div>
      </section>

      {/* Leads table + Rejection + Sector — MIST light */}
      <section className="bg-mist-fade">
        <div className="mx-auto max-w-[1600px] px-6 py-14">
          <div className="mb-8">
            <div className="text-[13px] font-semibold uppercase tracking-[0.18em] text-black/60">
              Ranked pipeline
            </div>
            <h2 className="mt-3 font-serif text-[38px] leading-[0.98] tracking-serif text-black sm:text-[52px]">
              {totalLeads} leads · sorted by approval confidence.
            </h2>
          </div>

          <div className="overflow-hidden rounded-3xl border border-black/10 bg-white/70">
            <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_88px_100px_120px_120px_120px] items-center gap-4 border-b border-black/10 bg-white/60 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/60">
              <div>MSME</div>
              <div>Sector · City</div>
              <div>Score</div>
              <div>Conf.</div>
              <div className="text-right">Sanction</div>
              <div className="text-right">Rate</div>
              <div>Weakest</div>
            </div>
            {ranked.map((l) => {
              const invisible = l.profile.profileType !== "MATURE";
              const cPct = Math.round(l.confidence * 100);
              const rowTint = cPct >= 80 ? "bg-rh-lime/[0.08]" : cPct >= 60 ? "bg-white/50" : "bg-rh-red/[0.05]";
              return (
                <Link
                  key={l.profile.gstin}
                  href={`/dashboard?gstin=${l.profile.gstin}`}
                  className={`grid grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_88px_100px_120px_120px_120px] items-center gap-4 border-b border-black/10 px-5 py-4 transition last:border-b-0 hover:bg-white/95 ${rowTint}`}
                >
                  <div className="min-w-0">
                    <div className="truncate text-[15px] font-semibold text-black">{l.profile.tradeName}</div>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span className="truncate text-[12px] font-mono text-black/55">{l.profile.gstin}</span>
                      {invisible && (
                        <span className="rounded bg-black px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-rh-lime">
                          {l.profile.profileType}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[14px] text-black">{l.profile.sector}</div>
                    <div className="text-[12px] text-black/60">{l.profile.city.split(",")[0]}</div>
                  </div>
                  <div className="tabular font-bold text-black">{l.overall}</div>
                  <div>
                    <div className="tabular text-[13px] font-bold text-black">{cPct}%</div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-black/10">
                      <div className="h-full rounded-full bg-black" style={{ width: `${cPct}%` }} />
                    </div>
                  </div>
                  <div className="tabular text-right text-[14px] font-semibold text-black">
                    {formatINR(l.suggestedAmount)}
                  </div>
                  <div className="tabular text-right text-[14px] font-semibold text-black">
                    {l.ratePct.toFixed(2)}%
                  </div>
                  <div className="inline-flex items-center gap-1 text-[12px] text-black/70">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rh-red" />
                    {l.weakSubScore}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Rejection reason + sector mix */}
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <MixCard
              title="Rejection driver distribution"
              subtitle="Which dimension fails most often across the pipeline"
              rows={rejectionMix}
              rowTint="rose"
            />
            <MixCard
              title="Sector diversification"
              subtitle="Portfolio composition — flag any dimension >30%"
              rows={sectors}
              rowTint="ink"
            />
          </div>
        </div>
      </section>

      {/* Portfolio quality — dark */}
      <section className="border-t border-line bg-black">
        <div className="mx-auto max-w-[1600px] px-6 py-14">
          <div className="rounded-3xl border border-line bg-base-900 p-7">
            <div className="text-[13px] font-semibold uppercase tracking-[0.18em] text-muted">
              Post-sanction monitoring
            </div>
            <h3 className="mt-3 font-serif text-[36px] leading-[0.98] tracking-serif text-base-50 sm:text-[44px]">
              Portfolio quality after disbursement.
            </h3>
            <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-muted-strong">
              Every OCEN sanction carries a post-disbursement AA consent. UdyamAI monitors those
              accounts monthly. If a borrower's score drops <span className="font-semibold text-base-50">80 points or more</span>,
              or a new bounce lands, we fire an OCEN <span className="font-mono text-rh-lime">status</span> webhook
              to your underwriting desk before it becomes an NPA.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <MonitorCard title="Refresh cadence" value="Monthly" detail="Auto-pull via AA consent" />
              <MonitorCard title="Early-warning trigger" value="−80 pts" detail="Score drop over 3 cycles" />
              <MonitorCard title="Delivery" value="OCEN status webhook" detail="Real-time to underwriting" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Kpi({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  accent?: "lime" | "amber";
}) {
  const iconBg =
    accent === "lime" ? "bg-rh-lime/15 text-rh-lime" : accent === "amber" ? "bg-rh-amber/15 text-rh-amber" : "bg-white/8 text-white/85";
  return (
    <div className="rounded-2xl border border-white/[0.09] bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-5">
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${iconBg}`}>{icon}</div>
      <div className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">{label}</div>
      <div className="mt-1.5 text-[24px] font-bold leading-tight tracking-tight text-white tabular">{value}</div>
      <div className="mt-1 text-[12px] text-white/55">{sub}</div>
    </div>
  );
}

function MixCard({
  title,
  subtitle,
  rows,
  rowTint,
}: {
  title: string;
  subtitle: string;
  rows: { label: string; count: number; pct: number }[];
  rowTint: "rose" | "ink";
}) {
  const bar = rowTint === "rose" ? "bg-rh-red" : "bg-black";
  return (
    <div className="rounded-3xl border border-black/10 bg-white/70 p-6">
      <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-black/60">{title}</div>
      <div className="mt-1 text-[13px] text-black/55">{subtitle}</div>
      <div className="mt-5 space-y-3">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="mb-1 flex items-baseline justify-between">
              <span className="text-[14px] font-semibold text-black">{r.label}</span>
              <span className="tabular text-[12px] font-bold text-black">
                {r.count} · {r.pct.toFixed(0)}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-black/10">
              <div className={`h-full rounded-full ${bar}`} style={{ width: `${r.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MonitorCard({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-line bg-base-800/50 p-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{title}</div>
      <div className="mt-2 text-[24px] font-bold leading-none tracking-tight text-base-50 tabular">{value}</div>
      <div className="mt-1.5 text-[13px] text-muted-strong">{detail}</div>
      <div className="mt-4 inline-flex items-center gap-1 text-[11px] font-semibold text-rh-lime">
        Active <ArrowUpRight className="h-3 w-3" />
      </div>
    </div>
  );
}
