"use client";

import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, FileText } from "lucide-react";
import type { ItrRecord } from "@/lib/agami/itrData";
import { formatINR } from "@/lib/utils";

export function ItrVerifiedChip({
  itr,
  impact,
  status,
}: {
  itr: ItrRecord;
  impact: string;
  status: "positive" | "warning" | "neutral";
}) {
  const isWarn = status === "warning";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border-2 border-black/10 bg-white/80 p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-black px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-rh-lime">
            <FileText className="h-3 w-3" />
            ITR verified · Income Tax Dept
          </div>
          <div className="mt-3 font-serif text-[24px] leading-tight text-black">
            {itr.form} · AY {itr.assessmentYear}
          </div>
          <div className="mt-1 text-[12px] text-black/60">
            PAN <span className="font-mono font-semibold text-black">{itr.pan}</span> ·{" "}
            {itr.entityType} · Filed{" "}
            {itr.filingDate ? (
              <span className={isWarn ? "font-semibold text-amber-700" : ""}>
                {itr.filingDate}
                {itr.lateFiling && " · late"}
              </span>
            ) : "—"}
          </div>
        </div>
        <div
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
            isWarn ? "bg-amber-100 text-amber-700" :
            status === "positive" ? "bg-green-100 text-green-700" :
            "bg-black/[0.05] text-black/60"
          }`}
        >
          {isWarn ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
          {status}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-black/5 bg-black/[0.02] p-3 text-[12px]">
        <div>
          <div className="text-[9px] font-bold uppercase tracking-widest text-black/50">Gross income</div>
          <div className="mt-1 tabular font-serif text-[18px] leading-none text-black">
            {formatINR(itr.income)}
          </div>
        </div>
        <div>
          <div className="text-[9px] font-bold uppercase tracking-widest text-black/50">Tax paid</div>
          <div className="mt-1 tabular font-serif text-[18px] leading-none text-black">
            {formatINR(itr.tax + itr.cess)}
          </div>
        </div>
        <div>
          <div className="text-[9px] font-bold uppercase tracking-widest text-black/50">Effective rate</div>
          <div className="mt-1 tabular font-serif text-[18px] leading-none text-black">
            {itr.income ? (((itr.tax + itr.cess) / itr.income) * 100).toFixed(1) : "—"}%
          </div>
        </div>
      </div>

      <div className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-black">
        <span className={`h-1.5 w-1.5 rounded-full ${
          status === "positive" ? "bg-green-500" :
          status === "warning" ? "bg-amber-500" :
          "bg-black/40"
        }`} />
        Impact: {impact}
      </div>

      <div className="mt-3 text-[10px] text-black/50">
        Data source · AgamiAI Indian-Income-Tax-Returns (200-row open dataset, Apache 2.0)
      </div>
    </motion.div>
  );
}
