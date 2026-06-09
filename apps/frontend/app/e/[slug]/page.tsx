import type { PageConfig } from '@/app/[domain]/[slug]/grid';
import { EditorCanvas } from '@/app/e/[slug]/canvas';
import {
  getPageIdBySlugOrDomain,
  getPageLayout,
  getPageLoadData,
} from '@/app/lib/actions/page-actions';
import { renderBlock } from '@/lib/blocks/ui';
import { Block } from '@trylinky/prisma';
import { notFound } from 'next/navigation';

export default async function EditorCanvasPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN!;
  const corePage = await getPageIdBySlugOrDomain(slug, rootDomain);
  if (!corePage) notFound();

  const [layout, page] = await Promise.all([
    getPageLayout(corePage.id),
    getPageLoadData(corePage.id),
  ]);
  if (!page) notFound();

  const pageLayout = layout as unknown as PageConfig;
  const mergedIds = [...pageLayout.sm, ...pageLayout.xxs].map((item) => item.i);

  return (
    <EditorCanvas>
      {page.blocks
        .filter((block: Block) => mergedIds.includes(block.id))
        .map((block: Block) => (
          <section key={block.id} style={{ fontFamily: 'var(--font-sys-body)' }}>
            {renderBlock(block, page.id, true)}
          </section>
        ))}
    </EditorCanvas>
  );
}
