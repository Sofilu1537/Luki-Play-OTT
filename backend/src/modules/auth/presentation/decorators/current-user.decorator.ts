import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../../domain/interfaces/token.service';

/**
 * Parameter decorator that extracts the JWT payload from the request.
 *
 * Usage: `@CurrentUser() user: JwtPayload`
 *
 * @remarks Requires an active {@link JwtAuthGuard} on the route.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest<{ user: JwtPayload }>();
    return request.user;
  },
);