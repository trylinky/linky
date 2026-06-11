import prisma from '@/lib/prisma';
import formsRoutes from './index';
import { randomUUID } from 'node:crypto';
import Fastify, { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Route-level tests: the service has its own coverage in service.test.ts,
// but the Fastify body schema runs BEFORE the service sees the payload, so
// schema-layer behavior (e.g. AJV type coercion) is only observable here.

const suffix = randomUUID().slice(0, 8);
const IP = '198.51.100.21';

const testFormConfig = {
  title: 'Contact me',
  submitLabel: 'Submit',
  successMessage: 'Thanks!',
  fields: [
    { id: 'f-email', type: 'email', label: 'Email', required: true },
    { id: 'f-agree', type: 'checkbox', label: 'I agree', required: true },
  ],
};

let app: FastifyInstance;
let organizationId: string;
let pageId: string;
let blockId: string;

beforeAll(async () => {
  const organization = await prisma.organization.create({
    data: {
      name: 'Form Routes Test Org',
      slug: `form-routes-test-org-${suffix}`,
    },
  });
  organizationId = organization.id;

  const page = await prisma.page.create({
    data: {
      slug: `form-routes-test-page-${suffix}`,
      config: [],
      publishedAt: new Date(),
      organizationId,
    },
  });
  pageId = page.id;

  const block = await prisma.block.create({
    data: { type: 'form', config: {}, data: testFormConfig, pageId },
  });
  blockId = block.id;

  app = Fastify();
  await app.register(formsRoutes, { prefix: '/forms' });
  await app.ready();
});

afterAll(async () => {
  await app.close();
  await prisma.formSubmission.deleteMany({ where: { pageId } });
  await prisma.block.deleteMany({ where: { pageId } });
  await prisma.page.delete({ where: { id: pageId } });
  await prisma.organization.delete({ where: { id: organizationId } });
});

describe('POST /forms/:blockId/submissions', () => {
  it('accepts a checked required checkbox and stores it as a boolean', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/forms/${blockId}/submissions`,
      headers: { 'x-forwarded-for': IP },
      payload: {
        answers: { 'f-email': 'visitor@example.com', 'f-agree': true },
        website: '',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ success: true });

    const stored = await prisma.formSubmission.findFirst({
      where: { blockId },
      orderBy: { createdAt: 'desc' },
    });

    // Strict boolean: AJV coercion through the body schema's string|boolean
    // union once turned `true` into "true", silently breaking checkboxes.
    expect(stored?.answers).toEqual({
      'f-email': 'visitor@example.com',
      'f-agree': true,
    });
  });

  it('rejects an unchecked required checkbox', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/forms/${blockId}/submissions`,
      headers: { 'x-forwarded-for': IP },
      payload: {
        answers: { 'f-email': 'visitor@example.com', 'f-agree': false },
        website: '',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.fields).toMatchObject({
      'f-agree': 'I agree is required',
    });
  });
});
