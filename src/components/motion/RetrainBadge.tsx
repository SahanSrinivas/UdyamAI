"use client";

import { motion } from "framer-motion";
import { Activity, Database } from "lucide-react";
import { fadeUp, staggerParent } from "@/lib/motion";
import type { RetrainRun } from "@/lib/agami/lrRetrain";

export function RetrainBadge({ runs }: { runs: RetrainRun[] }) {
  if (runs.length === 0) return null;
  const latest = runs.reduce((a, b) => (a.started_at > b.started_at ? a : b));
  const when = new Date(latest.started_at);
  const sampleCount = latest.sample_count;

  return (
    <motion.div
      variants={staggerParent(0.08, 0.05)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      className="rounded-3xl border border-black bg-black p-6 text-white shadow-cream-card"
    >
      <motion.div variants={fadeUp} className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-rh-lime px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-black">
            <Activity className="h-3.5 w-3.5" />
            Live retrain · AWS RDS
          </div>
          <h3 className="mt-3 font-serif text-[28px] leading-tight tracking-tight sm:text-[34px]">
            Trained on <span className="text-rh-lime tabular">{sampleCount}</span> real MSME accounts.
          </h3>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-white/70">
            The LR calibrator retrains on-demand against{" "}
            <span className="font-semibold text-white">AgamiAI&rsquo;s open bank-statement dataset</span>{" "}
            in AWS Aurora Serverless v2. Every retrain is persisted to{" "}
            <span className="font-mono text-rh-lime">lr_training_runs</span> so you can audit drift.
          </p>
        </div>
        <div className="hidden shrink-0 rounded-2xl border border-white/20 bg-white/5 px-4 py-3 sm:block">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-rh-lime">
            <Database className="h-3 w-3" /> Last run
          </div>
          <div className="mt-1 font-mono text-[11px] text-white/70">
            {when.toISOString().slice(0, 16).replace("T", " ")} UTC
          </div>
        </div>
      </motion.div>

      <motion.div variants={staggerParent(0.06, 0.05)} className="mt-6 grid gap-3 sm:grid-cols-3">
        {runs.map((r) => (
          <motion.div
            key={r.lender}
            variants={fadeUp}
            className="rounded-2xl border border-white/15 bg-white/5 p-4"
          >
            <div className="font-serif text-[18px]">{r.lender}</div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <Stat label="AUC" value={r.auc.toFixed(3)} highlight />
              <Stat label="Acc" value={(r.accuracy * 100).toFixed(0) + "%"} />
              <Stat label="N" value={r.sample_count.toString()} />
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="text-[9px] font-bold uppercase tracking-widest text-white/50">{label}</div>
      <div className={`mt-0.5 tabular text-[15px] font-bold ${highlight ? "text-rh-lime" : "text-white"}`}>
        {value}
      </div>
    </div>
  );
}
