import type { AppBindings } from '@/env';
import { requireSession } from '@/middleware/authenticate';
import { getThemesForOrganization } from '@/modules/themes/service';
import type { Context } from 'hono';
import { Hono } from 'hono';

const themesRoutes = new Hono<AppBindings>();

themesRoutes.get('/me/team', getThemesForCurrentTeamHandler);

async function getThemesForCurrentTeamHandler(c: Context<AppBindings>) {
  const session = requireSession(c);

  const themes = await getThemesForOrganization(session.activeOrganizationId);

  return c.json(themes, 200);
}

export default themesRoutes;
