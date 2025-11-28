import { defaultThemeSeeds } from '../../../apps/frontend/lib/theme';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
