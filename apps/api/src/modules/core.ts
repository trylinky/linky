import type { AppBindings } from '@/env';
import { requireSession } from '@/middleware/authenticate';
import { Hono } from 'hono';

const coreRoutes = new Hono<AppBindings>();

coreRoutes.get('/', (c) => c.json({ message: 'Welcome to the Linky API' }));

coreRoutes.get('/ping', (c) => c.json({ ping: 'pong' }));

coreRoutes.get('/session/me', (c) => c.json({ session: requireSession(c) }));

export default coreRoutes;
