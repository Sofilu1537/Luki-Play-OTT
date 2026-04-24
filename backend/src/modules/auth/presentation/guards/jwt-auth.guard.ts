import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard that enforces JWT bearer token authentication via Passport.
 *
 * Apply with `@UseGuards(JwtAuthGuard)` on controllers or handlers.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
