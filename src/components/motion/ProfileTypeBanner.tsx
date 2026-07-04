"use client";

import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import type { MSMEProfile } from "@/lib/mockData";
import { PROFILE_TYPE_LABEL } from "@/lib/mockData";

export function ProfileTypeBanner({ profile }: { profile: MSMEProfile }) {
  const isInvisible = profile.profileType !== "MATURE";
  if (!isInvisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-6 flex flex-col gap-2 rounded-2xl border border-black/15 bg-white/70 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-black text-rh-lime">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-black/60">
            Credit-invisible cohort
          </div>
          <div className="text-[14px] font-semibold leading-tight text-black">
            {PROFILE_TYPE_LABEL[profile.profileType]} · scored without CIBIL
          </div>
        </div>
      </div>
      <div className="text-[12px] leading-snug text-black/60 sm:max-w-md sm:text-right">
        Built for the <span className="font-bold text-black">14M credit-invisible</span> Indian enterprises banks can't score today.
      </div>
    </motion.div>
  );
}
