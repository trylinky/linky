export const dynamic = 'force-static';

const BODY = `# Linky

> Linky is a delightfully rich link-in-bio page builder. Create a customizable
> personal page with blocks (links, embeds, music, social follower counts) on a
> free or paid plan, optionally on a custom domain.

## Core
- [Home](https://lin.ky): What Linky is and how to start
- [Pricing](https://lin.ky/i/pricing): Free, Premium, and Team plans
- [Explore](https://lin.ky/i/explore): Example public pages

## Learn
- [Blog](https://lin.ky/i/blog): Product updates and guides
- [Learn](https://lin.ky/i/learn): How-to articles and help content
`;

export function GET() {
  return new Response(BODY, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
