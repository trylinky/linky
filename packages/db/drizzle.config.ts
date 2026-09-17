import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema/index.ts',
  out: './migrations',
  dbCredentials: {
    // DIRECT_URL, not DATABASE_URL: the same split prisma.config.ts used, so
    // migrations bypass any pooler.
    url: process.env.DIRECT_URL as string,
  },
  strict: true,
  verbose: true,
});
