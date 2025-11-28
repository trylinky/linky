import { getAuthSession } from '@/lib/api/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getAuthSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    session,
  });
}
