"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  CheckCircle2,
  Loader2,
  X,
  Instagram,
  Twitter,
  Linkedin,
  Star,
  Newspaper,
  Scale,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import type { OsintReport, Sentiment } from "@/lib/osint";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
  reviews: Star,
  news: Newspaper,
  legal: Scale,
};

const DOT: Record<Sentiment, string> = {
  positive: "bg-emerald-500",
  neutral: "bg-black/30",
  negative: "bg-red-500",
};

const STEP_MS = 650;

export function AiAgentButton({ tradeName, report }: { tradeName: string; report: OsintReport }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-[14px] font-semibold text-white shadow-lime-glow transition hover:bg-black/85"
      >
        <Bot className="h-4 w-4 text-rh-lime" />
        AI Agent · Public footprint
        <Sparkles className="h-3.5 w-3.5 text-rh-lime transition group-hover:rotate-12" />
      </button>
      <AiAgentDrawer open={open} onClose={() => setOpen(false)} tradeName={tradeName} report={report} />
    </>
  );
}

function AiAgentDrawer({
  open,
  onClose,
  tradeName,
  report,
}: {
  open: boolean;
  onClose: () => void;
  tradeName: string;
  report: OsintReport;
}) {
  // cursor = number of sources finished scanning; done once all are in.
  const [cursor, setCursor] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const total = report.sources.length;
  const done = cursor >= total;

  useEffect(() => {
    if (!open) return;
    setCursor(0);
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      setCursor(i);
      if (i >= total) clearInterval(timer);
    }, STEP_MS);
    return () => clearInterval(timer);
  }, [open, total]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (done) scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [done]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 220, damping: 28 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[780px] flex-col overflow-hidden border-l border-black/10 bg-cream-fade text-black shadow-pop"
            role="dialog"
            aria-label="AI agent public footprint report"
          >
            <header className="flex items-start justify-between gap-4 border-b border-black/10 bg-white/50 px-6 py-5 backdrop-blur">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-black px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-rh-lime">
                  <span className={`h-1.5 w-1.5 rounded-full bg-rh-lime ${done ? "" : "animate-pulse"}`} />
                  {done ? "Scan complete" : "Agent running"}
                </div>
                <div className="mt-2 font-serif text-2xl leading-tight tracking-serif text-black">
                  Public footprint · {tradeName}
                </div>
                <div className="mt-1 text-[13px] text-black/65">
                  Social, reviews, news and registry signals — scraped and summarised for the credit officer
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-full border border-black/15 bg-white/70 p-2 text-black/60 hover:text-black"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
              {/* Scan progress */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {report.sources.map((s, i) => {
                  const Icon = ICONS[s.key] ?? Bot;
                  const state = i < cursor ? "done" : i === cursor ? "active" : "queued";
                  return (
                    <div
                      key={s.key}
                      className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition ${
                        state === "done" ? "border-black/15 bg-white/80" : state === "active" ? "border-black bg-white" : "border-black/10 bg-white/40 opacity-60"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0 text-black/70" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12.5px] font-semibold text-black">{s.label}</div>
                        <div className="truncate text-[11px] text-black/50">
                          {state === "done" ? `${s.items.length} signals` : state === "active" ? s.scanning : "Queued"}
                        </div>
                      </div>
                      {state === "done" ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                      ) : state === "active" ? (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-black/60" />
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <AnimatePresence>
                {done && (
                  <motion.div
                    key="report"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-6 space-y-5"
                  >
                    {/* Headline */}
                    <div className="rounded-2xl border-2 border-black bg-white p-5">
                      <div className="flex flex-wrap items-center gap-5">
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/55">Reputation score</div>
                          <div className="tabular text-[44px] font-bold leading-none text-black">
                            {report.reputationScore}
                            <span className="text-[16px] font-normal text-black/45">/100</span>
                          </div>
                        </div>
                        <div className="min-w-[220px] flex-1">
                          <div className="flex h-2.5 overflow-hidden rounded-full">
                            <div className="bg-emerald-500" style={{ width: `${report.sentiment.positive}%` }} />
                            <div className="bg-black/20" style={{ width: `${report.sentiment.neutral}%` }} />
                            <div className="bg-red-500" style={{ width: `${report.sentiment.negative}%` }} />
                          </div>
                          <div className="mt-2 flex gap-4 text-[12px] tabular text-black/65">
                            <span>{report.sentiment.positive}% positive</span>
                            <span>{report.sentiment.neutral}% neutral</span>
                            <span>{report.sentiment.negative}% negative</span>
                          </div>
                          <div className="mt-1 text-[11px] text-black/45">{report.itemsScanned.toLocaleString("en-IN")} public items scanned</div>
                        </div>
                      </div>
                      <div className="mt-4 rounded-xl bg-black/[0.04] p-4 text-[13.5px] leading-relaxed text-black/80">
                        <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-black/55">
                          <Bot className="h-3.5 w-3.5" /> Agent summary for credit officer
                        </div>
                        {report.summary}
                      </div>
                    </div>

                    {/* Flags */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-emerald-600/20 bg-emerald-50 p-4">
                        <div className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-widest text-emerald-800">
                          <ShieldCheck className="h-4 w-4" /> Green flags
                        </div>
                        <ul className="mt-2 space-y-1.5 text-[13px] text-emerald-950">
                          {report.greenFlags.map((f) => (
                            <li key={f}>• {f}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-2xl border border-red-600/20 bg-red-50 p-4">
                        <div className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-widest text-red-800">
                          <AlertTriangle className="h-4 w-4" /> Red flags
                        </div>
                        <ul className="mt-2 space-y-1.5 text-[13px] text-red-950">
                          {report.redFlags.length ? report.redFlags.map((f) => <li key={f}>• {f}</li>) : <li>None found</li>}
                        </ul>
                      </div>
                    </div>

                    {/* Per-source detail */}
                    {report.sources.map((s) => {
                      const Icon = ICONS[s.key] ?? Bot;
                      return (
                        <div key={s.key} className="rounded-2xl border border-black/10 bg-white/80 p-5">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <div className="grid h-9 w-9 place-items-center rounded-xl bg-black text-white">
                                <Icon className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="text-[14px] font-semibold text-black">{s.label}</div>
                                <div className="text-[12px] text-black/55">{s.handle}</div>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 grid grid-cols-3 gap-2">
                            {s.metrics.map((m) => (
                              <div key={m.label} className="rounded-xl bg-black/[0.04] px-3 py-2">
                                <div className="text-[10.5px] font-semibold uppercase tracking-wider text-black/50">{m.label}</div>
                                <div className="tabular text-[15px] font-semibold text-black">{m.value}</div>
                              </div>
                            ))}
                          </div>
                          <ul className="mt-4 space-y-2.5">
                            {s.items.map((it) => (
                              <li key={it.text} className="flex gap-2.5">
                                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT[it.sentiment]}`} aria-label={it.sentiment} />
                                <div>
                                  <div className="text-[13px] leading-snug text-black/85">{it.text}</div>
                                  <div className="text-[11px] text-black/45">{it.meta}</div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}

                    <div className="pb-4 text-[11px] leading-relaxed text-black/45">
                      Demo build: source data is simulated per GSTIN. In production the agent crawls public profiles,
                      news and registries under the borrower&apos;s consent and cites every item.
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
