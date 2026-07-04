"use client";

import { motion } from "framer-motion";

export function ExplanationCard({ text, theme = "dark" }: { text: string; theme?: "dark" | "light" }) {
  const isLight = theme === "light";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`relative overflow-hidden rounded-3xl border p-7 ${
        isLight
          ? "border-black/10 bg-white/70"
          : "border-line-strong bg-base-900"
      }`}
    >
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.15 }}
        className={`mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.18em] ${
          isLight ? "bg-black text-rh-lime" : "bg-rh-lime-glow text-rh-lime"
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${isLight ? "bg-rh-lime" : "bg-rh-lime"} animate-pulse`} />
        Read
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className={`text-[19px] leading-[1.55] ${isLight ? "text-black" : "text-base-50"}`}
      >
        {text}
      </motion.p>
    </motion.div>
  );
}
