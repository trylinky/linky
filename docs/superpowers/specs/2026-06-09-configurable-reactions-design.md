# Configurable Reaction Types — Design

**Date:** 2026-06-09
**Status:** Approved

## Goal

Let page owners configure which reaction their reactions block shows. One
block shows one reaction type, chosen from: love (existing), thumbs-up,
thumbs-down, smiley, rocket.

## Reaction registry

A single source of truth for the allowed types lives in
`packages/blocks/src/blocks/reaction/config.ts`:

```ts
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
}
```

- Default: `{ reactionType: 'love' }`.
- Yup schema validates `reactionType` with `oneOf(reactionTypes)` and is
  registered in the blocks config map (currently `schema: null`).
- The dead `showLove` boolean is dropped from the type.

### Backwards compatibility

Existing blocks have `{ showLove: true }` saved as blockData. Every reader
treats a missing `reactionType` as `'love'`, so existing blocks render and
behave exactly as today. No data migration.

## API (`apps/api/src/modules/reactions`)

- POST `/reactions` body gains optional `reactionType`, validated by TypeBox
  union of the five literals (invalid → 400), defaulting to `'love'`.
- `service.ts`: the hardcoded `REACTION_TYPE = 'love'` constant becomes a
  `reactionType` parameter on `reactToResource` and `incrementReaction`.
- DynamoDB needs no schema change: counts already live in per-type maps
  (`reactionTotals.<type>`, `reactions.<type>`); new types are new map keys.
- The 16-reactions-per-IP cap applies per type (unchanged behavior).
- GET `/reactions` already returns the full per-type maps; unchanged.

## Block UI (`apps/frontend/lib/blocks/reaction/ui.tsx`)

- Fetch `blockData` via SWR `/blocks/${blockId}` (map-block pattern); fall
  back to `'love'` when `reactionType` is missing.
- `REACTION_META` record maps each type to label, icon, and gradient:

| Type        | Label       | Icon (Heroicons 24/solid) | Gradient            |
| ----------- | ----------- | ------------------------- | ------------------- |
| love        | Love        | HeartIcon                 | #FF6096 → #FF2A76   |
| thumbs-up   | Thumbs up   | HandThumbUpIcon           | #4ADE80 → #22C55E   |
| thumbs-down | Thumbs down | HandThumbDownIcon         | #F97316 → #EF4444   |
| smiley      | Smile       | FaceSmileIcon             | #FBBF24 → #F59E0B   |
| rocket      | Rocket      | RocketLaunchIcon          | #A78BFA → #8B5CF6   |

- Icons render at 40px with the existing `fill-sys-label-primary` treatment.
- Layout, count animation (NumberFlow), debounced submit, and rising-fill
  animation are unchanged; the wave SVG fill and gradient take the meta
  colors, and the POST body includes `reactionType`.
- Client count/cap reads `data.total[reactionType]` instead of `.love`.

## Edit form (`apps/frontend/lib/blocks/reaction/form.tsx`)

Replace the placeholder with a Formik form (map-block pattern):

- A grid of five selectable tiles (icon + label), one per reaction type;
  selecting sets `values.reactionType`.
- Cancel / Save footer matching other block forms.

## Out of scope

- Multiple reactions in one block (owner adds multiple blocks instead).
- The static reactions mockup on the marketing site.
- Migrating stored `showLove` blockData (fallback handles it).

## Verification

- `tsc --noEmit` in api and frontend.
- Script against the dev DynamoDB table exercising `reactToResource` with a
  non-love type (per-type counts increment independently).
- Manual check of the block + edit form in the running frontend.
