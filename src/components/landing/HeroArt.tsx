"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * MSME Health Wheel — Ashoka-chakra-inspired hero visual.
 * Clean layout: chakra wheel outer, brand score arc, central globe with the number.
 */
export function HeroArt() {
  const reduce = useReducedMotion();

  const OUTER_R = 300;
  const RING_R = 262;
  const ARC_R = 220;
  const CORE_R = 175;
  const SPOKE_COUNT = 24;

  const polar = (r: number, deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return { x: r * Math.cos(rad), y: r * Math.sin(rad) };
  };

  const arcCirc = 2 * Math.PI * ARC_R;

  return (
    <div className="relative aspect-square w-full max-w-[820px]">
      <div className="pointer-events-none absolute inset-x-0 bottom-6 h-24 rounded-[50%] bg-black/10 blur-2xl" aria-hidden />

      <svg viewBox="-360 -360 720 720" className="h-full w-full">
        <defs>
          <radialGradient id="coreGrad" cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="55%" stopColor="#f5f1ea" />
            <stop offset="100%" stopColor="#d8ccb0" />
          </radialGradient>
          <radialGradient id="scoreGlow" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#CCFF5E" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#CCFF5E" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* soft glow behind wheel */}
        <circle cx="0" cy="0" r={OUTER_R} fill="url(#scoreGlow)" />

        {/* outer chakra rim */}
        <motion.circle
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          cx="0"
          cy="0"
          r={OUTER_R}
          fill="none"
          stroke="#1a3a6d"
          strokeWidth="5"
        />
        <motion.circle
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.55 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          cx="0"
          cy="0"
          r={OUTER_R - 10}
          fill="none"
          stroke="#1a3a6d"
          strokeWidth="1.25"
        />

        {/* 24 chakra spokes (Ashoka-chakra-inspired), slowly rotating */}
        <motion.g
          animate={reduce ? undefined : { rotate: 360 }}
          transition={{ duration: 240, ease: "linear", repeat: Infinity }}
          style={{ transformOrigin: "0 0" }}
        >
          {Array.from({ length: SPOKE_COUNT }).map((_, i) => {
            const angle = (i * 360) / SPOKE_COUNT;
            const inner = polar(RING_R - 8, angle);
            const outer = polar(OUTER_R - 14, angle);
            return (
              <motion.line
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.55 }}
                transition={{ delay: 0.3 + i * 0.015, duration: 0.4 }}
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke="#1a3a6d"
                strokeWidth="2"
                strokeLinecap="round"
              />
            );
          })}
          {Array.from({ length: SPOKE_COUNT }).map((_, i) => {
            const angle = (i * 360) / SPOKE_COUNT;
            const p = polar(RING_R - 8, angle);
            return (
              <motion.circle
                key={`h${i}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.85 }}
                transition={{ delay: 0.35 + i * 0.015, duration: 0.4 }}
                cx={p.x}
                cy={p.y}
                r="2"
                fill="#1a3a6d"
              />
            );
          })}
        </motion.g>

        {/* inner chakra rim */}
        <motion.circle
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          cx="0"
          cy="0"
          r={RING_R}
          fill="none"
          stroke="#1a3a6d"
          strokeWidth="2.5"
        />

        {/* brand score arc — sits in the ring band, matches UdyamAI mark */}
        <motion.circle
          initial={{ strokeDashoffset: arcCirc }}
          animate={{ strokeDashoffset: arcCirc * (1 - 0.847) }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.7 }}
          cx="0"
          cy="0"
          r={ARC_R}
          fill="none"
          stroke="#111111"
          strokeWidth="18"
          strokeLinecap="round"
          strokeDasharray={arcCirc}
          transform="rotate(-90)"
        />
        <motion.circle
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.1, duration: 0.5 }}
          cx="0"
          cy="0"
          r={ARC_R}
          fill="none"
          stroke="#CCFF5E"
          strokeWidth="22"
          strokeLinecap="round"
          strokeDasharray={`36 ${arcCirc - 36}`}
          transform="rotate(215)"
        />

        {/* central globe */}
        <motion.circle
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          cx="0"
          cy="0"
          r={CORE_R}
          fill="url(#coreGrad)"
          stroke="#1a3a6d"
          strokeWidth="2"
        />

        {/* MSME preline */}
        <motion.text
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 0.85, y: 0 }}
          transition={{ delay: 1.1, duration: 0.5 }}
          x="0"
          y="-108"
          textAnchor="middle"
          fontSize="15"
          fontFamily="var(--font-inter)"
          fontWeight="700"
          letterSpacing="6"
          fill="#1a3a6d"
        >
          MSME · LIVE
        </motion.text>

        {/* the big score number */}
        <motion.text
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          x="0"
          y="26"
          textAnchor="middle"
          fontSize="130"
          fontFamily="var(--font-serif)"
          fill="#0a1329"
          fontWeight="400"
          letterSpacing="-3"
        >
          847
        </motion.text>

        {/* footer caption inside globe */}
        <motion.text
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.75 }}
          transition={{ delay: 1.35, duration: 0.5 }}
          x="0"
          y="72"
          textAnchor="middle"
          fontSize="13"
          fontFamily="var(--font-inter)"
          fontWeight="600"
          letterSpacing="4"
          fill="#1a3a6d"
        >
          HEALTH SCORE · OF 1000
        </motion.text>

        {/* Indian tricolor micro-bar at the very bottom, outside wheel */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.4, duration: 0.5 }}
          transform="translate(0 335)"
        >
          <rect x="-27" y="-3.5" width="18" height="7" fill="#ff9933" rx="1" />
          <rect x="-9" y="-3.5" width="18" height="7" fill="#ffffff" stroke="#1a3a6d" strokeWidth="0.6" rx="1" />
          <rect x="9" y="-3.5" width="18" height="7" fill="#138808" rx="1" />
          <circle cx="0" cy="0" r="1.6" fill="#1a3a6d" />
        </motion.g>
      </svg>
    </div>
  );
}
