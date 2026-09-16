'use server';

import { batchGetItem, updateItem } from '@/modules/reactions/dynamo';
import { captureException } from '@sentry/cloudflare';

const TABLE_NAME = process.env.REACTIONS_TABLE_NAME as string;

export const MAX_ALLOWED_REACTIONS_PER_IP = 16;

export const REACTION_TYPES = [
  'love',
  'thumbs-up',
  'thumbs-down',
  'smiley',
  'rocket',
] as const;

export type ReactionType = (typeof REACTION_TYPES)[number];

// Clients that predate configurable reactions send no reactionType
export const DEFAULT_REACTION_TYPE: ReactionType = 'love';

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
  try {
    const items = await batchGetItem({
      table: TABLE_NAME,
      keys: [
        { PK: pageId, SK: 'totals' },
        { PK: pageId, SK: `entries#${ipAddress}` },
      ],
    });

    if (items.length === 0) {
      return {
        total: {},
        current: {},
      };
    }

    // Parse the results to separate totals and specific IP entry
    const result: {
      total: { [reactionType: string]: number };
      current: { [reactionType: string]: number };
    } = {
      total: {},
      current: {},
    };

    for (const item of items) {
      if (item.SK === 'totals') {
        result.total = item.reactionTotals as Record<string, number>;
      } else if (item.SK === `entries#${ipAddress}`) {
        result.current = item.reactions as Record<string, number>;
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
  reactionType,
}: {
  pageId: string;
  increment: number;
  ipAddress: string;
  reactionType: ReactionType;
}) {
  // Helper function to initialize and increment a reaction map with better error handling
  async function updateReactionMap({
    sk,
    mapName,
  }: {
    sk: string;
    mapName: string;
  }) {
    try {
      // DynamoDB rejects a single expression that sets both #map and
      // #map.#type (overlapping document paths), so this must stay two calls:
      // ensure the map exists, then atomically increment the nested counter.
      await updateItem({
        table: TABLE_NAME,
        key: { PK: pageId, SK: sk },
        updateExpression: 'SET #map = if_not_exists(#map, :emptyMap)',
        expressionAttributeNames: { '#map': mapName },
        expressionAttributeValues: { ':emptyMap': {} },
      });

      await updateItem({
        table: TABLE_NAME,
        key: { PK: pageId, SK: sk },
        updateExpression:
          'SET #map.#type = if_not_exists(#map.#type, :zero) + :increment',
        expressionAttributeNames: { '#map': mapName, '#type': reactionType },
        expressionAttributeValues: { ':zero': 0, ':increment': increment },
      });
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
  const failures = results.filter((result) => result.status === 'rejected');

  if (failures.length > 0) {
    // Log the failures for monitoring but don't attempt complex rollbacks
    // as they could make the situation worse in a distributed system
    const failureDetails = failures.map((failure, index) => ({
      operation: index === 0 ? 'individual entry' : 'totals',
      error: failure.status === 'rejected' ? failure.reason : 'unknown',
    }));

    captureException(
      new Error(`Reaction update failures: ${JSON.stringify(failureDetails)}`)
    );
    throw new Error(
      `Failed to update reactions: ${failures.length} operation(s) failed`
    );
  }
}

export async function reactToResource(
  pageId: string,
  increment: number,
  ipAddress: string,
  reactionType: ReactionType = DEFAULT_REACTION_TYPE
) {
  const currentReactionsForPage = await getReactionsForPageId({
    pageId,
    ipAddress,
  });

  const currentForType = currentReactionsForPage.current[reactionType] ?? 0;
  const totalForType = currentReactionsForPage.total[reactionType] ?? 0;

  // `increment` is client-supplied, so the cap has to bound the amount that
  // actually gets written — checking it only before applying let a single
  // request add an arbitrary number of reactions.
  const remainingAllowance = Math.max(
    MAX_ALLOWED_REACTIONS_PER_IP - currentForType,
    0
  );
  const appliedIncrement = Math.min(increment, remainingAllowance);

  if (appliedIncrement <= 0) {
    return {
      total: { [reactionType]: totalForType },
      current: { [reactionType]: currentForType },
    };
  }

  await incrementReaction({
    pageId,
    increment: appliedIncrement,
    ipAddress,
    reactionType,
  });

  // We could probably also refetch the latest data here, but this saves
  // an extra call to the database
  return {
    total: { [reactionType]: totalForType + appliedIncrement },
    current: { [reactionType]: currentForType + appliedIncrement },
  };
}
