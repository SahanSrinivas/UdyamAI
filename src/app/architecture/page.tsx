import { TopNav } from "@/components/TopNav";
import { ArchitectureTabs } from "@/components/motion/ArchitectureTabs";

export const dynamic = "force-dynamic";

export default function ArchitecturePage() {
  return (
    <main className="min-h-screen bg-mist-fade">
      <TopNav />
      <ArchitectureTabs />
    </main>
  );
}
