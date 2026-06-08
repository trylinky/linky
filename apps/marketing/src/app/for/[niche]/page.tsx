import { IntegrationBlocks, isRealBlock } from '@/components/pseo/integration-blocks';
import { PseoBenefits } from '@/components/pseo/pseo-benefits';
import { PseoHero } from '@/components/pseo/pseo-hero';
import { PseoLayout } from '@/components/pseo/pseo-layout';
import { PseoProse } from '@/components/pseo/pseo-prose';
import { PseoBand, PseoEyebrow, PseoSectionHeading } from '@/components/pseo/pseo-section';
import { ThemeMock } from '@/components/pseo/theme-mock';
import { getBlockPresentation } from '@/content/block-copy';
import { getNiche, getNicheSlugs } from '@/content/niches';
import { getTemplate, templates } from '@/content/templates';
import { buildPseoMetadata } from '@/lib/seo-metadata';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamicParams = false;

export function generateStaticParams() {
  return getNicheSlugs().map((niche) => ({ niche }));
}

export async function generateMetadata(props: {
  params: Promise<{ niche: string }>;
}): Promise<Metadata> {
  const { niche } = await props.params;
  const c = getNiche(niche);
  if (!c) return {};
  return buildPseoMetadata({
    title: `${c.h1} | Linky`,
    description: c.answer,
    path: `/i/for/${c.slug}`,
  });
}

export default async function NichePage(props: {
  params: Promise<{ niche: string }>;
}) {
  const { niche } = await props.params;
  const c = getNiche(niche);
  if (!c) notFound();

  const blockCopy: Record<string, { name: string; description: string }> = {};
  for (const key of c.recommendedBlocks ?? []) {
    if (isRealBlock(key)) blockCopy[key] = getBlockPresentation(key);
  }

  const recommendedTemplate = c.recommendedTemplate
    ? getTemplate(c.recommendedTemplate)
    : null;

  const heroPalette =
    recommendedTemplate?.palette ??
    getTemplate('violet')?.palette ??
    templates[0].palette;

  const relatedIntegrations = c.relatedIntegrations ?? [];

  return (
    <PseoLayout faqs={c.faqs}>
      <PseoHero
        eyebrow="Link in bio"
        h1={c.h1}
        answer={c.answer}
        visual={<ThemeMock palette={heroPalette} name={c.name} />}
        breadcrumbs={[
          { name: 'Home', url: 'https://lin.ky' },
          { name: 'Use cases', url: 'https://lin.ky/i/for' },
          { name: c.name, url: `https://lin.ky/i/for/${c.slug}` },
        ]}
      />

      {Object.keys(blockCopy).length > 0 && (
        <PseoBand tone="white">
          <PseoEyebrow>Blocks</PseoEyebrow>
          <PseoSectionHeading>
            Blocks made for {c.name.toLowerCase()}
          </PseoSectionHeading>
          <div className="mt-10">
            <IntegrationBlocks blockCopy={blockCopy} />
          </div>
        </PseoBand>
      )}

      <PseoBenefits />

      <PseoProse sections={c.sections} />

      {(relatedIntegrations.length > 0 || recommendedTemplate) && (
        <PseoBand tone="cream">
          <PseoSectionHeading>Recommended for you</PseoSectionHeading>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {relatedIntegrations.map((slug) => (
              <Link
                key={slug}
                href={`/i/integrations/${slug}`}
                className="block rounded-2xl border border-gray-200 bg-white p-6 shadow-xs hover:shadow-sm hover:border-gray-300 transition-shadow"
              >
                <div className="text-base font-semibold text-gray-900 capitalize">
                  {slug} integration
                </div>
                <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">
                  Connect {slug} to show live data on your Linky page.
                </p>
              </Link>
            ))}
            {recommendedTemplate && (
              <Link
                href={`/i/templates/${recommendedTemplate.slug}`}
                className="block rounded-2xl border border-gray-200 bg-white p-6 shadow-xs hover:shadow-sm hover:border-gray-300 transition-shadow"
              >
                <div className="text-base font-semibold text-gray-900">
                  {recommendedTemplate.name} template
                </div>
                <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">
                  {recommendedTemplate.answer}
                </p>
              </Link>
            )}
          </div>
        </PseoBand>
      )}
    </PseoLayout>
  );
}
