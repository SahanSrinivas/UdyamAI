"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const LANGS = [
  { code: "en", label: "EN" },
  { code: "hi", label: "HI" },
  { code: "te", label: "TE" },
] as const;

export function LangToggle({
  gstin,
  current,
  theme = "dark",
}: {
  gstin: string;
  current: string;
  theme?: "dark" | "light";
}) {
  const isLight = theme === "light";
  const container = isLight
    ? "border border-black/15 bg-white/80 backdrop-blur"
    : "border border-line-strong bg-base-900";
  const inactive = isLight ? "text-black/60 hover:text-black" : "text-muted hover:text-white";

  return (
    <div className={`inline-flex items-center gap-1 rounded-full p-1 shadow-sm ${container}`}>
      {LANGS.map((l) => {
        const active = current === l.code;
        return (
          <Link
            key={l.code}
            href={`/dashboard?gstin=${gstin}&lang=${l.code}`}
            aria-pressed={active}
            className={`relative rounded-full px-3.5 py-1.5 text-[12px] font-bold tracking-wide tabular ${
              active ? "" : inactive
            }`}
          >
            {active && (
              <motion.span
                layoutId="lang-pill"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                className="absolute inset-0 rounded-full bg-rh-lime shadow-lime-glow"
              />
            )}
            <span className={`relative z-10 ${active ? "text-black" : ""}`}>{l.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
