import { NextRequest, NextResponse } from 'next/server';

// Paths that do not require the refresh cookie to be present
const PUBLIC_PATHS = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/first-access',
  '/activate-account',
  '/api/auth',
  '/api/backend', // ← proxy routes: NestJS validates JWT on its own
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths and static files
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p)) || pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  // For protected CMS routes, verify refresh cookie exists as a proxy for session
  // (Full JWT verification happens in the layout server component via /api/auth/refresh)
  const refreshCookie = req.cookies.get(process.env.SESSION_COOKIE_NAME ?? 'luki_rt');
  if (!refreshCookie) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
