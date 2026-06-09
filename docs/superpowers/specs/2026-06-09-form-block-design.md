# Form Block — Design Spec

**Date:** 2026-06-09
**Status:** Approved (brainstorm validated)

## Summary

A new `form` block lets a page owner design a simple form (contact, RSVP, feedback), collect visitor responses, and view/export them in a new **Responses** section of the dashboard. Visitor submissions are stored as individual rows in Postgres — a new capability; existing visitor-data blocks (reactions) only store aggregates.

## Goals

- Owner adds a form block, designs its fields in the block edit modal, and publishes.
- Visitors submit responses with no account, protected by honeypot + IP rate limiting.
- Owner views responses per form in the dashboard, with pagination, delete, and CSV export.

## Non-goals (v1 — noted as fast-follows)

- Email notifications (per-submission or digest)
- File-upload, phone, number, date field types
- Conditional logic, multi-step forms
- Webhooks / Zapier integrations
- CAPTCHA

## Decisions made during brainstorm

| Question | Decision |
|---|---|
| Builder scope | Field-list builder (ordered list of fields from a fixed type set) |
| Field types | text, email, textarea, select, checkbox |
| Notifications | None in v1 — dashboard only |
| Dashboard placement | New dedicated **Responses** route, alongside Analytics |
| Spam protection | Honeypot field + per-IP-per-block rate limit |
| Storage | Postgres via Prisma (`FormSubmission` model) — not DynamoDB |

**Why Postgres over DynamoDB (reactions pattern):** reactions are high-write aggregation (counters); form submissions are low-volume row data with owner-facing queries (paginate, order, count, export). Postgres fits the access pattern, the `db push`-managed dev workflow, and the existing DB-backed integration test setup.

## 1. Block definition & config

New block type `form`, wired like the other 19 blocks:

- `packages/blocks/src/blocks/types.ts` — add `'form'` to the `Blocks` union
- `packages/blocks/src/blocks/config.ts` — registry entry `{ schema: FormSchema, defaults: formBlockDefaults, isBeta: true }`
- `packages/blocks/src/blocks/form/config.ts` — interface, defaults, Yup schema
- `apps/frontend/lib/blocks/ui.tsx` — `case 'form'` render dispatch
- `apps/frontend/lib/blocks/edit.tsx` — edit form registration
- `apps/frontend/app/components/DraggableBlockButton.tsx` — picker entry + icon

Ships with `isBeta: true` (admin-only), matching the in-flight quick-wins blocks.

### `Block.data` shape (JSON column — no migration needed for the block itself)

```ts
{
  title?: string;              // shown above the form
  submitLabel: string;         // default "Submit"
  successMessage: string;      // default "Thanks — your response was sent."
  fields: Array<{
    id: string;                // nanoid, stable across edits — answers key off this
    type: 'text' | 'email' | 'textarea' | 'select' | 'checkbox';
    label: string;             // required, max 100 chars
    required: boolean;
    placeholder?: string;
    options?: string[];        // select only, 2–20 options, each max 100 chars
  }>;                          // 1–10 fields
}
```

- Yup schema enforces all limits; same schema runs client-side (edit form) and server-side (`updateBlockData`), per existing convention.
- **Field `id` stability is the linchpin:** answers are stored keyed by `id`, not label, so relabeling a field never orphans past answers.
- Defaults seed a working contact form: Name (text), Email (email, required), Message (textarea, required) — the block is usable the moment it's dropped in.

## 2. Editor UX — building the form

Standard Formik edit modal. Body is a **field-list builder**:

- Ordered list of field rows: reorder control, label input, type select, required toggle, expandable placeholder/options editor (options editor shown only for `select`).
- "Add field" appends a text field; disabled at 10. Remove allowed down to 1 field.
- Title input above the list; submit-button label and success message below.
- Reordering: use the editor's existing lightweight pattern if reusable inside the modal; up/down buttons are an acceptable fallback (implementation plan decides).
- Save goes through existing `POST /blocks/{blockId}/update-data` — no new edit API surface.

**Removing a field does not delete past answers.** Old submissions retain that field's data (rendered via snapshot, §4). The edit form shows a brief note when a field is removed so this doesn't feel destructive.

## 3. Visitor flow & public API

Public page renders the form from `Block.data` inside `<CoreBlock>`:

- Client-side validation (required, email format).
- Hidden honeypot field named `website` (visually hidden, `autocomplete="off"`, excluded from a11y tree via `aria-hidden` + `tabindex="-1"`).
- Empty state before configuration follows block convention ("Edit this block to set up your form.") — though defaults make this rare.

### `POST /forms/{blockId}/submissions` — public, no auth

Body: `{ answers: Record<fieldId, string | boolean>, website?: string }`

Server-side, in order:

1. **Page checks:** block exists, is type `form`, and its page is published; otherwise 404.
2. **Honeypot:** if `website` is non-empty → respond 200 with the normal success body, **store nothing**. Bots see success; no signal to adapt.
3. **Rate limit:** per IP per block, 5 submissions/hour → 429 beyond. Implemented as a count query on `FormSubmission` (`blockId`, `visitorIp`, `createdAt > now − 1h`) — no extra infra; supported by the `[blockId, visitorIp, createdAt]` index.
4. **Validation against the block's current field config:**
   - unknown field IDs → 400
   - required fields present and non-empty
   - email fields match email format
   - select answers must be one of the configured options
   - checkbox values coerced to boolean
   - length caps: 200 chars (text/email), 5000 (textarea)
5. Store submission (§4), return `{ success: true }`.

Visitor sees the configured `successMessage` in place of the form, with a "Submit another response" affordance. Validation failures show inline field errors; 429/500 show a generic retry message.

**Stale-form edge case:** if the owner edits the form while a visitor has it open, the visitor's submission validates against the *current* config and may 400; the visitor retries against the refreshed form. Acceptable for v1.

## 4. Storage model

```prisma
model FormSubmission {
  id             String   @id @default(cuid())
  pageId         String
  page           Page     @relation(fields: [pageId], references: [id], onDelete: Cascade)
  blockId        String   // plain string — deliberately NOT a FK
  answers        Json     // Record<fieldId, string | boolean>
  fieldsSnapshot Json     // block title + fields array at submission time
  visitorIp      String?
  createdAt      DateTime @default(now())

  @@index([blockId, createdAt])
  @@index([blockId, visitorIp, createdAt]) // rate-limit count query
  @@index([pageId])
}
```

Two deliberate choices:

- **`blockId` is not a foreign key.** Deleting a form block must not destroy collected responses — visitor data outlives the block. Orphaned submissions still appear in the dashboard under their snapshot title, marked "(deleted form)". Page deletion cascades (the page is the ownership boundary).
- **`fieldsSnapshot` per submission** lets the dashboard always render a response with the labels the visitor actually saw, even after the form is reshaped. A few hundred bytes of insurance against the nastiest edge case in form products.

Dev workflow note: schema applied with `prisma db push` (local DB is db-push managed — never `migrate dev`).

## 5. Dashboard — Responses

New route `/e/[slug]/responses`, in the nav alongside Analytics.

- Lists each form on the page (current form blocks **plus** orphaned submission groups by `blockId`), with response count and latest-response time.
- Selecting a form shows a table: one row per submission, columns from the **union of field labels across snapshots** (renamed/removed fields still show), plus submitted-at. Paginated 50/page, newest first.
- Per-row delete with confirm.
- **CSV export** of all responses for a form — generated client-side from a full fetch for v1 (volumes won't need a streaming endpoint).
- Empty states: no form blocks → pointer to add one in the editor; form with no responses → "No responses yet."

### Owner API (Fastify, auth required)

Ownership checked via page → organization on every call.

- `GET /forms/{blockId}/submissions?cursor=` — paginated, newest first
- `DELETE /forms/submissions/{id}`
- Non-owner access → 404 (not 403), matching not-revealing-existence convention.

## 6. Testing

Per existing setup: Vitest unit tests in `@trylinky/blocks`, DB-backed integration tests in `apps/api` (dotenvx).

- **Unit (blocks):** Yup schema — field count limits, label length, select option rules, defaults validity.
- **Integration (api):**
  - submit happy path → row stored with correct `answers` + `fieldsSnapshot`
  - honeypot → 200, nothing stored
  - rate limit → 429 on 6th submission within the hour
  - validation rejections: unknown field ID, missing required, invalid select option, oversize answer
  - unpublished page / nonexistent block / non-form block → 404
  - owner list: pagination, ordering; non-owner → 404
  - delete: owner succeeds, non-owner 404
  - orphaned-block submissions still listable for the page

## 7. Edge cases covered

- Multiple form blocks per page — each keyed by `blockId`, naturally isolated.
- Form edited after responses exist — snapshot rendering (§4), answers keyed by stable field `id` (§1).
- Block deleted — submissions survive as orphaned group (§4, §5).
- Stale form open in a visitor tab — validated against current config (§3).
- Bot submissions — honeypot silently discarded; bursts rate-limited (§3).
