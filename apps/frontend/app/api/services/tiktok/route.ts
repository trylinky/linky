import { getAuthSession } from '@/lib/api/auth';
import { tiktokScopes } from '@/lib/api/services/tiktok/utils';
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

  if (!process.env.TIKTOK_CALLBACK_URL) {
    return NextResponse.json(
      { error: 'Missing TIKTOK_CALLBACK_URL' },
      { status: 500 }
    );
  }

  if (!process.env.TIKTOK_CLIENT_KEY) {
    return NextResponse.json(
      { error: 'Missing TIKTOK_CLIENT_KEY' },
      { status: 500 }
    );
  }

  const url = new URL('https://www.tiktok.com/v2/auth/authorize');

  const qs = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY,
    redirect_uri: process.env.TIKTOK_CALLBACK_URL,
    scope: tiktokScopes.join(','),
    response_type: 'code',
    state: await encrypt({
      userId: session.user.id,
      blockId,
    }),
  }).toString();

  url.search = qs;

  return NextResponse.redirect(url.toString());
}
