import { AwsClient } from 'aws4fetch';

let client: AwsClient | undefined;

/**
 * A SigV4 signer over fetch, replacing the AWS SDK. The SDK's three packages
 * added 1-2MB to a bundle with a 10MB ceiling, and this API only ever does
 * single-shot S3 PUTs and two DynamoDB operations.
 *
 * Safe at module scope: the signer holds no socket, just credentials.
 */
export function getAwsClient(): AwsClient {
  if (!client) {
    client = new AwsClient({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
      region: process.env.AWS_REGION,
    });
  }

  return client;
}

export function getAwsRegion(): string {
  return process.env.AWS_REGION as string;
}
