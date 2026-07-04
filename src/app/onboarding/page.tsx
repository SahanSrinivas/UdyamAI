import { TopNav } from "@/components/TopNav";
import { WhatsAppOnboarding } from "@/components/motion/WhatsAppOnboarding";

export const dynamic = "force-dynamic";

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-cream-fade">
      <TopNav />
      <WhatsAppOnboarding />
    </main>
  );
}
