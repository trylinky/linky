import { MarketingContainer } from '@/components/marketing-container';
import { MinimalHeading } from '@/components/minimal-heading';
import { IntegrationBlocks, isRealBlock } from '@/components/pseo/integration-blocks';
import { INTEGRATION_LOGOS } from '@/components/pseo/integration-logos';
import { PseoBenefits } from '@/components/pseo/pseo-benefits';
import { PseoFeatureSections } from '@/components/pseo/pseo-feature-sections';
import { PseoLayout } from '@/components/pseo/pseo-layout';
import { MinimalHero } from '@/components/pseo/pseo-minimal-hero';
import { hslToCss, ThemeMock } from '@/components/pseo/theme-mock';
import { getBlockPresentation } from '@/content/block-copy';
import { NICHE_PREVIEW } from '@/content/niche-presentation';
import { getNiche, getNicheSlugs } from '@/content/niches';
import { getTemplate } from '@/content/templates';
import { buildPseoMetadata } from '@/lib/seo-metadata';
import type { Metadata } from 'next';
import Image from 'next/image';
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

  const relatedIntegrations = c.relatedIntegrations ?? [];

  const heroPalette =
    (recommendedTemplate ?? getTemplate('violet'))?.palette ?? null;
  const heroPreview = NICHE_PREVIEW[c.slug];
  const hasBlocks = Object.keys(blockCopy).length > 0;

  return (
    <PseoLayout faqs={c.faqs} minimal>
      <MinimalHero
        eyebrow="Link in bio"
        h1={c.h1}
        answer={c.answer}
        secondaryHref={hasBlocks ? '#blocks' : '/i/templates'}
        secondaryLabel={hasBlocks ? 'See the blocks' : 'Browse templates'}
        breadcrumbs={[
          { name: 'Home', url: 'https://lin.ky' },
          { name: 'Use cases', url: 'https://lin.ky/i/for' },
          { name: c.name, url: `https://lin.ky/i/for/${c.slug}` },
        ]}
        phoneVisual={
          heroPalette ? (
            <div
              className="flex aspect-9/19 flex-col items-center justify-center"
              style={{ backgroundColor: hslToCss(heroPalette.colorBgBase) }}
            >
              <ThemeMock
                palette={heroPalette}
                name={heroPreview?.name ?? c.name}
                rows={heroPreview?.rows}
              />
            </div>
          ) : undefined
        }
      />

      {hasBlocks && (
        <section
          id="blocks"
          className="scroll-mt-24 border-t border-zinc-950/5 bg-white py-20 md:py-28"
        >
          <MarketingContainer>
            <MinimalHeading
              eyebrow="Blocks"
              heading={`Blocks made for ${c.name.toLowerCase()}`}
            />
            <div className="mt-12">
              <IntegrationBlocks blockCopy={blockCopy} />
            </div>
          </MarketingContainer>
        </section>
      )}

      <PseoBenefits minimal />

      <PseoFeatureSections sections={c.sections} minimal />

      {(relatedIntegrations.length > 0 || recommendedTemplate) && (
        <section className="border-t border-zinc-950/5 bg-[#FAFAF9] py-20 md:py-28">
          <MarketingContainer>
            <MinimalHeading eyebrow="Next" heading="Recommended for you" />
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {relatedIntegrations.map((slug) => (
                <Link
                  key={slug}
                  href={`/i/integrations/${slug}`}
                  className="group block rounded-2xl bg-white p-6 ring-1 ring-zinc-950/5 transition hover:shadow-sm hover:ring-zinc-950/10"
                >
                  <div className="flex items-center gap-3">
                    {INTEGRATION_LOGOS[slug] && (
                      <Image
                        src={INTEGRATION_LOGOS[slug]}
                        alt=""
                        width={36}
                        height={36}
                        className="size-9 rounded-lg"
                      />
                    )}
                    <div className="text-base font-semibold capitalize text-zinc-900">
                      {slug} integration
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-500">
                    Connect {slug} to show live data on your Linky page.
                  </p>
                </Link>
              ))}
              {recommendedTemplate && (
                <Link
                  href={`/i/templates/${recommendedTemplate.slug}`}
                  className="group block rounded-2xl bg-white p-6 ring-1 ring-zinc-950/5 transition hover:shadow-sm hover:ring-zinc-950/10"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="size-9 rounded-lg ring-1 ring-zinc-950/10"
                      style={{
                        backgroundColor: hslToCss(
                          recommendedTemplate.palette.colorBgBase
                        ),
                      }}
                    />
                    <div className="text-base font-semibold text-zinc-900">
                      {recommendedTemplate.name} template
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-500 line-clamp-2">
                    {recommendedTemplate.answer}
                  </p>
                </Link>
              )}
            </div>
          </MarketingContainer>
        </section>
      )}
    </PseoLayout>
  );
}
