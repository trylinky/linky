import { getAwsClient, getAwsRegion } from '@/lib/aws';

/**
 * Single-shot signed PUT. Uploads are capped at 10MB by the route, so the
 * SDK's multipart machinery was never exercised.
 */
export async function putObject({
  bucket,
  key,
  body,
  contentType,
}: {
  bucket: string;
  key: string;
  body: Uint8Array;
  contentType: string;
}): Promise<void> {
  const url = `https://${bucket}.s3.${getAwsRegion()}.amazonaws.com/${key}`;

  const response = await getAwsClient().fetch(url, {
    method: 'PUT',
    body,
    headers: { 'Content-Type': contentType },
  });

  if (!response.ok) {
    throw new Error(
      `S3 PUT ${key} failed with ${response.status}: ${await response.text()}`
    );
  }
}
