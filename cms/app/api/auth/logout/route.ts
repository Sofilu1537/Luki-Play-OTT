import { NextRequest, NextResponse } from 'next/server';
import { getRefreshCookie, clearRefreshCookie } from '@/lib/auth/cookies';
import { backendPost } from '@/lib/auth/api';

export async function POST(req: NextRequest) {
  const accessToken = req.headers.get('authorization')?.replace('Bearer ', '');
  const refreshToken = getRefreshCookie();

  if (accessToken && refreshToken) {
    await backendPost('/auth/logout', { refreshToken }).catch(() => null);
  }

  clearRefreshCookie();
  return NextResponse.json({ message: 'Sesión cerrada.' });
}
