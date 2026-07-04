"use client";

import { motion } from "framer-motion";
import { Cpu } from "lucide-react";
import { fadeUp, staggerParent } from "@/lib/motion";
import type { TrainedModel } from "@/lib/mlModel";

const FEATURE_LABELS = [
  "Revenue Stability",
  "Compliance",
  "Counterparty",
  "Growth",
  "Amount Ratio",
  "Tenor",
];

export function ModelCard({ models }: { models: TrainedModel[] }) {
  return (
    <motion.div
      variants={staggerParent(0.15, 0.09)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      className="rounded-3xl border border-black/10 bg-white/60 p-7"
    >
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-black px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-rh-lime">
            <Cpu className="h-3.5 w-3.5" />
            ML transparency
          </div>
          <h3 className="mt-3 font-serif text-[36px] leading-[0.98] tracking-serif text-black sm:text-[44px]">
            How we score approval.
          </h3>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-black/70">
            Approval confidence per lender comes from a{" "}
            <span className="font-semibold text-black">logistic regression</span> trained on{" "}
            {models[0]?.sampleCount ?? "—"} synthetic samples per lender, calibrated to each
            lender's published underwriting preferences. Below: the trained coefficients you can
            audit, plus holdout accuracy and AUC.
          </p>
        </div>
        <div className="hidden shrink-0 rounded-2xl border border-black/10 bg-white/80 px-4 py-3 sm:block">
          <div className="text-[10px] font-mono font-semibold uppercase tracking-widest text-black/50">Type</div>
          <div className="mt-1 font-mono text-[13px] font-semibold text-black">LR · sigmoid</div>
          <div className="mt-2 text-[10px] font-mono font-semibold uppercase tracking-widest text-black/50">Optim</div>
          <div className="mt-1 font-mono text-[13px] font-semibold text-black">Batch GD</div>
        </div>
      </div>

      <motion.div variants={staggerParent(0.1, 0.08)} className="mt-8 grid gap-4 lg:grid-cols-3">
        {models.map((m) => (
          <motion.div
            key={m.lender}
            variants={fadeUp}
            className="rounded-2xl border border-black/10 bg-white/80 p-5"
          >
            <div className="flex items-baseline justify-between">
              <div className="font-serif text-[22px] tracking-serif text-black">{m.lender}</div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-black/50">
                {m.sampleCount.toLocaleString()} samples
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-[13px]">
              <Metric label="Accuracy" value={(m.accuracy * 100).toFixed(1) + "%"} />
              <Metric label="AUC" value={m.auc.toFixed(3)} />
              <Metric label="Epochs" value={m.epochsRun.toString()} />
              <Metric label="Bias" value={m.weights[0].toFixed(3)} />
            </div>

            <div className="mt-5">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-black/50">
                Feature weights (β)
              </div>
              <div className="mt-2 space-y-1.5">
                {m.weights.slice(1).map((w, i) => {
                  const abs = Math.abs(w);
                  const max = Math.max(...m.weights.slice(1).map(Math.abs));
                  const pct = (abs / max) * 100;
                  const positive = w >= 0;
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-24 shrink-0 text-[11px] text-black/60">{FEATURE_LABELS[i]}</div>
                      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-black/10">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${pct}%` }}
                          viewport={{ once: true, margin: "-40px" }}
                          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 + i * 0.05 }}
                          className={`h-full rounded-full ${positive ? "bg-black" : "bg-rh-red"}`}
                        />
                      </div>
                      <div
                        className={`w-14 shrink-0 text-right font-mono text-[11px] font-semibold tabular ${
                          positive ? "text-black" : "text-rh-red"
                        }`}
                      >
                        {positive ? "+" : ""}
                        {w.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="mt-6 rounded-2xl border border-black/10 bg-white/70 p-4 text-[13px] leading-relaxed text-black/70">
        <span className="font-semibold text-black">Why LR, not XGBoost?</span> RBI's AA/ULI
        framework prefers auditable decisioning. A linear model with visible coefficients passes
        model-risk review; a black-box classifier does not. Every point of your score maps back
        to a specific feature weight — nothing hidden.
      </div>
    </motion.div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-black/10 bg-white/70 p-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-black/50">{label}</div>
      <div className="mt-1 tabular text-base font-bold text-black">{value}</div>
    </div>
  );
}
