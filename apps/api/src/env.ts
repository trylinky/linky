// TODO(Task 6): replace this placeholder with
// `import type { AuthenticatedSession } from '@/middleware/authenticate';`
// once that module exists, and delete the inline interface below.
export interface AuthenticatedSession {
  user: { id: string };
  activeOrganizationId: string;
}

export interface Env {
  HYPERDRIVE: { connectionString: string };
  AUTH_RATE_LIMIT: KVNamespace;
}

export interface Variables {
  session: AuthenticatedSession | null;
}

export type AppBindings = { Bindings: Env; Variables: Variables };
