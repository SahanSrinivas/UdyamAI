"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { RotateCcw, TrendingUp, TrendingDown, Zap, Droplets, Wifi, Home, Fuel, Plug } from "lucide-react";
import {
  FACTOR_DEFS,
  SUBSCORE_DEFS,
  scoreFromFactors,
  type FactorKey,
  type Factors,
} from "@/lib/scoreEngine";

const bandColor: Record<string, string> = {
  Excellent: "#00a83a",
  Strong: "#00a83a",
  Fair: "#d99a00",
  Weak: "#e03e3e",
};

const DEF = Object.fromEntries(FACTOR_DEFS.map((d) => [d.key, d])) as Record<FactorKey, (typeof FACTOR_DEFS)[number]>;

// Alternative data the engine will take once the feeds are wired. Shown so
// lenders can see where the model is going; they carry zero weight today.
const PLACEHOLDERS = [
  { icon: Zap, label: "Electricity bills", source: "BBPS · state DISCOM", note: "Units consumed tracks production; on-time payment tracks discipline" },
  { icon: Home, label: "Rent / lease payments", source: "AA · standing instructions", note: "Regular premises rent signals operational continuity" },
  { icon: Droplets, label: "Water & property tax", source: "Municipal portals", note: "Dues cleared on time, no arrears notices" },
  { icon: Wifi, label: "Telecom & broadband", source: "BBPS · postpaid billers", note: "Business line tenure and payment record" },
  { icon: Fuel, label: "FASTag & fuel spend", source: "NETC · fleet cards", note: "Logistics activity for trading and transport units" },
];

export function ScoreSimulator({ actual }: { actual: Factors }) {
  const [factors, setFactors] = useState<Factors>(actual);
  const base = useMemo(() => scoreFromFactors(actual), [actual]);
  const live = useMemo(() => scoreFromFactors(factors), [factors]);
  const delta = live.overall - base.overall;
  const changed = FACTOR_DEFS.some((d) => Math.round(factors[d.key] * 100) !== Math.round(actual[d.key] * 100));

  const set = (k: FactorKey, pct: number) => setFactors((f) => ({ ...f, [k]: pct / 100 }));
  const setAll = (fn: (k: FactorKey) => number) =>
    setFactors(Object.fromEntries(FACTOR_DEFS.map((d) => [d.key, fn(d.key)])) as Factors);

  return (
    <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
      {/* Live result + formula */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-3xl border border-black/10 bg-white/80 p-6">
          <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-black/55">Simulated score</div>
          <div className="mt-3 flex items-end gap-3">
            <div className="tabular text-[72px] font-bold leading-none tracking-tight text-black">{live.overall}</div>
            <div className="pb-2 text-[15px] text-black/50">/1000</div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white"
              style={{ background: bandColor[live.band] }}
            >
              {live.band}
            </span>
            {delta !== 0 && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-semibold tabular ${
                  delta > 0 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700"
                }`}
              >
                {delta > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {delta > 0 ? "+" : ""}
                {delta} vs actual {base.overall}
              </span>
            )}
            {delta === 0 && <span className="text-[13px] text-black/55">Actual score: {base.overall}</span>}
          </div>

          <div className="mt-6 space-y-3">
            {live.subScores.map((s) => (
              <div key={s.key}>
                <div className="flex items-baseline justify-between text-[13px]">
                  <span className="font-semibold text-black">
                    {s.label} <span className="font-normal text-black/50">× {Math.round(s.weight * 100)}%</span>
                  </span>
                  <span className="tabular text-black/70">
                    {s.score} → <span className="font-semibold text-black">{Math.round(s.score * s.weight)} pts</span>
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-black/10">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: s.color }}
                    animate={{ width: `${s.score / 10}%` }}
                    transition={{ type: "spring", stiffness: 260, damping: 30 }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl bg-black/[0.04] p-4 font-mono text-[11.5px] leading-relaxed text-black/75">
            Score = {live.subScores.map((s, i) => (
              <span key={s.key}>
                {i > 0 && " + "}
                {s.weight.toFixed(2)}×<span className="font-semibold text-black">{s.score}</span>
              </span>
            ))}
            <br />= <span className="font-semibold text-black">{live.overall}</span>
            <div className="mt-2 text-black/55">
              Bands: ≥800 Excellent · ≥650 Strong · ≥500 Fair · else Weak
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={() => setFactors(actual)}
              disabled={!changed}
              className="inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-black/85 disabled:opacity-40"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset to actual
            </button>
            <button
              onClick={() => setAll(() => 1)}
              className="rounded-full border border-black/15 bg-white px-4 py-2 text-[13px] font-semibold text-black transition hover:border-black/40"
            >
              Best case
            </button>
            <button
              onClick={() => setAll((k) => actual[k] * 0.6)}
              className="rounded-full border border-black/15 bg-white px-4 py-2 text-[13px] font-semibold text-black transition hover:border-black/40"
            >
              Stress −40%
            </button>
          </div>
        </div>
      </div>

      {/* Factor sliders grouped by sub-score */}
      <div className="grid gap-5 xl:grid-cols-2">
        {SUBSCORE_DEFS.map((sd) => {
          const sub = live.subScores.find((s) => s.key === sd.key)!;
          return (
            <div key={sd.key} className="rounded-3xl border border-black/10 bg-white/70 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: sd.color }} aria-hidden />
                    <span className="text-[15px] font-semibold text-black">{sd.label}</span>
                  </div>
                  <div className="mt-0.5 text-[12px] text-black/55">
                    {Math.round(sd.weight * 100)}% of overall score
                  </div>
                </div>
                <div className="tabular text-[22px] font-bold leading-none text-black">
                  {sub.score}
                  <span className="text-[12px] font-normal text-black/45">/1000</span>
                </div>
              </div>

              <div className="mt-5 space-y-5">
                {sub.parts.map((part) => {
                  const d = DEF[part.factor];
                  const pct = Math.round(factors[part.factor] * 100);
                  const actualPct = Math.round(actual[part.factor] * 100);
                  return (
                    <div key={part.factor}>
                      <div className="flex items-baseline justify-between gap-2">
                        <label htmlFor={`${sd.key}-${part.factor}`} className="text-[13px] font-semibold text-black">
                          {d.label}{" "}
                          <span className="font-normal text-black/45">
                            · {Math.round(part.weight * 100)}%{part.note ? ` · ${part.note}` : ""}
                          </span>
                        </label>
                        <span className="tabular text-[13px] font-semibold text-black">{pct}%</span>
                      </div>
                      <div className="relative mt-2">
                        <input
                          id={`${sd.key}-${part.factor}`}
                          type="range"
                          min={0}
                          max={100}
                          value={pct}
                          onChange={(e) => set(part.factor, Number(e.target.value))}
                          className="w-full cursor-pointer accent-black"
                        />
                        <span
                          className="pointer-events-none absolute -top-1.5 h-2 w-0.5 -translate-x-1/2 rounded bg-black/40"
                          style={{ left: `${actualPct}%` }}
                          title={`Actual: ${actualPct}%`}
                          aria-hidden
                        />
                      </div>
                      <div className="mt-1 flex justify-between gap-3 text-[11px] text-black/45">
                        <span>{d.scale[0]}</span>
                        <span className="text-right">{d.scale[1]}</span>
                      </div>
                      <div className="mt-1 flex justify-between text-[11px]">
                        <span className="text-black/50">
                          {d.source} · actual {actualPct}%
                        </span>
                        <span className="tabular font-semibold text-black/70">+{Math.round(part.points)} pts</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Alternative data — not yet connected */}
        <div className="rounded-3xl border border-dashed border-black/25 bg-white/40 p-5 xl:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Plug className="h-4 w-4 text-black/60" />
                <span className="text-[15px] font-semibold text-black">Utility &amp; alternative data</span>
                <span className="rounded-full bg-black/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-black/60">
                  Coming soon
                </span>
              </div>
              <div className="mt-0.5 text-[12px] text-black/55">
                Planned 5th sub-score. These feeds carry 0% weight until they're connected.
              </div>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PLACEHOLDERS.map(({ icon: Icon, label, source, note }) => (
              <div key={label} className="rounded-2xl border border-black/10 bg-white/60 p-4">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-black/[0.06] text-black/60">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-black">{label}</div>
                    <div className="text-[11px] text-black/50">{source}</div>
                  </div>
                </div>
                <input type="range" disabled value={0} min={0} max={100} readOnly className="mt-3 w-full opacity-40" aria-label={`${label} (not connected)`} />
                <div className="mt-1 text-[11px] leading-snug text-black/55">{note}</div>
                <div className="mt-2 text-[11px] font-semibold text-black/40">Not connected · 0 pts</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
