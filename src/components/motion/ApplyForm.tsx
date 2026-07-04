"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowRight, CheckCircle2, Circle, FileText, Landmark, Loader2, Users, Wallet, ShieldCheck,
} from "lucide-react";

type Quote = {
  lender: string;
  confidence: number;
  ratePct: number;
  sanctionAmount: number;
  tenorMonths: number;
};

type Props = {
  gstin: string;
  msmeName: string;
  city: string;
  sector: string;
  overall: number;
  subScores: { revenue: number; compliance: number; counterparty: number; growth: number };
  quotes: Quote[];
};

const PURPOSES = [
  { key: "working_capital", label: "Working capital" },
  { key: "term_loan", label: "Term loan" },
  { key: "invoice_finance", label: "Invoice financing" },
  { key: "equipment", label: "Equipment purchase" },
] as const;

const TENORS = [12, 24, 36, 48, 60];

export function ApplyForm(props: Props) {
  const router = useRouter();
  const suggested = Math.max(...props.quotes.map((q) => q.sanctionAmount));
  const [amount, setAmount] = useState(suggested);
  const [purpose, setPurpose] = useState<typeof PURPOSES[number]["key"]>("working_capital");
  const [tenor, setTenor] = useState(36);
  const [selectedLenders, setSelectedLenders] = useState<string[]>([props.quotes[0]?.lender ?? "IDBI Bank"]);
  const [docs, setDocs] = useState({
    gstinVerified: true,
    aaConsent: true,
    bankStatement12mo: true,
    gstr3bLast6Months: true,
    gstr1LastMonth: false,
    epfoLinked: false,
    itrUploaded: false,
  });
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState<string | null>(null);

  const docCount = Object.values(docs).filter(Boolean).length;
  const totalDocs = Object.keys(docs).length;
  const readiness = Math.round((docCount / totalDocs) * 100);

  async function submit() {
    if (selectedLenders.length === 0) return;
    setPending(true);
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        gstin: props.gstin,
        msmeName: props.msmeName,
        city: props.city,
        sector: props.sector,
        requestedAmount: amount,
        purpose,
        tenorMonths: tenor,
        scoreAtSubmit: props.overall,
        subScores: props.subScores,
        documents: docs,
        submittedTo: selectedLenders,
      }),
    });
    const j = await res.json();
    if (j.ok) setSubmitted(j.application.applicationId);
    setPending(false);
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border-2 border-black bg-white p-10"
      >
        <div className="inline-flex items-center gap-2 rounded-full bg-rh-lime px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-black">
          <CheckCircle2 className="h-3.5 w-3.5" /> Application submitted
        </div>
        <h2 className="mt-4 font-serif text-[36px] leading-tight text-black">
          You&rsquo;re in the queue.
        </h2>
        <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-black/70">
          Application ID <span className="font-mono font-bold text-black">{submitted}</span> was
          sent to {selectedLenders.length} lender{selectedLenders.length > 1 ? "s" : ""} with your
          Health Card attached. They&rsquo;ll see it live in their pipeline in the next few seconds.
          Expect a decision within 24 hours per lender.
        </p>
        <div className="mt-8 flex gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-xl bg-black px-6 py-3 text-[14px] font-semibold text-white hover:bg-black/85"
          >
            Back to Health Card
          </button>
          <button
            onClick={() => { setSubmitted(null); setSelectedLenders([]); }}
            className="rounded-xl border border-black/15 bg-white px-6 py-3 text-[14px] font-semibold text-black hover:border-black/30"
          >
            Apply again
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* Left column — form */}
      <div className="space-y-6">
        {/* Amount + purpose */}
        <div className="rounded-3xl border border-black/10 bg-white/80 p-7 shadow-cream-card">
          <div className="text-[11px] font-bold uppercase tracking-widest text-black/60">
            Loan details
          </div>
          <div className="mt-5">
            <label className="text-[13px] font-semibold text-black">Amount requested</label>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="tabular font-serif text-[38px] leading-none text-black">
                ₹{(amount / 100000).toFixed(1)} L
              </span>
              <input
                type="range"
                min={500000}
                max={5000000}
                step={100000}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="ml-auto flex-1 accent-black"
              />
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-black/50 tabular">
              <span>₹5 L</span>
              <span>Suggested by LR · ₹{Math.round(suggested / 100000)} L</span>
              <span>₹50 L</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-black/60">Purpose</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {PURPOSES.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setPurpose(p.key)}
                    className={`rounded-xl border p-3 text-left text-[12px] font-semibold transition ${
                      purpose === p.key
                        ? "border-black bg-black text-white"
                        : "border-black/15 bg-white text-black hover:border-black/40"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-black/60">Tenor</label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {TENORS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTenor(t)}
                    className={`rounded-xl border py-2 text-center text-[13px] font-bold tabular transition ${
                      tenor === t
                        ? "border-black bg-black text-white"
                        : "border-black/15 bg-white text-black hover:border-black/40"
                    }`}
                  >
                    {t}m
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="rounded-3xl border border-black/10 bg-white/80 p-7 shadow-cream-card">
          <div className="flex items-baseline justify-between">
            <div className="text-[11px] font-bold uppercase tracking-widest text-black/60">
              Documents · verified by AA
            </div>
            <div className="tabular text-[13px] font-bold text-black">{docCount} / {totalDocs} · {readiness}%</div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {[
              { key: "gstinVerified", label: "GSTIN verified", auto: true },
              { key: "aaConsent", label: "AA consent granted", auto: true },
              { key: "bankStatement12mo", label: "Bank statement (12 mo)", auto: true },
              { key: "gstr3bLast6Months", label: "GSTR-3B · 6 months", auto: true },
              { key: "gstr1LastMonth", label: "GSTR-1 · last month" },
              { key: "epfoLinked", label: "EPFO linked" },
              { key: "itrUploaded", label: "ITR uploaded (optional)" },
            ].map((doc) => {
              const on = docs[doc.key as keyof typeof docs];
              return (
                <button
                  key={doc.key}
                  onClick={() => setDocs((d) => ({ ...d, [doc.key]: !on }))}
                  disabled={doc.auto}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-left text-[13px] transition ${
                    on
                      ? "border-black/25 bg-rh-lime/10"
                      : "border-black/10 bg-white hover:border-black/25"
                  } ${doc.auto ? "cursor-default opacity-90" : "cursor-pointer"}`}
                >
                  {on ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-black" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-black/30" />
                  )}
                  <span className="flex-1 font-semibold text-black">{doc.label}</span>
                  {doc.auto && (
                    <span className="rounded-md bg-black px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-rh-lime">
                      AA
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lender select */}
        <div className="rounded-3xl border border-black/10 bg-white/80 p-7 shadow-cream-card">
          <div className="text-[11px] font-bold uppercase tracking-widest text-black/60">
            Send my Health Card to
          </div>
          <div className="mt-4 space-y-2">
            {props.quotes.map((q) => {
              const on = selectedLenders.includes(q.lender);
              return (
                <button
                  key={q.lender}
                  onClick={() =>
                    setSelectedLenders((prev) =>
                      prev.includes(q.lender)
                        ? prev.filter((x) => x !== q.lender)
                        : [...prev, q.lender]
                    )
                  }
                  className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${
                    on ? "border-black bg-black/[0.03]" : "border-black/10 bg-white hover:border-black/30"
                  }`}
                >
                  <div className={`grid h-6 w-6 place-items-center rounded-md border-2 ${on ? "border-black bg-black text-rh-lime" : "border-black/20 bg-white"}`}>
                    {on && <CheckCircle2 className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-serif text-[20px] leading-none text-black">{q.lender}</div>
                    <div className="mt-1 text-[12px] text-black/60">
                      Est. sanction ₹{(q.sanctionAmount / 100000).toFixed(1)} L · {q.ratePct.toFixed(2)}% · {q.tenorMonths} months
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="tabular text-[15px] font-bold text-black">
                      {Math.round(q.confidence * 100)}%
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-black/50">Approval</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right sticky column — profile summary + submit */}
      <div className="lg:sticky lg:top-24 h-fit space-y-4">
        <div className="rounded-3xl border border-black/10 bg-black p-6 text-white">
          <div className="text-[10px] font-bold uppercase tracking-widest text-rh-lime">
            Your Health Card · attached
          </div>
          <div className="mt-2 text-[22px] font-serif leading-tight">{props.msmeName}</div>
          <div className="mt-1 text-[12px] text-white/60">{props.city} · {props.sector}</div>
          <div className="mt-5 flex items-baseline gap-2">
            <div className="tabular font-serif text-[56px] leading-none text-rh-lime">
              {props.overall}
            </div>
            <div className="text-[11px] uppercase tracking-widest text-white/50">/ 1000</div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
            <Chip icon={<Wallet className="h-3 w-3" />} label="Revenue" value={props.subScores.revenue} />
            <Chip icon={<ShieldCheck className="h-3 w-3" />} label="Compliance" value={props.subScores.compliance} />
            <Chip icon={<Users className="h-3 w-3" />} label="Counterparty" value={props.subScores.counterparty} />
            <Chip icon={<Landmark className="h-3 w-3" />} label="Growth" value={props.subScores.growth} />
          </div>
        </div>

        <AnimatePresence>
          {selectedLenders.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-amber-400/50 bg-amber-100 p-3 text-[12px] text-amber-900">
              Pick at least one lender to continue.
            </motion.div>
          ) : (
            <motion.button
              key="submit"
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              onClick={submit}
              disabled={pending || selectedLenders.length === 0}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-6 py-4 text-[15px] font-semibold text-white shadow-cream-card hover:bg-black/85 disabled:opacity-50"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              Submit to {selectedLenders.length} lender{selectedLenders.length > 1 ? "s" : ""}
              <ArrowRight className="h-4 w-4" />
            </motion.button>
          )}
        </AnimatePresence>

        <div className="rounded-2xl border border-black/10 bg-white/60 p-3 text-[11px] leading-relaxed text-black/60">
          Submitting attaches your entire Health Card + LR confidence score to each selected
          lender via the OCEN LA rail. You can cancel any time before decisioning.
        </div>
      </div>
    </div>
  );
}

function Chip({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-lg bg-white/[0.06] p-2">
      <div className="inline-flex items-center gap-1 text-white/50">{icon}<span>{label}</span></div>
      <div className="mt-1 tabular font-bold text-white">{value}</div>
    </div>
  );
}
