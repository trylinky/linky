import { describe, expect, it } from 'vitest';
import { shouldIndexPage, type PageIndexInput } from './should-index-page';

const headerBlock = {
  type: 'header',
  data: { title: 'Jane Doe', description: 'Photographer in Berlin', avatar: { src: 'https://x/a.png' } },
};
const linkBlock = { type: 'link-box', data: { link: 'https://instagram.com/jane' } };

function base(overrides: Partial<PageIndexInput> = {}): PageIndexInput {
  return {
    publishedAt: '2026-01-01T00:00:00.000Z',
    customDomain: null,
    verifiedAt: null,
    isFeatured: false,
    isPaid: false,
    metaDescription: null,
    blocks: [headerBlock, linkBlock],
    ...overrides,
  };
}

describe('shouldIndexPage', () => {
  it('indexes a paid page that clears the content floor', () => {
    expect(shouldIndexPage(base({ isPaid: true }))).toBe(true);
  });

  it('indexes a page on a custom domain', () => {
    expect(shouldIndexPage(base({ customDomain: 'jane.com' }))).toBe(true);
  });

  it('indexes a verified page', () => {
    expect(shouldIndexPage(base({ verifiedAt: '2026-02-02T00:00:00.000Z' }))).toBe(true);
  });

  it('indexes a featured page', () => {
    expect(shouldIndexPage(base({ isFeatured: true }))).toBe(true);
  });

  it('noindexes a free page with no strong signal', () => {
    expect(shouldIndexPage(base())).toBe(false);
  });

  it('noindexes an unpublished page even if paid', () => {
    expect(shouldIndexPage(base({ isPaid: true, publishedAt: null }))).toBe(false);
  });

  it('noindexes a paid page with no header title (content floor)', () => {
    const blocks = [{ type: 'header', data: { title: '   ', description: 'x', avatar: { src: '' } } }, linkBlock];
    expect(shouldIndexPage(base({ isPaid: true, blocks }))).toBe(false);
  });

  it('noindexes a paid page with only a header (no content block)', () => {
    expect(shouldIndexPage(base({ isPaid: true, blocks: [headerBlock] }))).toBe(false);
  });

  it('noindexes a paid page with no description anywhere', () => {
    const blocks = [{ type: 'header', data: { title: 'Jane', description: '', avatar: { src: '' } } }, linkBlock];
    expect(shouldIndexPage(base({ isPaid: true, blocks, metaDescription: null }))).toBe(false);
  });

  it('accepts metaDescription as the description source', () => {
    const blocks = [{ type: 'header', data: { title: 'Jane', description: '', avatar: { src: '' } } }, linkBlock];
    expect(shouldIndexPage(base({ isPaid: true, blocks, metaDescription: 'Berlin photographer' }))).toBe(true);
  });
});
