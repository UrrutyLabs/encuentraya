import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingHowItWorks } from "@/components/landing/LandingHowItWorks";
import { LandingWhyEncuentraYa } from "@/components/landing/LandingWhyEncuentraYa";
import { LandingForProfessionals } from "@/components/landing/LandingForProfessionals";
import { LandingFooter } from "@/components/landing/LandingFooter";

export function LandingScreen() {
  return (
    <div className="min-h-screen bg-bg">
      <LandingHeader />
      <LandingHero />
      <LandingHowItWorks />
      <LandingWhyEncuentraYa />
      <LandingForProfessionals />
      <LandingFooter />
    </div>
  );
}
