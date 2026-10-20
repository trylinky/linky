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
  // Path-style. The bucket names contain dots (`production.glow.user-uploads`),
  // and S3's wildcard certificate only covers one label before
  // `.s3.<region>.amazonaws.com`, so a virtual-hosted URL fails the TLS
  // handshake and every upload 500s. The AWS SDK this replaced switched to
  // path-style for dotted buckets automatically.
  const url = `https://s3.${getAwsRegion()}.amazonaws.com/${bucket}/${key}`;

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
