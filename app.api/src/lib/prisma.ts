import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@trylinky/prisma';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

const prismaClientSingleton = () => {
  return new PrismaClient({ adapter }).$extends({
    query: {
      async $allOperations({ model, operation, args, query }) {
        const before = Date.now();
        const result = await query(args);
        const after = Date.now();

        console.log(`Query ${model}.${operation} took ${after - before}ms`);

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

export default globalForPrisma.prisma;
