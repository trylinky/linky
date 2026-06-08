import realtimeBlocksImg from '@/assets/landing-page/realtime-blocks.png';
import { IntegrationBlocks } from '@/components/pseo/integration-blocks';
import { IntegrationVisual } from '@/components/pseo/integration-visual';
import { DEFAULT_LINKY_BENEFITS, PseoBenefits } from '@/components/pseo/pseo-benefits';
import { PseoFeatureImage } from '@/components/pseo/pseo-feature-image';
import { PseoHero } from '@/components/pseo/pseo-hero';
import { PseoLayout } from '@/components/pseo/pseo-layout';
import { PseoProse } from '@/components/pseo/pseo-prose';
import { PseoBand, PseoEyebrow, PseoSectionHeading } from '@/components/pseo/pseo-section';
import { getIntegration, getIntegrationSlugs } from '@/content/integrations';
import { buildPseoMetadata } from '@/lib/seo-metadata';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const dynamicParams = false;

export function generateStaticParams() {
  return getIntegrationSlugs().map((integration) => ({ integration }));
}

export async function generateMetadata(props: {
  params: Promise<{ integration: string }>;
}): Promise<Metadata> {
  const { integration } = await props.params;
  const c = getIntegration(integration);
  if (!c) return {};
  return buildPseoMetadata({
    title: `${c.h1} | Linky`,
    description: c.answer,
    path: `/i/integrations/${c.slug}`,
  });
}

export default async function IntegrationPage(props: {
  params: Promise<{ integration: string }>;
}) {
  const { integration } = await props.params;
  const c = getIntegration(integration);
  if (!c) notFound();

  return (
    <PseoLayout faqs={c.faqs}>
      <PseoHero
        eyebrow={`${c.name} integration`}
        h1={c.h1}
        answer={c.answer}
        visual={<IntegrationVisual slug={c.slug} />}
        breadcrumbs={[
          { name: 'Home', url: 'https://lin.ky' },
          { name: 'Integrations', url: 'https://lin.ky/i/integrations' },
          { name: c.name, url: `https://lin.ky/i/integrations/${c.slug}` },
        ]}
      />

      <PseoBand tone="white">
        <div className="mb-3">
          <PseoEyebrow>What you can show</PseoEyebrow>
        </div>
        <div className="mt-3">
          <PseoSectionHeading>
            Live {c.name} content on your page
          </PseoSectionHeading>
        </div>
        <p className="mt-4 text-lg leading-8 text-zinc-600 mb-8 max-w-[60ch]">
          These blocks connect directly to {c.name} and refresh automatically —
          your page always shows the latest.
        </p>
        <IntegrationBlocks blockCopy={c.blockCopy} />
      </PseoBand>

      <PseoBenefits items={DEFAULT_LINKY_BENEFITS} />

      <PseoFeatureImage
        eyebrow="Drag and drop"
        heading="Build your page in minutes"
        body="Add any block from the editor, connect your accounts, and hit publish. Linky fetches the latest data from your integrations automatically so your page stays fresh without any manual work."
        imageSrc={realtimeBlocksImg}
        imageAlt="Linky editor showing live integration blocks being arranged on a page"
      />

      <PseoProse sections={c.sections} />
    </PseoLayout>
  );
}
