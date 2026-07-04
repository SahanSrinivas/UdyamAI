"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function Logout() {
  useEffect(() => {
    (async () => {
      await fetch("/api/auth/login", { method: "DELETE" }).catch(() => {});
      window.location.assign("/");
    })();
  }, []);

  return (
    <main className="grid min-h-screen place-items-center bg-cream-fade">
      <div className="inline-flex items-center gap-3 rounded-2xl border border-black/10 bg-white/80 px-6 py-4">
        <Loader2 className="h-4 w-4 animate-spin text-black" />
        <span className="text-[14px] font-medium text-black">Signing you out…</span>
      </div>
    </main>
  );
}
