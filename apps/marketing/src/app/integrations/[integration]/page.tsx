import { PseoPage } from '@/components/pseo/pseo-page';
import { IntegrationBlocks } from '@/components/pseo/integration-blocks';
import { getIntegration, getIntegrationSlugs } from '@/content/integrations';
import { buildPseoMetadata } from '@/lib/seo-metadata';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const dynamicParams = false;

export function generateStaticParams() {
  return getIntegrationSlugs().map((integration) => ({ integration }));
}

export async function generateMetadata(props: { params: Promise<{ integration: string }> }): Promise<Metadata> {
  const { integration } = await props.params;
  const c = getIntegration(integration);
  if (!c) return {};
  return buildPseoMetadata({ title: `${c.h1} | Linky`, description: c.answer, path: `/i/integrations/${c.slug}` });
}

export default async function IntegrationPage(props: { params: Promise<{ integration: string }> }) {
  const { integration } = await props.params;
  const c = getIntegration(integration);
  if (!c) notFound();

  return (
    <PseoPage
      h1={c.h1}
      answer={c.answer}
      breadcrumbs={[
        { name: 'Home', url: 'https://lin.ky' },
        { name: 'Integrations', url: 'https://lin.ky/i/integrations' },
        { name: c.name, url: `https://lin.ky/i/integrations/${c.slug}` },
      ]}
      faqs={c.faqs}
    >
      {c.sections.map((s, i) => (
        <section key={i}>
          <h2>{s.heading}</h2>
          <p>{s.body}</p>
          {i === 0 && <IntegrationBlocks blockCopy={c.blockCopy} />}
        </section>
      ))}
    </PseoPage>
  );
}
