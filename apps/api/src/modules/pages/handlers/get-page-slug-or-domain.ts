import type { AppBindings } from '@/env';
import prisma from '@/lib/prisma';
import { tbValidator } from '@hono/typebox-validator';
import { captureException } from '@sentry/cloudflare';
import { createFactory } from 'hono/factory';
import safeAwait from 'safe-await';
// Built with `typebox`, NOT `@sinclair/typebox` — see the comment on
// postReactionsBodySchema in reactions/handlers/post-reactions.ts for why the
// two aren't interchangeable when fed to tbValidator.
import { Type } from 'typebox';

const factory = createFactory<AppBindings>();

export const getPageBySlugOrDomainQuerySchema = Type.Object({
  slug: Type.String(),
  domain: Type.String(),
});

// Server-to-server only — mounted behind `requireApiKey` in index.ts, not
// baked in here, matching how `bodyLimit` is applied at the mount site for
// forms' submission route rather than inside its `createHandlers` call.
//
// The handler stays inline in this same `createHandlers` call so
// `c.req.valid('query')` is inferred from the validator immediately above
// it — see the comment on getReactionsHandlers in
// reactions/handlers/get-reactions.ts for why pulling it out into a
// separately-typed named function reopens that hole.
export const getPageBySlugOrDomainHandlers = factory.createHandlers(
  tbValidator('query', getPageBySlugOrDomainQuerySchema),
  async (c) => {
    const { slug, domain } = c.req.valid('query');

    const appDomain = new URL(process.env.APP_FRONTEND_URL as string);
    const rootDomain =
      process.env.NODE_ENV === 'production'
        ? appDomain.hostname
        : `${appDomain.hostname}:${appDomain.port}`;

    const customDomain = decodeURIComponent(domain) !== rootDomain;

    const [error, page] = await safeAwait(
      prisma.page.findFirst({
        where: {
          deletedAt: null,
          slug: customDomain ? undefined : slug,
          customDomain: customDomain ? decodeURIComponent(domain) : undefined,
        },
        select: {
          id: true,
          organizationId: true,
          publishedAt: true,
          slug: true,
        },
      })
    );

    if (error) {
      console.error(error);
      captureException(error);
      return c.json({ error: 'Internal Server Error' }, 500);
    }

    if (!page) {
      return c.json({}, 404);
    }

    return c.json(page, 200);
  }
);
