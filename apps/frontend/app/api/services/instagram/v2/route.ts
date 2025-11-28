import { getAuthSession } from '@/lib/api/auth';
import { encrypt } from '@/lib/encrypt';
import { NextRequest, NextResponse } from 'next/server';

const scopes = ['instagram_business_basic'];

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

  if (!process.env.INSTAGRAM_CALLBACK_URL) {
    return NextResponse.json(
      { error: 'Missing INSTAGRAM_CALLBACK_URL' },
      { status: 500 }
    );
  }

  if (!process.env.INSTAGRAM_CLIENT_ID) {
    return NextResponse.json(
      { error: 'Missing INSTAGRAM_CLIENT_ID' },
      { status: 500 }
    );
  }

  const options = {
    client_id: process.env.INSTAGRAM_CLIENT_ID,
    redirect_uri: process.env.INSTAGRAM_CALLBACK_URL,
    scope: scopes.join(','),
    response_type: 'code',
    state: await encrypt({ blockId }),
  };

  const qs = new URLSearchParams(options).toString();

  return NextResponse.redirect(
    `https://www.instagram.com/oauth/authorize?${qs}`
  );
}
