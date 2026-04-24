import { SetMetadata } from '@nestjs/common';

export const AUDIENCE_KEY = 'audience';

/**
 * Metadata decorator restricting a route to specific JWT audiences.
 *
 * Usage: `@RequireAudience(Audience.CMS)`
 *
 * Evaluated by {@link AudienceGuard}.
 */
export const RequireAudience = (...audiences: string[]) =>
  SetMetadata(AUDIENCE_KEY, audiences);
