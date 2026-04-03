import { cookies } from 'next/headers';

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? 'luki_rt';

export function setRefreshCookie(refreshToken: string) {
  cookies().set(COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/api/auth',
  });
}

export function getRefreshCookie(): string | undefined {
  return cookies().get(COOKIE_NAME)?.value;
}

export function clearRefreshCookie() {
  cookies().delete(COOKIE_NAME);
}
