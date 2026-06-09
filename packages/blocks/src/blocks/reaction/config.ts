import * as Yup from 'yup';

export const reactionTypes = [
  'love',
  'thumbs-up',
  'thumbs-down',
  'smiley',
  'rocket',
] as const;

export type ReactionType = (typeof reactionTypes)[number];

export interface ReactionBlockConfig {
  reactionType: ReactionType;
  // Custom display label; empty or missing falls back to the
  // reaction type's default label (e.g. 'Thumbs up')
  label?: string;
}

// Blocks saved before reactionType existed have `{ showLove: true }` as
// their blockData; readers must treat a missing reactionType as 'love'.
export const defaultReactionType: ReactionType = 'love';

export const reactionBlockDefaults: ReactionBlockConfig = {
  reactionType: defaultReactionType,
};

export const ReactionSchema = Yup.object().shape({
  reactionType: Yup.string().oneOf([...reactionTypes]).required(),
  label: Yup.string().max(30, 'Labels can be at most 30 characters').notRequired(),
});
