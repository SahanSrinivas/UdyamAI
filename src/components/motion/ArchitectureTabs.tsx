"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Brain, Building2, Cloud, Cpu, Database, Layers,
  ShieldCheck, Smartphone, Zap,
} from "lucide-react";

type TabKey = "overview" | "client" | "api" | "ai" | "data" | "rails" | "deploy" | "compliance";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "overview", label: "Overview", icon: <Layers className="h-3.5 w-3.5" /> },
  { key: "client", label: "Client", icon: <Smartphone className="h-3.5 w-3.5" /> },
  { key: "api", label: "API", icon: <Zap className="h-3.5 w-3.5" /> },
  { key: "ai", label: "AI · ML", icon: <Brain className="h-3.5 w-3.5" /> },
  { key: "data", label: "Data", icon: <Database className="h-3.5 w-3.5" /> },
  { key: "rails", label: "Rails", icon: <Building2 className="h-3.5 w-3.5" /> },
  { key: "deploy", label: "Deploy", icon: <Cloud className="h-3.5 w-3.5" /> },
  { key: "compliance", label: "Compliance", icon: <ShieldCheck className="h-3.5 w-3.5" /> },
];

export function ArchitectureTabs() {
  const [active, setActive] = useState<TabKey>("overview");

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-10">
      {/* Hero */}
      <div className="mb-10">
        <div className="text-[13px] font-semibold uppercase tracking-[0.18em] text-black/60">
          Production architecture · post-Round-1
        </div>
        <h1 className="mt-3 font-serif text-[52px] leading-[0.96] tracking-tight text-black sm:text-[80px]">
          The stack IDBI can deploy.
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-black/70">
          Everything below runs on Google Cloud in asia-south1 (Mumbai). Auditable, scalable,
          RBI-compliant. The prototype is Next.js on Cloud Run with no database at all; the
          production build swaps in Django, Cloud SQL, Firestore, and Vertex AI — same UI, same
          code, same container, real rails.
        </p>

        {/* KPI strip */}
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Google Cloud services", value: "20+" },
            { label: "Region", value: "asia-south1" },
            { label: "SLA target", value: "99.95%" },
            { label: "Cost @ 100k MAU", value: "₹4.8L / mo" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-black/10 bg-white/70 p-5 backdrop-blur">
              <div className="text-[10px] font-bold uppercase tracking-widest text-black/50">{s.label}</div>
              <div className="mt-1 tabular font-serif text-[32px] leading-none text-black">{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs bar — sticky, mist-tinted */}
      <div className="sticky top-16 z-30 -mx-6 mb-8 border-y border-black/10 bg-mist-100/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center gap-1 overflow-x-auto px-6 py-2">
          {TABS.map((t) => {
            const on = active === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActive(t.key)}
                className={`relative inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold transition ${
                  on ? "text-white" : "text-black/70 hover:text-black"
                }`}
              >
                {on && (
                  <motion.span
                    layoutId="arch-tab"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    className="absolute inset-0 rounded-full bg-black"
                  />
                )}
                <span className="relative z-10 inline-flex items-center gap-1.5">
                  {t.icon}
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25 }}
        >
          {active === "overview" && <OverviewTab onNav={setActive} />}
          {active === "client" && <ClientTab />}
          {active === "api" && <ApiTab />}
          {active === "ai" && <AiTab />}
          {active === "data" && <DataTab />}
          {active === "rails" && <RailsTab />}
          {active === "deploy" && <DeployTab />}
          {active === "compliance" && <ComplianceTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Tab content ──────────────────────────────────────────────────

function OverviewTab({ onNav }: { onNav: (k: TabKey) => void }) {
  const tiers = [
    { name: "Client", key: "client" as TabKey, services: ["iOS SwiftUI", "Android Kotlin", "Web PWA", "WhatsApp Bot"], accent: "#CCFF5E" },
    { name: "Edge · API", key: "api" as TabKey, services: ["Cloud CDN", "Cloud Armor", "Cloud Run · Django"], accent: "#3b82f6" },
    { name: "AI · ML", key: "ai" as TabKey, services: ["Vertex AI (Gemini)", "Vertex Training", "Custom LR"], accent: "#22c55e" },
    { name: "Data", key: "data" as TabKey, services: ["Cloud SQL", "Firestore", "Memorystore", "Cloud Storage"], accent: "#f59e0b" },
    { name: "Rails", key: "rails" as TabKey, services: ["Account Aggregator", "ULI · RBIH", "OCEN 4.0"], accent: "#a855f7" },
  ];
  return (
    <div className="space-y-4">
      {tiers.map((t, i) => (
        <button
          key={t.key}
          onClick={() => onNav(t.key)}
          className="group flex w-full items-center justify-between gap-6 rounded-3xl border border-black/10 bg-white/70 p-6 text-left backdrop-blur transition hover:border-black/40 hover:bg-white/90"
        >
          <div className="flex items-center gap-5">
            <div
              className="grid h-12 w-12 place-items-center rounded-2xl text-black"
              style={{ background: t.accent }}
            >
              <span className="font-mono font-bold">{String(i + 1).padStart(2, "0")}</span>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-black/50">Tier</div>
              <div className="mt-0.5 font-serif text-[24px] leading-tight text-black">{t.name}</div>
            </div>
          </div>
          <div className="hidden flex-1 gap-2 md:flex md:flex-wrap md:justify-center">
            {t.services.map((s) => (
              <span key={s} className="rounded-full border border-black/15 bg-white px-3 py-1 text-[11px] font-semibold text-black/80">
                {s}
              </span>
            ))}
          </div>
          <ArrowRight className="h-5 w-5 text-black/40 transition group-hover:translate-x-1 group-hover:text-black" />
        </button>
      ))}
    </div>
  );
}

function ClientTab() {
  const rows: [string, string, string][] = [
    ["Mobile · iOS", "SwiftUI + Combine + Swift Concurrency", "Native performance for animations · Aadhaar SDK on native"],
    ["Mobile · Android", "Kotlin + Jetpack Compose + Coroutines", "Vernacular text rendering (HI/TE/TA) is best native"],
    ["Web PWA", "Next.js 14 + Tailwind + framer-motion", "This repo · desktop-first · Cloud Run behind Cloud CDN"],
    ["Alt · Single codebase", "React Native + Expo", "One codebase covers both mobile OS if team is 1 person"],
    ["Distribution · SDK", "Embedded SDK for Khatabook / OkCredit / Vyapar", "30M+ MSMEs already there — embed rather than acquire"],
    ["WhatsApp Bot", "Gupshup WhatsApp Business API", "78% of India prefers this · production onboarding rail"],
  ];
  return <TableCard title="Client tier" subtitle="Every surface an MSME might touch" rows={rows} accent="#CCFF5E" />;
}

function ApiTab() {
  const rows: [string, string, string][] = [
    ["Framework", "Django 5 + DRF", "Async views on score endpoints · async elsewhere · admin baked in"],
    ["Real-time", "Django Channels + Redis pub/sub", "Push score updates when AA feed arrives"],
    ["Task queue", "Celery + Redis broker", "Monthly AA refresh · LR retraining · batch quote scoring"],
    ["Auth", "django-allauth + Firebase Auth + OTP", "MFA · SSO for lenders (Okta/Azure AD)"],
    ["Aadhaar KYC", "Digio / Signzy SDK", "Regulator-approved eKYC · ~₹15 / verification"],
    ["Rate limit", "django-ratelimit + Cloud Armor", "Protect GSTIN + score endpoints"],
    ["Ingress", "Global External Load Balancer", "Single anycast endpoint · managed TLS · Cloud Armor in front"],
  ];
  return <TableCard title="API tier · Django-first" subtitle="Where the real work happens" rows={rows} accent="#3b82f6" />;
}

function AiTab() {
  const rows: [string, string, string][] = [
    ["LLM · vernacular", "Vertex AI · Gemini on asia-south1", "Enterprise SLA · in-region prompts · Cloud Audit Logs per call"],
    ["LLM · prototype", "Gemini API (AI Studio key)", "Already wired in this repo · same model family, one env var to switch"],
    ["Score classifier", "Per-lender logistic regression", "Weekly retrain · scikit-learn on Vertex AI Training"],
    ["Cash-flow forecast", "Vertex AI AutoML · LSTM under the hood", "90-day liquidity projection · fed into repayment capacity"],
    ["UPI graph analysis", "Neo4j Aura on Google Cloud", "Counterparty concentration · circular-payment-ring detection"],
    ["Fraud detection", "Vertex AI embeddings on GSTR-1 invoice text", "Circular billing rings via cosine similarity"],
    ["Model registry", "Vertex AI Model Registry", "Every retrain versioned · model cards auto-generated"],
  ];
  return (
    <div className="space-y-6">
      <TableCard title="AI · ML tier" subtitle="Auditable by default — LR is the decision, everything else is a feature" rows={rows} accent="#22c55e" />
      <NoteCard>
        <span className="font-semibold text-black">Regulatory note:</span> credit decisions stay
        interpretable (LR only). LSTM + graph outputs feed <em>into</em> the LR as features, not as
        the final decision. This passes RBI PRISM model-risk review.
      </NoteCard>
    </div>
  );
}

function DataTab() {
  const rows: [string, string, string][] = [
    ["Prototype · today", "No database · bundled AgamiAI corpus", "3.7 MB of open data read from the container image · scales to zero"],
    ["Cloud SQL Postgres", "HA · PITR enabled · private IP", "Users · KYC · loan applications · OCEN txn log · AA consent artifacts"],
    ["Firestore", "Native mode · asia-south1", "Score history · event stream · UPI graphs (document-shaped)"],
    ["Memorystore Redis", "Standard tier", "Celery broker · session cache · rate-limit counters"],
    ["BigQuery", "On-demand pricing", "ML training warehouse · cohort analytics · sector benchmarks"],
    ["Cloud Storage", "asia-south1 · CMEK-encrypted", "Consent PDFs · KYC docs · e-signed loan agreements"],
    ["Backup", "Dual-region asia-south1 + asia-south2", "Both regions are in India — residency holds through DR · RPO 15 min · RTO 4 hours"],
  ];
  return <TableCard title="Data tier" subtitle="None today — transactional plus document when it is real" rows={rows} accent="#f59e0b" />;
}

function RailsTab() {
  const rails: [string, string, string, "in" | "out"][] = [
    ["Account Aggregator", "Sahamati · Finvu · OneMoney", "Regulated data pull · consent-based", "in"],
    ["GSTN", "Direct as FIP via AA", "GSTR-1 + 3B returns · 24 months", "in"],
    ["EPFO", "Direct as FIP via AA", "Payroll + PF contribution verification", "in"],
    ["ULI · RBIH", "Public Tech Platform", "64 lenders · 136 data services · SBI/HDFC/ICICI onboarded", "in"],
    ["CIBIL · Experian", "Bureau APIs (optional)", "Only when hasBureau=true · fallback signal", "in"],
    ["OCEN 4.0", "iSPIRT LA registration", "LA → Lender application rail · federation cert + OAuth 2.0", "out"],
    ["UPI counterparty", "NPCI via AA + M2P enrichment", "Buyer/supplier graph analysis", "in"],
  ];
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-black/10 bg-white/70 p-6 backdrop-blur">
        <div className="text-[10px] font-bold uppercase tracking-widest text-black/50">Regulated integration rails</div>
        <div className="mt-2 font-serif text-[28px] leading-tight text-black">Every pipe UdyamAI plugs into</div>
        <div className="mt-6 space-y-2">
          {rails.map(([name, provider, purpose, dir]) => (
            <div key={name} className="grid grid-cols-[24px_minmax(0,1.5fr)_minmax(0,1.5fr)_minmax(0,2fr)] items-center gap-4 rounded-2xl border border-black/10 bg-white p-4">
              <div
                className={`grid h-6 w-6 place-items-center rounded-md text-[10px] font-bold ${
                  dir === "in" ? "bg-black text-rh-lime" : "bg-[#a855f7] text-white"
                }`}
                title={dir === "in" ? "Inbound (we consume)" : "Outbound (we send)"}
              >
                {dir === "in" ? "↓" : "↑"}
              </div>
              <div className="font-semibold text-black">{name}</div>
              <div className="text-[13px] text-black/70">{provider}</div>
              <div className="text-[12px] text-black/60">{purpose}</div>
            </div>
          ))}
        </div>
      </div>
      <NoteCard>
        <span className="font-semibold text-black">Finvu note:</span> supports Web SDK + Direct
        API + Sandbox at{" "}
        <a href="https://finvu.github.io/sandbox/" target="_blank" rel="noreferrer" className="font-semibold text-black underline">
          finvu.github.io/sandbox
        </a>{" "}
        · Pvt Ltd sandbox onboarding via <span className="font-mono font-semibold text-black">support@cookiejar.co.in</span> · production requires
        FIU/LSP arrangement with a licensed bank or NBFC (IDBI qualifies).
      </NoteCard>
    </div>
  );
}

function DeployTab() {
  const rows: [string, string, string][] = [
    ["This prototype", "Cloud Run · one container · scales to zero", "Next.js standalone image · no VPC, no database, no connector"],
    ["Django API", "Cloud Run · 1–100 auto-scale", "Same deploy shape as the prototype · image built by Cloud Build"],
    ["Score serving", "Cloud Run · separate service", "Isolated · low-latency · min-instances 1 to remove cold starts"],
    ["LR training", "Cloud Run Jobs + Cloud Scheduler", "Weekly · reads BigQuery outcome data · off the public surface"],
    ["Postgres", "Cloud SQL PostgreSQL 16 · HA", "asia-south1 · private IP · PITR · CMEK"],
    ["Documents", "Firestore Native mode", "Score history · event stream"],
    ["Redis", "Memorystore for Redis", "Standard tier · private services access"],
    ["Object storage", "Cloud Storage", "Signed URLs for KYC docs"],
    ["CDN", "Cloud CDN on the global load balancer", "Edge cache · managed TLS · one anycast IP"],
    ["Secrets", "Secret Manager", "API keys · mTLS certs · Aadhaar keys · mounted into Cloud Run"],
    ["CI/CD", "Cloud Build → Artifact Registry", "Gradual rollout by revision · rollback is one traffic split"],
    ["Monitoring", "Cloud Logging + Cloud Monitoring (+ Sentry)", "30d log retention · p99 latency alerts · error reporting"],
    ["WAF", "Cloud Armor", "Protects public endpoints · OWASP preconfigured rules"],
    ["DNS", "Cloud DNS", "udyamai.credit · udyamai.in"],
  ];
  return <TableCard title="Deploy · Google Cloud for IDBI" subtitle="Everything runs on Google Cloud in asia-south1" rows={rows} accent="#CCFF5E" />;
}

function ComplianceTab() {
  const rows: [string, string, string][] = [
    ["RBI IT Framework (2023)", "Data residency in asia-south1 · CMEK · audit log per decision", "Non-negotiable"],
    ["DPDP Act 2023", "Consent lifecycle via AA · deletion within 72h · PII vault separated", "Non-negotiable"],
    ["RBI Digital Lending Guidelines", "LSP model — bank owns customer funds · money never touches us", "Regulatory alignment"],
    ["Sahamati Rulebook", "ReBIT-compliant AA calls · signed responses · complete consent trail", "Ecosystem membership"],
    ["SOC 2 Type II", "Target: 12 months · Vanta or Drata for automation", "Enterprise sales requirement"],
    ["ISO 27001", "Target: 18 months", "International expansion enabler"],
    ["Model risk · RBI PRISM", "Only interpretable LR in credit decisions", "Regulator can audit every point"],
    ["Business continuity", "Nightly backup to asia-south2 (Delhi) · RPO 15m · RTO 4h", "Bank BCP requirement · stays in India"],
  ];
  return <TableCard title="Compliance stack" subtitle="Everything a bank's CISO will ask for" rows={rows} accent="#f43f5e" />;
}

// ─── Reusable ─────────────────────────────────────────────────────

function TableCard({
  title, subtitle, rows, accent,
}: {
  title: string; subtitle: string;
  rows: [string, string, string][];
  accent: string;
}) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white/70 p-6 backdrop-blur">
      <div className="flex items-baseline gap-3">
        <div
          className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"
          style={{ background: accent, color: accent === "#CCFF5E" ? "#000" : "#fff" }}
        >
          {title}
        </div>
      </div>
      <div className="mt-3 font-serif text-[28px] leading-tight text-black">{subtitle}</div>
      <div className="mt-6 overflow-hidden rounded-2xl border border-black/10">
        {rows.map(([col1, col2, col3], i) => (
          <div
            key={col1 + i}
            className={`grid grid-cols-1 gap-3 border-b border-black/5 p-4 text-[13px] last:border-b-0 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_minmax(0,2fr)] ${
              i % 2 === 0 ? "bg-white" : "bg-white/40"
            }`}
          >
            <div className="font-semibold text-black">{col1}</div>
            <div className="text-black/75">{col2}</div>
            <div className="text-black/60">{col3}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NoteCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-black/10 bg-white/80 p-5 text-[13px] leading-relaxed text-black/75">
      <div className="inline-flex items-center gap-1.5 text-black">
        <Cpu className="h-3.5 w-3.5" />
        <span className="text-[10px] font-bold uppercase tracking-widest">Note</span>
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}
