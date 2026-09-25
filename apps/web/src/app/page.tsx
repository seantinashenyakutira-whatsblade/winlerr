import { Hero } from "@/components/hero";
import { SiteNav } from "@/components/site-nav";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-surface text-ink">
      <SiteNav />
      <Hero />
    </main>
  );
}
