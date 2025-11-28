import 'server-only';

import { getAuthSession } from '@/lib/api/auth';
import { getIntegrationsForOrganizationId } from '@/lib/api/integrations';

export async function getTeamIntegrations() {
  const session = await getAuthSession();

  if (!session?.activeOrganizationId) {
    return [];
  }

  return getIntegrationsForOrganizationId(session.activeOrganizationId);
}
