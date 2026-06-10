# Form Block Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `form` block that page owners design in the editor, visitors submit responses to, and owners view/export in the dashboard's existing Forms tab.

**Architecture:** New block type wired through the standard three registries (blocks package union/config, frontend render/edit dispatch, picker). Visitor submissions are validated server-side against the block's current field config and stored as rows in a new Postgres `FormSubmission` model (answers keyed by stable field `id`, plus a `fieldsSnapshot` for historical rendering). A new Fastify `forms` module exposes one public submit endpoint (honeypot + per-IP rate limit) and three auth'd owner endpoints. The dashboard's existing `/e/[slug]/forms` "coming soon" placeholder is replaced with the real responses view.

**Tech Stack:** Next.js App Router + React 19, Fastify + TypeBox, Prisma/Postgres, Formik + Yup, SWR, Catalyst UI, Vitest.

**Spec:** `docs/superpowers/specs/2026-06-09-form-block-design.md`

**Spec deviation (deliberate):** the spec proposed a new `/e/[slug]/responses` route, but the codebase already has a `/e/[slug]/forms` route with a nav entry and a "Forms are coming soon" placeholder (`apps/frontend/app/components/SidebarForms.tsx`). We use the existing route instead of adding a parallel one.

**Conventions you must know (this repo):**
- Local dev DB is **`db push` managed** — never run `prisma migrate dev` (it will offer to wipe data).
- `.env.local` at the repo root is dotenvx-managed. Commands needing `DATABASE_URL` run through `dotenvx run -f ../../.env.local --` (dotenvx is a dependency of `apps/api`).
- `apps/api` uses the `@` → `src` path alias (tsconfig). Its vitest config does NOT have this alias yet — Task 4 adds it.
- API auth: `await request.server.authenticate(request, response)` returns a session or null; handlers check `session?.user` themselves (see `apps/api/src/modules/blocks/index.ts:82`).
- Non-owner access returns **404**, not 403.
- All `Block.data` is a JSON column; block data validation is Yup, run in `updateBlockData` (`apps/api/src/modules/blocks/service.ts:138`).

---

### Task 1: Prisma `FormSubmission` model

**Files:**
- Modify: `packages/prisma/prisma/schema.prisma`

- [ ] **Step 1: Add the model and the Page relation**

In `packages/prisma/prisma/schema.prisma`, add to the `Page` model's relation list (after `orchestrations Orchestration[]`, around line 170):

```prisma
  formSubmissions      FormSubmission[]
```

Then add the new model after the `Block` model (after line 196):

```prisma
model FormSubmission {
  id             String   @id @default(uuid())
  createdAt      DateTime @default(now())
  page           Page     @relation(fields: [pageId], references: [id], onDelete: Cascade)
  pageId         String
  // Deliberately NOT a relation: submissions must survive block deletion.
  // Orphaned submissions render in the dashboard via fieldsSnapshot.
  blockId        String
  answers        Json
  fieldsSnapshot Json
  visitorIp      String?

  @@index([blockId, createdAt])
  @@index([blockId, visitorIp, createdAt]) // rate-limit count query
  @@index([pageId])
}
```

- [ ] **Step 2: Push the schema to the dev DB (NOT migrate dev)**

Run (dotenvx lives in `apps/api`, so launch from there and hop to the prisma package with the env loaded):

```bash
cd apps/api && pnpm exec dotenvx run -f ../../.env.local -- bash -c 'cd ../../packages/prisma && pnpm exec prisma db push'
```

Expected: `Your database is now in sync with your Prisma schema.` (db push also regenerates the client). If `prisma generate` does not run automatically, run `cd packages/prisma && pnpm prisma:generate`.

- [ ] **Step 3: Verify the client knows the model**

```bash
cd packages/prisma && pnpm typecheck
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/prisma/prisma/schema.prisma
git commit -m "feat: add FormSubmission model for form block responses"
```

---

### Task 2: `form` block config + schema tests (blocks package)

**Files:**
- Create: `packages/blocks/src/blocks/form/config.ts`
- Create: `packages/blocks/src/blocks/form/config.test.ts`
- Create: `packages/blocks/vitest.config.ts`
- Modify: `packages/blocks/package.json` (add vitest + test script)

Note: this task does NOT touch the `Blocks` union or the `blocks` registry yet — those flips break every frontend `Record<Blocks, …>` map, so they happen in Task 6 together with the frontend wiring. Until then `form/config.ts` is a standalone, exported-nowhere module, and every task still compiles.

- [ ] **Step 1: Write the config**

Create `packages/blocks/src/blocks/form/config.ts`:

```ts
import * as Yup from 'yup';

export const formFieldTypes = [
  'text',
  'email',
  'textarea',
  'select',
  'checkbox',
] as const;

export type FormFieldType = (typeof formFieldTypes)[number];

export interface FormBlockField {
  // Stable across edits — submitted answers are keyed by this id, so
  // relabeling a field never orphans previously collected answers.
  id: string;
  type: FormFieldType;
  label: string;
  required: boolean;
  placeholder?: string;
  // select only
  options?: string[];
}

export interface FormBlockConfig {
  title?: string;
  submitLabel: string;
  successMessage: string;
  fields: FormBlockField[];
}

export const MAX_FORM_FIELDS = 10;

export const formBlockDefaults: FormBlockConfig = {
  title: 'Contact me',
  submitLabel: 'Submit',
  successMessage: 'Thanks — your response was sent.',
  fields: [
    { id: 'field-name', type: 'text', label: 'Name', required: false },
    { id: 'field-email', type: 'email', label: 'Email', required: true },
    { id: 'field-message', type: 'textarea', label: 'Message', required: true },
  ],
};

export const FormBlockSchema = Yup.object().shape({
  title: Yup.string().max(100, 'Titles can be at most 100 characters').notRequired(),
  submitLabel: Yup.string()
    .max(40, 'Button labels can be at most 40 characters')
    .required('A submit button label is required'),
  successMessage: Yup.string()
    .max(300, 'Success messages can be at most 300 characters')
    .required('A success message is required'),
  fields: Yup.array()
    .of(
      Yup.object().shape({
        id: Yup.string().max(64).required(),
        type: Yup.string()
          .oneOf([...formFieldTypes])
          .required(),
        label: Yup.string()
          .max(100, 'Field labels can be at most 100 characters')
          .required('Every field needs a label'),
        required: Yup.boolean().required(),
        placeholder: Yup.string()
          .max(100, 'Placeholders can be at most 100 characters')
          .notRequired(),
        options: Yup.array()
          .of(Yup.string().max(100).required())
          .when('type', {
            is: 'select',
            then: (schema) =>
              schema
                .min(2, 'Select fields need at least 2 options')
                .max(20, 'Select fields can have at most 20 options')
                .required('Select fields need options'),
            otherwise: (schema) => schema.notRequired(),
          }),
      })
    )
    .min(1, 'Forms need at least one field')
    .max(MAX_FORM_FIELDS, `Forms can have at most ${MAX_FORM_FIELDS} fields`)
    .test('unique-ids', 'Field ids must be unique', (fields) => {
      if (!fields) return true;
      const ids = fields.map((field) => field.id);
      return new Set(ids).size === ids.length;
    })
    .required(),
});
```

- [ ] **Step 2: Scaffold vitest in `packages/blocks`**

The blocks package has no test runner on main (the richer setup lives on `feat/page-schema-foundation` — keep this minimal to limit merge conflicts).

```bash
pnpm --filter @trylinky/blocks add -D vitest
```

Create `packages/blocks/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

Add to `packages/blocks/package.json` scripts (next to `"typecheck"`):

```json
    "test": "vitest run",
```

- [ ] **Step 3: Write the failing schema tests**

Create `packages/blocks/src/blocks/form/config.test.ts`:

```ts
import { FormBlockSchema, formBlockDefaults } from './config';
import { describe, expect, it } from 'vitest';

const validField = {
  id: 'f-1',
  type: 'text',
  label: 'Name',
  required: false,
};

const validConfig = {
  title: 'Contact',
  submitLabel: 'Send',
  successMessage: 'Thanks!',
  fields: [validField],
};

describe('FormBlockSchema', () => {
  it('accepts the block defaults', async () => {
    await expect(
      FormBlockSchema.validate(formBlockDefaults, { strict: true })
    ).resolves.toBeTruthy();
  });

  it('accepts a minimal valid config', async () => {
    await expect(
      FormBlockSchema.validate(validConfig, { strict: true })
    ).resolves.toBeTruthy();
  });

  it('rejects an empty field list', async () => {
    await expect(
      FormBlockSchema.validate({ ...validConfig, fields: [] }, { strict: true })
    ).rejects.toThrow('at least one field');
  });

  it('rejects more than 10 fields', async () => {
    const fields = Array.from({ length: 11 }, (_, i) => ({
      ...validField,
      id: `f-${i}`,
    }));
    await expect(
      FormBlockSchema.validate({ ...validConfig, fields }, { strict: true })
    ).rejects.toThrow('at most 10 fields');
  });

  it('rejects duplicate field ids', async () => {
    const fields = [validField, { ...validField, label: 'Other' }];
    await expect(
      FormBlockSchema.validate({ ...validConfig, fields }, { strict: true })
    ).rejects.toThrow('unique');
  });

  it('rejects a field without a label', async () => {
    const fields = [{ ...validField, label: '' }];
    await expect(
      FormBlockSchema.validate({ ...validConfig, fields }, { strict: true })
    ).rejects.toThrow('needs a label');
  });

  it('rejects an unknown field type', async () => {
    const fields = [{ ...validField, type: 'file' }];
    await expect(
      FormBlockSchema.validate({ ...validConfig, fields }, { strict: true })
    ).rejects.toThrow();
  });

  it('rejects a select field with fewer than 2 options', async () => {
    const fields = [
      { ...validField, type: 'select', options: ['Only one'] },
    ];
    await expect(
      FormBlockSchema.validate({ ...validConfig, fields }, { strict: true })
    ).rejects.toThrow('at least 2 options');
  });

  it('accepts a select field with valid options', async () => {
    const fields = [
      { ...validField, type: 'select', options: ['Support', 'Sales'] },
    ];
    await expect(
      FormBlockSchema.validate({ ...validConfig, fields }, { strict: true })
    ).resolves.toBeTruthy();
  });

  it('allows a non-select field to omit options', async () => {
    await expect(
      FormBlockSchema.validate(
        { ...validConfig, fields: [{ ...validField, type: 'textarea' }] },
        { strict: true }
      )
    ).resolves.toBeTruthy();
  });

  it('rejects a missing submit label', async () => {
    await expect(
      FormBlockSchema.validate(
        { ...validConfig, submitLabel: undefined },
        { strict: true }
      )
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 4: Run the tests**

```bash
cd packages/blocks && pnpm test
```

Expected: PASS (the config and tests land together; if any case fails, fix the schema — the tests encode the spec's limits).

- [ ] **Step 5: Typecheck**

```bash
cd packages/blocks && pnpm typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/blocks
git commit -m "feat: add form block config, schema and tests"
```

---

### Task 3: `validateAnswers` — pure server-side answer validation (TDD)

**Files:**
- Create: `apps/api/src/modules/forms/validate-answers.ts`
- Create: `apps/api/src/modules/forms/validate-answers.test.ts`

This is a pure function (no DB, no env) so it gets exhaustive unit tests. It validates a visitor's submitted answers against the block's **current** field config and returns sanitized answers.

Note: it imports `FormBlockField` from the *file path* `@trylinky/blocks/src/blocks/form/config` — no. It must import from `@trylinky/blocks` package root, which doesn't export form config until Task 6. To keep every task compiling, import the type from the package source via a relative-package path is wrong too. **Resolution:** add the export line to `packages/blocks/src/index.ts` NOW (it's additive and breaks nothing — only the union flip is deferred):

- [ ] **Step 1: Export the form config from the blocks package**

In `packages/blocks/src/index.ts`, add after `export * from './blocks/content/config';` (alphabetical position, line ~3):

```ts
export * from './blocks/form/config';
```

Run `cd packages/blocks && pnpm typecheck` — expected PASS (the export is additive; the `Blocks` union is untouched).

- [ ] **Step 2: Write the failing tests**

Create `apps/api/src/modules/forms/validate-answers.test.ts`:

```ts
import { validateAnswers } from './validate-answers';
import { FormBlockField } from '@trylinky/blocks';
import { describe, expect, it } from 'vitest';

const fields: FormBlockField[] = [
  { id: 'f-name', type: 'text', label: 'Name', required: false },
  { id: 'f-email', type: 'email', label: 'Email', required: true },
  { id: 'f-message', type: 'textarea', label: 'Message', required: false },
  {
    id: 'f-topic',
    type: 'select',
    label: 'Topic',
    required: false,
    options: ['Support', 'Sales'],
  },
  { id: 'f-consent', type: 'checkbox', label: 'Consent', required: false },
];

describe('validateAnswers', () => {
  it('accepts a valid submission and returns sanitized answers', () => {
    const result = validateAnswers(fields, {
      'f-name': '  Alex  ',
      'f-email': 'alex@example.com',
      'f-topic': 'Support',
      'f-consent': true,
    });

    expect(result).toEqual({
      ok: true,
      answers: {
        'f-name': 'Alex',
        'f-email': 'alex@example.com',
        'f-topic': 'Support',
        'f-consent': true,
      },
    });
  });

  it('rejects non-object payloads', () => {
    expect(validateAnswers(fields, 'nope').ok).toBe(false);
    expect(validateAnswers(fields, null).ok).toBe(false);
    expect(validateAnswers(fields, ['a']).ok).toBe(false);
  });

  it('rejects unknown field ids', () => {
    const result = validateAnswers(fields, {
      'f-email': 'alex@example.com',
      'f-evil': 'payload',
    });
    expect(result.ok).toBe(false);
  });

  it('rejects when a required field is missing', () => {
    const result = validateAnswers(fields, { 'f-name': 'Alex' });
    expect(result).toMatchObject({
      ok: false,
      errors: { 'f-email': expect.stringContaining('required') },
    });
  });

  it('rejects when a required field is whitespace only', () => {
    const result = validateAnswers(fields, { 'f-email': '   ' });
    expect(result.ok).toBe(false);
  });

  it('rejects an invalid email', () => {
    const result = validateAnswers(fields, { 'f-email': 'not-an-email' });
    expect(result).toMatchObject({
      ok: false,
      errors: { 'f-email': expect.stringContaining('valid email') },
    });
  });

  it('rejects a select answer not in the configured options', () => {
    const result = validateAnswers(fields, {
      'f-email': 'alex@example.com',
      'f-topic': 'Gossip',
    });
    expect(result.ok).toBe(false);
  });

  it('rejects oversize answers', () => {
    const result = validateAnswers(fields, {
      'f-email': 'alex@example.com',
      'f-name': 'x'.repeat(201),
    });
    expect(result.ok).toBe(false);
  });

  it('allows textarea answers up to 5000 chars but not beyond', () => {
    const ok = validateAnswers(fields, {
      'f-email': 'alex@example.com',
      'f-message': 'x'.repeat(5000),
    });
    expect(ok.ok).toBe(true);

    const tooLong = validateAnswers(fields, {
      'f-email': 'alex@example.com',
      'f-message': 'x'.repeat(5001),
    });
    expect(tooLong.ok).toBe(false);
  });

  it('coerces checkbox values: only literal true counts as checked', () => {
    const result = validateAnswers(fields, {
      'f-email': 'alex@example.com',
      'f-consent': 'true',
    });
    // 'true' (string) is not a boolean — checkbox answers must be booleans
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.answers['f-consent']).toBe(false);
    }
  });

  it('fails a required checkbox that is not checked', () => {
    const requiredConsent: FormBlockField[] = [
      { id: 'f-consent', type: 'checkbox', label: 'Consent', required: true },
    ];
    expect(validateAnswers(requiredConsent, {}).ok).toBe(false);
    expect(validateAnswers(requiredConsent, { 'f-consent': true }).ok).toBe(true);
  });

  it('rejects non-string values for text fields', () => {
    const result = validateAnswers(fields, {
      'f-email': 'alex@example.com',
      'f-name': 42,
    });
    expect(result.ok).toBe(false);
  });

  it('omits empty optional answers from the result', () => {
    const result = validateAnswers(fields, {
      'f-email': 'alex@example.com',
      'f-name': '',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect('f-name' in result.answers).toBe(false);
    }
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
cd apps/api && pnpm vitest run src/modules/forms/validate-answers.test.ts
```

Expected: FAIL — `Cannot find module './validate-answers'`. (No DB/env needed; this file is pure.)

- [ ] **Step 4: Write the implementation**

Create `apps/api/src/modules/forms/validate-answers.ts`:

```ts
import { FormBlockField } from '@trylinky/blocks';

const MAX_TEXT_LENGTH = 200;
const MAX_TEXTAREA_LENGTH = 5000;
// Deliberately simple: server-side sanity check, not RFC 5322.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ValidationResult =
  | { ok: true; answers: Record<string, string | boolean> }
  | { ok: false; errors: Record<string, string> };

export function validateAnswers(
  fields: FormBlockField[],
  rawAnswers: unknown
): ValidationResult {
  if (
    typeof rawAnswers !== 'object' ||
    rawAnswers === null ||
    Array.isArray(rawAnswers)
  ) {
    return { ok: false, errors: { _form: 'Invalid submission' } };
  }

  const raw = rawAnswers as Record<string, unknown>;
  const fieldIds = new Set(fields.map((field) => field.id));

  for (const key of Object.keys(raw)) {
    if (!fieldIds.has(key)) {
      return { ok: false, errors: { _form: 'Unknown field in submission' } };
    }
  }

  const errors: Record<string, string> = {};
  const answers: Record<string, string | boolean> = {};

  for (const field of fields) {
    const value = raw[field.id];

    if (field.type === 'checkbox') {
      const checked = value === true;
      if (field.required && !checked) {
        errors[field.id] = `${field.label} is required`;
        continue;
      }
      answers[field.id] = checked;
      continue;
    }

    if (value === undefined || value === null || value === '') {
      if (field.required) {
        errors[field.id] = `${field.label} is required`;
      }
      continue;
    }

    if (typeof value !== 'string') {
      errors[field.id] = `${field.label} has an invalid value`;
      continue;
    }

    const trimmed = value.trim();

    if (trimmed.length === 0) {
      if (field.required) {
        errors[field.id] = `${field.label} is required`;
      }
      continue;
    }

    const maxLength =
      field.type === 'textarea' ? MAX_TEXTAREA_LENGTH : MAX_TEXT_LENGTH;
    if (trimmed.length > maxLength) {
      errors[field.id] = `${field.label} is too long`;
      continue;
    }

    if (field.type === 'email' && !EMAIL_REGEX.test(trimmed)) {
      errors[field.id] = `${field.label} must be a valid email address`;
      continue;
    }

    if (field.type === 'select' && !(field.options ?? []).includes(trimmed)) {
      errors[field.id] = `${field.label} has an invalid option`;
      continue;
    }

    answers[field.id] = trimmed;
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, answers };
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd apps/api && pnpm vitest run src/modules/forms/validate-answers.test.ts
```

Expected: PASS (14 tests).

- [ ] **Step 6: Commit**

```bash
git add packages/blocks/src/index.ts apps/api/src/modules/forms
git commit -m "feat: add form answer validation with unit tests"
```

---

### Task 4: Forms service + DB-backed integration tests

**Files:**
- Create: `apps/api/src/modules/forms/service.ts`
- Create: `apps/api/src/modules/forms/service.test.ts`
- Modify: `apps/api/vitest.config.ts`

- [ ] **Step 1: Update the api vitest config (alias + serial files)**

The service imports `@/lib/prisma`; vitest needs the `@` alias. DB-backed tests must not interleave, so disable file parallelism. Replace `apps/api/vitest.config.ts` with:

```ts
import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Integration tests share the dev database; keep files serial.
    fileParallelism: false,
  },
});
```

(Heads-up from project memory: `feat/page-schema-foundation` carries a similar richer config — expect a merge conflict here and prefer whichever is a superset.)

- [ ] **Step 2: Write the service**

Create `apps/api/src/modules/forms/service.ts`:

```ts
import prisma from '@/lib/prisma';
import { validateAnswers } from './validate-answers';
import { FormBlockConfig } from '@trylinky/blocks';

const RATE_LIMIT_MAX_PER_HOUR = 5;
const DEFAULT_PAGE_SIZE = 50;

export type SubmitResult =
  | { status: 'ok' }
  | { status: 'not-found' }
  | { status: 'rate-limited' }
  | { status: 'invalid'; errors: Record<string, string> };

export async function submitFormResponse({
  blockId,
  answers,
  honeypot,
  ipAddress,
}: {
  blockId: string;
  answers: unknown;
  honeypot: string;
  ipAddress: string;
}): Promise<SubmitResult> {
  const block = await prisma.block.findUnique({
    where: { id: blockId },
    select: {
      id: true,
      type: true,
      data: true,
      pageId: true,
      page: {
        select: {
          publishedAt: true,
          deletedAt: true,
        },
      },
    },
  });

  if (
    !block ||
    block.type !== 'form' ||
    !block.page.publishedAt ||
    block.page.deletedAt
  ) {
    return { status: 'not-found' };
  }

  // Honeypot tripped: pretend success, store nothing — bots get no signal.
  if (honeypot.length > 0) {
    return { status: 'ok' };
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentCount = await prisma.formSubmission.count({
    where: {
      blockId,
      visitorIp: ipAddress,
      createdAt: { gt: oneHourAgo },
    },
  });

  if (recentCount >= RATE_LIMIT_MAX_PER_HOUR) {
    return { status: 'rate-limited' };
  }

  const config = block.data as unknown as FormBlockConfig;
  const result = validateAnswers(config.fields ?? [], answers);

  if (!result.ok) {
    return { status: 'invalid', errors: result.errors };
  }

  await prisma.formSubmission.create({
    data: {
      pageId: block.pageId,
      blockId: block.id,
      answers: result.answers,
      fieldsSnapshot: {
        title: config.title ?? null,
        fields: config.fields,
      },
      visitorIp: ipAddress,
    },
  });

  return { status: 'ok' };
}

export async function checkUserHasAccessToPage(
  pageId: string,
  userId: string
) {
  const count = await prisma.page.count({
    where: {
      id: pageId,
      organization: {
        members: {
          some: {
            userId,
          },
        },
      },
    },
  });

  return count > 0;
}

export interface FormGroup {
  blockId: string;
  title: string;
  isDeleted: boolean;
  submissionCount: number;
  latestSubmissionAt: Date | null;
}

export async function getFormGroupsForPage(
  pageId: string
): Promise<FormGroup[]> {
  const [formBlocks, submissionGroups] = await Promise.all([
    prisma.block.findMany({
      where: { pageId, type: 'form' },
      select: { id: true, data: true },
    }),
    prisma.formSubmission.groupBy({
      by: ['blockId'],
      where: { pageId },
      _count: { _all: true },
      _max: { createdAt: true },
    }),
  ]);

  const countsByBlockId = new Map(
    submissionGroups.map((group) => [group.blockId, group])
  );

  const groups: FormGroup[] = formBlocks.map((block) => {
    const data = block.data as unknown as FormBlockConfig;
    const counts = countsByBlockId.get(block.id);
    countsByBlockId.delete(block.id);

    return {
      blockId: block.id,
      title: data.title || 'Untitled form',
      isDeleted: false,
      submissionCount: counts?._count._all ?? 0,
      latestSubmissionAt: counts?._max.createdAt ?? null,
    };
  });

  // Whatever remains belongs to deleted form blocks; title comes from the
  // latest submission's snapshot so collected data stays reachable.
  for (const [blockId, counts] of countsByBlockId) {
    const latest = await prisma.formSubmission.findFirst({
      where: { blockId },
      orderBy: { createdAt: 'desc' },
      select: { fieldsSnapshot: true },
    });

    const snapshot = latest?.fieldsSnapshot as { title?: string | null } | null;

    groups.push({
      blockId,
      title: snapshot?.title || 'Untitled form',
      isDeleted: true,
      submissionCount: counts._count._all,
      latestSubmissionAt: counts._max.createdAt,
    });
  }

  return groups;
}

export async function listSubmissions(
  pageId: string,
  blockId: string,
  cursor?: string,
  pageSize: number = DEFAULT_PAGE_SIZE
) {
  const submissions = await prisma.formSubmission.findMany({
    where: { pageId, blockId },
    orderBy: { createdAt: 'desc' },
    take: pageSize + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = submissions.length > pageSize;
  const pageOfSubmissions = hasMore
    ? submissions.slice(0, pageSize)
    : submissions;

  return {
    submissions: pageOfSubmissions,
    nextCursor: hasMore
      ? pageOfSubmissions[pageOfSubmissions.length - 1].id
      : null,
  };
}

export async function deleteSubmissionById(
  submissionId: string,
  userId: string
) {
  const submission = await prisma.formSubmission.findUnique({
    where: { id: submissionId },
    select: {
      id: true,
      page: {
        select: {
          organization: {
            select: {
              members: {
                where: { userId },
                select: { id: true },
              },
            },
          },
        },
      },
    },
  });

  if (!submission || !submission.page.organization?.members.length) {
    return false;
  }

  await prisma.formSubmission.delete({ where: { id: submissionId } });

  return true;
}
```

- [ ] **Step 3: Write the integration tests**

These hit the real dev DB (per project convention): create a throwaway user/org/page/block in `beforeAll`, clean up everything in `afterAll`.

Create `apps/api/src/modules/forms/service.test.ts`:

```ts
import prisma from '@/lib/prisma';
import {
  checkUserHasAccessToPage,
  deleteSubmissionById,
  getFormGroupsForPage,
  listSubmissions,
  submitFormResponse,
} from './service';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const suffix = randomUUID().slice(0, 8);
const IP = '198.51.100.7';

const testFormConfig = {
  title: 'Contact me',
  submitLabel: 'Submit',
  successMessage: 'Thanks!',
  fields: [
    { id: 'f-name', type: 'text', label: 'Name', required: false },
    { id: 'f-email', type: 'email', label: 'Email', required: true },
    {
      id: 'f-topic',
      type: 'select',
      label: 'Topic',
      required: false,
      options: ['Support', 'Sales'],
    },
  ],
};

let userId: string;
let otherUserId: string;
let organizationId: string;
let pageId: string;
let unpublishedPageId: string;
let blockId: string;
let unpublishedBlockId: string;
let nonFormBlockId: string;

beforeAll(async () => {
  const user = await prisma.user.create({
    data: { email: `form-test-${suffix}@example.com` },
  });
  userId = user.id;

  const otherUser = await prisma.user.create({
    data: { email: `form-test-other-${suffix}@example.com` },
  });
  otherUserId = otherUser.id;

  const organization = await prisma.organization.create({
    data: {
      name: 'Form Test Org',
      slug: `form-test-org-${suffix}`,
      members: { create: { userId, role: 'owner' } },
    },
  });
  organizationId = organization.id;

  const page = await prisma.page.create({
    data: {
      slug: `form-test-page-${suffix}`,
      config: [],
      publishedAt: new Date(),
      organizationId,
    },
  });
  pageId = page.id;

  const unpublishedPage = await prisma.page.create({
    data: {
      slug: `form-test-unpub-${suffix}`,
      config: [],
      organizationId,
    },
  });
  unpublishedPageId = unpublishedPage.id;

  const block = await prisma.block.create({
    data: { type: 'form', config: {}, data: testFormConfig, pageId },
  });
  blockId = block.id;

  const unpublishedBlock = await prisma.block.create({
    data: {
      type: 'form',
      config: {},
      data: testFormConfig,
      pageId: unpublishedPageId,
    },
  });
  unpublishedBlockId = unpublishedBlock.id;

  const nonFormBlock = await prisma.block.create({
    data: { type: 'content', config: {}, data: {}, pageId },
  });
  nonFormBlockId = nonFormBlock.id;
});

afterAll(async () => {
  await prisma.formSubmission.deleteMany({
    where: { pageId: { in: [pageId, unpublishedPageId] } },
  });
  await prisma.block.deleteMany({
    where: { pageId: { in: [pageId, unpublishedPageId] } },
  });
  await prisma.page.deleteMany({
    where: { id: { in: [pageId, unpublishedPageId] } },
  });
  await prisma.member.deleteMany({ where: { organizationId } });
  await prisma.organization.delete({ where: { id: organizationId } });
  await prisma.user.deleteMany({
    where: { id: { in: [userId, otherUserId] } },
  });
});

describe('submitFormResponse', () => {
  it('stores a valid submission with answers and a fields snapshot', async () => {
    const result = await submitFormResponse({
      blockId,
      answers: { 'f-email': 'visitor@example.com', 'f-topic': 'Support' },
      honeypot: '',
      ipAddress: IP,
    });

    expect(result).toEqual({ status: 'ok' });

    const stored = await prisma.formSubmission.findFirst({
      where: { blockId },
      orderBy: { createdAt: 'desc' },
    });

    expect(stored).toBeTruthy();
    expect(stored?.pageId).toBe(pageId);
    expect(stored?.visitorIp).toBe(IP);
    expect(stored?.answers).toEqual({
      'f-email': 'visitor@example.com',
      'f-topic': 'Support',
    });
    expect(stored?.fieldsSnapshot).toMatchObject({
      title: 'Contact me',
      fields: testFormConfig.fields,
    });
  });

  it('returns ok for honeypot submissions but stores nothing', async () => {
    const before = await prisma.formSubmission.count({ where: { blockId } });

    const result = await submitFormResponse({
      blockId,
      answers: { 'f-email': 'bot@example.com' },
      honeypot: 'http://spam.example',
      ipAddress: IP,
    });

    expect(result).toEqual({ status: 'ok' });

    const after = await prisma.formSubmission.count({ where: { blockId } });
    expect(after).toBe(before);
  });

  it('rejects invalid answers', async () => {
    const missingRequired = await submitFormResponse({
      blockId,
      answers: { 'f-name': 'No email' },
      honeypot: '',
      ipAddress: IP,
    });
    expect(missingRequired.status).toBe('invalid');

    const badOption = await submitFormResponse({
      blockId,
      answers: { 'f-email': 'a@b.co', 'f-topic': 'Gossip' },
      honeypot: '',
      ipAddress: IP,
    });
    expect(badOption.status).toBe('invalid');

    const unknownField = await submitFormResponse({
      blockId,
      answers: { 'f-email': 'a@b.co', 'f-evil': 'x' },
      honeypot: '',
      ipAddress: IP,
    });
    expect(unknownField.status).toBe('invalid');
  });

  it('rate limits the 6th submission from one IP within an hour', async () => {
    // Use a dedicated block so submissions from other tests don't count.
    const rateLimitBlock = await prisma.block.create({
      data: { type: 'form', config: {}, data: testFormConfig, pageId },
    });
    const rateLimitIp = '203.0.113.9';

    for (let i = 0; i < 5; i++) {
      const result = await submitFormResponse({
        blockId: rateLimitBlock.id,
        answers: { 'f-email': `v${i}@example.com` },
        honeypot: '',
        ipAddress: rateLimitIp,
      });
      expect(result.status).toBe('ok');
    }

    const sixth = await submitFormResponse({
      blockId: rateLimitBlock.id,
      answers: { 'f-email': 'v6@example.com' },
      honeypot: '',
      ipAddress: rateLimitIp,
    });
    expect(sixth.status).toBe('rate-limited');

    // A different visitor is unaffected.
    const otherVisitor = await submitFormResponse({
      blockId: rateLimitBlock.id,
      answers: { 'f-email': 'v7@example.com' },
      honeypot: '',
      ipAddress: '203.0.113.10',
    });
    expect(otherVisitor.status).toBe('ok');
  });

  it('returns not-found for unpublished pages, missing and non-form blocks', async () => {
    const unpublished = await submitFormResponse({
      blockId: unpublishedBlockId,
      answers: { 'f-email': 'a@b.co' },
      honeypot: '',
      ipAddress: IP,
    });
    expect(unpublished.status).toBe('not-found');

    const missing = await submitFormResponse({
      blockId: randomUUID(),
      answers: { 'f-email': 'a@b.co' },
      honeypot: '',
      ipAddress: IP,
    });
    expect(missing.status).toBe('not-found');

    const nonForm = await submitFormResponse({
      blockId: nonFormBlockId,
      answers: { 'f-email': 'a@b.co' },
      honeypot: '',
      ipAddress: IP,
    });
    expect(nonForm.status).toBe('not-found');
  });
});

describe('checkUserHasAccessToPage', () => {
  it('allows org members and rejects everyone else', async () => {
    expect(await checkUserHasAccessToPage(pageId, userId)).toBe(true);
    expect(await checkUserHasAccessToPage(pageId, otherUserId)).toBe(false);
  });
});

describe('getFormGroupsForPage', () => {
  it('lists live form blocks and orphaned submission groups', async () => {
    // Create a form block, give it a submission, then delete the block.
    const doomedBlock = await prisma.block.create({
      data: {
        type: 'form',
        config: {},
        data: { ...testFormConfig, title: 'Doomed form' },
        pageId,
      },
    });

    const submit = await submitFormResponse({
      blockId: doomedBlock.id,
      answers: { 'f-email': 'keep@example.com' },
      honeypot: '',
      ipAddress: '203.0.113.55',
    });
    expect(submit.status).toBe('ok');

    await prisma.block.delete({ where: { id: doomedBlock.id } });

    const groups = await getFormGroupsForPage(pageId);

    const liveGroup = groups.find((group) => group.blockId === blockId);
    expect(liveGroup).toMatchObject({
      title: 'Contact me',
      isDeleted: false,
    });
    expect(liveGroup!.submissionCount).toBeGreaterThanOrEqual(1);

    const orphanGroup = groups.find(
      (group) => group.blockId === doomedBlock.id
    );
    expect(orphanGroup).toMatchObject({
      title: 'Doomed form',
      isDeleted: true,
      submissionCount: 1,
    });
  });
});

describe('listSubmissions', () => {
  it('returns newest-first pages with a working cursor', async () => {
    const paginationBlock = await prisma.block.create({
      data: { type: 'form', config: {}, data: testFormConfig, pageId },
    });

    // Insert directly so we control timestamps deterministically.
    const base = Date.now();
    for (let i = 0; i < 3; i++) {
      await prisma.formSubmission.create({
        data: {
          pageId,
          blockId: paginationBlock.id,
          answers: { 'f-email': `p${i}@example.com` },
          fieldsSnapshot: { title: 'Contact me', fields: testFormConfig.fields },
          visitorIp: IP,
          createdAt: new Date(base - i * 1000),
        },
      });
    }

    const firstPage = await listSubmissions(
      pageId,
      paginationBlock.id,
      undefined,
      2
    );
    expect(firstPage.submissions).toHaveLength(2);
    expect(firstPage.nextCursor).toBeTruthy();
    expect(firstPage.submissions[0].answers).toMatchObject({
      'f-email': 'p0@example.com',
    });

    const secondPage = await listSubmissions(
      pageId,
      paginationBlock.id,
      firstPage.nextCursor!,
      2
    );
    expect(secondPage.submissions).toHaveLength(1);
    expect(secondPage.nextCursor).toBeNull();
    expect(secondPage.submissions[0].answers).toMatchObject({
      'f-email': 'p2@example.com',
    });
  });
});

describe('deleteSubmissionById', () => {
  it('lets the owner delete and blocks other users', async () => {
    const submission = await prisma.formSubmission.create({
      data: {
        pageId,
        blockId,
        answers: { 'f-email': 'delete-me@example.com' },
        fieldsSnapshot: { title: 'Contact me', fields: testFormConfig.fields },
        visitorIp: IP,
      },
    });

    expect(await deleteSubmissionById(submission.id, otherUserId)).toBe(false);
    expect(
      await prisma.formSubmission.findUnique({ where: { id: submission.id } })
    ).toBeTruthy();

    expect(await deleteSubmissionById(submission.id, userId)).toBe(true);
    expect(
      await prisma.formSubmission.findUnique({ where: { id: submission.id } })
    ).toBeNull();
  });
});
```

- [ ] **Step 4: Run the integration tests (DB env via dotenvx)**

```bash
cd apps/api && pnpm exec dotenvx run -f ../../.env.local -- pnpm vitest run src/modules/forms/service.test.ts
```

Expected: PASS (9 tests). Also re-run the whole api suite to confirm nothing else broke:

```bash
cd apps/api && pnpm exec dotenvx run -f ../../.env.local -- pnpm test
```

Expected: PASS.

- [ ] **Step 5: Typecheck**

```bash
cd apps/api && pnpm typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/api/vitest.config.ts apps/api/src/modules/forms
git commit -m "feat: add form submission service with integration tests"
```

---

### Task 5: Forms API routes

**Files:**
- Create: `apps/api/src/modules/forms/index.ts`
- Modify: `apps/api/src/index.ts`

- [ ] **Step 1: Write the routes**

Create `apps/api/src/modules/forms/index.ts`:

```ts
'use strict';

import { getIpAddress } from '@/modules/analytics/utils';
import {
  checkUserHasAccessToPage,
  deleteSubmissionById,
  getFormGroupsForPage,
  listSubmissions,
  submitFormResponse,
} from './service';
import { Type } from '@fastify/type-provider-typebox';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

const postSubmissionSchema = {
  body: Type.Object({
    answers: Type.Record(
      Type.String(),
      Type.Union([Type.String(), Type.Boolean()])
    ),
    website: Type.Optional(Type.String()),
  }),
};

export default async function formsRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/:blockId/submissions',
    { schema: postSubmissionSchema },
    postSubmissionHandler
  );
  fastify.get('/page/:pageId', getFormGroupsHandler);
  fastify.get('/page/:pageId/submissions', listSubmissionsHandler);
  fastify.delete('/submissions/:submissionId', deleteSubmissionHandler);
}

// Public endpoint: visitors submit form responses. No auth — the service
// gates on published page + honeypot + per-IP rate limit.
async function postSubmissionHandler(
  request: FastifyRequest<{
    Params: { blockId: string };
    Body: { answers: Record<string, string | boolean>; website?: string };
  }>,
  response: FastifyReply
) {
  const { blockId } = request.params;
  const { answers, website } = request.body;

  const ipAddress = getIpAddress(request);

  const result = await submitFormResponse({
    blockId,
    answers,
    honeypot: website ?? '',
    ipAddress,
  });

  switch (result.status) {
    case 'ok':
      return response.status(200).send({ success: true });
    case 'not-found':
      return response
        .status(404)
        .send({ error: { message: 'Form not found' } });
    case 'rate-limited':
      return response.status(429).send({
        error: { message: 'Too many submissions. Please try again later.' },
      });
    case 'invalid':
      return response.status(400).send({
        error: { message: 'Validation failed', fields: result.errors },
      });
  }
}

async function getFormGroupsHandler(
  request: FastifyRequest<{ Params: { pageId: string } }>,
  response: FastifyReply
) {
  const session = await request.server.authenticate(request, response);

  if (!session?.user) {
    return response.status(401).send({ error: { message: 'Unauthorized' } });
  }

  const { pageId } = request.params;

  const hasAccess = await checkUserHasAccessToPage(pageId, session.user.id);
  if (!hasAccess) {
    return response.status(404).send({ error: { message: 'Page not found' } });
  }

  const groups = await getFormGroupsForPage(pageId);

  return response.status(200).send({ groups });
}

async function listSubmissionsHandler(
  request: FastifyRequest<{
    Params: { pageId: string };
    Querystring: { blockId?: string; cursor?: string };
  }>,
  response: FastifyReply
) {
  const session = await request.server.authenticate(request, response);

  if (!session?.user) {
    return response.status(401).send({ error: { message: 'Unauthorized' } });
  }

  const { pageId } = request.params;
  const { blockId, cursor } = request.query;

  if (!blockId) {
    return response
      .status(400)
      .send({ error: { message: 'blockId is required' } });
  }

  const hasAccess = await checkUserHasAccessToPage(pageId, session.user.id);
  if (!hasAccess) {
    return response.status(404).send({ error: { message: 'Page not found' } });
  }

  const result = await listSubmissions(pageId, blockId, cursor);

  return response.status(200).send(result);
}

async function deleteSubmissionHandler(
  request: FastifyRequest<{ Params: { submissionId: string } }>,
  response: FastifyReply
) {
  const session = await request.server.authenticate(request, response);

  if (!session?.user) {
    return response.status(401).send({ error: { message: 'Unauthorized' } });
  }

  const deleted = await deleteSubmissionById(
    request.params.submissionId,
    session.user.id
  );

  if (!deleted) {
    return response
      .status(404)
      .send({ error: { message: 'Submission not found' } });
  }

  return response.status(200).send({ success: true });
}
```

- [ ] **Step 2: Register the module**

In `apps/api/src/index.ts`, add the import next to the other module imports (alphabetical with the `@/modules/*` group, line ~15):

```ts
import formsRoutes from '@/modules/forms';
```

And register it next to the other registrations (after the `/flags` line, ~line 74):

```ts
fastify.register(formsRoutes, { prefix: '/forms' });
```

- [ ] **Step 3: Typecheck and smoke-test the route**

```bash
cd apps/api && pnpm typecheck
```

Expected: PASS.

Start the API and hit the public endpoint (replace `BLOCK_ID` with any form block id from Task 4's test run, or create one through the editor later — a 404 for a bogus id is the expected smoke result here):

```bash
cd apps/api && pnpm dev
# in another shell:
curl -s -X POST http://localhost:3001/forms/00000000-0000-0000-0000-000000000000/submissions \
  -H 'Content-Type: application/json' \
  -d '{"answers": {}}'
```

Expected: `{"error":{"message":"Form not found"}}` (proves routing + schema parsing work). Stop the dev server. If the API listens on a different port, check the `dev` output for the actual one.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/modules/forms/index.ts apps/api/src/index.ts
git commit -m "feat: add forms API routes for submissions and owner views"
```

---

### Task 6: Frontend block wiring (union flip + public UI + editor + picker)

**Files:**
- Modify: `packages/blocks/src/blocks/types.ts`
- Modify: `packages/blocks/src/blocks/config.ts`
- Create: `apps/frontend/lib/blocks/form/ui.tsx`
- Create: `apps/frontend/lib/blocks/form/form.tsx`
- Create: `apps/frontend/app/assets/ui/type-form.svg`
- Modify: `apps/frontend/lib/blocks/ui.tsx`
- Modify: `apps/frontend/lib/blocks/edit.tsx`
- Modify: `apps/frontend/app/components/DraggableBlockButton.tsx`

This task flips the `Blocks` union, which makes every `Record<Blocks, …>` map a compile error until ALL consumers are updated — so everything lands in one commit. Build the new files first, flip the union last.

- [ ] **Step 1: Public block UI**

Create `apps/frontend/lib/blocks/form/ui.tsx`:

```tsx
'use client';

import { BlockProps } from '../ui';
import { CoreBlock } from '@/components/CoreBlock';
import { FormBlockConfig, FormBlockField } from '@trylinky/blocks';
import { InternalApi, internalApiFetcher } from '@trylinky/common';
import { toast } from '@trylinky/ui';
import { FormEvent, FunctionComponent, useState } from 'react';
import useSWR from 'swr';

const inputClasses =
  'min-w-0 w-full appearance-none rounded-md border-0 bg-sys-bg-primary px-3 py-1.5 text-base text-sys-label-primary shadow-xs ring-1 ring-inset ring-sys-bg-secondary/50 placeholder:text-gray-400 focus:ring-sys-bg-secondary/90 sm:text-sm sm:leading-6';

export const FormBlock: FunctionComponent<BlockProps> = (props) => {
  const { data } = useSWR<{ blockData: FormBlockConfig }>(
    `/blocks/${props.blockId}`,
    internalApiFetcher
  );

  const { blockData } = data || {};

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!data) return null;

  const fields = blockData?.fields ?? [];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (props.isEditable) {
      toast({
        title: 'Form will not be submitted in edit mode',
        variant: 'error',
      });
      return;
    }

    const formData = new FormData(event.currentTarget);

    const answers: Record<string, string | boolean> = {};
    for (const field of fields) {
      if (field.type === 'checkbox') {
        answers[field.id] = formData.get(field.id) === 'on';
      } else {
        const value = formData.get(field.id);
        if (typeof value === 'string' && value.trim() !== '') {
          answers[field.id] = value.trim();
        }
      }
    }

    setIsSubmitting(true);

    const res = await InternalApi.post(
      `/forms/${props.blockId}/submissions`,
      {
        answers,
        website: (formData.get('website') as string) ?? '',
      }
    );

    setIsSubmitting(false);

    if (res?.success) {
      setSubmitted(true);
      return;
    }

    toast({
      title: 'There was a problem submitting the form. Please try again.',
      variant: 'error',
    });
  };

  if (submitted) {
    return (
      <CoreBlock
        {...props}
        className="flex flex-col items-start justify-center gap-4"
      >
        <p className="text-md text-sys-label-primary">
          {blockData?.successMessage || 'Thanks — your response was sent.'}
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="text-sm text-sys-label-secondary underline"
        >
          Submit another response
        </button>
      </CoreBlock>
    );
  }

  return (
    <CoreBlock {...props} className="flex flex-col">
      {blockData?.title && (
        <h2 className="mb-4 text-2xl font-medium text-sys-label-primary">
          {blockData.title}
        </h2>
      )}

      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
        {fields.map((field) => (
          <FieldInput key={field.id} field={field} />
        ))}

        {/* Honeypot: hidden from humans; the API silently drops submissions
            that fill it. */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-1 flex items-center justify-center self-start rounded-md bg-sys-label-primary px-4 py-2 text-sm font-semibold text-sys-bg-primary shadow-xs hover:bg-sys-label-primary/50 disabled:opacity-60"
        >
          {isSubmitting ? 'Sending…' : blockData?.submitLabel || 'Submit'}
        </button>
      </form>
    </CoreBlock>
  );
};

const FieldInput = ({ field }: { field: FormBlockField }) => {
  const maxLength = field.type === 'textarea' ? 5000 : 200;

  if (field.type === 'checkbox') {
    return (
      <label className="flex items-center gap-2 text-sm text-sys-label-primary">
        <input
          type="checkbox"
          name={field.id}
          required={field.required}
          className="h-4 w-4 rounded"
        />
        {field.label}
        {field.required && <span aria-hidden="true">*</span>}
      </label>
    );
  }

  return (
    <label className="flex flex-col gap-1 text-sm text-sys-label-secondary">
      <span>
        {field.label}
        {field.required && <span aria-hidden="true"> *</span>}
      </span>
      {field.type === 'textarea' ? (
        <textarea
          name={field.id}
          required={field.required}
          maxLength={maxLength}
          placeholder={field.placeholder}
          rows={4}
          className={inputClasses}
        />
      ) : field.type === 'select' ? (
        <select
          name={field.id}
          required={field.required}
          defaultValue=""
          className={inputClasses}
        >
          <option value="" disabled>
            {field.placeholder || 'Choose an option'}
          </option>
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={field.type === 'email' ? 'email' : 'text'}
          name={field.id}
          required={field.required}
          maxLength={maxLength}
          placeholder={field.placeholder}
          className={inputClasses}
        />
      )}
    </label>
  );
};
```

- [ ] **Step 2: Editor field-list builder**

Create `apps/frontend/lib/blocks/form/form.tsx`:

```tsx
import { EditFormProps } from '../types';
import { FormField } from '@/components/FormField';
import {
  FormBlockConfig,
  FormBlockField,
  FormBlockSchema,
  MAX_FORM_FIELDS,
  formBlockDefaults,
  formFieldTypes,
} from '@trylinky/blocks';
import { Button, cn } from '@trylinky/ui';
import {
  Field,
  FieldArray,
  Form,
  Formik,
  FormikHelpers,
  useFormikContext,
} from 'formik';
import { ChevronDown, ChevronUp, Loader2, Plus, Trash2 } from 'lucide-react';

const fieldTypeLabels: Record<(typeof formFieldTypes)[number], string> = {
  text: 'Text',
  email: 'Email',
  textarea: 'Long text',
  select: 'Dropdown',
  checkbox: 'Checkbox',
};

const newField = (): FormBlockField => ({
  id:
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `field-${Math.random().toString(36).slice(2, 10)}`,
  type: 'text',
  label: '',
  required: false,
});

export function EditForm({
  initialValues,
  onSave,
  onClose,
}: EditFormProps<FormBlockConfig>) {
  const handleSubmit = async (
    values: FormBlockConfig,
    { setSubmitting }: FormikHelpers<FormBlockConfig>
  ) => {
    setSubmitting(true);
    onSave(values);
  };

  return (
    <Formik<FormBlockConfig>
      initialValues={{
        title: initialValues?.title ?? formBlockDefaults.title,
        submitLabel:
          initialValues?.submitLabel ?? formBlockDefaults.submitLabel,
        successMessage:
          initialValues?.successMessage ?? formBlockDefaults.successMessage,
        fields: initialValues?.fields ?? formBlockDefaults.fields,
      }}
      validationSchema={FormBlockSchema}
      onSubmit={handleSubmit}
      enableReinitialize={true}
    >
      {({ isSubmitting, errors }) => (
        <Form className="flex w-full flex-col gap-3">
          <FormField
            label="Title"
            name="title"
            id="title"
            error={typeof errors.title === 'string' ? errors.title : undefined}
          />

          <FieldList />

          <FormField
            label="Submit button label"
            name="submitLabel"
            id="submitLabel"
            error={
              typeof errors.submitLabel === 'string'
                ? errors.submitLabel
                : undefined
            }
          />

          <FormField
            label="Success message"
            name="successMessage"
            id="successMessage"
            error={
              typeof errors.successMessage === 'string'
                ? errors.successMessage
                : undefined
            }
          />

          <div className="flex shrink-0 justify-between border-t border-stone-200 py-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              ← Cancel
            </Button>
            <Button type="submit">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
}

const fieldInputClasses =
  'rounded-md border border-stone-200 px-2 py-1.5 text-sm text-stone-800 placeholder:text-stone-400';

const FieldList = () => {
  const { values, errors, setFieldValue } =
    useFormikContext<FormBlockConfig>();

  return (
    <FieldArray name="fields">
      {({ push, remove, swap }) => (
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium text-stone-700">Fields</span>

          {values.fields.map((field, index) => (
            <div
              key={field.id}
              className="flex flex-col gap-2 rounded-lg border border-stone-200 p-3"
            >
              <div className="flex items-center gap-2">
                <Field
                  name={`fields.${index}.label`}
                  placeholder="Field label"
                  className={cn(fieldInputClasses, 'flex-1')}
                />
                <Field
                  as="select"
                  name={`fields.${index}.type`}
                  className={fieldInputClasses}
                >
                  {formFieldTypes.map((type) => (
                    <option key={type} value={type}>
                      {fieldTypeLabels[type]}
                    </option>
                  ))}
                </Field>

                <button
                  type="button"
                  aria-label="Move field up"
                  disabled={index === 0}
                  onClick={() => swap(index, index - 1)}
                  className="rounded p-1 text-stone-500 hover:bg-stone-100 disabled:opacity-30"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Move field down"
                  disabled={index === values.fields.length - 1}
                  onClick={() => swap(index, index + 1)}
                  className="rounded p-1 text-stone-500 hover:bg-stone-100 disabled:opacity-30"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Remove field"
                  disabled={values.fields.length === 1}
                  onClick={() => remove(index)}
                  className="rounded p-1 text-stone-500 hover:bg-stone-100 disabled:opacity-30"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {field.type !== 'checkbox' && (
                <Field
                  name={`fields.${index}.placeholder`}
                  placeholder="Placeholder (optional)"
                  className={fieldInputClasses}
                />
              )}

              <label className="flex items-center gap-2 text-sm text-stone-600">
                <Field type="checkbox" name={`fields.${index}.required`} />
                Required
              </label>

              {field.type === 'select' && (
                <textarea
                  value={(field.options ?? []).join('\n')}
                  onChange={(event) =>
                    setFieldValue(
                      `fields.${index}.options`,
                      event.target.value
                        .split('\n')
                        .map((option) => option.trim())
                        .filter(Boolean)
                    )
                  }
                  placeholder={'One option per line\ne.g.\nSupport\nSales'}
                  rows={3}
                  className={fieldInputClasses}
                />
              )}
            </div>
          ))}

          {typeof errors.fields === 'string' && (
            <p className="text-sm text-red-600">{errors.fields}</p>
          )}

          {values.fields.length < MAX_FORM_FIELDS && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => push(newField())}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add field
            </Button>
          )}

          <p className="text-xs text-stone-500">
            Removing a field doesn&apos;t delete answers already collected for
            it — they stay visible in your responses.
          </p>
        </div>
      )}
    </FieldArray>
  );
};
```

- [ ] **Step 3: Picker icon**

Create `apps/frontend/app/assets/ui/type-form.svg`:

```svg
<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="48" height="48" rx="8" fill="#F4F4F5"/>
  <rect x="10" y="11" width="28" height="6" rx="3" fill="#A1A1AA"/>
  <rect x="10" y="21" width="28" height="6" rx="3" fill="#A1A1AA"/>
  <rect x="10" y="31" width="14" height="6" rx="3" fill="#3F3F46"/>
</svg>
```

(Visual style follows the existing `type-*.svg` flat-tile icons; eyeball it against `type-waitlist-email.svg` in the picker and tweak fills if it looks off.)

- [ ] **Step 4: Flip the union and update every registry**

`packages/blocks/src/blocks/types.ts` — add to the union (after `| 'reactions'`):

```ts
  | 'form';
```

`packages/blocks/src/blocks/config.ts` — add the import (alphabetical, near the top):

```ts
import { FormBlockSchema, formBlockDefaults } from './form/config';
```

and the registry entry (after `reactions: { … },`):

```ts
  form: {
    defaults: formBlockDefaults,
    schema: FormBlockSchema,
    isBeta: true,
  },
```

`apps/frontend/lib/blocks/ui.tsx` — add the import:

```ts
import { FormBlock } from './form/ui';
```

and the switch case (after `case 'reactions': …`):

```tsx
    case 'form':
      return <FormBlock {...sharedProps} />;
```

`apps/frontend/lib/blocks/edit.tsx` — add the import:

```ts
import { EditForm as FormBlockForm } from './form/form';
```

and the map entry (after `reactions: ReactionForm,`):

```ts
  form: FormBlockForm,
```

`apps/frontend/app/components/DraggableBlockButton.tsx` — add the icon import next to the other `type-*.svg` imports:

```ts
import blockFormIcon from '@/app/assets/ui/type-form.svg';
```

and the config entry (after the `reactions` entry):

```ts
  form: {
    title: 'Form',
    label: 'Collect responses from your visitors',
    icon: blockFormIcon,
    drag: {
      w: 12,
      h: 10,
    },
  },
```

- [ ] **Step 5: Typecheck everything that consumes the union**

```bash
cd packages/blocks && pnpm typecheck && pnpm test
cd ../../apps/frontend && pnpm typecheck
cd ../api && pnpm typecheck
```

Expected: all PASS. A failure in frontend typecheck means a `Record<Blocks, …>` map was missed — the error names the file.

- [ ] **Step 6: Manual smoke test in the editor**

Run the dev stack (API + frontend), log in as an **admin** user (the block is `isBeta`), open a page in the editor and verify:
1. "Form" appears in the block picker; drag it in — it renders the default Name/Email/Message contact form.
2. Edit the block: add a Dropdown field with two options, reorder with the arrows, remove a field — note about kept answers shows.
3. Save — block re-renders with the new fields.
4. Open the published page logged-out and submit a response; the success message appears with "Submit another response".

- [ ] **Step 7: Commit**

```bash
git add packages/blocks apps/frontend
git commit -m "feat: add form block with field-list editor and public submission UI"
```

---

### Task 7: Dashboard responses view

**Files:**
- Rewrite: `apps/frontend/app/components/SidebarForms.tsx` (currently a "coming soon" placeholder)

The page `apps/frontend/app/e/[slug]/forms/page.tsx` and the nav entry (`editor-navbar.tsx:24`) already exist — only the sidebar component changes.

- [ ] **Step 1: Replace the placeholder with the responses view**

Replace the entire contents of `apps/frontend/app/components/SidebarForms.tsx`:

```tsx
'use client';

import { InternalApi } from '@trylinky/common';
import { Button } from '@trylinky/ui';
import * as Catalyst from '@trylinky/ui/catalyst';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@trylinky/ui/catalyst';
import { Download, Loader2, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useSWRConfig } from 'swr';

interface FormGroup {
  blockId: string;
  title: string;
  isDeleted: boolean;
  submissionCount: number;
  latestSubmissionAt: string | null;
}

interface Submission {
  id: string;
  createdAt: string;
  answers: Record<string, string | boolean>;
  fieldsSnapshot: {
    title: string | null;
    fields: { id: string; label: string; type: string }[];
  };
}

interface Column {
  id: string;
  label: string;
}

// Column set is the union of field ids across every snapshot, so responses
// collected before a field was renamed/removed still render. Most recent
// snapshot's label wins.
function deriveColumns(submissions: Submission[]): Column[] {
  const columns = new Map<string, string>();
  // Submissions arrive newest-first; iterate oldest-first so newer labels
  // overwrite older ones.
  for (const submission of [...submissions].reverse()) {
    for (const field of submission.fieldsSnapshot?.fields ?? []) {
      columns.set(field.id, field.label);
    }
  }
  return [...columns.entries()].map(([id, label]) => ({ id, label }));
}

function formatAnswer(value: string | boolean | undefined): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return value;
}

function escapeCsvValue(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadCsv(filename: string, columns: Column[], rows: Submission[]) {
  const header = ['Submitted at', ...columns.map((column) => column.label)];
  const body = rows.map((submission) => [
    new Date(submission.createdAt).toISOString(),
    ...columns.map((column) => formatAnswer(submission.answers[column.id])),
  ]);
  const csv = [header, ...body]
    .map((row) => row.map(escapeCsvValue).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function SidebarForms() {
  const { cache } = useSWRConfig();
  // Same pattern as SidebarAnalytics.tsx:64 — pageId is seeded into the SWR
  // cache by the editor layout.
  const pageId = cache.get('pageId');

  const [groups, setGroups] = useState<FormGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!pageId) return;

    const fetchGroups = async () => {
      setGroupsLoading(true);
      try {
        const response = await InternalApi.get(`/forms/page/${pageId}`);
        const fetchedGroups: FormGroup[] = response?.groups ?? [];
        setGroups(fetchedGroups);
        if (fetchedGroups.length > 0) {
          setSelectedBlockId(fetchedGroups[0].blockId);
        }
      } finally {
        setGroupsLoading(false);
      }
    };

    fetchGroups();
  }, [pageId]);

  const fetchSubmissions = useCallback(
    async (blockId: string, cursor?: string) => {
      setSubmissionsLoading(true);
      try {
        const params = new URLSearchParams({ blockId });
        if (cursor) params.set('cursor', cursor);
        const response = await InternalApi.get(
          `/forms/page/${pageId}/submissions?${params.toString()}`
        );
        setSubmissions((previous) =>
          cursor
            ? [...previous, ...(response?.submissions ?? [])]
            : (response?.submissions ?? [])
        );
        setNextCursor(response?.nextCursor ?? null);
      } finally {
        setSubmissionsLoading(false);
      }
    },
    [pageId]
  );

  useEffect(() => {
    if (!selectedBlockId || !pageId) return;
    setSubmissions([]);
    setNextCursor(null);
    fetchSubmissions(selectedBlockId);
  }, [selectedBlockId, pageId, fetchSubmissions]);

  const handleDelete = async (submissionId: string) => {
    if (!window.confirm('Delete this response? This cannot be undone.')) {
      return;
    }

    const response = await InternalApi.delete(
      `/forms/submissions/${submissionId}`
    );

    if (response?.success) {
      setSubmissions((previous) =>
        previous.filter((submission) => submission.id !== submissionId)
      );
      setGroups((previous) =>
        previous.map((group) =>
          group.blockId === selectedBlockId
            ? { ...group, submissionCount: group.submissionCount - 1 }
            : group
        )
      );
    }
  };

  const handleExport = async () => {
    if (!selectedBlockId || !pageId) return;
    setIsExporting(true);
    try {
      // Fetch every page so the CSV contains all responses, not just the
      // ones currently loaded.
      const allSubmissions: Submission[] = [];
      let cursor: string | null = null;
      do {
        const params = new URLSearchParams({ blockId: selectedBlockId });
        if (cursor) params.set('cursor', cursor);
        const response = await InternalApi.get(
          `/forms/page/${pageId}/submissions?${params.toString()}`
        );
        allSubmissions.push(...(response?.submissions ?? []));
        cursor = response?.nextCursor ?? null;
      } while (cursor);

      const group = groups.find((g) => g.blockId === selectedBlockId);
      const slug = (group?.title || 'form')
        .replace(/[^a-z0-9]+/gi, '-')
        .toLowerCase();
      downloadCsv(
        `${slug}-responses.csv`,
        deriveColumns(allSubmissions),
        allSubmissions
      );
    } finally {
      setIsExporting(false);
    }
  };

  if (groupsLoading) {
    return (
      <div className="flex min-h-[360px] w-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
      </div>
    );
  }

  if (groups.length === 0) {
    return <SidebarFormsEmpty />;
  }

  const columns = deriveColumns(submissions);
  const selectedGroup = groups.find(
    (group) => group.blockId === selectedBlockId
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {groups.map((group) => (
          <button
            key={group.blockId}
            type="button"
            onClick={() => setSelectedBlockId(group.blockId)}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              group.blockId === selectedBlockId
                ? 'border-stone-800 bg-stone-100 font-medium'
                : 'border-stone-200 bg-white hover:bg-stone-50'
            }`}
          >
            {group.title}
            {group.isDeleted && ' (deleted form)'}
            <span className="ml-2 text-stone-500">
              {group.submissionCount}
            </span>
          </button>
        ))}
      </div>

      {selectedGroup && (
        <div className="flex items-center justify-between">
          <Catalyst.Text>
            {selectedGroup.submissionCount}{' '}
            {selectedGroup.submissionCount === 1 ? 'response' : 'responses'}
            {selectedGroup.latestSubmissionAt &&
              ` · latest ${new Date(
                selectedGroup.latestSubmissionAt
              ).toLocaleString()}`}
          </Catalyst.Text>
          <Button
            type="button"
            variant="secondary"
            onClick={handleExport}
            disabled={isExporting || selectedGroup.submissionCount === 0}
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export CSV
          </Button>
        </div>
      )}

      {submissions.length === 0 && !submissionsLoading ? (
        <div className="flex min-h-[200px] w-full items-center justify-center rounded-lg border border-dashed border-stone-200 bg-stone-50">
          <Catalyst.Text>No responses yet.</Catalyst.Text>
        </div>
      ) : (
        <Table dense className="w-full">
          <TableHead>
            <TableRow>
              <TableHeader>Submitted</TableHeader>
              {columns.map((column) => (
                <TableHeader key={column.id}>{column.label}</TableHeader>
              ))}
              <TableHeader>
                <span className="sr-only">Actions</span>
              </TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {submissions.map((submission) => (
              <TableRow key={submission.id}>
                <TableCell className="whitespace-nowrap text-stone-500">
                  {new Date(submission.createdAt).toLocaleString()}
                </TableCell>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    className="max-w-[240px] truncate"
                    title={formatAnswer(submission.answers[column.id])}
                  >
                    {formatAnswer(submission.answers[column.id])}
                  </TableCell>
                ))}
                <TableCell>
                  <button
                    type="button"
                    aria-label="Delete response"
                    onClick={() => handleDelete(submission.id)}
                    className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {nextCursor && (
        <Button
          type="button"
          variant="secondary"
          disabled={submissionsLoading}
          onClick={() =>
            selectedBlockId && fetchSubmissions(selectedBlockId, nextCursor)
          }
        >
          {submissionsLoading && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Load more
        </Button>
      )}
    </div>
  );
}

function SidebarFormsEmpty() {
  return (
    <div className="flex min-h-[360px] w-full items-center justify-center rounded-lg border border-dashed border-stone-200 bg-stone-50 p-12">
      <div className="flex max-w-md flex-col items-center text-center">
        <Catalyst.Heading level={2} className="mb-2">
          No forms on this page yet
        </Catalyst.Heading>
        <Catalyst.Text className="text-pretty">
          Add a Form block to your page in the editor to start collecting
          responses from your visitors. They&apos;ll show up here.
        </Catalyst.Text>
      </div>
    </div>
  );
}
```

Import note: `Table`/`TableHead`/etc. are exported from `packages/ui/src/catalyst/table.tsx`. If `@trylinky/ui/catalyst` doesn't re-export them at that path, check how other files import catalyst components (`grep -rn "catalyst" apps/frontend/app --include="*.tsx" | head`) and match.

- [ ] **Step 2: Typecheck**

```bash
cd apps/frontend && pnpm typecheck
```

Expected: PASS.

- [ ] **Step 3: Manual smoke test**

With the dev stack running and at least one submitted response (from Task 6 Step 6):
1. Open `/e/<slug>/forms` — the form group chip shows with its response count.
2. The table renders the submission with the right labels and values.
3. Export CSV downloads a file whose header matches the field labels.
4. Delete a response — confirm dialog, row disappears, count decrements.
5. In the editor, rename a field, submit a new response, return to the Forms tab: both old and new label columns render correctly.
6. Delete the form block in the editor, revisit the Forms tab: the group remains, marked "(deleted form)".

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/app/components/SidebarForms.tsx
git commit -m "feat: replace forms placeholder with responses dashboard"
```

---

### Task 8: Full verification

- [ ] **Step 1: Run every check**

```bash
cd packages/blocks && pnpm typecheck && pnpm test
cd ../prisma && pnpm typecheck
cd ../../apps/api && pnpm typecheck && pnpm exec dotenvx run -f ../../.env.local -- pnpm test
cd ../frontend && pnpm typecheck
```

Expected: all PASS.

- [ ] **Step 2: Spec checklist sweep**

Confirm each spec requirement has landed (spot-check, don't re-test):
- Block: 5 field types, 1–10 fields, Yup limits, `isBeta: true`, seeded contact-form defaults ✓ (Tasks 2, 6)
- Visitor flow: honeypot → rate limit → validate-against-current-config → store; success message + submit-another ✓ (Tasks 3–6)
- Storage: `FormSubmission` with no block FK, snapshot per submission, cascade on page delete ✓ (Task 1)
- Dashboard: groups incl. orphans, union-of-snapshots columns, pagination, delete, full CSV export, empty states ✓ (Task 7)
- Non-owner gets 404 on owner endpoints ✓ (Tasks 4–5)

- [ ] **Step 3: Final commit if anything was fixed during verification**

```bash
git status --short
# commit any stragglers with a descriptive message
```
