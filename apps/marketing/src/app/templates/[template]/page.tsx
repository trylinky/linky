import { PaletteStrip } from '@/components/pseo/pseo-palette-strip';
import { PseoBenefits } from '@/components/pseo/pseo-benefits';
import { PseoHero } from '@/components/pseo/pseo-hero';
import { PseoLayout } from '@/components/pseo/pseo-layout';
import { PseoProse } from '@/components/pseo/pseo-prose';
import { PseoBand, PseoEyebrow, PseoSectionHeading } from '@/components/pseo/pseo-section';
import { TemplateGallery } from '@/components/pseo/pseo-template-gallery';
import { ThemeMock } from '@/components/pseo/theme-mock';
import { getTemplate, getTemplateSlugs, templates } from '@/content/templates';
import { buildPseoMetadata } from '@/lib/seo-metadata';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

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
    <PseoLayout faqs={c.faqs}>
      <PseoHero
        eyebrow="Template"
        h1={c.h1}
        answer={c.answer}
        visual={<ThemeMock palette={c.palette} name={c.name} />}
        breadcrumbs={[
          { name: 'Home', url: 'https://lin.ky' },
          { name: 'Templates', url: 'https://lin.ky/i/templates' },
          { name: c.name, url: `https://lin.ky/i/templates/${c.slug}` },
        ]}
      />

      <PseoBand tone="white">
        <PseoEyebrow>The palette</PseoEyebrow>
        <PseoSectionHeading>Colors in this template</PseoSectionHeading>
        <div className="mt-10">
          <PaletteStrip palette={c.palette} />
        </div>
      </PseoBand>

      <PseoBenefits />

      <PseoProse sections={c.sections} />

      <PseoBand tone="cream">
        <PseoSectionHeading>More templates</PseoSectionHeading>
        <div className="mt-10">
          <TemplateGallery templates={templates} currentSlug={c.slug} />
        </div>
      </PseoBand>
    </PseoLayout>
  );
}
