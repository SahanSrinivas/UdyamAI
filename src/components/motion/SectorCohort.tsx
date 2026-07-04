"use client";

import { motion } from "framer-motion";
import type { MSMEProfile } from "@/lib/mockData";

export function SectorCohort({ profile }: { profile: MSMEProfile }) {
  const pct = profile.sectorCohortPercentile;
  const quartile = pct >= 75 ? "TOP" : pct >= 50 ? "UPPER" : pct >= 25 ? "MID" : "BOTTOM";
  const quartileColor = pct >= 75 ? "text-rh-lime" : pct >= 50 ? "text-black" : pct >= 25 ? "text-rh-amber" : "text-rh-red";
  const barColor = pct >= 75 ? "bg-rh-lime" : pct >= 50 ? "bg-black" : pct >= 25 ? "bg-rh-amber" : "bg-rh-red";
  const sectorLabel = `${profile.sector} in ${profile.city.split(",")[0]}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="rounded-2xl border border-black/10 bg-white/70 p-5"
    >
      <div className="flex items-baseline justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/60">
          Sector cohort benchmark
        </div>
        <div className={`text-[11px] font-bold uppercase tracking-widest ${quartileColor}`}>{quartile} QUARTILE</div>
      </div>
      <div className="mt-2 text-[15px] leading-snug text-black/80">
        You rank at the{" "}
        <span className="font-bold text-black tabular">{pct}th percentile</span> against{" "}
        <span className="font-semibold text-black">{sectorLabel}</span> peers.
      </div>

      <div className="mt-4">
        <div className="relative h-2 overflow-hidden rounded-full bg-black/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
            className={`h-full rounded-full ${barColor}`}
          />
          {/* quartile ticks */}
          {[25, 50, 75].map((t) => (
            <span key={t} className="absolute top-0 h-full w-px bg-black/25" style={{ left: `${t}%` }} />
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[10px] font-mono text-black/40">
          <span>0</span>
          <span>25</span>
          <span>50</span>
          <span>75</span>
          <span>100</span>
        </div>
      </div>
    </motion.div>
  );
}
