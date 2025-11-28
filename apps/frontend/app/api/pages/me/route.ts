import { getAuthSession } from '@/lib/api/auth';
import { getPagesForOrganizationId } from '@/lib/api/pages';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const pages = await getPagesForOrganizationId(session.activeOrganizationId);

  return NextResponse.json(pages);
}
