import { describe, expect, it } from 'vitest';
import {
  buildBreadcrumbSchema,
  buildOrganizationSchema,
  buildProfilePageSchema,
  buildWebSiteSchema,
  personInputFromPage,
  serializeJsonLd,
} from './json-ld';

describe('buildProfilePageSchema', () => {
  it('wraps a Person as the mainEntity and omits empty fields', () => {
    const schema = buildProfilePageSchema({ name: 'Jane', url: 'https://lin.ky/jane' });
    expect(schema).toEqual({
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      mainEntity: { '@type': 'Person', name: 'Jane', url: 'https://lin.ky/jane' },
    });
  });

  it('includes description, image and sameAs when present', () => {
    const schema = buildProfilePageSchema({
      name: 'Jane',
      url: 'https://lin.ky/jane',
      description: 'Photographer',
      image: 'https://x/a.png',
      sameAs: ['https://instagram.com/jane'],
    });
    expect(schema.mainEntity).toMatchObject({
      description: 'Photographer',
      image: 'https://x/a.png',
      sameAs: ['https://instagram.com/jane'],
    });
  });
});

describe('personInputFromPage', () => {
  const blocks = [
    { type: 'header', data: { title: 'Jane Doe', description: 'Berlin photographer', avatar: { src: 'https://x/a.png' } } },
    { type: 'link-box', data: { link: 'https://instagram.com/jane' } },
    { type: 'link-bar', data: { link: 'https://tiktok.com/@jane' } },
    { type: 'content', data: { html: 'hi' } },
  ];

  it('derives name/description/image and sameAs from blocks', () => {
    expect(personInputFromPage({ blocks }, 'https://lin.ky/jane')).toEqual({
      name: 'Jane Doe',
      description: 'Berlin photographer',
      image: 'https://x/a.png',
      url: 'https://lin.ky/jane',
      sameAs: ['https://instagram.com/jane', 'https://tiktok.com/@jane'],
    });
  });

  it('returns null when there is no header title', () => {
    expect(personInputFromPage({ blocks: [{ type: 'content', data: {} }] }, 'https://lin.ky/x')).toBeNull();
  });
});

describe('buildOrganizationSchema / buildWebSiteSchema', () => {
  it('builds an Organization', () => {
    expect(buildOrganizationSchema({ name: 'Linky', url: 'https://lin.ky', logo: 'https://lin.ky/assets/og.png' })).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Linky',
      url: 'https://lin.ky',
      logo: 'https://lin.ky/assets/og.png',
    });
  });

  it('builds a WebSite', () => {
    expect(buildWebSiteSchema({ name: 'Linky', url: 'https://lin.ky' })).toEqual({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Linky',
      url: 'https://lin.ky',
    });
  });
});

describe('buildBreadcrumbSchema', () => {
  it('numbers positions from 1', () => {
    const schema = buildBreadcrumbSchema([
      { name: 'Home', url: 'https://lin.ky' },
      { name: 'Blog', url: 'https://lin.ky/i/blog' },
    ]);
    expect(schema.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://lin.ky' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://lin.ky/i/blog' },
    ]);
  });
});

describe('serializeJsonLd', () => {
  it('escapes < to prevent breaking out of the script tag', () => {
    expect(serializeJsonLd({ a: '</script><b>' })).toBe('{"a":"\\u003c/script>\\u003cb>"}');
  });
});
