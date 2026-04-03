import { Module } from '@nestjs/common';
import { RolesGuard } from '../auth/presentation/guards/roles.guard';
import { PermissionsGuard } from '../auth/presentation/guards/permissions.guard';
import { AudienceGuard } from '../auth/presentation/guards/audience.guard';

/**
 * Provides role-based, permission-based, and audience-based access control guards.
 *
 * Exported guards:
 * - {@link RolesGuard} — validates the user’s role against `@Roles()` metadata
 * - {@link PermissionsGuard} — validates individual permissions with wildcard support
 * - {@link AudienceGuard} — ensures the JWT audience matches `@RequireAudience()` metadata
 */
@Module({
  providers: [RolesGuard, PermissionsGuard, AudienceGuard],
  exports: [RolesGuard, PermissionsGuard, AudienceGuard],
})
export class AccessControlModule {}