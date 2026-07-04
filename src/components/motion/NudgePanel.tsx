"use client";

import { motion } from "framer-motion";
import { CheckCircle2, TrendingDown, TrendingUp } from "lucide-react";
import { fadeUp, staggerParent } from "@/lib/motion";
import type { Nudge } from "@/lib/scoreEngine";

export function NudgePanel({ drags, lifts }: { drags: Nudge[]; lifts: Nudge[] }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Panel
        title="What's holding you back"
        icon={<TrendingDown className="h-3.5 w-3.5" />}
        accent="red"
        items={drags}
        emptyLabel="Nothing material. You are loan-ready."
        sign="-"
      />
      <Panel
        title="Do this — score goes up"
        icon={<TrendingUp className="h-3.5 w-3.5" />}
        accent="green"
        items={lifts}
        emptyLabel="Keep doing what you're doing."
        sign="+"
      />
    </div>
  );
}

function Panel({
  title,
  icon,
  accent,
  items,
  emptyLabel,
  sign,
}: {
  title: string;
  icon: React.ReactNode;
  accent: "green" | "red";
  items: Nudge[];
  emptyLabel: string;
  sign: "+" | "-";
}) {
  const isLift = accent === "green";

  const panelBg = isLift
    ? "border-rh-lime/25 bg-gradient-to-br from-[#1a2a10] to-[#0e1608]"
    : "border-rh-red/25 bg-gradient-to-br from-[#2a1010] to-[#170808]";

  const chipStyle = isLift
    ? "bg-rh-lime/15 text-rh-lime"
    : "bg-rh-red/15 text-rh-red";

  const cardBg = isLift
    ? "bg-rh-lime/[0.06] border-rh-lime/20 hover:border-rh-lime/40"
    : "bg-rh-red/[0.06] border-rh-red/20 hover:border-rh-red/40";

  const catText = isLift ? "text-rh-lime" : "text-rh-red";
  const impactChip = isLift
    ? "bg-rh-lime text-black"
    : "bg-rh-red text-white";

  return (
    <motion.section
      variants={staggerParent(0.15, 0.08)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      className={`rounded-3xl border p-7 ${panelBg}`}
    >
      <motion.div
        variants={fadeUp}
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-semibold uppercase tracking-[0.14em] ${chipStyle}`}
      >
        {icon}
        {title}
      </motion.div>

      <div className="mt-6 space-y-4">
        {items.length === 0 ? (
          <motion.div
            variants={fadeUp}
            className="rounded-2xl border border-rh-lime/30 bg-rh-lime/10 p-5 text-[15px] text-rh-lime"
          >
            <CheckCircle2 className="mb-2 h-5 w-5" />
            {emptyLabel}
          </motion.div>
        ) : (
          items.map((n, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              whileHover={{ x: 3 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className={`group relative overflow-hidden rounded-2xl border p-5 transition ${cardBg}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className={`text-[12px] font-semibold uppercase tracking-[0.14em] ${catText}`}>
                    {n.category} · {n.timeframe}
                  </div>
                  <div className="mt-2 text-[17px] font-semibold leading-snug text-white">{n.title}</div>
                  <div className="mt-2 text-[14px] leading-relaxed text-white/70">{n.detail}</div>
                </div>
                <div
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-bold tabular ${impactChip}`}
                >
                  {sign}
                  {n.impact}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.section>
  );
}
