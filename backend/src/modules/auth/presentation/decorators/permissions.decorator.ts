import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Metadata decorator specifying which permissions are required for a route.
 *
 * Usage: `@Permissions('cms:users:read', 'cms:content:write')`
 *
 * Evaluated by {@link PermissionsGuard} with wildcard support.
 */
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
