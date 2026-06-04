import 'server-only';

/**
 * Cookie-free fetch to apps/api for PUBLIC (published-page) reads.
 *
 * Unlike `apiServerFetch`, this never reads request data (`headers()`/`cookies()`),
 * so it is safe to call from a `'use cache'` function. Published page data is public
 * (served to logged-out visitors today), so no session is required. Some internal
 * endpoints (slug-or-domain, load) require the `x-api-key` header — that comes from an
 * env var, not request data, so it is still cache-safe.
 */
export async function publicApiFetch(path: string, requestOptions: RequestInit = {}) {
  return fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    method: 'GET',
    ...requestOptions,
  });
}
