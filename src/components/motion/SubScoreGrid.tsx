"use client";

import { motion, useReducedMotion } from "framer-motion";
import { fadeUp, staggerParent } from "@/lib/motion";
import type { SubScore } from "@/lib/scoreEngine";
import { CountUp } from "./CountUp";

export function SubScoreGrid({ subScores, theme = "dark" }: { subScores: SubScore[]; theme?: "dark" | "light" }) {
  const reduce = useReducedMotion();
  const isLight = theme === "light";
  return (
    <motion.div
      variants={staggerParent(0.35, 0.08)}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
    >
      {subScores.map((s) => {
        const pct = Math.min(100, s.score / 10);
        return (
          <motion.div
            key={s.key}
            variants={fadeUp}
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className={`group rounded-2xl border p-5 ${
              isLight ? "border-black/10 bg-white/70" : "border-line bg-base-900/70"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className={`text-[12px] font-semibold uppercase tracking-[0.14em] ${isLight ? "text-black/60" : "text-muted"}`}>
                {s.label}
              </div>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} aria-hidden />
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <div className={`tabular text-3xl font-bold leading-none tracking-tight ${isLight ? "text-black" : "text-base-50"}`}>
                <CountUp to={s.score} duration={1.1} />
              </div>
              <div className={`text-xs ${isLight ? "text-black/50" : "text-muted-soft"}`}>/1000</div>
            </div>
            <div className={`mt-4 h-1.5 overflow-hidden rounded-full ${isLight ? "bg-black/10" : "bg-base-800"}`}>
              <motion.div
                initial={{ width: reduce ? `${pct}%` : 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
                className="h-full rounded-full"
                style={{ background: s.color }}
              />
            </div>
            <div className={`mt-3 text-[12px] leading-snug ${isLight ? "text-black/60" : "text-muted-soft"}`}>{s.summary}</div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
