"use client";

import { motion } from "framer-motion";
import { GstinInput } from "./GstinInput";
import { Logo } from "@/components/Logo";

export function GstinCheckSection() {
  return (
    <section className="relative overflow-hidden bg-mist-fade">
      <div className="pointer-events-none absolute inset-0 grid-dot-cream opacity-50" aria-hidden />
      <div className="relative mx-auto grid max-w-[1600px] gap-10 px-6 py-24 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-16 md:py-32">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 text-[15px] font-medium"
          >
            <Logo size={22} variant="glyph-dark" />
            <span className="text-black">
              Udyam<span className="font-serif italic text-black/70">AI</span>
            </span>
            <span className="text-black/60">Check</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-8 font-serif text-[56px] font-normal leading-[0.98] tracking-serif text-black sm:text-[72px] md:text-[92px]"
          >
            Type your
            <br />
            GSTIN. <span className="italic text-black/80">See your score.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-8 max-w-lg text-[18px] leading-[1.55] text-black/70"
          >
            15 characters. Validated on-device using the official RBI checksum algorithm.
            Nothing leaves your browser until you press Open.
          </motion.p>
        </div>

        <div className="flex items-start md:pt-8">
          <GstinInput theme="light" />
        </div>
      </div>
    </section>
  );
}
