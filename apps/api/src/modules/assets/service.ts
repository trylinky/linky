import { assetContexts, AssetContexts } from '@/modules/assets/constants';
import {
  CompleteMultipartUploadCommandOutput,
  S3,
  type AbortMultipartUploadCommandOutput,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { MultipartFile } from '@fastify/multipart';
import { randomUUID } from 'crypto';
import sharp from 'sharp';
import { PassThrough } from 'stream';

function isComplete(
  output:
    | CompleteMultipartUploadCommandOutput
    | AbortMultipartUploadCommandOutput
): output is CompleteMultipartUploadCommandOutput {
  return (output as CompleteMultipartUploadCommandOutput).ETag !== undefined;
}

const s3 = new S3({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
  region: process.env.AWS_REGION,
});

const uploadStream = (fileName: string, contentType: string) => {
  const passThrough = new PassThrough();

  const upload = new Upload({
    client: s3,
    params: {
      Bucket: `${process.env.APP_ENV}.glow.user-uploads`,
      Key: fileName,
      ContentType: contentType,
      Body: passThrough,
    },
  });

  return {
    writeStream: passThrough,
    done: upload.done(),
  };
};

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

  // Create upload streams for webp and png
  const { writeStream: webpStream, done: webpDone } = uploadStream(
    `${baseFileName}.webp`,
    'image/webp'
  );
  const { writeStream: pngStream, done: pngDone } = uploadStream(
    `${baseFileName}.png`,
    'image/png'
  );

  // Process file with sharp streams
  const sharpWebp = sharp()
    .resize(assetConfig.resize.width, assetConfig.resize.height)
    .webp({ quality: assetConfig.quality });
  const sharpPng = sharp()
    .resize(assetConfig.resize.width, assetConfig.resize.height)
    .png({ quality: assetConfig.quality });

  try {
    // Handle File or MultipartFile input
    if (file) {
      const buffer = await file.arrayBuffer();
      const fileBuffer = Buffer.from(buffer);

      // Process and pipe the buffer through sharp to S3
      sharpWebp.end(fileBuffer);
      sharpPng.end(fileBuffer);
    } else if (multipartFile) {
      const buffer = await multipartFile.toBuffer();

      // Process and pipe the buffer through sharp to S3
      sharpWebp.end(buffer);
      sharpPng.end(buffer);
    } else {
      throw new Error('No file provided');
    }

    // Connect sharp output to S3 upload streams
    sharpWebp.pipe(webpStream);
    sharpPng.pipe(pngStream);

    // Wait for uploads to finish
    const [webpUpload, pngUpload] = await Promise.all([webpDone, pngDone]);

    // Check if uploads are successful
    if (isComplete(webpUpload) && isComplete(pngUpload)) {
      const fileLocation =
        process.env.APP_ENV === 'development'
          ? `https://cdn.dev.lin.ky/${webpUpload.Key}`
          : `https://cdn.lin.ky/${webpUpload.Key}`;

      return {
        data: {
          url: fileLocation,
        },
      };
    }

    return {
      error: 'Failed to upload asset',
    };
  } catch (error) {
    console.error('Error uploading asset:', error);
    return {
      error: 'Failed to upload asset',
    };
  }
}
