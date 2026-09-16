import type { AppBindings } from '@/env';
import { isTrustedOrigin } from '@/lib/origins';
import type { MiddlewareHandler } from 'hono';
import { cors } from 'hono/cors';

/**
 * CORS is decided per request, because the API serves two different kinds of
 * caller:
 *
 *  - First-party app surfaces (the editor, admin, marketing) are trusted and
 *    need credentialed requests so the session cookie is sent and the response
 *    is readable.
 *
 *  - Public pages on user custom domains, whose origin we cannot enumerate.
 *    These only ever call session-free endpoints (reactions, form
 *    submissions), so they get CORS *without* credentials.
 *
 * Reflecting the origin without credentials is safe: no cookie is attached, so
 * an untrusted caller can only reach data that is already public. Echoing an
 * arbitrary origin *with* credentials would let any site read a logged-in
 * user's data.
 */
export const corsMiddleware: MiddlewareHandler<AppBindings> = (c, next) =>
  cors({
    origin: (origin) => origin, // reflect; hono/cors also sets `Vary: Origin`
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
    exposeHeaders: ['Content-Length'],
    credentials: isTrustedOrigin(c.req.header('origin')),
    maxAge: 86400,
  })(c, next);
