"use client";

import { motion } from "framer-motion";
import { AlertOctagon, AlertTriangle, TrendingDown } from "lucide-react";
import { fadeUp, staggerParent } from "@/lib/motion";
import type { SanctionedLoan, PortfolioStats } from "@/lib/loanPortfolio";
import { formatINR } from "@/lib/utils";

const STAGE_COLORS: Record<string, string> = {
  STANDARD: "#94c83c",
  "SMA-0": "#facc15",
  "SMA-1": "#f59e0b",
  "SMA-2": "#e35b3f",
  NPA: "#dc2626",
};

export function LenderPortfolio({
  stats,
  alerts,
  loans,
}: {
  stats: PortfolioStats;
  alerts: SanctionedLoan[];
  loans: SanctionedLoan[];
}) {
  const stages: Array<keyof PortfolioStats | "STANDARD" | "SMA-0" | "SMA-1" | "SMA-2" | "NPA"> = [
    "STANDARD", "SMA-0", "SMA-1", "SMA-2", "NPA",
  ];
  const counts = {
    STANDARD: stats.standardCount,
    "SMA-0": stats.sma0Count,
    "SMA-1": stats.sma1Count,
    "SMA-2": stats.sma2Count,
    NPA: stats.npaCount,
  };
  const max = Math.max(...(Object.values(counts) as number[]));

  return (
    <motion.div
      variants={staggerParent(0.1, 0.06)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      className="space-y-4"
    >
      {/* NPA heatmap header */}
      <motion.div variants={fadeUp} className="rounded-3xl border border-black/10 bg-white/80 p-6">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-black/60">
              Portfolio composition · by NPA stage
            </div>
            <div className="mt-1 text-[15px] text-black/60">
              RBI stages · SMA-0 (1–30 DPD) · SMA-1 (31–60) · SMA-2 (61–90) · NPA (90+)
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-bold uppercase tracking-widest text-black/50">Outstanding AUM</div>
            <div className="mt-1 tabular font-serif text-[26px] leading-none text-black">
              {formatINR(stats.outstandingAum)}
            </div>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-5 gap-3">
          {stages.map((s) => {
            const c = counts[s as keyof typeof counts] as number;
            const pct = max > 0 ? (c / max) * 100 : 0;
            const color = STAGE_COLORS[s as string];
            return (
              <div key={s as string} className="rounded-2xl border border-black/10 bg-white p-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-black/50">
                  {s as string}
                </div>
                <div className="mt-1 tabular text-[22px] font-bold text-black">{c}</div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/5">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${pct}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-full"
                    style={{ background: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Alert queue */}
      {alerts.length > 0 && (
        <motion.div variants={fadeUp} className="rounded-3xl border border-red-300/50 bg-white p-6">
          <div className="flex items-baseline justify-between">
            <div className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-red-700">
              <AlertOctagon className="h-3.5 w-3.5" />
              {alerts.length} active alert{alerts.length > 1 ? "s" : ""}
            </div>
            <div className="text-[12px] text-black/60">Sorted by severity · click to review</div>
          </div>

          <div className="mt-5 space-y-3">
            {alerts.slice(0, 5).map((l) => {
              const critical = l.alert?.severity === "critical";
              return (
                <motion.div
                  key={l.loanId}
                  whileHover={{ x: 3 }}
                  transition={{ type: "spring", stiffness: 320, damping: 26 }}
                  className={`rounded-2xl border p-4 transition ${
                    critical ? "border-red-300 bg-red-50/60" : "border-amber-300 bg-amber-50/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className={`grid h-8 w-8 place-items-center rounded-lg ${critical ? "bg-red-600 text-white" : "bg-amber-500 text-white"}`}>
                          {critical ? <AlertOctagon className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                        </div>
                        <div>
                          <div className="font-serif text-[18px] leading-none text-black">{l.msmeName}</div>
                          <div className="mt-1 text-[11px] text-black/60">
                            {l.sector} · {l.city.split(",")[0]} · Loan {l.loanId}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 text-[14px] font-semibold text-black">
                        {l.alert?.reason}
                      </div>
                      <div className="mt-1 text-[12px] text-black/60">
                        Sanction {formatINR(l.sanctionAmount)} · outstanding {formatINR(l.outstandingPrincipal)} · {l.stage}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="inline-flex items-center gap-1 text-[13px] font-bold text-red-600">
                        <TrendingDown className="h-3.5 w-3.5" />
                        {l.scoreDelta > 0 ? "+" : ""}{l.scoreDelta}
                      </div>
                      <div className="mt-1 text-[10px] uppercase tracking-widest text-black/50">
                        Score Δ
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Sample portfolio table (top 10) */}
      <motion.div variants={fadeUp} className="rounded-3xl border border-black/10 bg-white/80 p-6">
        <div className="text-[11px] font-bold uppercase tracking-widest text-black/60">
          Recent book · {loans.length} loans
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-black/10">
          <div className="grid grid-cols-[minmax(0,1.5fr)_88px_100px_88px_100px_100px] items-center gap-3 border-b border-black/10 bg-black/5 px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-black/60">
            <div>MSME · Loan ID</div>
            <div className="text-right">Sanction</div>
            <div className="text-right">Outstanding</div>
            <div className="text-right">DPD</div>
            <div className="text-right">Score Δ</div>
            <div>Stage</div>
          </div>
          {loans.slice(0, 10).map((l) => (
            <div
              key={l.loanId}
              className="grid grid-cols-[minmax(0,1.5fr)_88px_100px_88px_100px_100px] items-center gap-3 border-b border-black/5 px-4 py-3 text-[13px] last:border-b-0"
            >
              <div className="min-w-0">
                <div className="truncate font-semibold text-black">{l.msmeName}</div>
                <div className="font-mono text-[11px] text-black/50">{l.loanId} · {l.sector}</div>
              </div>
              <div className="text-right tabular font-semibold text-black">{formatINR(l.sanctionAmount)}</div>
              <div className="text-right tabular text-black/80">{formatINR(l.outstandingPrincipal)}</div>
              <div className={`text-right tabular font-bold ${l.dpd === 0 ? "text-black/50" : l.dpd > 90 ? "text-red-600" : l.dpd > 60 ? "text-amber-600" : "text-yellow-600"}`}>
                {l.dpd === 0 ? "—" : `${l.dpd}d`}
              </div>
              <div className={`text-right tabular font-bold ${l.scoreDelta > 0 ? "text-black" : "text-red-600"}`}>
                {l.scoreDelta > 0 ? "+" : ""}{l.scoreDelta}
              </div>
              <div>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                  style={{ background: STAGE_COLORS[l.stage] + "33", color: STAGE_COLORS[l.stage] === "#94c83c" ? "#4a6b1a" : STAGE_COLORS[l.stage] }}
                >
                  {l.stage}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
