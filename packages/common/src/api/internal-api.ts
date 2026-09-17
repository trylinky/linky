'use client';

import { UPGRADE_REQUIRED, type UpgradeRequiredError } from '../billing/plans';

/**
 * Client for public, session-free endpoints reachable from published pages.
 *
 * Published pages run on user custom domains, which are not trusted origins
 * and so receive CORS without `Access-Control-Allow-Credentials`. Requests
 * must omit credentials or the browser will reject the response. See
 * `publicApiFetcher` for the read-side equivalent.
 */
export class PublicApi {
  static async post(path: string, body?: any) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
        method: 'POST',
        headers: {
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        credentials: 'omit',
        body: body ? JSON.stringify(body) : undefined,
      });

      if (res.ok) {
        return res.json();
      }

      return {
        success: false,
      };
    } catch {
      return {
        success: false,
      };
    }
  }
}

type UpgradeRequiredListener = (error: UpgradeRequiredError) => void;

let upgradeRequiredListener: UpgradeRequiredListener | null = null;

async function parse(res: Response) {
  try {
    const body = await res.json();

    if (
      res.status === 402 &&
      body?.error?.code === UPGRADE_REQUIRED &&
      upgradeRequiredListener
    ) {
      upgradeRequiredListener(body.error);
    }

    return body;
  } catch {
    return { success: false };
  }
}

async function request(method: string, path: string, body?: any) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
    });

    return parse(res);
  } catch {
    return { success: false };
  }
}

/**
 * Session-bearing client for the editor. Unlike PublicApi it returns the
 * parsed body for every status so callers can read `error.message`,
 * `error.field` and `error.code`. A 402 UPGRADE_REQUIRED is also handed to
 * the registered listener (the UpgradeDialog provider) so gates need no
 * bespoke handling at each call site.
 */
export class InternalApi {
  static setUpgradeRequiredListener(listener: UpgradeRequiredListener | null) {
    upgradeRequiredListener = listener;
  }

  static post(path: string, body?: any) {
    return request('POST', path, body);
  }

  static put(path: string, body?: any) {
    return request('PUT', path, body);
  }

  static get(path: string, body?: any) {
    return request('GET', path, body);
  }

  static delete(path: string, body?: any) {
    return request('DELETE', path, body);
  }
}
