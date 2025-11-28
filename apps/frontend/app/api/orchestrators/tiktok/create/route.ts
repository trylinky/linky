import { createPageFromTikTokOrchestration } from '@/lib/api/orchestrators/tiktok';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orchestrationId } = body;

    if (!orchestrationId) {
      return NextResponse.json(
        { error: 'Missing orchestrationId' },
        { status: 400 }
      );
    }

    const result = await createPageFromTikTokOrchestration(orchestrationId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error running TikTok orchestration:', error);
    return NextResponse.json(
      { error: 'Failed to run orchestration' },
      { status: 500 }
    );
  }
}
