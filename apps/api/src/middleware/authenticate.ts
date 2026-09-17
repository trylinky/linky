import type { AppBindings } from '@/env';
import { getAuth } from '@/middleware/request-context';
import { captureException } from '@sentry/cloudflare';
import type { Context, MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';

export interface AuthenticatedSession {
  user: { id: string };
  activeOrganizationId: string;
}

/**
 * Resolves the session once per request and parks it on the context, so a
 * handler that needs it does not pay for a second lookup.
 *
 * Deliberately never throws: public endpoints (reactions, form submissions)
 * run through the same chain. Handlers that require a session call
 * requireSession().
 */
export const resolveSession: MiddlewareHandler<AppBindings> = async (
  c,
  next
) => {
  // Vitest-only bypass. `process.env.VITEST` is set by the Vitest runner and
  // by nothing else; wrangler never defines TEST_SESSION, so this branch is
  // dead in every deployed environment.
  if (process.env.VITEST === 'true' && c.env.TEST_SESSION) {
    c.set('session', c.env.TEST_SESSION);
    await next();
    return;
  }

  try {
    const session = await getAuth().api.getSession({
      headers: c.req.raw.headers,
    });
    const user = session?.user;

    c.set(
      'session',
      user
        ? {
            user: { id: user.id },
            activeOrganizationId:
              (session as { session?: { activeOrganizationId?: string } })
                .session?.activeOrganizationId || '',
          }
        : null
    );
  } catch (error) {
    captureException(error);
    c.set('session', null);
  }

  await next();
};

export function requireSession(c: Context<AppBindings>): AuthenticatedSession {
  const session = c.get('session');

  if (!session) {
    throw new HTTPException(401, { message: 'Unauthorized' });
  }

  return session;
}

export async function optionalSession(
  c: Context<AppBindings>
): Promise<AuthenticatedSession | null> {
  return c.get('session');
}
