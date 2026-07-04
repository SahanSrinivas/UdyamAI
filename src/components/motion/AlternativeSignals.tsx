"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Check, Cpu, Fingerprint, Globe, Radio, Ship, Zap } from "lucide-react";
import { fadeUp, staggerParent } from "@/lib/motion";
import type { AlternativeSignal, SignalCategory, SignalStatus } from "@/lib/sectorSignals";

const CATEGORY_META: Record<SignalCategory, { icon: React.ReactNode; label: string }> = {
  usage: { icon: <Zap className="h-4 w-4" />, label: "Usage" },
  compliance: { icon: <Fingerprint className="h-4 w-4" />, label: "Compliance" },
  presence: { icon: <Globe className="h-4 w-4" />, label: "Digital presence" },
  trade: { icon: <Ship className="h-4 w-4" />, label: "Trade" },
};

const STATUS_STYLES: Record<SignalStatus, { icon: React.ReactNode; color: string; bg: string; ring: string }> = {
  positive: {
    icon: <Check className="h-3.5 w-3.5" />,
    color: "text-green-700", bg: "bg-green-50", ring: "border-green-200",
  },
  neutral: {
    icon: <Radio className="h-3.5 w-3.5" />,
    color: "text-black/60", bg: "bg-black/[0.04]", ring: "border-black/10",
  },
  warning: {
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    color: "text-amber-700", bg: "bg-amber-50", ring: "border-amber-200",
  },
};

export function AlternativeSignals({
  sector,
  signals,
}: {
  sector: string;
  signals: AlternativeSignal[];
}) {
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
            <Cpu className="h-3.5 w-3.5" />
            Sector-adaptive signals
          </div>
          <h3 className="mt-3 font-serif text-[34px] leading-tight tracking-tight text-black sm:text-[42px]">
            Beyond GST · UPI · AA.
          </h3>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-black/70">
            Signals we pull specifically for{" "}
            <span className="font-semibold text-black">{sector}</span> — power draw, sector
            certifications, trade data, and digital presence. Auto-detected from the MSME&rsquo;s
            NIC code · augments the base 4-sub-score composite.
          </p>
        </div>
        <div className="hidden shrink-0 rounded-2xl border border-black/10 bg-white/80 px-4 py-3 sm:block">
          <div className="text-[10px] font-bold uppercase tracking-widest text-black/50">Signal categories</div>
          <div className="mt-1.5 flex flex-wrap gap-2 text-[11px] font-semibold text-black">
            {Object.entries(CATEGORY_META).map(([key, meta]) => (
              <span key={key} className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white px-2 py-0.5">
                {meta.icon}
                {meta.label}
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div variants={staggerParent(0.05, 0.05)} className="mt-8 grid gap-4 md:grid-cols-2">
        {signals.map((s) => {
          const cat = CATEGORY_META[s.category];
          const st = STATUS_STYLES[s.status];
          return (
            <motion.div
              key={s.key}
              variants={fadeUp}
              whileHover={{ y: -3 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className={`overflow-hidden rounded-2xl border-2 bg-white p-5 ${st.ring}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-black/60">
                    <span className={`grid h-6 w-6 place-items-center rounded-md ${st.bg} ${st.color}`}>{cat.icon}</span>
                    {cat.label}
                  </div>
                  <div className="mt-2.5 text-[16px] font-semibold text-black leading-tight">
                    {s.label}
                  </div>
                  <div className="mt-1 font-mono text-[11px] text-black/50">Source · {s.source}</div>
                </div>
                <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${st.bg} ${st.color}`}>
                  {st.icon}
                  {s.status}
                </span>
              </div>

              <div className="mt-4 rounded-xl border border-black/5 bg-black/[0.02] p-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-black/40">Value</div>
                <div className="mt-1 font-mono text-[13px] font-semibold text-black">{s.value}</div>
              </div>

              <div className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-black">
                <span className={`h-1.5 w-1.5 rounded-full ${s.status === "positive" ? "bg-green-500" : s.status === "warning" ? "bg-amber-500" : "bg-black/40"}`} />
                Impact: {s.impact}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div variants={fadeUp} className="mt-6 rounded-2xl border-2 border-black/10 bg-white/80 p-4 text-[12px] leading-relaxed text-black/70">
        <span className="font-semibold text-black">Framework:</span> UdyamAI detects the MSME&rsquo;s
        vertical from GSTIN → NIC code, then queries the sector-specific signal providers listed
        above. The signals augment the base composite score with additional dimensions banks
        traditionally can&rsquo;t see — power consumption verifying real operations, sector
        certifications verifying compliance depth, digital presence verifying legitimacy.
        <span className="mt-1 block text-black/60">
          Currently covers 10 verticals · Manufacturing · Textile · Auto · Precision · Handloom ·
          Leather · Retail · Agri · Food · Chemical · Construction. Non-mapped sectors get 4
          sector-agnostic baseline signals.
        </span>
      </motion.div>
    </motion.section>
  );
}
