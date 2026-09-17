import { pgEnum } from 'drizzle-orm/pg-core';

export const verificationRequestStatus = pgEnum('VerificationRequestStatus', [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
]);

export const orchestrationType = pgEnum('OrchestrationType', ['TIKTOK']);
