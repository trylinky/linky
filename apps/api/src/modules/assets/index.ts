import type { AppBindings } from '@/env';
import { requireSession } from '@/middleware/authenticate';
import { canUploadAsset } from '@/modules/assets/authorization';
import { assetContexts } from '@/modules/assets/constants';
import { uploadAsset } from '@/modules/assets/service';
import { isObjKey } from '@/modules/assets/utils';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';

// This used to live in the `@fastify/multipart` registration in the old
// `src/index.ts` (`limits: { files: 1, fileSize: 10 * 1024 * 1024 }`), which
// Task 7 deleted along with that file. This module went unmounted from then
// until this task, so the cap was silently unenforced the whole time — see
// the per-file check below, and the `bodyLimit` middleware for why the check
// alone isn't enough.
const MAX_FILE_BYTES = 10 * 1024 * 1024;

// `bodyLimit`'s threshold is intentionally a little above `MAX_FILE_BYTES`:
// the multipart request also carries `referenceId`/`assetContext` text
// fields and boundary framing on top of the file bytes, and this middleware
// sees the whole request body, not just the file part. Its job is to stop an
// oversized request from being buffered into memory (and on into the WASM
// encode pipeline in service.ts) at all — same instrument forms/index.ts
// uses for its submission cap, chosen because it counts real bytes off the
// request stream rather than trusting a client-supplied `content-length`.
// The per-file `MAX_FILE_BYTES` check after `parseBody()` below is what
// actually reproduces the old 10MB *file* limit once the request is known to
// be within bounds.
const MAX_REQUEST_BYTES = MAX_FILE_BYTES + 64 * 1024;

const assetsRoutes = new Hono<AppBindings>();

assetsRoutes.post(
  '/upload',
  bodyLimit({
    maxSize: MAX_REQUEST_BYTES,
    onError: (c) => c.json({ error: { message: 'File too large' } }, 413),
  }),
  async (c) => {
    const session = requireSession(c);

    const body = await c.req.parseBody();

    // The old handler used Fastify's `request.file()`, which returns
    // whichever file field arrived first in the multipart stream — the
    // field name was never actually pinned server-side. The real caller
    // (apps/frontend/app/components/FormFileUpload.tsx) always sends `file`;
    // `image` is accepted too so this stays at least as permissive as the
    // handler it replaces.
    const file = body.file ?? body.image;
    const referenceId = body.referenceId;
    const context = body.assetContext;

    if (!(file instanceof File)) {
      return c.json({ error: { message: 'No file uploaded' } }, 400);
    }

    if (file.size > MAX_FILE_BYTES) {
      return c.json({ error: { message: 'File too large' } }, 413);
    }

    if (typeof referenceId !== 'string' || !referenceId) {
      return c.json({ error: { message: 'Missing referenceId field' } }, 400);
    }

    if (typeof context !== 'string' || !isObjKey(context, assetContexts)) {
      return c.json({ error: { message: 'Invalid asset context' } }, 400);
    }

    // referenceId chooses the S3 key prefix, so it has to be something the
    // caller actually owns.
    const isAllowed = await canUploadAsset({
      context,
      referenceId,
      userId: session.user.id,
      organizationId: session.activeOrganizationId,
    });

    if (!isAllowed) {
      return c.json(
        {
          error: {
            message: 'You do not have access to upload against this reference',
          },
        },
        403
      );
    }

    const result = await uploadAsset({ context, file, referenceId });

    if ('error' in result) {
      return c.json({ error: result.error }, 500);
    }

    return c.json({ message: 'success', url: result.data.url }, 200);
  }
);

export default assetsRoutes;
