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

  if (!process.env.SPOTIFY_CLIENT_ID) {
    return NextResponse.json(
      { error: 'Missing SPOTIFY_CLIENT_ID' },
      { status: 500 }
    );
  }

  if (!process.env.SPOTIFY_REDIRECT_URL) {
    return NextResponse.json(
      { error: 'Missing SPOTIFY_REDIRECT_URL' },
      { status: 500 }
    );
  }

  const query = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: process.env.SPOTIFY_REDIRECT_URL,
    scope: 'user-read-currently-playing, user-read-recently-played',
    state: await encrypt({ blockId }),
  });

  return NextResponse.redirect(
    `https://accounts.spotify.com/authorize?${query}`
  );
}
