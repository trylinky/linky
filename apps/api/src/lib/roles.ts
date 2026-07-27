/**
 * Site-wide user role, stored on User.role as a bare string.
 *
 * The value has to match better-auth's admin plugin, which defaults to
 * `adminRoles: ['admin']` - lowercase. A stray 'ADMIN' comparison meant the
 * page-limit bypass never fired for admins.
 *
 * Note this is distinct from Member.role ('owner' | 'admin' | 'member'), which
 * is a role *within* an organization.
 */
export const ADMIN_USER_ROLE = 'admin';

export function isAdminUser(
  user: { role?: string | null } | null | undefined
): boolean {
  return user?.role === ADMIN_USER_ROLE;
}
