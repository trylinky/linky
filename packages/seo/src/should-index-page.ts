export interface IndexBlock {
  type: string;
  data: Record<string, unknown>;
}

export interface PageIndexInput {
  publishedAt: string | null;
  customDomain: string | null;
  verifiedAt: string | null;
  isFeatured: boolean;
  isPaid: boolean;
  metaDescription: string | null;
  blocks: IndexBlock[];
}

function asTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Quality gate for indexing public user pages. We never list user pages in the
 * sitemap; this decides whether a crawled page is `index` or `noindex`.
 *
 * Generous by design — start here and tighten against GSC coverage data.
 */
export function shouldIndexPage(page: PageIndexInput): boolean {
  if (!page.publishedAt) return false;

  const hasStrongSignal =
    page.isPaid || Boolean(page.customDomain) || Boolean(page.verifiedAt) || page.isFeatured;
  if (!hasStrongSignal) return false;

  const header = page.blocks.find((b) => b.type === 'header');
  const headerTitle = asTrimmedString(header?.data?.title);
  const headerDescription = asTrimmedString(header?.data?.description);
  const nonHeaderBlocks = page.blocks.filter((b) => b.type !== 'header').length;
  const hasDescription = asTrimmedString(page.metaDescription) !== '' || headerDescription !== '';

  return headerTitle !== '' && nonHeaderBlocks >= 1 && hasDescription;
}
