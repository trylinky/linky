import type { AuthenticatedSession } from '@/middleware/authenticate';

export interface Env {
  HYPERDRIVE: { connectionString: string };
  AUTH_RATE_LIMIT: KVNamespace;
}

export interface Variables {
  session: AuthenticatedSession | null;
}

export type AppBindings = { Bindings: Env; Variables: Variables };
