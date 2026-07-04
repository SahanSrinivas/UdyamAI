"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, MessageCircle, Phone, Smartphone } from "lucide-react";

type Channel = "whatsapp" | "sms" | "voice";

const CHANNELS: { key: Channel; label: string; icon: React.ReactNode; provider: string }[] = [
  { key: "whatsapp", label: "WhatsApp", icon: <MessageCircle className="h-3.5 w-3.5" />, provider: "Gupshup · WhatsApp Business API" },
  { key: "sms", label: "SMS", icon: <Smartphone className="h-3.5 w-3.5" />, provider: "MSG91 · DLT-approved template" },
  { key: "voice", label: "Voice call", icon: <Phone className="h-3.5 w-3.5" />, provider: "Exotel · Auto-read OTP" },
];

export function WhatsAppOtpCard({
  phone,
  otp,
  channel,
  onChangeChannel,
  seconds,
}: {
  phone: string;
  otp: string;
  channel: Channel;
  onChangeChannel: (c: Channel) => void;
  seconds: number;
}) {
  const maskedPhone = maskPhone(phone);
  const timeLabel = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  const provider = CHANNELS.find((c) => c.key === channel)?.provider ?? "";

  return (
    <div className="rounded-2xl border border-black/10 bg-white/85">
      {/* Channel switcher */}
      <div className="flex items-center gap-1 border-b border-black/10 p-1.5">
        {CHANNELS.map((c) => {
          const active = c.key === channel;
          return (
            <button
              key={c.key}
              onClick={() => onChangeChannel(c.key)}
              className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold transition ${
                active
                  ? c.key === "whatsapp"
                    ? "bg-[#25D366] text-white"
                    : "bg-black text-white"
                  : "text-black/60 hover:bg-black/[0.03]"
              }`}
            >
              {c.icon}
              {c.label}
              {active && <Check className="h-3 w-3" />}
            </button>
          );
        })}
      </div>

      {/* Delivery preview */}
      <AnimatePresence mode="wait">
        {channel === "whatsapp" ? (
          <motion.div
            key="whatsapp"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="p-4"
          >
            {/* WhatsApp header */}
            <div className="flex items-center gap-3 rounded-t-2xl bg-[#075E54] px-4 py-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-white text-[#075E54]">
                <span className="font-serif text-lg font-bold">U</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 text-[13px] font-semibold text-white">
                  UdyamAI Verification
                  <Check className="h-3.5 w-3.5 fill-[#34B7F1] text-[#075E54]" />
                </div>
                <div className="text-[11px] text-white/80">online · encrypted end-to-end</div>
              </div>
              <div className="rounded-md bg-[#128C7E] px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-white">
                Business
              </div>
            </div>

            {/* WhatsApp chat body */}
            <div className="rounded-b-2xl bg-[#e5ddd5] p-3">
              <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-[#DCF8C6] p-3">
                <div className="text-[13px] leading-snug text-black/90">
                  <span className="font-bold">{otp}</span> is your UdyamAI verification code.
                  Do not share it with anyone.
                  <br />
                  <span className="text-[11px] text-black/60">Valid for 5 minutes.</span>
                </div>
                <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-black/50">
                  <span className="tabular">
                    {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="inline-flex text-[#34B7F1]">
                    <Check className="-mr-1.5 h-3 w-3" />
                    <Check className="h-3 w-3" />
                  </span>
                </div>
              </div>
              <div className="mt-2 text-center text-[10px] text-black/40">
                Delivered to {maskedPhone} · via {provider}
              </div>
            </div>
          </motion.div>
        ) : channel === "sms" ? (
          <motion.div
            key="sms"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="p-4"
          >
            <div className="rounded-2xl bg-black p-4 text-white">
              <div className="flex items-center gap-2 border-b border-white/10 pb-2 text-[11px] font-bold uppercase tracking-widest text-white/60">
                <Smartphone className="h-3.5 w-3.5" /> AD-UDYMAI
              </div>
              <div className="mt-3 text-[13px] leading-snug">
                <span className="font-bold">{otp}</span> is your UdyamAI OTP. Do not share with
                anyone. Valid for 5 min. UdyamAI never asks for OTPs.
              </div>
              <div className="mt-2 text-[10px] text-white/50">
                Sent to {maskedPhone} · Header AD-UDYMAI · DLT template T-983ABC
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="voice"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="p-4"
          >
            <div className="rounded-2xl border border-black/10 bg-black/[0.03] p-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-black px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white">
                <Phone className="h-3.5 w-3.5" /> Incoming call
              </div>
              <div className="mt-3 text-[13px] text-black">
                &ldquo;Namaste. Your UdyamAI OTP is <span className="font-bold">{otp.split("").join(" · ")}</span>.
                I repeat, {otp.split("").join(" ")}. Thank you.&rdquo;
              </div>
              <div className="mt-2 text-[10px] text-black/50">
                Placed to {maskedPhone} · via {provider}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delivery meta */}
      <div className="flex items-center justify-between border-t border-black/10 px-4 py-3 text-[11px] text-black/60">
        <div className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          Delivered · expires in <span className="ml-1 tabular font-bold text-black">{timeLabel}</span>
        </div>
        <div className="hidden sm:inline">{provider}</div>
      </div>
    </div>
  );
}

function maskPhone(p: string): string {
  const digits = p.replace(/\D/g, "");
  if (digits.length < 6) return p;
  const last2 = digits.slice(-2);
  const first3 = digits.startsWith("91") ? "+91 " + digits.slice(2, 4) : digits.slice(0, 3);
  return `${first3}${digits.length > 6 ? "•••••" : "••"}${last2}`;
}
