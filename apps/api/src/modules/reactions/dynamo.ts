import { getAwsClient, getAwsRegion } from '@/lib/aws';

export type AttributeValue =
  | { S: string }
  | { N: string }
  | { BOOL: boolean }
  | { NULL: true }
  | { L: AttributeValue[] }
  | { M: Record<string, AttributeValue> };

/** The marshalling @aws-sdk/lib-dynamodb used to do; see dynamo.test.ts. */
export function marshal(value: unknown): AttributeValue {
  if (value === null || value === undefined) {
    return { NULL: true };
  }

  if (typeof value === 'string') {
    return { S: value };
  }

  if (typeof value === 'number') {
    return { N: String(value) };
  }

  if (typeof value === 'boolean') {
    return { BOOL: value };
  }

  if (Array.isArray(value)) {
    return { L: value.map(marshal) };
  }

  if (typeof value === 'object') {
    return {
      M: Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([k, v]) => [
          k,
          marshal(v),
        ])
      ),
    };
  }

  // Reaction items are plain JSON (strings, numbers, booleans, null, arrays,
  // maps) — nothing here should ever produce a bigint/function/symbol. Throw
  // rather than silently writing a malformed attribute value.
  throw new Error(`Cannot marshal value of type ${typeof value} for DynamoDB`);
}

export function unmarshal(value: AttributeValue): unknown {
  if ('S' in value) return value.S;
  if ('N' in value) return Number(value.N);
  if ('BOOL' in value) return value.BOOL;
  if ('NULL' in value) return null;
  if ('L' in value) return value.L.map(unmarshal);

  return Object.fromEntries(
    Object.entries(value.M).map(([k, v]) => [k, unmarshal(v)])
  );
}

async function call<T>(target: string, body: unknown): Promise<T> {
  const region = getAwsRegion();

  const response = await getAwsClient().fetch(
    `https://dynamodb.${region}.amazonaws.com/`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.0',
        'X-Amz-Target': `DynamoDB_20120810.${target}`,
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    throw new Error(
      `DynamoDB ${target} failed with ${response.status}: ${await response.text()}`
    );
  }

  return response.json() as Promise<T>;
}

export async function batchGetItem({
  table,
  keys,
}: {
  table: string;
  keys: Record<string, unknown>[];
}): Promise<Record<string, unknown>[]> {
  const result = await call<{
    Responses?: Record<string, Record<string, AttributeValue>[]>;
    // Real DynamoDB can return UnprocessedKeys under throttling; the
    // previous @aws-sdk/lib-dynamodb-based implementation never retried
    // those either, so this matches existing (not ideal) behaviour.
  }>('BatchGetItem', {
    RequestItems: {
      [table]: {
        Keys: keys.map(
          (key) => (marshal(key) as { M: Record<string, AttributeValue> }).M
        ),
      },
    },
  });

  return (result.Responses?.[table] ?? []).map(
    (item) => unmarshal({ M: item }) as Record<string, unknown>
  );
}

export async function updateItem({
  table,
  key,
  updateExpression,
  expressionAttributeNames,
  expressionAttributeValues,
}: {
  table: string;
  key: Record<string, unknown>;
  updateExpression: string;
  expressionAttributeNames: Record<string, string>;
  expressionAttributeValues: Record<string, unknown>;
}): Promise<void> {
  await call('UpdateItem', {
    TableName: table,
    Key: (marshal(key) as { M: Record<string, AttributeValue> }).M,
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: Object.fromEntries(
      Object.entries(expressionAttributeValues).map(([k, v]) => [k, marshal(v)])
    ),
  });
}
