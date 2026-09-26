import { Hero } from "@/components/hero";
import { AiDemo } from "@/components/sections/AiDemo";
import { Footer } from "@/components/sections/footer";
import { HowItWorks } from "@/components/sections/how-it-works";
import { LeadForm } from "@/components/sections/lead-form";
import { OsPreview } from "@/components/sections/os-preview";
import { Outcomes } from "@/components/sections/outcomes";
import { ProblemOutcome } from "@/components/sections/problem-outcome";
import { SiteNav } from "@/components/site-nav";
import { SystemsBento } from "@/components/sections/systems-bento";
import { ValueStrip } from "@/components/sections/value-strip";
import { WebsiteShowcase } from "@/components/sections/website-showcase";
import { WhyWinlerr } from "@/components/sections/why-winlerr";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-surface text-ink">
      <SiteNav />
      <Hero />
      <ValueStrip />
      <ProblemOutcome />
      <HowItWorks />
      <AiDemo />
      <SystemsBento />
      <OsPreview />
      <WebsiteShowcase />
      <Outcomes />
      <WhyWinlerr />
      <LeadForm />
      <Footer />
    </main>
  );
}
