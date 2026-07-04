"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CountUp } from "./CountUp";

const bandColor: Record<string, string> = {
  Excellent: "#00D93E",
  Strong: "#00D93E",
  Fair: "#FFB400",
  Weak: "#FA5252",
};

export function ScoreCard({ overall, band }: { overall: number; band: string }) {
  const reduce = useReducedMotion();
  const pct = overall / 1000;
  const R = 82;
  const C = 2 * Math.PI * R;
  const color = bandColor[band] ?? "#00D93E";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl border border-line-strong bg-base-900 p-6 shadow-card"
    >
      <div className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full blur-3xl" style={{ background: `${color}33` }} aria-hidden />

      <div className="relative flex items-center justify-between">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">
            Overall Health Score
          </div>
          <div className="mt-1 text-xs text-muted-soft tabular">Updated today · 09:42 IST</div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9, type: "spring", stiffness: 220, damping: 20 }}
          className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest"
          style={{ background: `${color}1F`, color }}
        >
          {band}
        </motion.div>
      </div>

      <div className="relative mx-auto mt-6 grid h-60 w-60 place-items-center">
        <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
          <circle cx="100" cy="100" r={R} stroke="rgba(255,255,255,0.06)" strokeWidth="14" fill="none" />
          <motion.circle
            cx="100"
            cy="100"
            r={R}
            stroke={color}
            strokeWidth="14"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={C}
            initial={{ strokeDashoffset: reduce ? C - pct * C : C }}
            animate={{ strokeDashoffset: C - pct * C }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          />
        </svg>
        <div className="absolute grid place-items-center text-center">
          <div className="tabular text-6xl font-black leading-none tracking-tightest text-base-50">
            <CountUp to={overall} duration={1.4} />
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-muted-soft">of 1000</div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.4 }}
        className="mt-6 rounded-2xl border border-line bg-base-800/40 p-3 text-xs leading-relaxed text-muted-strong"
      >
        Refreshes automatically from Account Aggregator feeds. Every point you gain translates
        to a lower quoted rate.
      </motion.div>
    </motion.div>
  );
}
