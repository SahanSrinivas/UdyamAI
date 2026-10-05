"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
  Sparkles,
  TrendingUp,
  Users,
  Layers,
  Globe,
  RotateCcw,
} from "lucide-react";
import { OSINT_MONTHS, type OsintReport, type Sentiment } from "@/lib/osint";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
  reviews: Star,
  news: Newspaper,
  legal: Scale,
};

const DOT: Record<Sentiment, string> = {
  positive: "bg-rh-lime",
  neutral: "bg-white/40",
  negative: "bg-rh-red",
};

const LOG_MS = 430;
// Log lines 3..9 are the six source crawls (mca21 + ecourts share "legal").
const SOURCE_DONE_AT = [4, 5, 6, 7, 8, 10];
const PHASES = ["Resolving entity", "Crawling public sources", "Analysing signals", "Cross-checking financials", "Writing credit brief"];

export function AiAgentButton({ tradeName, report }: { tradeName: string; report: OsintReport }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-black px-5 py-3 text-[14px] font-semibold text-white shadow-lime-glow transition hover:bg-black/85"
      >
        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-rh-lime/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" aria-hidden />
        <Bot className="h-4 w-4 text-rh-lime" />
        Run AI Agent · Public footprint
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
  const [run, setRun] = useState(0);
  const [cursor, setCursor] = useState(0);
  const [done, setDone] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const total = report.logs.length;

  useEffect(() => {
    if (!open) return;
    setCursor(0);
    setDone(false);
    let i = 0;
    let finish: ReturnType<typeof setTimeout>;
    const timer = setInterval(() => {
      i += 1;
      setCursor(i);
      if (i >= total) {
        clearInterval(timer);
        finish = setTimeout(() => setDone(true), 900);
      }
    }, LOG_MS);
    return () => {
      clearInterval(timer);
      clearTimeout(finish);
    };
  }, [open, total, run]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [cursor]);

  useEffect(() => {
    if (done) scrollRef.current?.scrollTo({ top: 0 });
  }, [done]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 220, damping: 28 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[860px] flex-col overflow-hidden border-l border-rh-lime/20 bg-[#050505] text-white shadow-pop"
            role="dialog"
            aria-label="AI agent public footprint report"
          >
            {/* grid backdrop */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(204,255,94,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(204,255,94,.6) 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
              aria-hidden
            />

            <header className="relative flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-rh-lime/40 bg-rh-lime/10 px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-rh-lime">
                  <span className={`h-1.5 w-1.5 rounded-full bg-rh-lime ${done ? "" : "animate-pulse"}`} />
                  {done ? "Brief ready" : "Agent live"}
                </div>
                <div className="mt-2 font-serif text-2xl leading-tight tracking-serif text-white">
                  Public footprint · {tradeName}
                </div>
                <div className="mt-1 text-[13px] text-white/55">
                  Autonomous OSINT agent · social, SaaS stack, hiring, news and registries
                </div>
              </div>
              <div className="flex items-center gap-2">
                {done && (
                  <button
                    onClick={() => setRun((r) => r + 1)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-2 text-[12px] font-semibold text-white/70 hover:border-rh-lime/50 hover:text-rh-lime"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Re-run
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="rounded-full border border-white/15 p-2 text-white/60 hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>

            <div ref={scrollRef} className="relative flex-1 overflow-y-auto px-6 py-6">
              <AnimatePresence mode="wait">
                {!done ? (
                  <motion.div key={`proc-${run}`} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.35 }}>
                    <Processing report={report} cursor={cursor} logRef={logRef} />
                  </motion.div>
                ) : (
                  <motion.div
                    key={`report-${run}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Report report={report} />
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

// ── Processing ───────────────────────────────────────────────────────────

function Processing({
  report,
  cursor,
  logRef,
}: {
  report: OsintReport;
  cursor: number;
  logRef: React.RefObject<HTMLDivElement>;
}) {
  const total = report.logs.length;
  const progress = Math.min(1, cursor / total);
  const phase = PHASES[Math.min(PHASES.length - 1, Math.floor(progress * PHASES.length))];
  const sourcesDone = SOURCE_DONE_AT.filter((at) => cursor >= at).length;

  return (
    <div className="space-y-5">
      <div className="grid items-center gap-6 sm:grid-cols-[220px_1fr]">
        <AgentOrb progress={progress} />
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-rh-lime/80">{phase}…</div>
          <div className="mt-2 bg-gradient-to-r from-white via-rh-lime to-white bg-[length:200%_100%] bg-clip-text font-serif text-[30px] leading-[1.05] tracking-serif text-transparent [animation:shimmer_2.4s_linear_infinite]">
            AI Agent is processing your request
          </div>
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-rh-lime shadow-[0_0_16px_rgba(204,255,94,0.7)]"
              animate={{ width: `${progress * 100}%` }}
              transition={{ ease: "easeOut", duration: 0.4 }}
            />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Stat label="Items scanned" value={Math.round(report.itemsScanned * progress ** 1.3).toLocaleString("en-IN")} />
            <Stat label="Sources" value={`${sourcesDone}/6`} />
            <Stat label="Progress" value={`${Math.round(progress * 100)}%`} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {report.sources.map((s, i) => {
          const Icon = ICONS[s.key] ?? Bot;
          const isDone = cursor >= SOURCE_DONE_AT[i];
          const active = !isDone && cursor >= SOURCE_DONE_AT[i] - 1;
          return (
            <div
              key={s.key}
              className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-all duration-300 ${
                isDone
                  ? "border-rh-lime/40 bg-rh-lime/[0.07]"
                  : active
                    ? "border-white/40 bg-white/[0.06]"
                    : "border-white/10 bg-white/[0.02] opacity-50"
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isDone ? "text-rh-lime" : "text-white/60"}`} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12.5px] font-semibold text-white">{s.label}</div>
                <div className="truncate font-mono text-[10.5px] text-white/45">
                  {isDone ? `${s.items.length + s.metrics.length} signals` : active ? s.scanning : "queued"}
                </div>
              </div>
              {isDone ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-rh-lime" />
              ) : active ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-white/60" />
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/80">
        <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rh-red/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-rh-amber/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-rh-green/80" />
          <span className="ml-2 font-mono text-[11px] text-white/40">udyam-agent — osint pipeline</span>
        </div>
        <div ref={logRef} className="h-[230px] overflow-y-auto px-4 py-3 font-mono text-[11.5px] leading-[1.7]">
          {report.logs.slice(0, cursor).map((line, i) => {
            const [tag, ...rest] = line.split(/\s{2,}/);
            return (
              <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
                <span className="text-white/30">{(i * 0.43 + 0.12).toFixed(2)}s </span>
                <span className="text-rh-lime">✓ {tag.padEnd(11, " ")}</span>
                <span className="text-white/75">{rest.join("  ")}</span>
              </motion.div>
            );
          })}
          {cursor < total && (
            <div className="text-white/50">
              <span className="text-rh-lime">›</span> {report.logs[cursor]?.split(/\s{2,}/)[0]}
              <span className="ml-1 inline-block h-3.5 w-1.5 translate-y-0.5 animate-pulse bg-rh-lime" />
            </div>
          )}
          {cursor >= total && <div className="text-rh-lime">● brief compiled — rendering report</div>}
        </div>
      </div>
    </div>
  );
}

function AgentOrb({ progress }: { progress: number }) {
  const reduce = useReducedMotion();
  const spin = (duration: number, dir = 1) =>
    reduce ? {} : { animate: { rotate: 360 * dir }, transition: { duration, repeat: Infinity, ease: "linear" as const } };
  return (
    <div className="relative mx-auto aspect-square w-[200px]">
      {/* radar sweep */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ background: "conic-gradient(from 0deg, rgba(204,255,94,0.35), transparent 25%)" }}
        {...spin(2.2)}
      />
      <svg viewBox="0 0 200 200" className="absolute inset-0">
        <circle cx="100" cy="100" r="96" fill="none" stroke="rgba(255,255,255,0.08)" />
        <circle cx="100" cy="100" r="64" fill="none" stroke="rgba(255,255,255,0.08)" />
      </svg>
      <motion.svg viewBox="0 0 200 200" className="absolute inset-0" {...spin(14)}>
        <circle cx="100" cy="100" r="82" fill="none" stroke="rgba(204,255,94,0.55)" strokeWidth="1.5" strokeDasharray="4 10" />
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <circle key={a} cx={100 + 82 * Math.cos((a * Math.PI) / 180)} cy={100 + 82 * Math.sin((a * Math.PI) / 180)} r="3.5" fill="#CCFF5E" />
        ))}
      </motion.svg>
      <motion.svg viewBox="0 0 200 200" className="absolute inset-0" {...spin(9, -1)}>
        <circle cx="100" cy="100" r="50" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1" strokeDasharray="30 14 6 14" />
      </motion.svg>
      <svg viewBox="0 0 200 200" className="absolute inset-0 -rotate-90">
        <circle
          cx="100"
          cy="100"
          r="96"
          fill="none"
          stroke="#CCFF5E"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={2 * Math.PI * 96}
          strokeDashoffset={2 * Math.PI * 96 * (1 - progress)}
          style={{ transition: "stroke-dashoffset 0.4s ease-out", filter: "drop-shadow(0 0 6px rgba(204,255,94,0.8))" }}
        />
      </svg>
      <motion.div
        className="absolute inset-[34%] grid place-items-center rounded-full bg-rh-lime/15 shadow-[0_0_40px_rgba(204,255,94,0.45)]"
        animate={reduce ? undefined : { scale: [1, 1.08, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <Bot className="h-9 w-9 text-rh-lime" />
      </motion.div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <div className="font-mono text-[10px] uppercase tracking-wider text-white/45">{label}</div>
      <div className="tabular text-[17px] font-semibold text-white">{value}</div>
    </div>
  );
}

// ── Report ───────────────────────────────────────────────────────────────

function Report({ report }: { report: OsintReport }) {
  const typed = useTypewriter(report.summary);
  const { presence, saas, employment } = report;
  const maxHead = Math.max(...employment.headcount);

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl border border-rh-lime/40 bg-gradient-to-br from-rh-lime/[0.10] to-transparent p-5">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/55">Digital reputation</div>
            <div className="tabular text-[52px] font-bold leading-none text-white">
              {report.reputationScore}
              <span className="text-[16px] font-normal text-white/45">/100</span>
            </div>
            <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-rh-lime px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest text-black">
              <ShieldCheck className="h-3.5 w-3.5" /> Strong
            </div>
          </div>
          <div className="min-w-[220px] flex-1">
            <div className="flex h-2.5 overflow-hidden rounded-full bg-white/10">
              <div className="bg-rh-lime" style={{ width: `${report.sentiment.positive}%` }} />
              <div className="bg-white/30" style={{ width: `${report.sentiment.neutral}%` }} />
            </div>
            <div className="mt-2 flex gap-4 text-[12px] tabular text-white/65">
              <span>{report.sentiment.positive}% positive</span>
              <span>{report.sentiment.neutral}% neutral</span>
              <span>0 adverse</span>
            </div>
            <div className="mt-1 font-mono text-[11px] text-white/40">
              {report.itemsScanned.toLocaleString("en-IN")} public items · 6 sources · 0 contradictions with GST/AA data
            </div>
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-4 text-[13.5px] leading-relaxed text-white/85">
          <div className="mb-1.5 flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-widest text-rh-lime">
            <Bot className="h-3.5 w-3.5" /> Agent brief for credit officer
          </div>
          {typed}
          {typed.length < report.summary.length && <span className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 animate-pulse bg-rh-lime" />}
        </div>
      </div>

      {/* Three trend tiles */}
      <div className="grid gap-3 md:grid-cols-3">
        <Tile icon={Globe} label="Digital presence" value={`+${presence.growthPct}%`} sub="Follower reach, 12 months">
          <Spark values={presence.followers} />
          <div className="mt-2 font-mono text-[10.5px] text-white/45">
            {presence.rating.toFixed(1)}★ · {presence.reviews} reviews
          </div>
        </Tile>
        <Tile icon={Users} label="Employment" value={`+${employment.growthPct}%`} sub={`${employment.headcount[0]} → ${employment.headcount[11]} staff · EPFO verified`}>
          <div className="flex h-[52px] items-end gap-[3px]">
            {employment.headcount.map((h, i) => (
              <motion.div
                key={i}
                className="flex-1 rounded-sm bg-rh-lime"
                style={{ opacity: 0.35 + (0.65 * i) / 11 }}
                initial={{ height: 0 }}
                animate={{ height: `${(h / maxHead) * 100}%` }}
                transition={{ delay: 0.2 + i * 0.04, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                title={`${OSINT_MONTHS[i]}: ${h}`}
              />
            ))}
          </div>
          <div className="mt-2 font-mono text-[10.5px] text-white/45">
            {employment.openRoles} open roles · {employment.newHires90d} hires in 90d
          </div>
        </Tile>
        <Tile icon={Layers} label="SaaS adoption" value={`${saas.adoptionScore}/100`} sub={`Top ${100 - saas.percentile}% in sector`}>
          <Spark values={saas.spendTrend} />
          <div className="mt-2 font-mono text-[10.5px] text-white/45">
            SaaS spend ₹{saas.spendTrend[0]}k → ₹{saas.spendTrend[5]}k / mo
          </div>
        </Tile>
      </div>

      {/* SaaS stack */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[14px] font-semibold">
            <Layers className="h-4 w-4 text-rh-lime" /> Detected business stack
          </div>
          <span className="font-mono text-[11px] text-white/45">{saas.tools.length} tools · fingerprinted</span>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {saas.tools.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.06 }}
              className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/40 px-3 py-2.5"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-rh-lime" />
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-white">
                  {t.name} <span className="font-normal text-white/40">· since {t.since}</span>
                </div>
                <div className="text-[11.5px] text-white/50">
                  {t.category} — {t.signal}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Green flags */}
      <div className="rounded-2xl border border-rh-lime/30 bg-rh-lime/[0.05] p-5">
        <div className="flex items-center gap-1.5 font-mono text-[12px] font-bold uppercase tracking-widest text-rh-lime">
          <TrendingUp className="h-4 w-4" /> Why this footprint supports lending
        </div>
        <ul className="mt-3 space-y-2 text-[13.5px] text-white/85">
          {report.greenFlags.map((f) => (
            <li key={f} className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-rh-lime" />
              {f}
            </li>
          ))}
        </ul>
        <div className="mt-3 font-mono text-[11px] text-white/45">Red flags: none found</div>
      </div>

      {/* Per-source detail */}
      <div className="grid gap-3 md:grid-cols-2">
        {report.sources.map((s) => {
          const Icon = ICONS[s.key] ?? Bot;
          return (
            <div key={s.key} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-rh-lime/15 text-rh-lime">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[13.5px] font-semibold text-white">{s.label}</div>
                  <div className="truncate text-[11.5px] text-white/45">{s.handle}</div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-1.5">
                {s.metrics.map((m) => (
                  <div key={m.label} className="rounded-lg bg-black/40 px-2 py-1.5">
                    <div className="truncate font-mono text-[9.5px] uppercase tracking-wider text-white/40">{m.label}</div>
                    <div className="tabular text-[14px] font-semibold text-white">{m.value}</div>
                  </div>
                ))}
              </div>
              <ul className="mt-3 space-y-2">
                {s.items.map((it) => (
                  <li key={it.text} className="flex gap-2">
                    <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${DOT[it.sentiment]}`} aria-label={it.sentiment} />
                    <div>
                      <div className="text-[12.5px] leading-snug text-white/80">{it.text}</div>
                      <div className="text-[10.5px] text-white/40">{it.meta}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="pb-4 text-[11px] leading-relaxed text-white/35">
        Demo build: source data is simulated per GSTIN. In production the agent crawls public profiles, news and
        registries under the borrower&apos;s consent and cites every item.
      </div>
    </div>
  );
}

function Tile({
  icon: Icon,
  label,
  value,
  sub,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-widest text-white/50">
        <Icon className="h-3.5 w-3.5 text-rh-lime" /> {label}
      </div>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className="tabular text-[28px] font-bold leading-none text-rh-lime">{value}</span>
        <TrendingUp className="h-4 w-4 text-rh-lime" />
      </div>
      <div className="mt-1 text-[11.5px] text-white/55">{sub}</div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Spark({ values }: { values: number[] }) {
  const w = 200;
  const h = 52;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 4 - ((v - lo) / (hi - lo || 1)) * (h - 8)]);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-[52px] w-full" preserveAspectRatio="none">
      <path d={`${d} L${w},${h} L0,${h} Z`} fill="rgba(204,255,94,0.12)" />
      <motion.path
        d={d}
        fill="none"
        stroke="#CCFF5E"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, ease: "easeOut", delay: 0.2 }}
      />
    </svg>
  );
}

function useTypewriter(text: string) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const step = Math.max(2, Math.ceil(text.length / 120));
    const t = setInterval(() => {
      setN((x) => {
        if (x + step >= text.length) {
          clearInterval(t);
          return text.length;
        }
        return x + step;
      });
    }, 18);
    return () => clearInterval(t);
  }, [text]);
  return text.slice(0, n);
}
