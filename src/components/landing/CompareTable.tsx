"use client";

import { motion } from "framer-motion";
import { fadeUp, staggerParent } from "@/lib/motion";

const ROWS = [
  { left: "Score you once, at apply time", right: "Continuous score, updated monthly" },
  { left: "Reject with no explanation", right: '"Here\'s the exact number to fix"' },
  { left: "Their capital only", right: "Pre-qualified quotes from 64 lenders" },
  { left: "English-only UX", right: "Hindi + Telugu" },
];

export function CompareTable() {
  return (
    <section id="why" className="bg-cream-fade">
      <div className="mx-auto max-w-[1600px] px-6 py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-[14px] font-semibold uppercase tracking-[0.18em] text-black/60">
              The gap
            </div>
            <h2 className="mt-4 font-serif text-[52px] font-normal leading-[0.98] tracking-serif text-black sm:text-[68px] md:text-[80px]">
              Nobody else
              <br />
              <span className="italic text-black/60">builds for the borrower.</span>
            </h2>
            <p className="mt-8 max-w-lg text-[17px] leading-relaxed text-black/70">
              Perfios and Jocata sell scoring engines to banks — the MSME never sees the score.
              Lendingkart lends once and moves on. Khatabook has 30M+ MSMEs but no credit
              layer. The MSME-facing living Health Card slot is empty.{" "}
              <span className="text-black">That's the slot we're taking.</span>
            </p>
          </motion.div>

          <motion.div
            variants={staggerParent(0.15, 0.08)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="grid gap-3"
          >
            <div className="grid grid-cols-2 gap-3 text-[13px] font-semibold uppercase tracking-[0.18em]">
              <div className="text-black/55">Existing lenders</div>
              <div className="text-black">
                Udyam<span className="font-serif italic">AI</span>
              </div>
            </div>
            {ROWS.map((r, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="grid grid-cols-2 overflow-hidden rounded-2xl border border-black/10"
              >
                <div className="bg-white/50 p-5">
                  <div className="text-[15px] text-black/50 line-through decoration-black/25">
                    {r.left}
                  </div>
                </div>
                <div className="bg-white/80 p-5">
                  <div className="text-[15px] font-semibold text-black">{r.right}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
