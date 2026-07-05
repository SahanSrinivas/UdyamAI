"use client";

import { motion } from "framer-motion";
import { AlertOctagon, Radio } from "lucide-react";
import { fadeUp, staggerParent } from "@/lib/motion";
import type { BounceAlert } from "@/lib/agami/statements";
import { formatINR } from "@/lib/utils";

export function BounceAlertsPanel({ alerts }: { alerts: BounceAlert[] }) {
  return (
    <motion.section
      variants={staggerParent(0.1, 0.05)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      className="rounded-3xl border-2 border-red-300 bg-white p-7 shadow-cream-card"
    >
      <motion.div variants={fadeUp} className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-red-600 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white">
            <AlertOctagon className="h-3.5 w-3.5" />
            {alerts.length} Live bounce{alerts.length === 1 ? "" : "s"}
          </div>
          <h3 className="mt-3 font-serif text-[34px] leading-tight tracking-tight text-black sm:text-[42px]">
            Post-sanction monitoring · real.
          </h3>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-black/70">
            Every sanctioned MSME&rsquo;s post-disbursement AA feed is scanned nightly. When a NACH /
            cheque bounces, we surface it here <span className="font-semibold text-black">before</span> it
            becomes a 30-day DPD.
          </p>
        </div>
        <div className="hidden shrink-0 rounded-2xl border border-black/10 bg-white/80 px-4 py-3 sm:block">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-green-700">
            <Radio className="h-3 w-3 animate-pulse" /> Live feed
          </div>
          <div className="mt-1 font-mono text-[11px] text-black/60">
            agami_transactions · failed=TRUE
          </div>
        </div>
      </motion.div>

      <motion.div variants={staggerParent(0.05, 0.05)} className="mt-6 space-y-2">
        {alerts.length === 0 ? (
          <motion.div variants={fadeUp} className="rounded-2xl border border-dashed border-black/15 bg-black/[0.02] p-8 text-center text-[13px] text-black/60">
            No bounces in the current window · portfolio is clean.
          </motion.div>
        ) : (
          alerts.map((b) => (
            <motion.div
              key={`${b.accountId}-${b.txnDate}-${b.description}`}
              variants={fadeUp}
              whileHover={{ x: 3 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className="rounded-2xl border border-red-200 bg-red-50/60 p-4"
            >
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,2fr)_120px_100px] sm:items-center">
                <div>
                  <div className="font-semibold text-black">{b.accountHolder}</div>
                  <div className="mt-0.5 text-[11px] text-black/60">
                    {b.bankName} · <span className="font-mono">****{b.accountId.slice(-4)}</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-red-700">
                    {b.txnType} bounce
                  </div>
                  <div className="mt-0.5 truncate font-mono text-[11px] text-black/70" title={b.description}>
                    {b.counterparty ?? b.description.slice(0, 80)}
                  </div>
                </div>
                <div className="text-right sm:text-left">
                  <div className="tabular text-[15px] font-bold text-red-700">
                    {formatINR(b.amount)}
                  </div>
                  <div className="text-[10px] text-black/50">reversed</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-bold uppercase tracking-widest text-black/50">
                    Detected
                  </div>
                  <div className="mt-0.5 tabular text-[12px] text-black">{b.txnDate}</div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>

      <motion.div variants={fadeUp} className="mt-5 rounded-xl border border-black/10 bg-white/80 p-3 text-[11px] text-black/60">
        <span className="font-semibold text-black">Rail:</span> post-sanction AA consent · webhook
        fires within 6 hours of the bounce hitting the borrower&rsquo;s bank statement.{" "}
        <span className="font-semibold text-black">Currently powered by AgamiAI dataset —</span>{" "}
        production ingests the same shape via Finvu Utility FIP.
      </motion.div>
    </motion.section>
  );
}
