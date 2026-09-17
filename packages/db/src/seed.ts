import { createDb } from './client';
import { member, organization, theme, user } from './schema';
import { defaultThemeSeeds, type DefaultThemeNames } from './seed-data';

const INITIAL_USER_ID = '62b6a104-6f6e-44e2-b610-801b5e103b29';
const INITIAL_TEAM_ID = '01929fe6-7ade-7dd9-b5ca-26ef831c2914';
const INITIAL_USER_EMAIL = 'hello@lin.ky';
const INITIAL_TEAM_SLUG = 'initial-team';

const themeNames: Record<DefaultThemeNames, string> = {
  Default: 'Default',
  Purple: 'Purple',
  Black: 'Black',
  Forest: 'Forest',
  Lilac: 'Lilac',
  OrangePunch: 'Orange Punch',
};

async function main() {
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DIRECT_URL or DATABASE_URL must be set');
  }

  const { db, close } = createDb({ connectionString });

  try {
    // Every insert is keyed on a fixed id and skipped when a conflict is
    // hit, so the seed can run repeatedly. Databases seeded by the old
    // Prisma seed omitted the id from the user and organization inserts, so
    // they hold this user/organization under a DIFFERENT id, keyed by email
    // and slug instead. Inserting with a target of only `id` would throw on
    // those unique indexes, so the conflict target is left unset (any
    // unique conflict is skipped) and the real id is then resolved by
    // email/slug, so the rest of the seed uses whichever id is actually in
    // the database.
    await db
      .insert(user)
      .values({
        id: INITIAL_USER_ID,
        name: 'Initial User',
        email: INITIAL_USER_EMAIL,
        emailVerified: true,
        role: 'user',
      })
      .onConflictDoNothing();

    const initialUser = await db.query.user.findFirst({
      where: (u, { eq }) => eq(u.email, INITIAL_USER_EMAIL),
    });

    if (!initialUser) {
      throw new Error(`User ${INITIAL_USER_EMAIL} not found after insert`);
    }

    await db
      .insert(organization)
      .values({ id: INITIAL_TEAM_ID, name: 'Initial Team', isPersonal: true, slug: INITIAL_TEAM_SLUG })
      .onConflictDoNothing();

    const initialOrganization = await db.query.organization.findFirst({
      where: (o, { eq }) => eq(o.slug, INITIAL_TEAM_SLUG),
    });

    if (!initialOrganization) {
      throw new Error(`Organization ${INITIAL_TEAM_SLUG} not found after insert`);
    }

    const existingMembership = await db.query.member.findFirst({
      where: (m, { and, eq }) =>
        and(eq(m.userId, initialUser.id), eq(m.organizationId, initialOrganization.id)),
    });

    if (!existingMembership) {
      await db
        .insert(member)
        .values({ userId: initialUser.id, organizationId: initialOrganization.id, role: 'admin' });
    }

    for (const [key, seed] of Object.entries(defaultThemeSeeds) as [DefaultThemeNames, any][]) {
      await db
        .insert(theme)
        .values({
          id: seed.id,
          name: themeNames[key],
          createdById: initialUser.id,
          isDefault: true,
          colorBgBase: seed.colorBgBase,
          colorBgPrimary: seed.colorBgPrimary,
          colorBgSecondary: seed.colorBgSecondary,
          colorBorderPrimary: seed.colorBorderPrimary,
          colorLabelPrimary: seed.colorLabelPrimary,
          colorLabelSecondary: seed.colorLabelSecondary,
          colorLabelTertiary: seed.colorLabelTertiary,
        })
        .onConflictDoNothing();
    }
  } finally {
    await close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
