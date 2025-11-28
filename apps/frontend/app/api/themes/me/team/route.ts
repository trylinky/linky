import { getAuthSession } from '@/lib/api/auth';
import { getThemesForOrganization } from '@/lib/api/themes';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const themes = await getThemesForOrganization(session.activeOrganizationId);

  return NextResponse.json(themes);
}
