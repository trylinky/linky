import { getAuthSession } from '@/lib/api/auth';
import { encrypt } from '@/lib/encrypt';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const session = await getAuthSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const blockId = searchParams.get('blockId');

  if (!blockId) {
    return NextResponse.json({ error: 'Missing blockId' }, { status: 400 });
  }

  if (!process.env.THREADS_CALLBACK_URL) {
    return NextResponse.json(
      { error: 'Missing THREADS_CALLBACK_URL' },
      { status: 500 }
    );
  }

  if (!process.env.THREADS_CLIENT_ID) {
    return NextResponse.json(
      { error: 'Missing THREADS_CLIENT_ID' },
      { status: 500 }
    );
  }

  const options = {
    client_id: process.env.THREADS_CLIENT_ID,
    redirect_uri: process.env.THREADS_CALLBACK_URL,
    scope: 'threads_basic,threads_manage_insights',
    response_type: 'code',
    state: await encrypt({ blockId }),
  };

  const qs = new URLSearchParams(options).toString();

  return NextResponse.redirect(`https://threads.net/oauth/authorize?${qs}`);
}
