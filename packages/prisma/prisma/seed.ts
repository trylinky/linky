import { PrismaClient } from '../src/generated/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Theme seed data (copied from apps/frontend/lib/theme.ts to avoid cross-package imports)
const defaultThemeSeeds = {
  Default: {
    id: '00441c91-6762-44d8-8110-2b5616825bd9',
    colorBgBase: { h: 60, l: 0.96, s: 0.0476 },
    colorBgPrimary: { h: 0, l: 1, s: 0 },
    colorBgSecondary: { h: 0, l: 0.902, s: 0 },
    colorBorderPrimary: { h: 0, l: 0.9176, s: 0 },
    colorLabelPrimary: { h: 240, l: 0.1137, s: 0.0345 },
    colorLabelSecondary: { h: 0, l: 0.16, s: 0 },
    colorLabelTertiary: { h: 0, l: 0.9804, s: 0 },
  },
  Purple: {
    id: '14fc9bdf-f363-4404-b05e-856670722fda',
    colorBgBase: { h: 255.48, l: 0.202, s: 0.301 },
    colorBgPrimary: { h: 255, l: 0.135, s: 0.29 },
    colorBgSecondary: { h: 0, l: 0, s: 0 },
    colorBorderPrimary: { h: 253.55, l: 0.2837, s: 0.1969 },
    colorLabelPrimary: { h: 0, l: 100, s: 0 },
    colorLabelSecondary: { h: 293.33, l: 0.7627, s: 0.0744 },
    colorLabelTertiary: { h: 0, l: 0.9804, s: 0 },
  },
  Black: {
    id: '1e24ab02-9b97-4a61-9b83-fe278a41b30b',
    colorBgBase: { h: 0, l: 0, s: 0 },
    colorBgPrimary: { h: 0, l: 0, s: 0 },
    colorBgSecondary: { h: 0, l: 0.902, s: 0 },
    colorBorderPrimary: { h: 0, l: 0.1607, s: 0 },
    colorLabelPrimary: { h: 0, l: 1, s: 0 },
    colorLabelSecondary: { h: 0, l: 0.9804, s: 0 },
    colorLabelTertiary: { h: 0, l: 0.9804, s: 0 },
  },
  Forest: {
    id: '4c47b21f-9183-4e7a-be6c-6ee4fabae92a',
    colorBgBase: { h: 141.18, l: 0.41, s: 0.0813 },
    colorBgPrimary: { h: 140, l: 0.31, s: 0.0988 },
    colorBgSecondary: { h: 0, l: 0.902, s: 0 },
    colorBorderPrimary: { h: 140, l: 0.31, s: 0.0988 },
    colorLabelPrimary: { h: 0, l: 100, s: 0 },
    colorLabelSecondary: { h: 141.18, l: 0.8392, s: 0.4146 },
    colorLabelTertiary: { h: 0, l: 0.9804, s: 0 },
  },
  Lilac: {
    id: '0192b479-69c1-7bb4-936d-26f9e3a2024f',
    colorBgBase: { a: 1, h: 244.86, l: 0.85, s: 1 },
    colorBgPrimary: { h: 244.86, l: 0.92, s: 0.91 },
    colorBgSecondary: { h: 0, l: 0, s: 0 },
    colorBorderPrimary: { h: 244.86, l: 0.76, s: 0.48 },
    colorLabelPrimary: { h: 250.0, l: 0.18, s: 0.32 },
    colorLabelSecondary: { h: 250.0, l: 0.18, s: 0.32 },
    colorLabelTertiary: { h: 250.0, l: 0.18, s: 0.32 },
  },
  OrangePunch: {
    id: '44ddcc5a-aa85-45b9-b333-3ddcbe7d7db3',
    colorBgBase: { h: 226.15, l: 0.1, s: 0.48 },
    colorBgPrimary: { h: 13.5, l: 0.53, s: 0.67 },
    colorBgSecondary: { h: 33.3, l: 0.48, s: 0.95 },
    colorBorderPrimary: { h: 226.15, l: 0.1, s: 0.48 },
    colorLabelPrimary: { h: 144, l: 0.69, s: 0.78 },
    colorLabelSecondary: { h: 144, l: 0.97, s: 0.76 },
    colorLabelTertiary: { h: 144, l: 0.98, s: 0 },
  },
};

async function main() {
  const initialUser = await prisma.user.upsert({
    where: {
      id: '62b6a104-6f6e-44e2-b610-801b5e103b29',
    },
    update: {},
    create: {
      name: 'Initial User',
      email: 'hello@lin.ky',
      emailVerified: true,
      role: 'user',
    },
  });

  const initialTeam = await prisma.organization.upsert({
    where: {
      id: '01929fe6-7ade-7dd9-b5ca-26ef831c2914',
    },
    update: {},
    create: {
      name: 'Initial Team',
      isPersonal: true,
      slug: 'initial-team',
      members: {
        create: {
          userId: initialUser.id,
          role: 'admin',
        },
      },
    },
  });

  // Default Theme
  await prisma.theme.upsert({
    where: {
      id: '00441c91-6762-44d8-8110-2b5616825bd9',
    },
    update: {},
    create: {
      id: '00441c91-6762-44d8-8110-2b5616825bd9',
      name: 'Default',
      createdById: initialUser.id,
      isDefault: true,
      colorBgPrimary: defaultThemeSeeds.Default.colorBgPrimary,
      colorBgSecondary: defaultThemeSeeds.Default.colorBgSecondary,
      colorBorderPrimary: defaultThemeSeeds.Default.colorBorderPrimary,
      colorLabelPrimary: defaultThemeSeeds.Default.colorLabelPrimary,
      colorLabelSecondary: defaultThemeSeeds.Default.colorLabelSecondary,
      colorLabelTertiary: defaultThemeSeeds.Default.colorLabelTertiary,
      colorBgBase: defaultThemeSeeds.Default.colorBgBase,
    },
  });

  // Purple Theme
  await prisma.theme.upsert({
    where: {
      id: '14fc9bdf-f363-4404-b05e-856670722fda',
    },
    update: {},
    create: {
      id: '14fc9bdf-f363-4404-b05e-856670722fda',
      name: 'Purple',
      createdById: initialUser.id,
      isDefault: true,
      colorBgPrimary: defaultThemeSeeds.Purple.colorBgPrimary,
      colorBgSecondary: defaultThemeSeeds.Purple.colorBgSecondary,
      colorBorderPrimary: defaultThemeSeeds.Purple.colorBorderPrimary,
      colorLabelPrimary: defaultThemeSeeds.Purple.colorLabelPrimary,
      colorLabelSecondary: defaultThemeSeeds.Purple.colorLabelSecondary,
      colorLabelTertiary: defaultThemeSeeds.Purple.colorLabelTertiary,
      colorBgBase: defaultThemeSeeds.Purple.colorBgBase,
    },
  });

  // Black Theme
  await prisma.theme.upsert({
    where: {
      id: '1e24ab02-9b97-4a61-9b83-fe278a41b30b',
    },
    update: {},
    create: {
      id: '1e24ab02-9b97-4a61-9b83-fe278a41b30b',
      name: 'Black',
      createdById: initialUser.id,
      isDefault: true,
      colorBgPrimary: defaultThemeSeeds.Black.colorBgPrimary,
      colorBgSecondary: defaultThemeSeeds.Black.colorBgSecondary,
      colorBorderPrimary: defaultThemeSeeds.Black.colorBorderPrimary,
      colorLabelPrimary: defaultThemeSeeds.Black.colorLabelPrimary,
      colorLabelSecondary: defaultThemeSeeds.Black.colorLabelSecondary,
      colorLabelTertiary: defaultThemeSeeds.Black.colorLabelTertiary,
      colorBgBase: defaultThemeSeeds.Black.colorBgBase,
    },
  });

  // Forest Theme
  await prisma.theme.upsert({
    where: {
      id: '4c47b21f-9183-4e7a-be6c-6ee4fabae92a',
    },
    update: {},
    create: {
      id: '4c47b21f-9183-4e7a-be6c-6ee4fabae92a',
      name: 'Forest',
      createdById: initialUser.id,
      isDefault: true,
      colorBgPrimary: defaultThemeSeeds.Forest.colorBgPrimary,
      colorBgSecondary: defaultThemeSeeds.Forest.colorBgSecondary,
      colorBorderPrimary: defaultThemeSeeds.Forest.colorBorderPrimary,
      colorLabelPrimary: defaultThemeSeeds.Forest.colorLabelPrimary,
      colorLabelSecondary: defaultThemeSeeds.Forest.colorLabelSecondary,
      colorLabelTertiary: defaultThemeSeeds.Forest.colorLabelTertiary,
      colorBgBase: defaultThemeSeeds.Forest.colorBgBase,
    },
  });

  // Lilac Theme
  await prisma.theme.upsert({
    where: {
      id: '0192b479-69c1-7bb4-936d-26f9e3a2024f',
    },
    update: {},
    create: {
      id: '0192b479-69c1-7bb4-936d-26f9e3a2024f',
      name: 'Lilac',
      createdById: initialUser.id,
      isDefault: true,
      colorBgPrimary: defaultThemeSeeds.Lilac.colorBgPrimary,
      colorBgSecondary: defaultThemeSeeds.Lilac.colorBgSecondary,
      colorBorderPrimary: defaultThemeSeeds.Lilac.colorBorderPrimary,
      colorLabelPrimary: defaultThemeSeeds.Lilac.colorLabelPrimary,
      colorLabelSecondary: defaultThemeSeeds.Lilac.colorLabelSecondary,
      colorLabelTertiary: defaultThemeSeeds.Lilac.colorLabelTertiary,
      colorBgBase: defaultThemeSeeds.Lilac.colorBgBase,
    },
  });

  // OrangePunch Theme
  await prisma.theme.upsert({
    where: {
      id: '44ddcc5a-aa85-45b9-b333-3ddcbe7d7db3',
    },
    update: {},
    create: {
      id: '44ddcc5a-aa85-45b9-b333-3ddcbe7d7db3',
      name: 'Orange Punch',
      createdById: initialUser.id,
      isDefault: true,
      colorBgPrimary: defaultThemeSeeds.OrangePunch.colorBgPrimary,
      colorBgSecondary: defaultThemeSeeds.OrangePunch.colorBgSecondary,
      colorBorderPrimary: defaultThemeSeeds.OrangePunch.colorBorderPrimary,
      colorLabelPrimary: defaultThemeSeeds.OrangePunch.colorLabelPrimary,
      colorLabelSecondary: defaultThemeSeeds.OrangePunch.colorLabelSecondary,
      colorLabelTertiary: defaultThemeSeeds.OrangePunch.colorLabelTertiary,
      colorBgBase: defaultThemeSeeds.OrangePunch.colorBgBase,
    },
  });

  console.log('Seed completed successfully');
  console.log('Created user:', initialUser.id);
  console.log('Created organization:', initialTeam.id);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
