import { getAuthSession } from '@/lib/api/auth';
import { checkUserHasAccessToBlock, updateBlockData } from '@/lib/api/blocks';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ blockId: string }> }
) {
  const { blockId } = await params;
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.json({}, { status: 401 });
  }

  const body = await request.json();
  const { newData } = body;

  const hasAccess = await checkUserHasAccessToBlock(blockId, session.user.id);

  if (!hasAccess) {
    return NextResponse.json({}, { status: 401 });
  }

  try {
    const updatedBlock = await updateBlockData(blockId, newData);

    return NextResponse.json({
      id: updatedBlock.id,
      updatedAt: updatedBlock.updatedAt,
    });
  } catch (error) {
    return NextResponse.json(
      { error: { message: 'Error updating block data' } },
      { status: 400 }
    );
  }
}
