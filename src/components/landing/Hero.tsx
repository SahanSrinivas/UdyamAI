"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { HeroArt } from "./HeroArt";
import { Logo } from "@/components/Logo";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-cream-radial">
      <div className="mx-auto grid max-w-[1600px] items-center gap-4 px-6 pt-14 pb-24 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.2fr)] md:gap-6 md:pt-24 md:pb-32">
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 text-[15px] font-medium"
          >
            <Logo size={22} variant="glyph-dark" />
            <span className="text-black">
              Udyam<span className="font-serif italic text-black/70">AI</span>
            </span>
            <span className="text-black/60">Presents</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="mt-8 font-serif text-[64px] font-normal leading-[0.95] tracking-serif text-black sm:text-[88px] md:text-[104px] lg:text-[128px]"
          >
            The Score
            <br />
            <span className="italic">Is Yours.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-8 max-w-lg text-[17px] leading-[1.55] text-black/70"
          >
            We're pulling MSME credit into daylight. See exactly where you stand with 64 lenders —
            in real time — before you file a single application.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.5 }}
            className="mt-10 flex flex-wrap items-center gap-3"
          >
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-full bg-rh-lime px-6 py-3.5 text-[15px] font-semibold text-black transition hover:bg-rh-lime-bright"
            >
              See a Health Card
            </Link>
            <a
              href="#how"
              className="inline-flex items-center rounded-full border border-black/15 bg-transparent px-6 py-3.5 text-[15px] font-semibold text-black transition hover:border-black/30"
            >
              How it works
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-14 flex flex-wrap items-center gap-x-8 gap-y-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-black/50"
          >
            <span>Live · Account Aggregator</span>
            <span className="hidden sm:inline">·</span>
            <span>64 lenders · ULI</span>
            <span className="hidden sm:inline">·</span>
            <span>OCEN 4.0 Loan Agent</span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="relative flex items-center justify-center md:justify-start md:-ml-6 lg:-ml-10"
        >
          <HeroArt />
        </motion.div>
      </div>
    </section>
  );
}
