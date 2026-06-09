import { MarketingContainer } from '@/components/marketing-container';
import { PseoBenefits } from '@/components/pseo/pseo-benefits';
import { PseoFeatureSections } from '@/components/pseo/pseo-feature-sections';
import { PseoLayout } from '@/components/pseo/pseo-layout';
import { MinimalHero } from '@/components/pseo/pseo-minimal-hero';
import { PaletteStrip } from '@/components/pseo/pseo-palette-strip';
import { TemplateGallery } from '@/components/pseo/pseo-template-gallery';
import { hslToCss, ThemeMock } from '@/components/pseo/theme-mock';
import { getTemplate, getTemplateSlugs, templates } from '@/content/templates';
import { buildPseoMetadata } from '@/lib/seo-metadata';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

function MinimalSectionHeading({
  eyebrow,
  heading,
}: {
  eyebrow: string;
  heading: string;
}) {
  return (
    <>
      <p className="flex items-center gap-2 text-sm font-medium text-zinc-500">
        <span className="inline-block h-px w-6 bg-zinc-300" />
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight text-zinc-900 text-balance">
        {heading}
      </h2>
    </>
  );
}

export const dynamicParams = false;

export function generateStaticParams() {
  return getTemplateSlugs().map((template) => ({ template }));
}

export async function generateMetadata(props: {
  params: Promise<{ template: string }>;
}): Promise<Metadata> {
  const { template } = await props.params;
  const c = getTemplate(template);
  if (!c) return {};
  return buildPseoMetadata({
    title: `${c.h1} | Linky`,
    description: c.answer,
    path: `/i/templates/${c.slug}`,
  });
}

export default async function TemplatePage(props: {
  params: Promise<{ template: string }>;
}) {
  const { template } = await props.params;
  const c = getTemplate(template);
  if (!c) notFound();

  return (
    <PseoLayout faqs={c.faqs} minimal>
      <MinimalHero
        eyebrow="Template"
        h1={c.h1}
        answer={c.answer}
        ctaLabel="Use this template"
        secondaryHref="/i/templates"
        secondaryLabel="Browse all templates"
        breadcrumbs={[
          { name: 'Home', url: 'https://lin.ky' },
          { name: 'Templates', url: 'https://lin.ky/i/templates' },
          { name: c.name, url: `https://lin.ky/i/templates/${c.slug}` },
        ]}
        phoneVisual={
          <div
            className="flex aspect-9/19 flex-col items-center justify-center"
            style={{ backgroundColor: hslToCss(c.palette.colorBgBase) }}
          >
            <ThemeMock palette={c.palette} name={c.name} />
          </div>
        }
      />

      <section className="border-t border-zinc-950/5 bg-white py-20 md:py-28">
        <MarketingContainer>
          <MinimalSectionHeading
            eyebrow="The palette"
            heading="Colors in this template"
          />
          <div className="mt-10">
            <PaletteStrip palette={c.palette} />
          </div>
        </MarketingContainer>
      </section>

      <PseoBenefits minimal />

      <PseoFeatureSections
        sections={c.sections}
        recipes={['themes', 'page', 'blocks', 'analytics', 'social', 'editor']}
        palette={c.palette}
        minimal
      />

      <section className="border-t border-zinc-950/5 bg-[#FAFAF9] py-20 md:py-28">
        <MarketingContainer>
          <MinimalSectionHeading
            eyebrow="Gallery"
            heading="More templates"
          />
          <div className="mt-10">
            <TemplateGallery templates={templates} currentSlug={c.slug} columns={3} />
          </div>
        </MarketingContainer>
      </section>
    </PseoLayout>
  );
}
