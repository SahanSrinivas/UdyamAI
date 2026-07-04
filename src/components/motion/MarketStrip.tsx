"use client";

import { motion } from "framer-motion";
import type { MarketSnapshot } from "@/lib/marketData";

export function MarketStrip({ snap }: { snap: MarketSnapshot }) {
  const items = [
    { label: "USD/INR", value: snap.usdInr.rate.toFixed(2), delta: snap.usdInr.delta, deltaSuffix: "" },
    { label: "RBI Repo", value: snap.repoRate.toFixed(2) + "%", delta: null },
    { label: "1Y MCLR (SBI)", value: snap.mclr.toFixed(2) + "%", delta: null },
    { label: "10Y G-Sec", value: snap.gSecTenYear.toFixed(2) + "%", delta: null },
    { label: "IDBI Bank", value: "₹" + snap.idbi.last.toFixed(2), delta: snap.idbi.deltaPct, deltaSuffix: "%" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="border-b border-line bg-base-950/90 backdrop-blur"
    >
      <div className="mx-auto flex max-w-[1600px] items-center gap-6 overflow-x-auto px-6 py-3 text-[13px] tabular">
        <span className="inline-flex items-center gap-2 whitespace-nowrap font-semibold uppercase tracking-[0.14em] text-white/85">
          <span className={`h-2 w-2 rounded-full ${snap.source === "live" ? "bg-rh-lime animate-pulse" : "bg-white/40"}`} />
          {snap.source === "live" ? "Live · India markets" : "Cached · India markets"}
        </span>
        {items.map((it) => (
          <span key={it.label} className="inline-flex items-center gap-2 whitespace-nowrap">
            <span className="text-white/60">{it.label}</span>
            <span className="font-semibold text-white">{it.value}</span>
            {it.delta !== null && it.delta !== undefined && (
              <span className={`font-semibold ${it.delta >= 0 ? "text-rh-lime" : "text-rh-red"}`}>
                {it.delta >= 0 ? "+" : ""}
                {it.delta.toFixed(2)}
                {it.deltaSuffix}
              </span>
            )}
          </span>
        ))}
      </div>
    </motion.div>
  );
}
