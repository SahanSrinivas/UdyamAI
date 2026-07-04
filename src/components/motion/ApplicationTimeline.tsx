"use client";

import { motion } from "framer-motion";
import { Check, X, MinusCircle, TrendingUp } from "lucide-react";
import { fadeUp, staggerParent } from "@/lib/motion";
import type { HistoricalApplication } from "@/lib/applicationHistory";
import { formatINR } from "@/lib/utils";

export function ApplicationTimeline({
  history,
  currentScore,
}: {
  history: HistoricalApplication[];
  currentScore: number;
}) {
  const rejected = history.filter((h) => h.decision.kind === "rejected").length;
  const approved = history.filter((h) => h.decision.kind === "approved").length;

  return (
    <motion.div
      variants={staggerParent(0.1, 0.05)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      className="rounded-3xl border border-black/10 bg-white/70 p-6"
    >
      <motion.div variants={fadeUp} className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-black/60">
            Your 12-month application history
          </div>
          <h3 className="mt-2 font-serif text-[34px] leading-tight text-black">
            Before UdyamAI · {rejected} rejections, {approved} approvals.
          </h3>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white/80 px-4 py-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-black/50">Today</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="tabular text-[26px] font-serif text-black">{currentScore}</span>
            <span className="inline-flex items-center gap-1 text-[13px] font-bold text-rh-lime-dim">
              <TrendingUp className="h-3.5 w-3.5 text-black" />
              Loan-ready
            </span>
          </div>
        </div>
      </motion.div>

      <div className="relative mt-8 border-l-2 border-dashed border-black/15 pl-6">
        {history.length === 0 && (
          <div className="text-[13px] text-black/60">No prior applications recorded.</div>
        )}
        {history.map((h, i) => {
          const isRej = h.decision.kind === "rejected";
          const isApp = h.decision.kind === "approved";
          const taken = h.decision.kind === "approved" && h.decision.taken;
          const color = isRej ? "#dc2626" : isApp ? (taken ? "#16a34a" : "#f59e0b") : "#94a3b8";
          return (
            <motion.div variants={fadeUp} key={h.id} className="relative mb-6 last:mb-0">
              <span
                className="absolute -left-[35px] top-1 grid h-7 w-7 place-items-center rounded-full border-2 border-white shadow-md"
                style={{ background: color }}
              >
                {isRej ? <X className="h-3.5 w-3.5 text-white" /> :
                 isApp ? <Check className="h-3.5 w-3.5 text-white" /> :
                 <MinusCircle className="h-3.5 w-3.5 text-white" />}
              </span>

              <div className="rounded-2xl border border-black/10 bg-white p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2">
                      <span className="font-serif text-[18px] leading-none text-black">
                        {h.lender}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-black/50">
                        {h.monthsAgo === 0 ? "This month" : `${h.monthsAgo} mo ago`}
                      </span>
                    </div>
                    <div className="mt-1.5 text-[12px] text-black/60">
                      {h.date} · Requested{" "}
                      <span className="font-semibold text-black">{formatINR(h.amountRequested)}</span> ·{" "}
                      Score at time <span className="font-bold tabular text-black">{h.scoreAtTime}</span>
                    </div>
                  </div>
                  <div>
                    <span
                      className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"
                      style={{ background: color + "22", color }}
                    >
                      {isRej ? "Rejected" :
                       isApp ? (taken ? "Approved · Taken" : "Approved · Declined") :
                       "Withdrawn"}
                    </span>
                  </div>
                </div>

                {h.decision.kind === "rejected" && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-[12px] text-red-900">
                    <span className="font-bold">Reason:</span> {h.decision.reason}
                  </div>
                )}
                {h.decision.kind === "approved" && !h.decision.taken && (
                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-900">
                    Sanction {formatINR(h.decision.sanctioned)} at {h.decision.ratePct.toFixed(2)}% ·{" "}
                    <span className="font-bold">Declined:</span> {h.decision.declinedReason}
                  </div>
                )}
                {h.decision.kind === "approved" && h.decision.taken && (
                  <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3 text-[12px] text-green-900">
                    Sanction {formatINR(h.decision.sanctioned)} at {h.decision.ratePct.toFixed(2)}% · Disbursed
                  </div>
                )}
                {h.decision.kind === "withdrawn" && (
                  <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-[12px] text-gray-700">
                    {h.decision.reason}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
