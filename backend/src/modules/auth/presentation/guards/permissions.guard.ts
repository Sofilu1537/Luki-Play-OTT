import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

/**
 * Guard that checks the authenticated user’s permissions against
 * those required by the `@Permissions()` decorator.
 *
 * Supports wildcard permissions: `cms:*` matches any `cms:<resource>` permission.
 * Passes through if no `@Permissions()` metadata is set.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }
    const { user } = context
      .switchToHttp()
      .getRequest<{ user: { permissions: string[] } }>();
    const userPermissions: string[] = user?.permissions ?? [];

    // Permission matching rules (first match wins):
    //   1. Exact match:            cms:users:read  satisfies  cms:users:read
    //   2. Wildcard suffix:        cms:*           satisfies  cms:users:write
    //   3. Parent module match:    cms:users       satisfies  cms:users:read / cms:users:write
    //      A coarse module permission (e.g. cms:users) is considered to imply
    //      all sub-operation permissions (cms:users:<anything>), because the
    //      CMS roles editor assigns module-level keys, not granular ones.
    return requiredPermissions.every((perm) =>
      userPermissions.some(
        (up: string) =>
          up === perm ||
          (up.endsWith(':*') && perm.startsWith(up.replace(':*', ':'))) ||
          perm.startsWith(up + ':'),
      ),
    );
  }
}
