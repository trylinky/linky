import { createOrchestration } from '@/lib/api/orchestrators/service';
import { OrchestrationType } from '@trylinky/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type } = body;

    if (!type || !Object.values(OrchestrationType).includes(type)) {
      return NextResponse.json(
        { error: 'Invalid orchestration type' },
        { status: 400 }
      );
    }

    const orchestration = await createOrchestration(type as OrchestrationType);

    return NextResponse.json({ id: orchestration.id });
  } catch (error) {
    console.error('Error creating orchestration:', error);
    return NextResponse.json(
      { error: 'Failed to create orchestration' },
      { status: 500 }
    );
  }
}
