"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Brain, Building2, Cloud, Cpu, Database, Layers,
  ShieldCheck, Smartphone, Zap, Check,
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
        <div className="text-[13px] font-semibold uppercase tracking-[0.18em] text-white/60">
          Production architecture · post-Round-1
        </div>
        <h1 className="mt-3 font-serif text-[52px] leading-[0.96] tracking-tight text-white sm:text-[80px]">
          The stack IDBI can deploy.
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/60">
          Everything below runs on AWS in ap-south-1 (Mumbai). Auditable, scalable, RBI-compliant.
          The prototype is Next.js on Amplify; the production build swaps in Django, RDS Postgres,
          DocumentDB, Bedrock, and Fargate — same UI, same code, real rails.
        </p>

        {/* KPI strip */}
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "AWS services", value: "25+", accent: "text-rh-lime" },
            { label: "Region", value: "ap-south-1", accent: "text-rh-lime" },
            { label: "SLA target", value: "99.95%", accent: "text-rh-lime" },
            { label: "Cost @ 100k MAU", value: "₹4.8L / mo", accent: "text-rh-lime" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">{s.label}</div>
              <div className={`mt-1 tabular font-serif text-[32px] leading-none ${s.accent}`}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs bar */}
      <div className="sticky top-16 z-30 -mx-6 mb-8 border-y border-white/10 bg-black/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center gap-1 overflow-x-auto px-6 py-2">
          {TABS.map((t) => {
            const on = active === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActive(t.key)}
                className={`relative inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold transition ${
                  on ? "text-black" : "text-white/70 hover:text-white"
                }`}
              >
                {on && (
                  <motion.span
                    layoutId="arch-tab"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    className="absolute inset-0 rounded-full bg-rh-lime"
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
    { name: "Edge · API", key: "api" as TabKey, services: ["CloudFront", "API Gateway", "Fargate · Django"], accent: "#3b82f6" },
    { name: "AI · ML", key: "ai" as TabKey, services: ["Bedrock (Claude)", "SageMaker", "Custom LR"], accent: "#22c55e" },
    { name: "Data", key: "data" as TabKey, services: ["RDS Postgres", "DocumentDB", "ElastiCache", "S3"], accent: "#f59e0b" },
    { name: "Rails", key: "rails" as TabKey, services: ["Account Aggregator", "ULI · RBIH", "OCEN 4.0"], accent: "#a855f7" },
  ];
  return (
    <div className="space-y-4">
      {tiers.map((t, i) => (
        <button
          key={t.key}
          onClick={() => onNav(t.key)}
          className="group flex w-full items-center justify-between gap-6 rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.01] p-6 text-left transition hover:border-white/30"
        >
          <div className="flex items-center gap-5">
            <div
              className="grid h-12 w-12 place-items-center rounded-2xl text-black"
              style={{ background: t.accent }}
            >
              <span className="font-mono font-bold">{String(i + 1).padStart(2, "0")}</span>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">Tier</div>
              <div className="mt-0.5 font-serif text-[24px] leading-tight text-white">{t.name}</div>
            </div>
          </div>
          <div className="hidden flex-1 gap-2 md:flex md:flex-wrap md:justify-center">
            {t.services.map((s) => (
              <span key={s} className="rounded-full border border-white/15 bg-white/[0.02] px-3 py-1 text-[11px] font-semibold text-white/80">
                {s}
              </span>
            ))}
          </div>
          <ArrowRight className="h-5 w-5 text-white/40 transition group-hover:translate-x-1 group-hover:text-white" />
        </button>
      ))}
    </div>
  );
}

function ClientTab() {
  const rows: [string, string, string][] = [
    ["Mobile · iOS", "SwiftUI + Combine + Swift Concurrency", "Native performance for animations · Aadhaar SDK on native"],
    ["Mobile · Android", "Kotlin + Jetpack Compose + Coroutines", "Vernacular text rendering (HI/TE/TA) is best native"],
    ["Web PWA", "Next.js 14 + Tailwind + framer-motion", "This repo · desktop-first · Vercel/Amplify Edge"],
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
    ["API Gateway", "AWS API Gateway", "Global endpoint · throttle · WAF integration"],
  ];
  return <TableCard title="API tier · Django-first" subtitle="Where the real work happens" rows={rows} accent="#3b82f6" />;
}

function AiTab() {
  const rows: [string, string, string][] = [
    ["LLM · vernacular", "AWS Bedrock (Claude 3.5)", "Enterprise SLA · ap-south-1 residency · audit logs"],
    ["LLM fallback", "Gemini 1.5 Flash", "Hackathon-speed · already wired in this prototype"],
    ["Score classifier", "Per-lender logistic regression", "Weekly retrain · scikit-learn on SageMaker"],
    ["Cash-flow forecast", "Vertex-style AutoML · LSTM under the hood", "90-day liquidity projection · fed into repayment capacity"],
    ["UPI graph analysis", "Neo4j Aura or Neptune", "Counterparty concentration · circular-payment-ring detection"],
    ["Fraud detection", "Embedding search on GSTR-1 invoice text", "Circular billing rings via cosine similarity"],
    ["Model registry", "SageMaker Model Registry", "Every retrain versioned · model cards auto-generated"],
  ];
  return (
    <div className="space-y-6">
      <TableCard title="AI · ML tier" subtitle="Auditable by default — LR is the decision, everything else is a feature" rows={rows} accent="#22c55e" />
      <NoteCard>
        <span className="font-semibold text-rh-lime">Regulatory note:</span> credit decisions stay
        interpretable (LR only). LSTM + graph outputs feed <em>into</em> the LR as features, not as
        the final decision. This passes RBI PRISM model-risk review.
      </NoteCard>
    </div>
  );
}

function DataTab() {
  const rows: [string, string, string][] = [
    ["MongoDB Atlas", "M30 → M60 as we scale", "Score history · event stream · UPI graphs (document-shaped)"],
    ["Cloud SQL Postgres", "HA · PITR enabled", "Users · KYC · loan applications · OCEN txn log · AA consent artifacts"],
    ["Memorystore Redis", "Standard tier", "Celery broker · session cache · rate-limit counters"],
    ["BigQuery", "On-demand pricing", "ML training warehouse · cohort analytics · sector benchmarks"],
    ["Cloud Storage", "ap-south-1 · CMEK-encrypted", "Consent PDFs · KYC docs · e-signed loan agreements"],
    ["Backup", "Cross-region to ap-northeast-1", "RPO 15 min · RTO 4 hours"],
  ];
  return <TableCard title="Data tier" subtitle="Two-database split — transactional vs document" rows={rows} accent="#f59e0b" />;
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
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.01] p-6">
        <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">Regulated integration rails</div>
        <div className="mt-2 font-serif text-[28px] leading-tight text-white">Every pipe UdyamAI plugs into</div>
        <div className="mt-6 space-y-2">
          {rails.map(([name, provider, purpose, dir]) => (
            <div key={name} className="grid grid-cols-[24px_minmax(0,1.5fr)_minmax(0,1.5fr)_minmax(0,2fr)] items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <div
                className={`grid h-6 w-6 place-items-center rounded-md text-[10px] font-bold ${
                  dir === "in" ? "bg-rh-lime text-black" : "bg-[#a855f7] text-white"
                }`}
                title={dir === "in" ? "Inbound (we consume)" : "Outbound (we send)"}
              >
                {dir === "in" ? "↓" : "↑"}
              </div>
              <div className="font-semibold text-white">{name}</div>
              <div className="text-[13px] text-white/70">{provider}</div>
              <div className="text-[12px] text-white/60">{purpose}</div>
            </div>
          ))}
        </div>
      </div>
      <NoteCard>
        <span className="font-semibold text-rh-lime">Finvu note:</span> supports Web SDK + Direct
        API + Sandbox at{" "}
        <a href="https://finvu.github.io/sandbox/" target="_blank" rel="noreferrer" className="underline">
          finvu.github.io/sandbox
        </a>{" "}
        · Pvt Ltd sandbox onboarding via <span className="font-mono text-white">support@cookiejar.co.in</span> · production requires
        FIU/LSP arrangement with a licensed bank or NBFC (IDBI qualifies).
      </NoteCard>
    </div>
  );
}

function DeployTab() {
  const rows: [string, string, string][] = [
    ["Django API", "AWS Fargate · 2–100 auto-scale", "Container image built via CodeBuild"],
    ["Score serving", "AWS Fargate · separate service", "Isolated · low-latency · warmed pool"],
    ["LR training", "SageMaker Custom Training", "Weekly · reads BigQuery outcome data"],
    ["Static + PWA", "AWS Amplify · Vercel Edge", "Next.js prototype auto-deploys on push"],
    ["Postgres", "AWS RDS PostgreSQL 15 · Multi-AZ", "ap-south-1 · PITR · CMEK"],
    ["MongoDB", "MongoDB Atlas M30", "VPC-peered to AWS"],
    ["Redis", "AWS ElastiCache Redis", "Standard tier"],
    ["Object storage", "AWS S3", "Signed URLs for KYC docs"],
    ["CDN", "AWS CloudFront", "Global edge cache"],
    ["Secrets", "AWS Secrets Manager", "API keys · mTLS certs · Aadhaar keys"],
    ["CI/CD", "CodePipeline + CodeBuild", "Blue-green deploy · rollback in seconds"],
    ["Monitoring", "CloudWatch + Sentry (+ Datadog)", "30d log retention · p99 latency alerts"],
    ["WAF", "AWS WAF + Shield", "Protects public endpoints"],
    ["DNS", "Route 53", "udyamai.credit · udyamai.in"],
  ];
  return <TableCard title="Deploy · GCP-native → AWS for IDBI" subtitle="Everything runs on AWS in ap-south-1" rows={rows} accent="#CCFF5E" />;
}

function ComplianceTab() {
  const rows: [string, string, string][] = [
    ["RBI IT Framework (2023)", "Data residency in ap-south-1 · CMEK · audit log per decision", "Non-negotiable"],
    ["DPDP Act 2023", "Consent lifecycle via AA · deletion within 72h · PII vault separated", "Non-negotiable"],
    ["RBI Digital Lending Guidelines", "LSP model — bank owns customer funds · money never touches us", "Regulatory alignment"],
    ["Sahamati Rulebook", "ReBIT-compliant AA calls · signed responses · complete consent trail", "Ecosystem membership"],
    ["SOC 2 Type II", "Target: 12 months · Vanta or Drata for automation", "Enterprise sales requirement"],
    ["ISO 27001", "Target: 18 months", "International expansion enabler"],
    ["Model risk · RBI PRISM", "Only interpretable LR in credit decisions", "Regulator can audit every point"],
    ["Business continuity", "Cross-region backup nightly · RPO 15m · RTO 4h", "Bank BCP requirement"],
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
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.01] p-6">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: accent }}>
            {title}
          </div>
          <div className="mt-2 font-serif text-[28px] leading-tight text-white">{subtitle}</div>
        </div>
      </div>
      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
        {rows.map(([col1, col2, col3], i) => (
          <div
            key={col1 + i}
            className={`grid grid-cols-1 gap-3 border-b border-white/5 p-4 text-[13px] last:border-b-0 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_minmax(0,2fr)] ${
              i % 2 === 0 ? "bg-white/[0.02]" : "bg-transparent"
            }`}
          >
            <div className="font-semibold text-white">{col1}</div>
            <div className="text-white/80">{col2}</div>
            <div className="text-white/60">{col3}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NoteCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-rh-lime/20 bg-rh-lime/[0.04] p-5 text-[13px] leading-relaxed text-white/80">
      <div className="inline-flex items-center gap-1.5 text-rh-lime">
        <Cpu className="h-3.5 w-3.5" />
        <span className="text-[10px] font-bold uppercase tracking-widest">Note</span>
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}
