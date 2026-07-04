"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, CheckCircle2, ExternalLink, Loader2, Send } from "lucide-react";
import Link from "next/link";

type Bubble =
  | { kind: "bot"; text: string; typingMs?: number }
  | { kind: "user"; text: string }
  | { kind: "action"; label: string; onTap: () => void; sub?: string; icon?: string }
  | { kind: "sysCard"; title: string; body: React.ReactNode }
  | { kind: "quickReplies"; options: { label: string; value: string; icon?: string }[]; onPick: (v: string) => void }
  | { kind: "scoreCard"; score: number; band: string }
  | { kind: "loanCards"; quotes: { lender: string; conf: number; amount: number; rate: number }[]; onPick: (l: string) => void };

const DEMO_MSME = {
  gstin: "24AABCS1234R1Z8",
  name: "Shreeji Silks",
  city: "Surat, Gujarat",
  score: 748,
  band: "Strong",
  aadhaarMasked: "XXXX-XXXX-4291",
  bank: "IDBI Bank · CA",
};

function ts() {
  return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export function WhatsAppOnboarding() {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [typing, setTyping] = useState(false);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const initRef = useRef(false);

  const push = useCallback((b: Bubble) => {
    setBubbles((prev) => [...prev, b]);
  }, []);

  const say = useCallback(async (text: string, typingMs = 900) => {
    setTyping(true);
    await new Promise((r) => setTimeout(r, typingMs));
    setTyping(false);
    push({ kind: "bot", text });
  }, [push]);

  const userSays = useCallback(async (text: string) => {
    push({ kind: "user", text });
    await new Promise((r) => setTimeout(r, 350));
  }, [push]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [bubbles, typing]);

  // Story flow — guard against React Strict Mode double-invoke
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    (async () => {
      await new Promise((r) => setTimeout(r, 300));
      await say("Namaste 🙏 Main UdyamAI hoon — your MSME credit assistant.", 900);
      await say("I can get you a live Health Score and pre-qualified loan quotes in 3 minutes. Ready?", 1200);
      push({
        kind: "quickReplies",
        options: [
          { label: "Yes, let's start", value: "start", icon: "▶" },
          { label: "How does it work?", value: "how" },
        ],
        onPick: async (v) => {
          removeQuickReplies();
          if (v === "start") await beginGstinFlow();
          else {
            await userSays("How does it work?");
            await say("Simple. I'll ask for your GSTIN, verify your Aadhaar, then pull your bank + GST data via RBI-regulated Account Aggregator. All 3 steps take under 3 minutes.", 1400);
            await say("No paperwork. No CIBIL needed. Ready?", 900);
            push({
              kind: "quickReplies",
              options: [{ label: "Yes, let's start", value: "start", icon: "▶" }],
              onPick: async () => { removeQuickReplies(); await beginGstinFlow(); },
            });
          }
        },
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function removeQuickReplies() {
    setBubbles((prev) => prev.filter((b) => b.kind !== "quickReplies" && b.kind !== "action"));
  }

  async function handleUserMessage(raw: string) {
    const text = raw.trim();
    if (!text) return;
    setDraft("");
    await userSays(text);
    const cmd = text.toUpperCase();

    if (cmd === "MENU") {
      await say("Here's what I can help with. Reply with a number or tap a chip.", 700);
      push({
        kind: "quickReplies",
        options: [
          { label: "1 · Apply for a loan", value: "LOAN", icon: "🏦" },
          { label: "2 · Check my score", value: "SCORE", icon: "📊" },
          { label: "3 · View history", value: "HISTORY", icon: "📜" },
          { label: "4 · Open Health Card", value: "OPEN", icon: "🌐" },
          { label: "5 · Help", value: "HELP", icon: "💬" },
        ],
        onPick: async (v) => {
          removeQuickReplies();
          await handleUserMessage(v);
        },
      });
      return;
    }
    if (cmd === "LOAN" || cmd === "APPLY" || cmd === "1") {
      await say("Let me pull up your latest pre-qualified lenders...", 900);
      await revealScore();
      return;
    }
    if (cmd === "SCORE" || cmd === "2") {
      await say(`Your latest UdyamAI Health Score is ${DEMO_MSME.score} / 1000 · ${DEMO_MSME.band} band.`, 900);
      push({ kind: "scoreCard", score: DEMO_MSME.score, band: DEMO_MSME.band });
      await say("Type MENU any time to see options.", 800);
      return;
    }
    if (cmd === "HISTORY" || cmd === "3") {
      await say("Your Health Score refreshes every 30 days from your AA feed. Last 3 events:", 900);
      push({
        kind: "sysCard",
        title: "Recent events",
        body: (
          <div className="space-y-1 text-[12px] text-black">
            <div><span className="font-bold text-green-700">+8</span> · GSTR-3B filed on time · 2h ago</div>
            <div><span className="font-bold text-green-700">+14</span> · UPI velocity up 22% · 3d ago</div>
            <div><span className="font-bold text-rh-red">−4</span> · Buyer concentration flagged · 12d ago</div>
          </div>
        ),
      });
      return;
    }
    if (cmd === "OPEN" || cmd === "4") {
      await say(`Opening your Health Card at udyamai.com/dashboard...`, 800);
      await new Promise((r) => setTimeout(r, 700));
      window.location.assign(`/dashboard?gstin=${DEMO_MSME.gstin}`);
      return;
    }
    if (cmd === "HELP" || cmd === "5") {
      await say("Available commands:", 700);
      await say("• MENU — main options\n• LOAN — apply for a loan\n• SCORE — see your Health Score\n• HISTORY — see recent score events\n• OPEN — open full Health Card in browser", 1200);
      return;
    }
    if (cmd === "STOP" || cmd === "UNSUBSCRIBE") {
      await say("You've been opted out of WhatsApp updates. Type START to resume.", 900);
      return;
    }

    // Unknown text — friendly fallback
    await say(`I didn't catch that. Try typing MENU to see what I can do.`, 900);
    push({
      kind: "quickReplies",
      options: [{ label: "Show MENU", value: "MENU", icon: "≡" }],
      onPick: async (v) => { removeQuickReplies(); await handleUserMessage(v); },
    });
  }

  async function beginGstinFlow() {
    setStep(1);
    await userSays("Yes, let's start");
    await say("Great. What's your business GSTIN? (15 characters)", 1000);
    push({
      kind: "quickReplies",
      options: [
        { label: DEMO_MSME.gstin, value: DEMO_MSME.gstin, icon: "📝" },
      ],
      onPick: async (v) => {
        removeQuickReplies();
        await userSays(v);
        await say("Verifying GSTIN with GSTN...", 700);
        push({
          kind: "sysCard",
          title: "GSTIN verified · via GSTN as FIP",
          body: (
            <div className="text-black">
              <div className="text-[13px] font-semibold text-black">{DEMO_MSME.name}</div>
              <div className="mt-0.5 text-[11px] text-black/70">{DEMO_MSME.city} · Regular taxpayer · Active since 2022</div>
              <div className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-green-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-green-700">
                <Check className="h-2.5 w-2.5" /> Match
              </div>
            </div>
          ),
        });
        await new Promise((r) => setTimeout(r, 900));
        await beginAadhaarFlow();
      },
    });
  }

  async function beginAadhaarFlow() {
    setStep(2);
    await say(`Perfect, ${DEMO_MSME.name.split(" ")[0]}. Now I need to verify your Aadhaar for KYC.`, 900);
    await say("This is a UIDAI OTP · takes 15 seconds. Tap below to start.", 700);
    push({
      kind: "action",
      label: "Verify with Aadhaar",
      sub: "via Digio · UIDAI OTP",
      icon: "🪪",
      onTap: async () => {
        removeQuickReplies();
        await userSays("→ Aadhaar OTP submitted");
        await say("✓ Aadhaar verified", 900);
        push({
          kind: "sysCard",
          title: "Aadhaar · KYC verified",
          body: (
            <div className="text-black">
              <div className="font-mono text-[13px] font-semibold text-black">{DEMO_MSME.aadhaarMasked}</div>
              <div className="mt-1 text-[11px] text-black/70">e-KYC completed · via Digio · UIDAI OTP verified at {ts()}</div>
            </div>
          ),
        });
        await new Promise((r) => setTimeout(r, 900));
        await beginAaFlow();
      },
    });
  }

  async function beginAaFlow() {
    setStep(3);
    await say("Almost there. Now grant one-time consent to pull your bank statement + GST returns via Account Aggregator (RBI-regulated).", 1200);
    push({
      kind: "action",
      label: "Grant AA consent · 1 tap",
      sub: "via Finvu · Sahamati network",
      icon: "🏦",
      onTap: async () => {
        removeQuickReplies();
        await userSays("→ Consent granted at Finvu");
        await say("Pulling data from GSTN + your bank... hang on 20 seconds", 800);
        push({
          kind: "sysCard",
          title: "Live data pulled · via Finvu AA",
          body: (
            <div className="space-y-1.5 text-[12px] font-medium text-black">
              <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 shrink-0 text-green-600" /><span>Bank statement · 12 months · {DEMO_MSME.bank}</span></div>
              <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 shrink-0 text-green-600" /><span>GSTR-1 + GSTR-3B · 24 months</span></div>
              <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 shrink-0 text-green-600" /><span>UPI transactions · 1,842 counter-parties</span></div>
              <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 shrink-0 text-green-600" /><span>EPFO contribution · Active</span></div>
            </div>
          ),
        });
        await new Promise((r) => setTimeout(r, 1400));
        await say("Computing your Health Score...", 700);
        await new Promise((r) => setTimeout(r, 1800));
        await revealScore();
      },
    });
  }

  async function revealScore() {
    setStep(4);
    await say(`🎉 Your UdyamAI Health Score is ready.`, 700);
    push({ kind: "scoreCard", score: DEMO_MSME.score, band: DEMO_MSME.band });
    await new Promise((r) => setTimeout(r, 1400));
    await say("Now the good part — I've found 3 pre-qualified lenders for you. Pick one to apply.", 1200);
    push({
      kind: "loanCards",
      quotes: [
        { lender: "IDBI Bank", conf: 0.91, amount: 1500000, rate: 12.5 },
        { lender: "SBI", conf: 0.88, amount: 1200000, rate: 11.9 },
        { lender: "HDFC Bank", conf: 0.85, amount: 1800000, rate: 13.4 },
      ],
      onPick: async (lender) => {
        removeQuickReplies();
        await userSays(`→ Apply to ${lender}`);
        await customizeApplication(lender);
      },
    });
    // Cancel / not-now escape hatch
    push({
      kind: "quickReplies",
      options: [
        { label: "Not now · save my score", value: "cancel", icon: "💾" },
        { label: "Send to all 3 lenders", value: "all", icon: "📤" },
      ],
      onPick: async (v) => {
        removeQuickReplies();
        if (v === "cancel") {
          await userSays("Not now · save my score");
          await say("No problem 👍 Your Health Score is saved. You can apply anytime later — score refreshes every 30 days from your AA feed.", 1200);
          push({
            kind: "sysCard",
            title: "Score saved · no application submitted",
            body: (
              <div className="text-black">
                <div className="text-[13px] font-semibold text-black">Your UdyamAI Health Card is live.</div>
                <div className="mt-1 text-[11px] text-black/70">
                  Come back any time — type LOAN in this chat to see updated quotes, or open the full Health Card in your browser.
                </div>
              </div>
            ),
          });
          await new Promise((r) => setTimeout(r, 900));
          await say(`Anything else? Type MENU to see options, or open your full Health Card in browser.`, 1000);
          setStep(6);
        } else {
          await userSays("Send to all 3 lenders");
          await say("Great — I'll customize each application with your score attached. First, how much do you need overall?", 1100);
          await customizeApplication("all 3 lenders");
        }
      },
    });
  }

  async function customizeApplication(lender: string) {
    setStep(5);
    await say(`Great choice — ${lender}. Let me tailor your application. First, how much do you need?`, 1000);
    await new Promise<void>((resolve) => {
      push({
        kind: "quickReplies",
        options: [
          { label: "₹5 L", value: "500000", icon: "💵" },
          { label: "₹10 L", value: "1000000", icon: "💵" },
          { label: "₹15 L · suggested", value: "1500000", icon: "⭐" },
          { label: "₹25 L", value: "2500000", icon: "💵" },
          { label: "₹50 L", value: "5000000", icon: "💵" },
        ],
        onPick: async (v) => {
          removeQuickReplies();
          await userSays(`₹${(Number(v) / 100000).toFixed(0)} L`);
          const amount = Number(v);

          await say("What's the purpose?", 700);
          push({
            kind: "quickReplies",
            options: [
              { label: "Working capital", value: "working_capital", icon: "🏭" },
              { label: "Term loan", value: "term_loan", icon: "📈" },
              { label: "Invoice financing", value: "invoice_finance", icon: "🧾" },
              { label: "Equipment purchase", value: "equipment", icon: "🔧" },
            ],
            onPick: async (purpose) => {
              removeQuickReplies();
              const purposeLabel = purpose.replace(/_/g, " ");
              await userSays(purposeLabel);

              await say("And your preferred tenor?", 700);
              push({
                kind: "quickReplies",
                options: [
                  { label: "12 months", value: "12", icon: "📅" },
                  { label: "24 months", value: "24", icon: "📅" },
                  { label: "36 months · suggested", value: "36", icon: "⭐" },
                  { label: "48 months", value: "48", icon: "📅" },
                  { label: "60 months", value: "60", icon: "📅" },
                ],
                onPick: async (tenor) => {
                  removeQuickReplies();
                  await userSays(`${tenor} months`);
                  await confirmApplication(lender, amount, purpose, Number(tenor));
                  resolve();
                },
              });
            },
          });
        },
      });
    });
  }

  async function confirmApplication(lender: string, amount: number, purpose: string, tenor: number) {
    const purposeLabel = purpose.replace(/_/g, " ");
    await say(`Confirming: ₹${(amount / 100000).toFixed(1)} L · ${purposeLabel} · ${tenor} months at ${lender}. Correct?`, 900);
    await new Promise<void>((resolve) => {
      push({
        kind: "quickReplies",
        options: [
          { label: "Yes, submit", value: "yes", icon: "✓" },
          { label: "Change something", value: "no", icon: "↩" },
        ],
        onPick: async (v) => {
          removeQuickReplies();
          if (v === "no") {
            await userSays("Change something");
            await say("No problem. Let's start over — how much do you need?", 700);
            await customizeApplication(lender);
            resolve();
            return;
          }
          await userSays("Yes, submit");
          await say("Submitting via OCEN 4.0 LA rail... this takes a moment.", 900);

          // Actually submit to the pipeline API so it lands on the lender's queue
          let appId = `APP-DEMO-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
          try {
            const res = await fetch("/api/applications", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                gstin: DEMO_MSME.gstin,
                msmeName: DEMO_MSME.name,
                city: DEMO_MSME.city,
                sector: "Textile Wholesale",
                requestedAmount: amount,
                purpose,
                tenorMonths: tenor,
                scoreAtSubmit: DEMO_MSME.score,
                subScores: { revenue: 720, compliance: 690, counterparty: 700, growth: 810 },
                documents: {
                  gstinVerified: true, aaConsent: true, bankStatement12mo: true,
                  gstr3bLast6Months: true, gstr1LastMonth: true, epfoLinked: true, itrUploaded: false,
                },
                submittedTo: [lender],
              }),
            });
            const j = await res.json();
            if (j.ok) appId = j.application.applicationId;
          } catch {}

          await new Promise((r) => setTimeout(r, 1200));
          await say(`✓ Application sent to ${lender}. You'll get a decision within 24 hours.`, 900);
          push({
            kind: "sysCard",
            title: "Application submitted · via OCEN 4.0",
            body: (
              <div className="text-black">
                <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 text-[11px]">
                  <div className="text-black/70">Application ID</div>
                  <div className="font-mono font-semibold text-black">{appId}</div>
                  <div className="text-black/70">Amount</div>
                  <div className="font-bold text-black">₹{(amount / 100000).toFixed(1)} L</div>
                  <div className="text-black/70">Purpose</div>
                  <div className="font-bold text-black">{purposeLabel}</div>
                  <div className="text-black/70">Tenor</div>
                  <div className="font-bold text-black">{tenor} months</div>
                  <div className="text-black/70">Lender</div>
                  <div className="font-bold text-black">{lender}</div>
                </div>
                <div className="mt-3 text-[11px] text-black/70">
                  Now visible in {lender}&rsquo;s pipeline. Sanction pending underwriting.
                </div>
              </div>
            ),
          });
          await new Promise((r) => setTimeout(r, 1200));
          await say(`Anything else? Type MENU to see options, or open your full Health Card in browser.`, 1100);
          setStep(6);
        },
      });
    });
  }

  const stepLabels = [
    "Getting started",
    "GSTIN verification",
    "Aadhaar KYC",
    "AA consent",
    "Score computed",
    "Customize application",
    "Application submitted",
  ];

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-6 py-8 lg:grid-cols-[minmax(0,1fr)_420px]">
      {/* Left: narrative + progress */}
      <div className="order-2 lg:order-1">
        <div className="text-[13px] font-semibold uppercase tracking-[0.18em] text-black/60">
          WhatsApp onboarding · production spec
        </div>
        <h1 className="mt-3 font-serif text-[42px] leading-[0.98] tracking-tight text-black sm:text-[54px]">
          Score in 3 minutes.
          <br /><span className="italic text-black/60">No app to install.</span>
        </h1>
        <p className="mt-5 max-w-md text-[15px] leading-relaxed text-black/70">
          Every Indian MSME is already on WhatsApp. Onboarding, KYC, Aadhaar, AA consent, and
          loan application — all inside a single chat. This is what Kotak 811, Jupiter, and
          RazorpayX are racing to build. We built it first.
        </p>

        <div className="mt-8 space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-widest text-black/50">
            Live onboarding progress
          </div>
          {stepLabels.map((label, i) => {
            const active = step === i;
            const done = step > i;
            return (
              <div key={i} className="flex items-center gap-3">
                <div
                  className={`grid h-8 w-8 place-items-center rounded-full transition ${
                    done ? "bg-[#25D366] text-white" : active ? "bg-black text-[#25D366]" : "bg-black/[0.06] text-black/40"
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : active ? <Loader2 className="h-4 w-4 animate-spin" /> : i + 1}
                </div>
                <div className={`text-[14px] font-semibold ${done || active ? "text-black" : "text-black/40"}`}>
                  {label}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl border border-black/10 bg-white/80 p-5">
          <div className="text-[11px] font-bold uppercase tracking-widest text-black/50">
            Production stack
          </div>
          <div className="mt-3 grid gap-1.5 text-[12px] text-black/70">
            <div>· <span className="font-semibold text-black">Gupshup</span> — WhatsApp Business API</div>
            <div>· <span className="font-semibold text-black">Digio</span> — Aadhaar UIDAI eKYC</div>
            <div>· <span className="font-semibold text-black">Finvu / OneMoney</span> — Sahamati AA</div>
            <div>· <span className="font-semibold text-black">GSTN</span> — direct FIP integration</div>
            <div>· <span className="font-semibold text-black">iSPIRT OCEN 4.0</span> — LA → Lender rail</div>
          </div>
        </div>

        {step >= 6 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex flex-wrap gap-3"
          >
            <Link
              href="/dashboard?gstin=24AABCS1234R1Z8"
              className="inline-flex items-center gap-2 rounded-xl bg-black px-6 py-3 text-[14px] font-semibold text-white hover:bg-black/85"
            >
              Open Health Card in browser <ExternalLink className="h-4 w-4" />
            </Link>
            <button
              onClick={() => { setBubbles([]); setStep(0); window.location.reload(); }}
              className="inline-flex items-center gap-2 rounded-xl border border-black/15 bg-white px-6 py-3 text-[14px] font-semibold text-black hover:border-black/30"
            >
              Replay conversation
            </button>
          </motion.div>
        )}
      </div>

      {/* Right: WhatsApp chat mockup */}
      <div className="order-1 lg:order-2">
        <div className="mx-auto max-w-[420px] overflow-hidden rounded-[36px] border-[10px] border-black bg-black shadow-pop">
          {/* Phone status bar */}
          <div className="flex items-center justify-between bg-black px-4 py-2 text-[10px] font-semibold text-white">
            <span className="tabular">{ts()}</span>
            <span>◉◉◉ · 5G · 92%</span>
          </div>
          {/* WhatsApp header */}
          <div className="flex items-center gap-3 bg-[#075E54] px-4 py-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-white text-[#075E54]">
              <span className="font-serif text-lg font-bold">U</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 text-[14px] font-semibold text-white">
                UdyamAI · MSME Credit
                <Check className="h-3.5 w-3.5 text-[#34B7F1]" />
              </div>
              <div className="text-[11px] text-white/80">{typing ? "typing..." : "online"}</div>
            </div>
            <span className="rounded-md bg-[#128C7E] px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-white">
              Business
            </span>
          </div>

          {/* Chat body */}
          <div
            ref={scrollRef}
            className="h-[560px] overflow-y-auto bg-[#e5ddd5] px-3 py-4"
            style={{ backgroundImage: "radial-gradient(rgba(0,0,0,0.03) 1px, transparent 1px)", backgroundSize: "16px 16px" }}
          >
            <div className="mb-3 text-center">
              <span className="rounded-md bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-black/60">
                Today
              </span>
            </div>

            <AnimatePresence initial={false}>
              {bubbles.map((b, i) => (
                <BubbleView key={i} bubble={b} />
              ))}
              {typing && (
                <motion.div
                  key="typing"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-2 flex justify-start"
                >
                  <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-white px-3 py-2 shadow-sm">
                    {[0, 1, 2].map((k) => (
                      <motion.span
                        key={k}
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 0.9, repeat: Infinity, delay: k * 0.15 }}
                        className="inline-block h-1.5 w-1.5 rounded-full bg-black/40"
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Chat input */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleUserMessage(draft); }}
            className="flex items-center gap-2 border-t border-black/20 bg-[#f0f0f0] px-3 py-2"
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={step >= 6 ? "Type MENU, LOAN, SCORE, HELP..." : "Reply above to continue · or type MENU"}
              autoComplete="off"
              enterKeyHint="send"
              className="flex-1 rounded-full border border-transparent bg-white px-4 py-2 text-[13px] text-black outline-none placeholder:text-black/40 focus:border-[#25D366]"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              className="grid h-9 w-9 place-items-center rounded-full bg-[#25D366] text-white transition disabled:opacity-40"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function BubbleView({ bubble }: { bubble: Bubble }) {
  if (bubble.kind === "bot") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-2 flex justify-start"
      >
        <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 shadow-sm">
          <div className="text-[13px] leading-snug text-black">{bubble.text}</div>
          <div className="mt-1 flex justify-end text-[10px] text-black/50">{ts()}</div>
        </div>
      </motion.div>
    );
  }
  if (bubble.kind === "user") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-2 flex justify-end"
      >
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-[#DCF8C6] px-3 py-2 shadow-sm">
          <div className="text-[13px] leading-snug text-black">{bubble.text}</div>
          <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-black/50">
            {ts()}
            <span className="inline-flex text-[#34B7F1]">
              <Check className="-mr-1.5 h-3 w-3" /><Check className="h-3 w-3" />
            </span>
          </div>
        </div>
      </motion.div>
    );
  }
  if (bubble.kind === "sysCard") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-2 flex justify-start"
      >
        <div className="max-w-[90%] rounded-2xl rounded-tl-sm border border-green-100 bg-white p-3.5 text-black shadow-md">
          <div className="mb-2 border-b border-green-100 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-green-700">
            {bubble.title}
          </div>
          {bubble.body}
        </div>
      </motion.div>
    );
  }
  if (bubble.kind === "action") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-2 flex justify-start"
      >
        <button
          onClick={bubble.onTap}
          className="w-[85%] rounded-2xl rounded-tl-sm bg-white p-3 text-left shadow-md ring-2 ring-[#25D366]/30 transition hover:shadow-lg"
        >
          <div className="flex items-center gap-2 text-[13px] font-bold text-[#075E54]">
            {bubble.icon && <span>{bubble.icon}</span>}
            {bubble.label}
            <ArrowRight className="ml-auto h-4 w-4" />
          </div>
          {bubble.sub && <div className="mt-1 text-[11px] text-black/60">{bubble.sub}</div>}
        </button>
      </motion.div>
    );
  }
  if (bubble.kind === "quickReplies") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-2 flex flex-wrap justify-end gap-1.5"
      >
        {bubble.options.map((o) => (
          <button
            key={o.value}
            onClick={() => bubble.onPick(o.value)}
            className="inline-flex items-center gap-1 rounded-2xl border border-[#25D366] bg-white/90 px-3 py-1.5 text-[12px] font-semibold text-[#075E54] transition hover:bg-[#DCF8C6]"
          >
            {o.icon && <span>{o.icon}</span>}
            {o.label}
          </button>
        ))}
      </motion.div>
    );
  }
  if (bubble.kind === "scoreCard") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-2 flex justify-start"
      >
        <div className="w-[90%] overflow-hidden rounded-2xl rounded-tl-sm bg-black text-white shadow-md">
          <div className="bg-gradient-to-r from-[#25D366] to-[#075E54] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white">
            UdyamAI Health Card
          </div>
          <div className="p-4">
            <div className="text-[10px] uppercase tracking-widest text-white/60">MSME · LIVE</div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-serif text-[64px] leading-none text-[#25D366]">{bubble.score}</span>
              <span className="text-[12px] text-white/60">/ 1000</span>
            </div>
            <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#25D366]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#25D366]">
              <CheckCircle2 className="h-3 w-3" /> {bubble.band}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
  if (bubble.kind === "loanCards") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-2 space-y-2"
      >
        {bubble.quotes.map((q) => (
          <div key={q.lender} className="rounded-2xl rounded-tl-sm bg-white p-3 shadow-md">
            <div className="flex items-baseline justify-between">
              <div className="text-[13px] font-bold text-black">{q.lender}</div>
              <span className="rounded-md bg-[#25D366]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#075E54]">
                {Math.round(q.conf * 100)}% approval
              </span>
            </div>
            <div className="mt-1 text-[11px] text-black/60">
              ₹{(q.amount / 100000).toFixed(1)} L · {q.rate.toFixed(2)}% · 36 months
            </div>
            <button
              onClick={() => bubble.onPick(q.lender)}
              className="mt-2 w-full rounded-xl bg-[#25D366] py-1.5 text-[12px] font-bold text-white hover:bg-[#128C7E]"
            >
              Apply to {q.lender}
            </button>
          </div>
        ))}
      </motion.div>
    );
  }
  return null;
}
