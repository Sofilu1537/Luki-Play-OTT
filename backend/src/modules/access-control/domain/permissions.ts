import { UserRole } from '../../auth/domain/entities/user.entity';

/**
 * Static mapping from each {@link UserRole} to its granted permission strings.
 *
 * Permission format: `<scope>:<resource>` or `<scope>:<resource>:<action>`.
 * The `cms:*` wildcard grants all CMS permissions.
 */
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.SUPERADMIN]: [
    'cms:*',
    'cms:users:read',
    'cms:users:write',
    'cms:content:read',
    'cms:content:write',
    'cms:analytics:read',
    'cms:settings:read',
    'cms:settings:write',
    'app:playback',
    'app:profiles',
  ],
  [UserRole.SOPORTE]: [
    'cms:users:read',
    'cms:content:read',
    'cms:analytics:read',
  ],
  [UserRole.CLIENTE]: ['app:playback', 'app:profiles'],
};

/**
 * Returns the list of permissions granted to the given role.
 *
 * @param role - The user role to look up.
 * @returns Array of permission strings, empty if role is unknown.
 */
export function getPermissionsForRole(role: UserRole): string[] {
  return ROLE_PERMISSIONS[role] ?? [];
}