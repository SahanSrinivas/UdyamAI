"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Loader2, X, ArrowRight, ArrowLeft } from "lucide-react";
import type { OcenStep } from "@/lib/ocen";
import type { LoanQuote } from "@/lib/scoreEngine";

const STEP_LABEL: Record<string, string> = {
  search: "Loan Search",
  offer: "Offer Response",
  accept: "Offer Accept",
  status: "Sanction Status",
};

const STEP_DELAY_MS = 900;

export function OcenApplyDrawer({
  open,
  onClose,
  gstin,
  quote,
}: {
  open: boolean;
  onClose: () => void;
  gstin: string;
  quote: LoanQuote | null;
}) {
  const [flow, setFlow] = useState<OcenStep[]>([]);
  const [cursor, setCursor] = useState<number>(-1);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!open || !quote) return;
    cancelledRef.current = false;
    setFlow([]);
    setCursor(-1);
    setCompleted(false);
    setLoading(true);

    (async () => {
      const res = await fetch("/api/ocen/apply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          gstin,
          lender: quote.lender,
          sanctionAmount: quote.amount,
          ratePct: quote.ratePct,
          tenorMonths: quote.tenorMonths,
        }),
      });
      const j = (await res.json()) as { flow: OcenStep[] };
      if (cancelledRef.current) return;
      setFlow(j.flow);
      setLoading(false);

      for (let i = 0; i < j.flow.length; i++) {
        await new Promise((r) => setTimeout(r, STEP_DELAY_MS));
        if (cancelledRef.current) return;
        setCursor(i);
      }

      await new Promise((r) => setTimeout(r, STEP_DELAY_MS));
      if (cancelledRef.current) return;
      setCompleted(true);
    })();

    return () => {
      cancelledRef.current = true;
    };
  }, [open, gstin, quote]);

  useEffect(() => {
    if (cursor < 0) return;
    const el = scrollRef.current;
    if (!el) return;
    const timer = setTimeout(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }, 200);
    return () => clearTimeout(timer);
  }, [cursor, completed]);

  if (!quote) return null;

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
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[720px] flex-col overflow-hidden border-l border-black/10 bg-sage-fade text-black shadow-pop"
          >
            <header className="flex items-start justify-between gap-4 border-b border-black/10 bg-white/40 px-6 py-5 backdrop-blur">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-black px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-rh-lime">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rh-lime" /> Live · OCEN 4.0
                </div>
                <div className="mt-2 font-serif text-2xl leading-tight tracking-serif text-black">
                  Applying to {quote.lender}
                </div>
                <div className="mt-1 text-[13px] text-black/65">
                  Standard iSPIRT LA → Lender protocol · txn traced end-to-end
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
              {loading && (
                <div className="flex items-center gap-2 text-[13px] text-black/60">
                  <Loader2 className="h-4 w-4 animate-spin" /> Preparing OCEN transaction…
                </div>
              )}

              <ol className="relative space-y-6 border-l border-black/15 pl-6">
                {flow.map((step, i) => {
                  const revealed = i <= cursor;
                  const active = i === cursor && !completed;
                  const done = i < cursor || (i === cursor && completed);
                  return (
                    <motion.li
                      key={i}
                      layout="position"
                      initial={{ opacity: 0, x: 12 }}
                      animate={revealed ? { opacity: 1, x: 0 } : { opacity: 0.35, x: 12 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="relative"
                    >
                      <span
                        className={`absolute -left-[33px] top-1 grid h-6 w-6 place-items-center rounded-full border-2 transition-colors ${
                          done
                            ? "border-black bg-black text-rh-lime"
                            : active
                              ? "border-black bg-white text-black"
                              : "border-black/25 bg-white text-black/40"
                        }`}
                      >
                        {done ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : active ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <span className="text-[10px] font-bold tabular">{i + 1}</span>
                        )}
                      </span>

                      <div className="flex items-center gap-3">
                        <div className="text-[11px] font-mono font-semibold uppercase tracking-widest text-black/55">
                          {step.direction === "la->lender" ? (
                            <span className="inline-flex items-center gap-1">
                              LSP <ArrowRight className="h-3 w-3" /> Lender
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              Lender <ArrowLeft className="h-3 w-3" /> LSP
                            </span>
                          )}
                        </div>
                        <span className="text-[13px] font-semibold text-black">
                          {STEP_LABEL[step.name]}
                        </span>
                      </div>
                      <div className="mt-1 font-mono text-[11px] text-black/55">
                        {step.direction === "la->lender" ? "POST" : "200 OK"} {step.endpoint}
                      </div>

                      <AnimatePresence initial={false}>
                        {revealed && (
                          <motion.div
                            key="body"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 rounded-xl border border-black/10 bg-white/85 p-4">
                              <pre className="whitespace-pre-wrap break-words font-mono text-[11.5px] leading-relaxed text-black/80">
                                {JSON.stringify(step.payload, null, 2)}
                              </pre>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.li>
                  );
                })}
              </ol>

              <AnimatePresence>
                {completed && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-8 rounded-2xl border-2 border-black bg-white p-6"
                  >
                    <div className="inline-flex items-center gap-2 rounded-full bg-rh-lime px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-black">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Sanctioned
                    </div>
                    <div className="mt-3 font-serif text-2xl leading-tight tracking-serif text-black">
                      Loan approved. Disbursal in 24 hours.
                    </div>
                    <div className="mt-2 text-[13px] leading-relaxed text-black/70">
                      OCEN 4.0 handshake complete. Post-disbursement AA consent will keep the
                      sanction refreshed monthly.
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
