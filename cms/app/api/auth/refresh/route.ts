import { NextResponse } from 'next/server';
import { getRefreshCookie, setRefreshCookie, clearRefreshCookie } from '@/lib/auth/cookies';
import { backendPost } from '@/lib/auth/api';

interface AuthTokens { accessToken: string; refreshToken: string; }

export async function POST() {
  const refreshToken = getRefreshCookie();
  if (!refreshToken) {
    return NextResponse.json({ message: 'No hay sesión activa.' }, { status: 401 });
  }

  const result = await backendPost<AuthTokens>('/auth/refresh', { refreshToken });

  if (result.error || !result.data) {
    clearRefreshCookie();
    return NextResponse.json({ message: result.error }, { status: result.status });
  }

  setRefreshCookie(result.data.refreshToken);
  return NextResponse.json({ accessToken: result.data.accessToken });
}
