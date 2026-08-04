import { putObject } from '@/lib/s3';
import { assetContexts, AssetContexts } from '@/modules/assets/constants';
import { encodeVariants } from '@/modules/assets/image';

function bucketName(): string {
  return `${process.env.APP_ENV}.glow.user-uploads`;
}

function cdnUrl(key: string): string {
  return process.env.APP_ENV === 'development'
    ? `https://cdn.dev.lin.ky/${key}`
    : `https://cdn.lin.ky/${key}`;
}

// No explicit return type annotation, deliberately: the two `return`
// statements below infer to
// `{ data: { url: string }; error?: undefined } | { error: string; data?: undefined }`,
// which is what lets callers (modules/assets/index.ts,
// modules/orchestrators/tiktok.ts) narrow with a plain `result.error` /
// `result.data` check. Annotating this as the brief's
// `Promise<{ data: { url: string } } | { error: string }>` (no companion
// `?: undefined` properties) compiles here but breaks both of those
// call sites' narrowing under strict mode — accessing `.error` on the
// `{ data }` branch, or `.data` on the `{ error }` branch, becomes a
// property-does-not-exist error. Keeping the return type inferred
// preserves the exact runtime shape while staying source-compatible with
// existing callers.
export async function uploadAsset({
  context,
  file,
  referenceId,
}: {
  context: AssetContexts;
  file: File;
  referenceId: string;
}) {
  const assetConfig = assetContexts[context];
  const fileId = crypto.randomUUID();
  const baseFileName = `${assetConfig.keyPrefix}-${referenceId}/${fileId}`;

  try {
    const source = new Uint8Array(await file.arrayBuffer());

    const { webp, png } = await encodeVariants(source, {
      width: assetConfig.resize.width,
      height: assetConfig.resize.height,
      quality: assetConfig.quality,
    });

    const bucket = bucketName();

    await Promise.all([
      putObject({
        bucket,
        key: `${baseFileName}.webp`,
        body: webp,
        contentType: 'image/webp',
      }),
      putObject({
        bucket,
        key: `${baseFileName}.png`,
        body: png,
        contentType: 'image/png',
      }),
    ]);

    return { data: { url: cdnUrl(`${baseFileName}.webp`) } };
  } catch (error) {
    console.error('Error uploading asset:', error);
    return { error: 'Failed to upload asset' };
  }
}
