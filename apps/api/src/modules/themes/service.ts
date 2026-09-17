import db from '@/lib/db';

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
} as const;

export async function getThemesForOrganization(orgId: string) {
  const themes = await db.query.theme.findMany({
    where: (t, { and, eq }) =>
      and(eq(t.organizationId, orgId), eq(t.isDefault, false)),
    columns: themeFields,
  });

  const defaultThemes = await db.query.theme.findMany({
    where: (t, { eq }) => eq(t.isDefault, true),
    columns: themeFields,
  });

  return [...defaultThemes, ...themes];
}
