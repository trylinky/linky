import { ComparisonTable } from '@/components/pseo/comparison-table';
import { PseoBenefits } from '@/components/pseo/pseo-benefits';
import { PseoHero } from '@/components/pseo/pseo-hero';
import { PseoLayout } from '@/components/pseo/pseo-layout';
import { PseoProse } from '@/components/pseo/pseo-prose';
import { PseoBand, PseoEyebrow, PseoSectionHeading } from '@/components/pseo/pseo-section';
import { ThemeMock } from '@/components/pseo/theme-mock';
import { getAlternative, getAlternativeSlugs } from '@/content/alternatives';
import { getTemplate, templates } from '@/content/templates';
import { buildPseoMetadata } from '@/lib/seo-metadata';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const dynamicParams = false;

export function generateStaticParams() {
  return getAlternativeSlugs().map((competitor) => ({ competitor }));
}

export async function generateMetadata(props: {
  params: Promise<{ competitor: string }>;
}): Promise<Metadata> {
  const { competitor } = await props.params;
  const c = getAlternative(competitor);
  if (!c) return {};
  return buildPseoMetadata({
    title: `${c.h1} | Linky`,
    description: c.answer,
    path: `/i/alternatives/${c.slug}`,
  });
}

export default async function AlternativePage(props: {
  params: Promise<{ competitor: string }>;
}) {
  const { competitor } = await props.params;
  const c = getAlternative(competitor);
  if (!c) notFound();

  const heroPalette =
    getTemplate('violet')?.palette ?? templates[0].palette;

  return (
    <PseoLayout faqs={c.faqs}>
      <PseoHero
        eyebrow={`${c.competitor} alternative`}
        h1={c.h1}
        answer={c.answer}
        visual={
          <ThemeMock palette={heroPalette} name="Your link in bio" />
        }
        breadcrumbs={[
          { name: 'Home', url: 'https://lin.ky' },
          { name: 'Alternatives', url: 'https://lin.ky/i/alternatives' },
          {
            name: c.competitor,
            url: `https://lin.ky/i/alternatives/${c.slug}`,
          },
        ]}
      />

      <PseoBenefits heading="Why creators switch to Linky" />

      <PseoBand tone="white">
        <PseoEyebrow>Side by side</PseoEyebrow>
        <PseoSectionHeading>Linky vs {c.competitor}</PseoSectionHeading>
        <div className="mt-10">
          <ComparisonTable competitor={c.competitor} rows={c.comparison} />
        </div>
      </PseoBand>

      <PseoProse sections={c.sections} />
    </PseoLayout>
  );
}
