import { PseoPage } from '@/components/pseo/pseo-page';
import { ThemeMock } from '@/components/pseo/theme-mock';
import { getTemplate, getTemplateSlugs } from '@/content/templates';
import { buildPseoMetadata } from '@/lib/seo-metadata';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const dynamicParams = false;

export function generateStaticParams() {
  return getTemplateSlugs().map((template) => ({ template }));
}

export async function generateMetadata(props: { params: Promise<{ template: string }> }): Promise<Metadata> {
  const { template } = await props.params;
  const c = getTemplate(template);
  if (!c) return {};
  return buildPseoMetadata({ title: `${c.h1} | Linky`, description: c.answer, path: `/templates/${c.slug}` });
}

export default async function TemplatePage(props: { params: Promise<{ template: string }> }) {
  const { template } = await props.params;
  const c = getTemplate(template);
  if (!c) notFound();

  return (
    <PseoPage
      h1={c.h1}
      answer={c.answer}
      breadcrumbs={[
        { name: 'Home', url: 'https://lin.ky' },
        { name: 'Templates', url: 'https://lin.ky/templates' },
        { name: c.name, url: `https://lin.ky/templates/${c.slug}` },
      ]}
      hero={<ThemeMock palette={c.palette} name={c.name} />}
      faqs={c.faqs}
    >
      {c.sections.map((s, i) => (
        <section key={i}>
          <h2>{s.heading}</h2>
          <p>{s.body}</p>
        </section>
      ))}
    </PseoPage>
  );
}
