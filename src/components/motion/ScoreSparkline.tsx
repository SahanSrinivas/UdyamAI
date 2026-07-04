"use client";

import { motion } from "framer-motion";
import type { ScoreEvent } from "@/lib/mockData";

export function ScoreSparkline({
  history,
  lastEvent,
  lastRefreshedIso,
}: {
  history: number[];
  lastEvent: ScoreEvent;
  lastRefreshedIso: string;
}) {
  const w = 320;
  const h = 62;
  const pad = 4;

  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = Math.max(max - min, 40);
  const xs = history.map((_, i) => pad + (i / (history.length - 1)) * (w - pad * 2));
  const ys = history.map((v) => pad + (1 - (v - min) / range) * (h - pad * 2));
  const path = xs.map((x, i) => `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${ys[i].toFixed(2)}`).join(" ");
  const areaPath = `${path} L ${xs[xs.length - 1].toFixed(2)} ${h - pad} L ${xs[0].toFixed(2)} ${h - pad} Z`;

  const positive = lastEvent.delta >= 0;
  const refreshed = new Date(lastRefreshedIso);
  const now = Date.now();
  const minsAgo = Math.max(1, Math.round((now - refreshed.getTime()) / 60000));
  const refreshedLabel = minsAgo < 60 ? `${minsAgo} min ago` : `${Math.round(minsAgo / 60)} hours ago`;

  return (
    <div className="rounded-2xl border border-line-strong bg-base-900 p-5 shadow-card">
      <div className="flex items-baseline justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
          6-month score history
        </div>
        <div className="inline-flex items-center gap-1.5 text-[11px] tabular text-white/60">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rh-lime" />
          Refreshed {refreshedLabel}
        </div>
      </div>

      <div className="relative mt-3">
        <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="block">
          <defs>
            <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#CCFF5E" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#CCFF5E" stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path
            d={areaPath}
            fill="url(#spark-fill)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          />
          <motion.path
            d={path}
            fill="none"
            stroke="#CCFF5E"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          />
          <motion.circle
            cx={xs[xs.length - 1]}
            cy={ys[ys.length - 1]}
            r="3.5"
            fill="#CCFF5E"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.4, type: "spring", stiffness: 320, damping: 24 }}
          />
        </svg>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.4 }}
        className="mt-3 flex items-center gap-2 rounded-xl border border-line bg-base-800/70 p-3"
      >
        <div
          className={`rounded-md px-2 py-0.5 text-[11px] font-bold tabular ${
            positive ? "bg-rh-lime text-black" : "bg-rh-red/20 text-rh-red"
          }`}
        >
          {positive ? "+" : ""}
          {lastEvent.delta}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-medium text-white">{lastEvent.label}</div>
          <div className="text-[11px] text-white/50">Event-triggered refresh · {lastEvent.when}</div>
        </div>
      </motion.div>
    </div>
  );
}
