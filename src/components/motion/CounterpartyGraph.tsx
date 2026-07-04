"use client";

import { motion } from "framer-motion";
import type { MSMEProfile } from "@/lib/mockData";

export function CounterpartyGraph({ profile }: { profile: MSMEProfile }) {
  const buyers = profile.topBuyers;
  const concentrationRisk = profile.topBuyerRevenueShare >= 0.5;
  const ringWarning = buyers.length <= 2 && buyers[0]?.revenueShare >= 0.9;

  const cx = 200;
  const cy = 200;
  const centerR = 40;
  const orbit = 120;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className="rounded-3xl border border-black/10 bg-white/70 p-6"
    >
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-black/60">
            UPI counterparty graph
          </div>
          <div className="mt-1 text-[16px] font-semibold text-black">
            Who your revenue comes from
          </div>
        </div>
        <div
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
            concentrationRisk ? "bg-rh-red/15 text-rh-red" : "bg-black/85 text-rh-lime"
          }`}
        >
          {concentrationRisk ? "Concentration risk" : "Healthy diversification"}
        </div>
      </div>

      <svg viewBox="-90 -30 580 470" className="mt-4 block w-full" preserveAspectRatio="xMidYMid meet">
        {/* orbit outline */}
        <circle cx={cx} cy={cy} r={orbit + 10} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="1" strokeDasharray="3 5" />

        {/* edges */}
        {buyers.map((b, i) => {
          const angle = (-90 + (i * 360) / buyers.length) * (Math.PI / 180);
          const bx = cx + Math.cos(angle) * orbit;
          const by = cy + Math.sin(angle) * orbit;
          const isHighest = b.revenueShare === Math.max(...buyers.map((x) => x.revenueShare));
          const edgeColor = isHighest && concentrationRisk ? "#FA5252" : "#1a3a6d";
          const edgeWidth = 1 + b.revenueShare * 14;
          return (
            <motion.line
              key={`e${i}`}
              x1={cx}
              y1={cy}
              x2={bx}
              y2={by}
              stroke={edgeColor}
              strokeOpacity={isHighest && concentrationRisk ? 0.85 : 0.55}
              strokeWidth={edgeWidth}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: isHighest && concentrationRisk ? 0.85 : 0.55 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 + i * 0.06 }}
            />
          );
        })}

        {/* buyer nodes */}
        {buyers.map((b, i) => {
          const angle = (-90 + (i * 360) / buyers.length) * (Math.PI / 180);
          const bx = cx + Math.cos(angle) * orbit;
          const by = cy + Math.sin(angle) * orbit;
          const isHighest = b.revenueShare === Math.max(...buyers.map((x) => x.revenueShare));
          const nodeR = 12 + b.revenueShare * 16;
          const fill = isHighest && concentrationRisk ? "#FA5252" : "#1a3a6d";
          const label = b.name.length > 28 ? b.name.slice(0, 26) + "…" : b.name;
          const isTop = by < cy - 20;
          const isBottom = by > cy + 20;
          const labelDx = bx < cx - 20 ? -nodeR - 8 : bx > cx + 20 ? nodeR + 8 : 0;
          const labelDy = isTop ? -nodeR - 24 : isBottom ? nodeR + 20 : -4;
          const pctDy = isTop ? -nodeR - 10 : isBottom ? nodeR + 32 : 12;
          const anchor = labelDx < 0 ? "end" : labelDx > 0 ? "start" : "middle";
          return (
            <motion.g
              key={`n${i}`}
              initial={{ opacity: 0, scale: 0.7 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <circle cx={bx} cy={by} r={nodeR} fill={fill} />
              <circle cx={bx} cy={by} r={nodeR - 3} fill="white" opacity="0.12" />
              <text
                x={bx + labelDx}
                y={by + labelDy}
                fontSize="10"
                fontFamily="var(--font-inter)"
                fontWeight="600"
                fill="#0a1329"
                textAnchor={anchor}
              >
                {label}
              </text>
              <text
                x={bx + labelDx}
                y={by + pctDy}
                fontSize="10"
                fontFamily="var(--font-inter)"
                fontWeight="700"
                fill={isHighest && concentrationRisk ? "#FA5252" : "#1a3a6d"}
                textAnchor={anchor}
              >
                {Math.round(b.revenueShare * 100)}%
              </text>
            </motion.g>
          );
        })}

        {/* central MSME node */}
        <motion.g
          initial={{ opacity: 0, scale: 0.6 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          <circle cx={cx} cy={cy} r={centerR} fill="#0a1329" />
          <circle cx={cx} cy={cy} r={centerR - 5} fill="#CCFF5E" opacity="0.15" />
          <text x={cx} y={cy - 3} textAnchor="middle" fontSize="10" fontFamily="var(--font-inter)" fontWeight="700" letterSpacing="1.5" fill="#CCFF5E">
            YOU
          </text>
          <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10" fontFamily="var(--font-inter)" fontWeight="600" fill="rgba(255,255,255,0.7)">
            {profile.tradeName.slice(0, 12)}
          </text>
        </motion.g>
      </svg>

      <div className="mt-3 grid gap-2 rounded-xl border border-black/10 bg-white/60 p-3 text-[13px] leading-relaxed text-black/70">
        <div>
          <span className="font-semibold text-black">Signal:</span>{" "}
          Top buyer accounts for{" "}
          <span className={`font-bold tabular ${concentrationRisk ? "text-rh-red" : "text-black"}`}>
            {Math.round(profile.topBuyerRevenueShare * 100)}%
          </span>{" "}
          of monthly revenue.
          {concentrationRisk && " Losing this buyer would break cash flow."}
        </div>
        {ringWarning && (
          <div className="text-rh-red">
            <span className="font-semibold">Ring flag:</span> {"<2 material counterparties — flagged for review."}
          </div>
        )}
      </div>
    </motion.div>
  );
}
