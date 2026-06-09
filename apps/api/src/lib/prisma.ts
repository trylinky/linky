import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@trylinky/prisma';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// Synchronous console I/O on every query is a measurable tax in production,
// so only surface genuinely slow queries. No NODE_ENV branch: the esbuild
// bundle inlines env vars at build time (see analytics/utils.ts).
const SLOW_QUERY_THRESHOLD_MS = 50;

const prismaClientSingleton = () => {
  return new PrismaClient({ adapter }).$extends({
    query: {
      async $allOperations({ model, operation, args, query }) {
        const before = Date.now();
        const result = await query(args);
        const duration = Date.now() - before;

        if (duration >= SLOW_QUERY_THRESHOLD_MS) {
          console.log(`Slow query ${model}.${operation} took ${duration}ms`);
        }

        return result;
      },
    },
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prismaClientSingleton();
}

export default globalForPrisma.prisma as PrismaClient;
