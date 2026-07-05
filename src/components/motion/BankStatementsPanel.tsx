"use client";

import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, Building2, Database, Landmark, Users } from "lucide-react";
import { fadeUp, staggerParent } from "@/lib/motion";
import type { StatementSummary } from "@/lib/agami/statements";
import { formatINR } from "@/lib/utils";

const TYPE_COLORS: Record<string, string> = {
  NEFT: "#3b82f6", RTGS: "#8b5cf6", UPI: "#22c55e", IMPS: "#f59e0b",
  CHEQUE: "#94a3b8", INTEREST: "#0ea5e9", CHARGE: "#ef4444", OTHER: "#64748b",
};

export function BankStatementsPanel({ summary }: { summary: StatementSummary }) {
  const totalTypeVolume = summary.typeMix.reduce((s, t) => s + t.volume, 0) || 1;

  return (
    <motion.section
      variants={staggerParent(0.1, 0.06)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      className="rounded-3xl border border-black/10 bg-white/70 p-7 backdrop-blur"
    >
      <motion.div variants={fadeUp} className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-black px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-rh-lime">
            <Database className="h-3.5 w-3.5" />
            Live · via Account Aggregator
          </div>
          <h3 className="mt-3 font-serif text-[34px] leading-tight tracking-tight text-black sm:text-[42px]">
            Bank statement · pulled live.
          </h3>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-black/70">
            {summary.txnCount.toLocaleString()} transactions from{" "}
            <span className="font-semibold text-black">{summary.bankName}</span>{" "}
            · {summary.uniqueCounterparties} unique counterparties · pulled via Finvu AA and
            parsed for NEFT / RTGS / UPI / IMPS.
          </p>
        </div>
        <div className="hidden shrink-0 rounded-2xl border border-black/10 bg-white/80 px-4 py-3 sm:block">
          <div className="text-[10px] font-bold uppercase tracking-widest text-black/50">Account</div>
          <div className="mt-1 font-mono text-[13px] font-semibold text-black">
            ****{summary.accountId.slice(-4)}
          </div>
          <div className="mt-1 text-[11px] text-black/60">{summary.accountHolder}</div>
        </div>
      </motion.div>

      {/* Stat cards */}
      <motion.div variants={staggerParent(0.05, 0.05)} className="mt-8 grid gap-3 sm:grid-cols-4">
        <StatCard label="Inflow (12 mo)" value={formatINR(summary.totalInflow)}
          icon={<ArrowDown className="h-4 w-4" />} color="text-green-700 bg-green-50" />
        <StatCard label="Outflow (12 mo)" value={formatINR(summary.totalOutflow)}
          icon={<ArrowUp className="h-4 w-4" />} color="text-red-700 bg-red-50" />
        <StatCard label="Closing balance" value={formatINR(summary.closingBalance)}
          icon={<Landmark className="h-4 w-4" />} color="text-black bg-black/[0.05]" />
        <StatCard label="Unique counterparties" value={summary.uniqueCounterparties.toString()}
          icon={<Users className="h-4 w-4" />} color="text-black bg-black/[0.05]" />
      </motion.div>

      {/* Type-mix bar */}
      <motion.div variants={fadeUp} className="mt-8">
        <div className="text-[10px] font-bold uppercase tracking-widest text-black/60">
          Payment rail mix · by volume
        </div>
        <div className="mt-3 flex h-3 overflow-hidden rounded-full border border-black/10">
          {summary.typeMix.map((t) => {
            const pct = (t.volume / totalTypeVolume) * 100;
            const color = TYPE_COLORS[t.txnType] ?? "#64748b";
            return (
              <div
                key={t.txnType}
                style={{ width: `${pct}%`, background: color }}
                title={`${t.txnType} · ${t.count.toLocaleString()} txns · ${formatINR(t.volume)}`}
              />
            );
          })}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {summary.typeMix.map((t) => (
            <span key={t.txnType} className="inline-flex items-center gap-1.5 text-[11px] text-black/70">
              <span className="h-2 w-2 rounded-full" style={{ background: TYPE_COLORS[t.txnType] ?? "#64748b" }} />
              <span className="font-semibold text-black">{t.txnType}</span>
              <span className="text-black/50">· {t.count.toLocaleString()}</span>
            </span>
          ))}
        </div>
      </motion.div>

      {/* Top counterparties */}
      <motion.div variants={fadeUp} className="mt-8">
        <div className="text-[10px] font-bold uppercase tracking-widest text-black/60">
          Top 8 counterparties · by volume
        </div>
        <div className="mt-3 space-y-1.5">
          {summary.topCounterparties.map((cp) => {
            const max = Math.max(...summary.topCounterparties.map((c) => c.inflow + c.outflow));
            const pct = ((cp.inflow + cp.outflow) / max) * 100;
            return (
              <div key={cp.name} className="grid grid-cols-[minmax(0,1.5fr)_88px_88px_1fr_88px] items-center gap-3 rounded-lg border border-black/5 bg-white p-2.5">
                <div className="min-w-0 truncate text-[13px] font-semibold text-black">
                  {cp.name}
                </div>
                <div className="text-right tabular text-[12px] font-semibold text-green-700">
                  +{formatINR(cp.inflow)}
                </div>
                <div className="text-right tabular text-[12px] font-semibold text-red-700">
                  −{formatINR(cp.outflow)}
                </div>
                <div className="relative h-1.5 overflow-hidden rounded-full bg-black/5">
                  <div className="h-full rounded-full bg-black" style={{ width: `${pct}%` }} />
                </div>
                <div className="text-right tabular text-[11px] text-black/60">
                  {cp.txnCount} txns
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Recent transactions */}
      <motion.div variants={fadeUp} className="mt-8">
        <div className="text-[10px] font-bold uppercase tracking-widest text-black/60">
          Recent transactions
        </div>
        <div className="mt-3 overflow-hidden rounded-xl border border-black/10">
          {summary.recentTxns.map((t, i) => (
            <div
              key={i}
              className={`grid grid-cols-[80px_60px_minmax(0,2fr)_100px_100px] items-center gap-3 border-b border-black/5 p-3 text-[12px] last:border-b-0 ${
                i % 2 === 0 ? "bg-white" : "bg-white/40"
              }`}
            >
              <div className="tabular text-black/60">{t.date}</div>
              <div>
                <span
                  className="rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white"
                  style={{ background: TYPE_COLORS[t.txnType] ?? "#64748b" }}
                >
                  {t.txnType}
                </span>
              </div>
              <div className="min-w-0 truncate font-mono text-[11px] text-black/70" title={t.description}>
                {t.counterparty ?? t.description.slice(0, 60)}
                {t.failed && (
                  <span className="ml-2 rounded bg-red-100 px-1 py-0.5 text-[9px] font-bold uppercase text-red-700">
                    failed
                  </span>
                )}
              </div>
              <div className={`text-right tabular font-semibold ${t.credit > 0 ? "text-green-700" : "text-black/30"}`}>
                {t.credit > 0 ? `+${formatINR(t.credit)}` : "—"}
              </div>
              <div className={`text-right tabular font-semibold ${t.debit > 0 ? "text-red-700" : "text-black/30"}`}>
                {t.debit > 0 ? `−${formatINR(t.debit)}` : "—"}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="mt-4 rounded-xl border border-black/10 bg-white/80 p-3 text-[11px] text-black/60">
        <span className="font-semibold text-black">Data source:</span> AgamiAI Indian-Bank-Statements
        (open dataset, Apache 2.0) · loaded into AWS RDS Aurora Postgres 18 · queried live at page
        render.
      </motion.div>
    </motion.section>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/80 p-4">
      <div className="flex items-center gap-2">
        <span className={`grid h-7 w-7 place-items-center rounded-md ${color}`}>{icon}</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-black/50">{label}</span>
      </div>
      <div className="mt-2 tabular font-serif text-[22px] leading-none text-black">{value}</div>
    </div>
  );
}
