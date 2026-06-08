import { MarketingContainer } from '@/components/marketing-container';
import { PseoBand } from '@/components/pseo/pseo-section';
import { TemplateGallery } from '@/components/pseo/pseo-template-gallery';
import { templates } from '@/content/templates';
import { buildPseoMetadata } from '@/lib/seo-metadata';
import { Button } from '@trylinky/ui';
import Link from 'next/link';

export const metadata = buildPseoMetadata({
  title: 'Link in bio templates | Linky',
  description:
    'Browse free link-in-bio templates — light, dark, colourful — and apply one to your Linky page in seconds.',
  path: '/i/templates',
});

export default function TemplatesHub() {
  return (
    <div className="min-h-screen">
      {/* Hero band */}
      <section className="bg-linear-to-b from-[#f5f3ea] to-white pt-28 md:pt-36 pb-16 md:pb-20">
        <MarketingContainer>
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-black">
              Templates
            </h1>
            <p className="mt-5 text-lg md:text-xl text-[#241f3d]/80 text-pretty">
              Free link-in-bio templates you can make your own. Pick a palette,
              customise the colours, and publish in minutes — no design skills
              needed.
            </p>
            <Button
              asChild
              variant="default"
              size="xl"
              className="mt-8 rounded-full font-bold"
            >
              <Link href="/i/auth/signup">Get started free</Link>
            </Button>
          </div>
        </MarketingContainer>
      </section>

      {/* Templates grid */}
      <PseoBand tone="white">
        <TemplateGallery templates={templates} />
      </PseoBand>
    </div>
  );
}
