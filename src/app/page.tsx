import { listProfiles } from "@/lib/mockData";
import { TopNav } from "@/components/TopNav";
import { Wordmark } from "@/components/Logo";
import { Hero } from "@/components/landing/Hero";
import { GstinCheckSection } from "@/components/landing/GstinCheckSection";
import { SampleCards } from "@/components/landing/SampleCards";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { CompareTable } from "@/components/landing/CompareTable";

export const revalidate = 300;

export default async function LandingPage() {
  const profiles = listProfiles();
  return (
    <main className="min-h-screen bg-black">
      <TopNav />
      <Hero />
      <GstinCheckSection />
      <SampleCards profiles={profiles} />
      <HowItWorks />
      <CompareTable />

      <footer className="border-t border-line bg-black">
        <div className="mx-auto max-w-[1600px] px-6 py-14">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <Wordmark variant="dark" size={26} />
              <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-white/70">
                Built on Account Aggregator, ULI and OCEN. For IDBI Innovate 2026.
              </p>
            </div>
            <FooterCol
              title="Product"
              items={[
                { label: "Health Card", href: "/dashboard" },
                { label: "For MSMEs", href: "#" },
                { label: "For Lenders", href: "#" },
                { label: "Pricing", href: "#" },
              ]}
            />
            <FooterCol
              title="Rails"
              items={[
                { label: "Account Aggregator", href: "https://sahamati.org.in" },
                { label: "Unified Lending Interface", href: "https://rbihub.in/projects/unified-lending-interface" },
                { label: "OCEN 4.0", href: "https://ocen.dev" },
              ]}
            />
          </div>
          <div className="mt-12 flex flex-col items-start justify-between gap-2 border-t border-line pt-6 text-[14px] font-medium text-white/70 sm:flex-row">
            <span>© 2026 UdyamAI. All rights reserved.</span>
            <span>Made in India · Built for IDBI Innovate 2026</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

function FooterCol({ title, items }: { title: string; items: { label: string; href: string }[] }) {
  return (
    <div>
      <div className="text-[13px] font-semibold uppercase tracking-[0.18em] text-white/60">{title}</div>
      <ul className="mt-4 space-y-2 text-[14px]">
        {items.map((it) => (
          <li key={it.label}>
            <a
              href={it.href}
              target={it.href.startsWith("http") ? "_blank" : undefined}
              rel={it.href.startsWith("http") ? "noreferrer" : undefined}
              className="text-white/80 hover:text-white"
            >
              {it.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
