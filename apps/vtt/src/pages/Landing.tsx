import { MarketingLayout } from '../components/marketing/MarketingLayout.js';
import { LandingHero } from '../components/marketing/LandingHero.js';
import {
  LandingCta,
  LandingFeatures,
  LandingFlow,
} from '../components/marketing/LandingSections.js';

export function Landing() {
  return (
    <MarketingLayout>
      <LandingHero />
      <LandingFeatures />
      <LandingFlow />
      <LandingCta />
    </MarketingLayout>
  );
}
