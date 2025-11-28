'use server';

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  BatchGetCommand,
  DynamoDBDocumentClient,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { captureException } from '@sentry/node';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

const dynamoDb = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.REACTIONS_TABLE_NAME;

const MAX_ALLOWED_REACTIONS_PER_IP = 16;

// We only support one reaction type for now
const REACTION_TYPE = 'love';

export async function getReactionsForPageId({
  pageId,
  ipAddress,
}: {
  pageId: string;
  ipAddress: string;
}): Promise<{
  total: {
    [reactionType: string]: number;
  };
  current: {
    [reactionType: string]: number;
  };
}> {
  const params = {
    RequestItems: {
      [TABLE_NAME as string]: {
        Keys: [
          { PK: pageId, SK: 'totals' },
          { PK: pageId, SK: `entries#${ipAddress}` },
        ],
      },
    },
  };

  try {
    const data = await dynamoDb.send(new BatchGetCommand(params));

    const items = data?.Responses?.[TABLE_NAME as string];

    if (!items) {
      return {
        total: {},
        current: {},
      };
    }

    // Parse the results to separate totals and specific IP entry
    const result = {
      total: {},
      current: {},
    };

    for (const item of items) {
      if (item.SK === 'totals') {
        result.total = item.reactionTotals;
      } else if (item.SK === `entries#${ipAddress}`) {
        result.current = item.reactions;
      }
    }

    return result;
  } catch (error) {
    console.error('Error getting reactions', error);
    captureException(error);
    return {
      total: {},
      current: {},
    };
  }
}

export async function incrementReaction({
  pageId,
  increment,
  ipAddress,
}: {
  pageId: string;
  increment: number;
  ipAddress: string;
}) {
  // Helper function to initialize and increment a reaction map with better error handling
  async function updateReactionMap({
    sk,
    mapName,
  }: {
    sk: string;
    mapName: string;
  }) {
    // Combined initialization and increment in a single atomic operation
    const params = {
      TableName: TABLE_NAME,
      Key: {
        PK: pageId,
        SK: sk,
      },
      UpdateExpression: `SET #map = if_not_exists(#map, :emptyMap), #map.#type = if_not_exists(#map.#type, :zero) + :increment`,
      ExpressionAttributeNames: {
        '#map': mapName,
        '#type': REACTION_TYPE,
      },
      ExpressionAttributeValues: {
        ':emptyMap': {},
        ':zero': 0,
        ':increment': increment,
      },
    };

    try {
      await dynamoDb.send(new UpdateCommand(params));
    } catch (error) {
      console.error(`Error updating ${mapName} for ${sk}:`, error);
      captureException(error);
      throw error;
    }
  }

  // Use Promise.allSettled to handle both operations with proper error handling
  const results = await Promise.allSettled([
    updateReactionMap({
      sk: `entries#${ipAddress}`,
      mapName: 'reactions',
    }),
    updateReactionMap({
      sk: 'totals',
      mapName: 'reactionTotals',
    }),
  ]);

  // Check if any operations failed
  const failures = results.filter(result => result.status === 'rejected');
  
  if (failures.length > 0) {
    // Log the failures for monitoring but don't attempt complex rollbacks
    // as they could make the situation worse in a distributed system
    const failureDetails = failures.map((failure, index) => ({
      operation: index === 0 ? 'individual entry' : 'totals',
      error: failure.status === 'rejected' ? failure.reason : 'unknown'
    }));
    
    captureException(new Error(`Reaction update failures: ${JSON.stringify(failureDetails)}`));
    throw new Error(`Failed to update reactions: ${failures.length} operation(s) failed`);
  }
}

export async function reactToResource(
  pageId: string,
  increment: number,
  ipAddress: string
) {
  const currentReactionsForPage = await getReactionsForPageId({
    pageId,
    ipAddress,
  });

  if (
    currentReactionsForPage.current[REACTION_TYPE] >=
    MAX_ALLOWED_REACTIONS_PER_IP
  ) {
    return {
      error: 'Max reactions reached',
      total: {
        [REACTION_TYPE]: currentReactionsForPage.total[REACTION_TYPE],
      },
      current: {
        [REACTION_TYPE]: currentReactionsForPage.current[REACTION_TYPE],
      },
    };
  }

  await incrementReaction({ pageId, increment, ipAddress });

  // We could probably also refetch the latest data here, but this saves
  // an extra call to the database
  return {
    total: {
      [REACTION_TYPE]: currentReactionsForPage.total[REACTION_TYPE] + increment,
    },
    current: {
      [REACTION_TYPE]:
        currentReactionsForPage.current[REACTION_TYPE] + increment,
    },
  };
}
