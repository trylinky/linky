import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrations: {
    path: './prisma/migrations',
    seed: 'dotenvx run -f ../../.env.local -- tsx ./prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
