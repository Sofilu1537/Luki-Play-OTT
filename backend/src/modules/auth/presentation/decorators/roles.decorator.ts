import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Metadata decorator specifying which roles can access a route.
 *
 * Usage: `@Roles(UserRole.SUPERADMIN, UserRole.SOPORTE)`
 *
 * Evaluated by {@link RolesGuard}.
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);