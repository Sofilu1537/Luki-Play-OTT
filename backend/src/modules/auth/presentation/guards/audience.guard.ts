import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AUDIENCE_KEY } from '../decorators/audience.decorator';

/**
 * Guard that validates the JWT audience claim against the
 * audiences required by the `@RequireAudience()` decorator.
 *
 * Throws {@link ForbiddenException} when the audience does not match.
 * Passes through if no `@RequireAudience()` metadata is set.
 */
@Injectable()
export class AudienceGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredAudiences = this.reflector.getAllAndOverride<string[]>(
      AUDIENCE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredAudiences || requiredAudiences.length === 0) {
      return true;
    }
    const { user } = context
      .switchToHttp()
      .getRequest<{ user: { aud: string } }>();
    if (!requiredAudiences.includes(user?.aud)) {
      throw new ForbiddenException('Access denied for this audience context');
    }
    return true;
  }
}
