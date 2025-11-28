import { getAuthSession } from '@/lib/api/auth';
import { getIntegrationsForOrganizationId } from '@/lib/api/integrations';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!session.activeOrganizationId || session.activeOrganizationId === '') {
    return NextResponse.json({ error: 'No organization found' }, { status: 400 });
  }

  const integrations = await getIntegrationsForOrganizationId(
    session.activeOrganizationId
  );

  return NextResponse.json(integrations);
}
