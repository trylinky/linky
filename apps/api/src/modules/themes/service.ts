import prisma from '@/lib/prisma';

const themeFields = {
  id: true,
  isDefault: true,
  name: true,
  font: true,
  backgroundImage: true,
  colorBgBase: true,
  colorBgPrimary: true,
  colorBgSecondary: true,
  colorBorderPrimary: true,
  colorLabelPrimary: true,
  colorLabelSecondary: true,
  colorLabelTertiary: true,
  colorTitlePrimary: true,
  colorTitleSecondary: true,
};

export async function getThemesForOrganization(orgId: string) {
  const themes = await prisma.theme.findMany({
    where: {
      organizationId: orgId,
      isDefault: false,
    },
    select: themeFields,
  });

  const defaultThemes = await prisma.theme.findMany({
    where: {
      isDefault: true,
    },
    select: themeFields,
  });

  return [...defaultThemes, ...themes];
}
