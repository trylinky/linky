import { getAuthSession } from '@/lib/api/auth';
import { isValidAssetContext } from '@/lib/api/assets/constants';
import { uploadAsset } from '@/lib/api/assets/service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const session = await getAuthSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const referenceId = formData.get('referenceId') as string | null;
    const assetContext = formData.get('assetContext') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: { message: 'No file uploaded' } },
        { status: 400 }
      );
    }

    if (!referenceId) {
      return NextResponse.json(
        { error: { message: 'Missing referenceId field' } },
        { status: 400 }
      );
    }

    if (!assetContext || !isValidAssetContext(assetContext)) {
      return NextResponse.json(
        { error: { message: 'Invalid asset context' } },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await uploadAsset({
      context: assetContext,
      buffer,
      referenceId,
    });

    if (uploadResult?.error) {
      return NextResponse.json(
        { error: uploadResult.error },
        { status: 500 }
      );
    }

    if (!uploadResult.data) {
      return NextResponse.json(
        { error: { message: 'Failed to upload asset' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'success',
      url: uploadResult.data.url,
    });
  } catch (error) {
    console.error('Error uploading asset:', error);
    return NextResponse.json(
      { error: { message: 'Failed to process upload' } },
      { status: 500 }
    );
  }
}
