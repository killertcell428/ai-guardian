import HeroSection from "@/components/HeroSection";
import WaitlistSection from "@/components/WaitlistSection";
import SocialProofBar from "@/components/SocialProofBar";
import HowItWorksSection from "@/components/HowItWorksSection";
import SocialProofSection from "@/components/SocialProofSection";
import FeaturesSection from "@/components/FeaturesSection";
import RiskScoringSection from "@/components/RiskScoringSection";
import CodeIntegrationSection from "@/components/CodeIntegrationSection";
import PricingSection from "@/components/PricingSection";
import FAQSection from "@/components/FAQSection";
import FooterCTASection from "@/components/FooterCTASection";

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <WaitlistSection lang="en" />
      <SocialProofBar />
      <HowItWorksSection />
      <SocialProofSection />
      <FeaturesSection />
      <RiskScoringSection />
      <CodeIntegrationSection />
      <PricingSection />
      <FAQSection />
      <FooterCTASection />
    </>
  );
}
