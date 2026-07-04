"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { fadeUp, staggerParent } from "@/lib/motion";
import type { MSMEProfile } from "@/lib/mockData";

export function SampleCards({ profiles }: { profiles: MSMEProfile[] }) {
  return (
    <section className="bg-sand-fade">
      <div className="mx-auto max-w-[1600px] px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.4 }}
          className="mb-14 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end"
        >
          <div>
            <div className="text-[14px] font-semibold uppercase tracking-[0.18em] text-black/60">
              Live profiles
            </div>
            <h2 className="mt-4 font-serif text-[52px] font-normal leading-[0.98] tracking-serif text-black sm:text-[68px] md:text-[80px]">
              Three MSMEs.
              <br />
              <span className="italic text-black/60">Three score stories.</span>
            </h2>
          </div>
          <div className="text-[15px] text-black/70">
            Click any card to open the Health Card
          </div>
        </motion.div>

        <motion.div
          variants={staggerParent(0.1, 0.08)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid gap-5 md:grid-cols-3"
        >
          {profiles.map((p) => (
            <motion.div
              key={p.gstin}
              variants={fadeUp}
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
            >
              <Link
                href={`/dashboard?gstin=${p.gstin}`}
                className="group relative block overflow-hidden rounded-3xl border border-black/10 bg-white/70 p-8 transition hover:border-black/30 hover:bg-white/90"
              >
                <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-black/55">
                  Sample MSME
                </div>
                <div className="mt-3 font-serif text-[34px] leading-[1.02] tracking-serif text-black">
                  {p.tradeName}
                </div>
                <div className="mt-2 text-[15px] text-black/65">
                  {p.sector} · {p.city.split(",")[0]}
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-2 text-[13px] text-black/70">
                  <span className="rounded-full border border-black/15 bg-white/70 px-3 py-1 tabular">
                    {p.vintageYears}y old
                  </span>
                  <span className="rounded-full border border-black/15 bg-white/70 px-3 py-1 tabular">
                    ₹{Math.round(p.monthlyRevenue.slice(-1)[0] / 100000)}L / mo
                  </span>
                </div>

                <div className="mt-7 inline-flex items-center gap-1.5 text-[15px] font-semibold text-black transition group-hover:gap-2.5">
                  Open Health Card
                  <ArrowRight className="h-4 w-4 transition" />
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
