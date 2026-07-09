import { LandingHeader } from "@/components/landing/landing-header" 
import { FeaturesSection } from "@/components/landing/features-section"
import { RolesSection } from "@/components/landing/roles-section"
import { ShowcaseSection } from "@/components/landing/showcase-section"
import { CtaSection } from "@/components/landing/cta-section"
import { LandingFooter } from "@/components/landing/landing-footer" 
import { HeroSection } from "@/components/landing/hero-section"
import { StatStrip } from "@/components/landing/stats-strip"
import WorkflowSection from "@/components/landing/workflow-section"

export default function HomePage() {
  return (
    <>
      <LandingHeader />
      <main>
        <HeroSection />
        <StatStrip/>
        <FeaturesSection />
        <WorkflowSection/>
        <RolesSection />
        <ShowcaseSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </>
  )
}
