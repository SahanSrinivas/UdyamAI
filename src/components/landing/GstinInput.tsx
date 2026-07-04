"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { validateGstin } from "@/lib/gstin";

type Theme = "dark" | "light";

const T: Record<Theme, {
  label: string; wrap: string; wrapOk: string; wrapErr: string; wrapIdle: string;
  input: string; btnOk: string; btnIdle: string; help: string; ok: string; err: string; typing: string;
}> = {
  dark: {
    label: "text-muted",
    wrap: "bg-base-900",
    wrapOk: "border-rh-lime shadow-lime-glow",
    wrapErr: "border-rh-red",
    wrapIdle: "border-line-strong",
    input: "text-base-50 placeholder:text-muted-soft",
    btnOk: "bg-rh-lime text-black hover:bg-rh-lime-bright",
    btnIdle: "bg-base-800 text-muted-soft",
    help: "text-muted-soft",
    ok: "text-rh-lime",
    err: "text-rh-red",
    typing: "text-muted-soft",
  },
  light: {
    label: "text-black/70",
    wrap: "bg-white/60",
    wrapOk: "border-black shadow-none",
    wrapErr: "border-rh-red",
    wrapIdle: "border-black/15",
    input: "text-black placeholder:text-black/35",
    btnOk: "bg-black text-white hover:bg-black/85",
    btnIdle: "bg-black/10 text-black/40",
    help: "text-black/55",
    ok: "text-black",
    err: "text-rh-red",
    typing: "text-black/55",
  },
};

export function GstinInput({ theme = "dark" }: { theme?: Theme }) {
  const router = useRouter();
  const t = T[theme];
  const [raw, setRaw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<{ state: string; pan: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function handleChange(v: string) {
    const next = v.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 15);
    setRaw(next);
    if (next.length === 15) {
      const r = validateGstin(next);
      if (r.ok) {
        setOk({ state: r.state, pan: r.pan });
        setError(null);
      } else {
        setError(r.reason);
        setOk(null);
      }
    } else {
      setError(null);
      setOk(null);
    }
  }

  function submit() {
    if (!ok) return;
    startTransition(() => router.push(`/dashboard?gstin=${raw}`));
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ delay: 0.2 }}
      className="w-full max-w-xl"
    >
      <label htmlFor="gstin" className={`block text-[13px] font-semibold uppercase tracking-[0.18em] ${t.label}`}>
        GSTIN
      </label>

      <div
        className={`mt-3 flex items-center gap-2 rounded-2xl border p-2 pl-5 transition ${t.wrap} ${
          ok ? t.wrapOk : error ? t.wrapErr : t.wrapIdle
        }`}
      >
        <input
          id="gstin"
          value={raw}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="22AAAAA0000A1Z5"
          spellCheck={false}
          autoComplete="off"
          className={`w-full bg-transparent font-mono text-lg tracking-wider outline-none ${t.input}`}
        />
        <button
          type="button"
          onClick={submit}
          disabled={!ok || pending}
          className={`inline-flex items-center gap-1.5 rounded-xl px-5 py-3 text-[15px] font-semibold transition ${
            ok ? t.btnOk : `cursor-not-allowed ${t.btnIdle}`
          }`}
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : ok ? <ArrowRight className="h-4 w-4" /> : null}
          {ok ? "Open" : "Verify"}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {ok && (
          <motion.div
            key="ok"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium ${t.ok}`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Valid GSTIN · {ok.state} · PAN {ok.pan}
          </motion.div>
        )}
        {error && (
          <motion.div
            key="err"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mt-3 text-[13px] font-medium ${t.err}`}
          >
            {error}
          </motion.div>
        )}
        {!error && !ok && raw.length > 0 && raw.length < 15 && (
          <motion.div
            key="typing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`mt-3 text-[13px] tabular ${t.typing}`}
          >
            {raw.length} / 15 characters
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`mt-4 text-[13px] ${t.help}`}>
        Validated on-device using the official RBI checksum. Nothing is sent until you press Open.
      </div>
    </motion.div>
  );
}
