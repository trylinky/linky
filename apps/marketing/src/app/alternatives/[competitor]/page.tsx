import { PseoPage } from '@/components/pseo/pseo-page';
import { ComparisonTable } from '@/components/pseo/comparison-table';
import { getAlternative, getAlternativeSlugs } from '@/content/alternatives';
import { buildPseoMetadata } from '@/lib/seo-metadata';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const dynamicParams = false;

export function generateStaticParams() {
  return getAlternativeSlugs().map((competitor) => ({ competitor }));
}

export async function generateMetadata(props: { params: Promise<{ competitor: string }> }): Promise<Metadata> {
  const { competitor } = await props.params;
  const c = getAlternative(competitor);
  if (!c) return {};
  return buildPseoMetadata({ title: `${c.h1} | Linky`, description: c.answer, path: `/i/alternatives/${c.slug}` });
}

export default async function AlternativePage(props: { params: Promise<{ competitor: string }> }) {
  const { competitor } = await props.params;
  const c = getAlternative(competitor);
  if (!c) notFound();

  return (
    <PseoPage
      h1={c.h1}
      answer={c.answer}
      breadcrumbs={[
        { name: 'Home', url: 'https://lin.ky' },
        { name: 'Alternatives', url: 'https://lin.ky/i/alternatives' },
        { name: c.competitor, url: `https://lin.ky/i/alternatives/${c.slug}` },
      ]}
      faqs={c.faqs}
    >
      {c.sections.map((s, i) => (
        <section key={i}>
          <h2>{s.heading}</h2>
          <p>{s.body}</p>
          {i === 1 && <ComparisonTable competitor={c.competitor} rows={c.comparison} />}
        </section>
      ))}
    </PseoPage>
  );
}
