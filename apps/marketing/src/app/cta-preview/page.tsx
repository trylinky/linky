import { CallToActionBlock } from '@/components/landing-page/CallToActionBlock';
import { PseoCtaCard } from '@/components/pseo/pseo-cta-card';
import { PseoCtaGradient } from '@/components/pseo/pseo-cta-gradient';
import { MarketingContainer } from '@/components/marketing-container';

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-6xl mx-auto px-4 pt-12 text-sm font-semibold uppercase tracking-wider text-gray-400">
      {children}
    </div>
  );
}

export default function CtaPreviewPage() {
  return (
    <div className="min-h-screen bg-white pb-24">
      <Label>Option 1 — Current (CallToActionBlock)</Label>
      <div className="py-12">
        <MarketingContainer>
          <CallToActionBlock />
        </MarketingContainer>
      </div>

      <Label>Option 2 — Gradient band</Label>
      <PseoCtaGradient />

      <Label>Option 3 — Bright card</Label>
      <PseoCtaCard />
    </div>
  );
}
