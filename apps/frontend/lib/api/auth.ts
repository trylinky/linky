import { auth } from '@/lib/auth-server';
import { headers } from 'next/headers';

export type AuthSession = {
  user: { id: string };
  activeOrganizationId: string;
} | null;

/**
 * Get the current session from the request headers.
 * Returns null if not authenticated.
 */
export async function getAuthSession(): Promise<AuthSession> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    const user = session?.user;

    if (!user) {
      return null;
    }

    return {
      user: {
        id: user.id,
      },
      activeOrganizationId:
        (session as any).session?.activeOrganizationId || '',
    };
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Require authentication for an API route.
 * Throws an error if not authenticated.
 */
export async function requireAuth(): Promise<{
  user: { id: string };
  activeOrganizationId: string;
}> {
  const session = await getAuthSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  return session;
}
