import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { SubscriptionService } from '../subscription.service';

/**
 * SubscriptionAccessGuard
 *
 * Attaches to subscriber-facing app endpoints. Reads `req.user.id` (set by
 * JwtAuthGuard) and verifies the customer has an ACTIVE or valid GRACE_PERIOD
 * subscription before allowing the request through.
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard, SubscriptionAccessGuard)
 *   @Get('stream/:id')
 *   getStream(...) {}
 */
@Injectable()
export class SubscriptionAccessGuard implements CanActivate {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ user?: { id?: string } }>();
    const userId = request.user?.id;

    if (!userId) {
      throw new ForbiddenException('Authentication required');
    }

    const access = await this.subscriptionService.checkAccess(userId);

    if (!access.hasAccess) {
      throw new ForbiddenException(
        access.reason ?? 'Subscription inactive or suspended',
      );
    }

    // Attach access info to request for downstream use (e.g. entitlement checks)
    (request as any).subscriptionAccess = access;

    return true;
  }
}
