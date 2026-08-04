import type { AppBindings } from '@/env';
import { getReactionsHandlers } from '@/modules/reactions/handlers/get-reactions';
import { postReactionsHandlers } from '@/modules/reactions/handlers/post-reactions';
import { Hono } from 'hono';

const reactionsRoutes = new Hono<AppBindings>();

reactionsRoutes.get('/', ...getReactionsHandlers);
reactionsRoutes.post('/', ...postReactionsHandlers);

export default reactionsRoutes;
