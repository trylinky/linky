import { geolocation } from '@vercel/functions';
import { NextResponse } from 'next/server';

export function GET(request: Request) {
  const { country } = geolocation(request);

  return NextResponse.json({
    location: country ?? null,
  });
}
