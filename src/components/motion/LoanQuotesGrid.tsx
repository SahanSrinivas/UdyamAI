"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { fadeUp, staggerParent } from "@/lib/motion";
import type { LoanQuote } from "@/lib/scoreEngine";
import { formatINR } from "@/lib/utils";
import { CountUp } from "./CountUp";
import { OcenApplyDrawer } from "./OcenApplyDrawer";

export function LoanQuotesGrid({
  quotes,
  theme = "dark",
  gstin,
}: {
  quotes: LoanQuote[];
  theme?: "dark" | "light";
  gstin: string;
}) {
  const ranked = [...quotes].sort((a, b) => b.confidence - a.confidence);
  const [selected, setSelected] = useState<LoanQuote | null>(null);

  return (
    <>
      <motion.div
        variants={staggerParent(0.2, 0.09)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="grid gap-5 md:grid-cols-3"
      >
        {ranked.map((q, i) => (
          <QuoteCard key={q.lender} q={q} rank={i} theme={theme} onApply={() => setSelected(q)} />
        ))}
      </motion.div>

      <OcenApplyDrawer open={selected !== null} onClose={() => setSelected(null)} gstin={gstin} quote={selected} />
    </>
  );
}

function QuoteCard({
  q,
  rank,
  theme,
  onApply,
}: {
  q: LoanQuote;
  rank: number;
  theme: "dark" | "light";
  onApply: () => void;
}) {
  const reduce = useReducedMotion();
  const best = rank === 0;
  const pct = Math.round(q.confidence * 100);
  const isLight = theme === "light";

  const border = best
    ? isLight
      ? "border-black bg-white shadow-cream-card"
      : "border-rh-lime/50 bg-base-900 shadow-lime-glow"
    : isLight
      ? "border-black/10 bg-white/70 hover:border-black/25"
      : "border-line bg-base-900 hover:border-line-strong";

  const chipBg = isLight ? "bg-black text-rh-lime" : "bg-rh-lime text-black";
  const labelText = isLight ? "text-black/60" : "text-muted";
  const bodyText = isLight ? "text-black" : "text-base-50";
  const dividerBorder = isLight ? "border-black/10" : "border-line";
  const barBg = isLight ? "bg-black/10" : "bg-base-800";
  const reasonText = isLight ? "text-black/65" : "text-muted";
  const dotColor = isLight ? "bg-black/40" : "bg-muted-soft";
  const btnPrimary = isLight ? "bg-black text-white hover:bg-black/85" : "bg-rh-lime text-black hover:bg-rh-lime-bright";
  const btnSecondary = isLight ? "border border-black/15 bg-white text-black hover:border-black/30" : "border border-line-strong bg-base-800 text-base-50 hover:bg-base-700";

  return (
    <motion.article
      variants={fadeUp}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className={`group relative overflow-hidden rounded-3xl border p-7 ${border}`}
    >
      {best && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={`mb-4 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest ${chipBg}`}
        >
          Best match
        </motion.div>
      )}

      <div className={`text-[12px] font-semibold uppercase tracking-[0.14em] ${labelText}`}>
        {q.product}
      </div>
      <div className={`mt-1 font-serif text-[30px] leading-[1.05] tracking-serif ${bodyText}`}>{q.lender}</div>

      <dl className={`mt-5 space-y-3 border-t pt-4 text-[14px] ${dividerBorder}`}>
        <Row label="Sanction (est.)" value={<span className={`tabular font-bold ${bodyText}`}>{formatINR(q.amount)}</span>} labelText={labelText} />
        <Row label="Rate" value={<span className={`tabular font-semibold ${bodyText}`}>{q.ratePct.toFixed(2)}% p.a.</span>} labelText={labelText} />
        <Row label="Tenor" value={<span className={`tabular font-semibold ${bodyText}`}>{q.tenorMonths} months</span>} labelText={labelText} />
      </dl>

      <div className="mt-6">
        <div className="mb-2 flex items-baseline justify-between">
          <div className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] ${labelText}`}>
            Approval confidence
            <span
              className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold tabular ${
                isLight ? "bg-black text-rh-lime" : "bg-rh-lime text-black"
              }`}
              title={`Logistic regression · ${(q.prediction.model.accuracy * 100).toFixed(1)}% acc · AUC ${q.prediction.model.auc.toFixed(2)}`}
            >
              LR
            </span>
          </div>
          <div className={`tabular text-sm font-bold ${isLight ? "text-black" : "text-rh-lime"}`}>
            <CountUp to={pct} duration={1.1} />%
          </div>
        </div>
        <div className={`h-2 overflow-hidden rounded-full ${barBg}`}>
          <motion.div
            initial={{ width: reduce ? `${pct}%` : 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
            className={`h-full rounded-full ${isLight ? "bg-black" : "bg-gradient-to-r from-rh-lime-dim to-rh-lime-bright"}`}
          />
        </div>
      </div>

      <ul className={`mt-5 space-y-2 text-[13px] ${reasonText}`}>
        {q.reasons.map((r, j) => (
          <li key={j} className="flex items-start gap-2">
            <span className={`mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full ${dotColor}`} />
            <span>{r}</span>
          </li>
        ))}
      </ul>

      <motion.button
        whileTap={{ scale: 0.98 }}
        whileHover={{ scale: 1.005 }}
        onClick={onApply}
        className={`mt-7 inline-flex w-full items-center justify-center gap-1.5 rounded-xl py-3 text-[15px] font-semibold transition ${
          best ? btnPrimary : btnSecondary
        }`}
      >
        Apply via OCEN <ArrowRight className="h-4 w-4" />
      </motion.button>
    </motion.article>
  );
}

function Row({ label, value, labelText }: { label: string; value: React.ReactNode; labelText: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className={labelText}>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
