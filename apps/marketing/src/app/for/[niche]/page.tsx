import { PseoPage } from '@/components/pseo/pseo-page';
import { IntegrationBlocks, isRealBlock } from '@/components/pseo/integration-blocks';
import { ThemeMock } from '@/components/pseo/theme-mock';
import { getBlockPresentation } from '@/content/block-copy';
import { getNiche, getNicheSlugs } from '@/content/niches';
import { getTemplate } from '@/content/templates';
import { buildPseoMetadata } from '@/lib/seo-metadata';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamicParams = false;

export function generateStaticParams() {
  return getNicheSlugs().map((niche) => ({ niche }));
}

export async function generateMetadata(props: { params: Promise<{ niche: string }> }): Promise<Metadata> {
  const { niche } = await props.params;
  const c = getNiche(niche);
  if (!c) return {};
  return buildPseoMetadata({ title: `${c.h1} | Linky`, description: c.answer, path: `/for/${c.slug}` });
}

export default async function NichePage(props: { params: Promise<{ niche: string }> }) {
  const { niche } = await props.params;
  const c = getNiche(niche);
  if (!c) notFound();

  const blockCopy: Record<string, { name: string; description: string }> = {};
  for (const key of c.recommendedBlocks ?? []) {
    if (isRealBlock(key)) blockCopy[key] = getBlockPresentation(key);
  }
  const template = c.recommendedTemplate ? getTemplate(c.recommendedTemplate) : null;

  return (
    <PseoPage
      h1={c.h1}
      answer={c.answer}
      breadcrumbs={[
        { name: 'Home', url: 'https://lin.ky' },
        { name: 'Use cases', url: 'https://lin.ky/for' },
        { name: c.name, url: `https://lin.ky/for/${c.slug}` },
      ]}
      hero={template ? <ThemeMock palette={template.palette} name={template.name} /> : undefined}
      faqs={c.faqs}
    >
      {c.sections.map((s, i) => (
        <section key={i}>
          <h2>{s.heading}</h2>
          <p>{s.body}</p>
          {i === 1 && Object.keys(blockCopy).length > 0 && <IntegrationBlocks blockCopy={blockCopy} />}
        </section>
      ))}
      {((c.relatedIntegrations?.length ?? 0) > 0 || template) && (
        <section className="not-prose">
          <h2 className="text-xl font-semibold">Related</h2>
          <ul className="mt-3 flex flex-wrap gap-3 text-sm">
            {(c.relatedIntegrations ?? []).map((slug) => (
              <li key={slug}>
                <Link href={`/integrations/${slug}`} className="text-blue-700 hover:underline">{slug} integration</Link>
              </li>
            ))}
            {template && (
              <li>
                <Link href={`/templates/${c.recommendedTemplate}`} className="text-blue-700 hover:underline">{template.name} template</Link>
              </li>
            )}
          </ul>
        </section>
      )}
    </PseoPage>
  );
}
