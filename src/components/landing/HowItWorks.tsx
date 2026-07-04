"use client";

import { motion } from "framer-motion";
import { fadeUp, staggerParent } from "@/lib/motion";

const STEPS = [
  {
    n: "01",
    title: "Connect once via AA.",
    body: "One consent gives UdyamAI read-only access to your bank statement, GST returns, and EPFO. RBI-regulated. No passwords.",
  },
  {
    n: "02",
    title: "Watch the score, monthly.",
    body: "Four sub-scores: Revenue Stability, Compliance, Counterparty Risk, Growth. In Hindi, Telugu, or English.",
  },
  {
    n: "03",
    title: "Pre-qualified. 64 lenders.",
    body: "See which banks will approve you, at what rate, at what confidence — before you file a single application.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="bg-sage-fade">
      <div className="mx-auto max-w-[1600px] px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl"
        >
          <div className="text-[14px] font-semibold uppercase tracking-[0.18em] text-black/60">
            How it works
          </div>
          <h2 className="mt-4 font-serif text-[52px] font-normal leading-[0.98] tracking-serif text-black sm:text-[68px] md:text-[80px]">
            Three steps.
            <br />
            <span className="italic text-black/60">Zero paperwork.</span>
          </h2>
        </motion.div>

        <motion.div
          variants={staggerParent(0.1, 0.1)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-16 grid gap-5 md:grid-cols-3"
        >
          {STEPS.map((s) => (
            <motion.div
              key={s.n}
              variants={fadeUp}
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className="relative overflow-hidden rounded-3xl border border-black/10 bg-white/60 p-8"
            >
              <div className="text-[14px] font-mono font-semibold tracking-widest text-black/60">
                {s.n}
              </div>
              <div className="mt-5 font-serif text-[32px] leading-[1.05] tracking-serif text-black">
                {s.title}
              </div>
              <div className="mt-4 text-[16px] leading-relaxed text-black/70">{s.body}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
