import { putObject } from '@/lib/s3';
import { assetContexts, AssetContexts } from '@/modules/assets/constants';
import { MultipartFile } from '@fastify/multipart';
import { randomUUID } from 'crypto';
import sharp from 'sharp';

const uploadBuffer = (fileName: string, contentType: string, body: Buffer) =>
  putObject({
    bucket: `${process.env.APP_ENV}.glow.user-uploads`,
    key: fileName,
    body: new Uint8Array(body),
    contentType,
  });

export async function uploadAsset({
  context,
  file,
  multipartFile,
  referenceId,
}: {
  context: AssetContexts;
  file?: File;
  multipartFile?: MultipartFile;
  referenceId: string;
}) {
  const assetConfig = assetContexts[context];
  const fileId = randomUUID();
  const baseFileName = `${assetConfig.keyPrefix}-${referenceId}/${fileId}`;
  const webpKey = `${baseFileName}.webp`;
  const pngKey = `${baseFileName}.png`;

  try {
    // Handle File or MultipartFile input
    let fileBuffer: Buffer;
    if (file) {
      const buffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(buffer);
    } else if (multipartFile) {
      fileBuffer = await multipartFile.toBuffer();
    } else {
      throw new Error('No file provided');
    }

    // Encode both variants, then ship each as a single signed PUT.
    const [webpBuffer, pngBuffer] = await Promise.all([
      sharp(fileBuffer)
        .resize(assetConfig.resize.width, assetConfig.resize.height)
        .webp({ quality: assetConfig.quality })
        .toBuffer(),
      sharp(fileBuffer)
        .resize(assetConfig.resize.width, assetConfig.resize.height)
        .png({ quality: assetConfig.quality })
        .toBuffer(),
    ]);

    await Promise.all([
      uploadBuffer(webpKey, 'image/webp', webpBuffer),
      uploadBuffer(pngKey, 'image/png', pngBuffer),
    ]);

    const fileLocation =
      process.env.APP_ENV === 'development'
        ? `https://cdn.dev.lin.ky/${webpKey}`
        : `https://cdn.lin.ky/${webpKey}`;

    return {
      data: {
        url: fileLocation,
      },
    };
  } catch (error) {
    console.error('Error uploading asset:', error);
    return {
      error: 'Failed to upload asset',
    };
  }
}
