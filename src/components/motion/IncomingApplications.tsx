"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Inbox, RefreshCw, X } from "lucide-react";
import type { LiveApplication } from "@/lib/applicationPipeline";
import { formatINR } from "@/lib/utils";

export function IncomingApplications({ lender, decidedBy }: { lender: string; decidedBy: string }) {
  const [apps, setApps] = useState<LiveApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/applications?lender=${encodeURIComponent(lender)}`, { cache: "no-store" });
    const j = await res.json();
    setApps((j.items || []).filter((a: LiveApplication) => {
      const d = a.decisions.find((x) => x.lender === lender);
      return d?.status === "pending";
    }));
    setLoading(false);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 6000);
    return () => clearInterval(t);
  }, [lender]);

  async function decide(app: LiveApplication, decision: "approved" | "rejected") {
    setBusy(app.applicationId);
    const dec = app.decisions.find((x) => x.lender === lender);
    await fetch("/api/applications/decide", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        applicationId: app.applicationId,
        lender,
        decision,
        decidedBy,
        confidence: dec ? (0.75 + Math.random() * 0.2) : 0.85,
        ratePct: 12.5 + Math.random() * 2,
        sanctionAmount: app.requestedAmount * (decision === "approved" ? 0.9 + Math.random() * 0.15 : 0),
        reason: decision === "rejected" ? "Portfolio caps · sector concentration" : undefined,
      }),
    });
    await load();
    setBusy(null);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      className="rounded-3xl border-2 border-rh-lime/50 bg-white p-6 shadow-cream-card"
    >
      <div className="flex items-baseline justify-between">
        <div className="inline-flex items-center gap-2 rounded-full bg-black px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-rh-lime">
          <Inbox className="h-3.5 w-3.5" />
          Incoming applications · {apps.length}
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-1 rounded-full border border-black/15 bg-white px-3 py-1 text-[11px] font-semibold text-black hover:border-black/30"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>
      <div className="mt-1 text-[13px] text-black/60">
        Live queue · MSMEs who just submitted via UdyamAI · pipeline auto-refreshes every 6s
      </div>

      <div className="mt-5 space-y-3">
        <AnimatePresence>
          {apps.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="rounded-2xl border border-dashed border-black/15 bg-black/[0.02] p-8 text-center text-[13px] text-black/60"
            >
              No pending applications. Ask an MSME to submit — you&rsquo;ll see it here within 6 seconds.
            </motion.div>
          )}

          {apps.map((app) => (
            <motion.div
              key={app.applicationId}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 40, transition: { duration: 0.35 } }}
              className="rounded-2xl border border-black/15 bg-white/95 p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <div className="font-serif text-[22px] leading-none text-black">{app.msmeName}</div>
                    <span className="rounded-md bg-rh-lime/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-black">
                      Score {app.scoreAtSubmit}
                    </span>
                  </div>
                  <div className="mt-1 text-[12px] text-black/60">
                    {app.sector} · {app.city.split(",")[0]} · GSTIN{" "}
                    <span className="font-mono">{app.gstin}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-baseline gap-x-5 gap-y-1 text-[13px]">
                    <span className="text-black/60">
                      Requested: <span className="font-bold tabular text-black">{formatINR(app.requestedAmount)}</span>
                    </span>
                    <span className="text-black/60">
                      Purpose: <span className="font-semibold text-black">{app.purpose.replace(/_/g, " ")}</span>
                    </span>
                    <span className="text-black/60">
                      Tenor: <span className="font-semibold text-black">{app.tenorMonths}m</span>
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-bold uppercase tracking-widest">
                    {[
                      ["Revenue", app.subScores.revenue],
                      ["Compl.", app.subScores.compliance],
                      ["Ctpty", app.subScores.counterparty],
                      ["Growth", app.subScores.growth],
                    ].map(([label, val]) => (
                      <span key={label as string} className="rounded-md bg-black/[0.05] px-2 py-1 tabular text-black">
                        {label} <span className="text-black/60">·</span> {val as number}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => decide(app, "rejected")}
                    disabled={busy === app.applicationId}
                    className="inline-flex items-center gap-1 rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-[13px] font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"
                  >
                    <X className="h-3.5 w-3.5" />
                    Reject
                  </button>
                  <button
                    onClick={() => decide(app, "approved")}
                    disabled={busy === app.applicationId}
                    className="inline-flex items-center gap-1 rounded-xl bg-rh-lime px-4 py-2.5 text-[13px] font-bold text-black hover:bg-rh-lime-bright disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Approve
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
