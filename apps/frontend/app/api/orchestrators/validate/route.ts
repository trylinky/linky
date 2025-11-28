import { validateOrchestration } from '@/lib/api/orchestrators/service';
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

    const isValid = await validateOrchestration(orchestrationId);

    return NextResponse.json(isValid);
  } catch (error) {
    console.error('Error validating orchestration:', error);
    return NextResponse.json(
      { error: 'Failed to validate orchestration' },
      { status: 500 }
    );
  }
}
