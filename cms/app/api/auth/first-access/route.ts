import { NextRequest, NextResponse } from 'next/server';
import { backendPost } from '@/lib/auth/api';
import { setRefreshCookie } from '@/lib/auth/cookies';

interface AuthTokens { accessToken: string; refreshToken: string; }

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ message: 'Cuerpo inválido.' }, { status: 400 });

  const result = await backendPost<AuthTokens>('/auth/cms/first-access', { ...body, deviceId: 'web' });
  if (result.error || !result.data) {
    return NextResponse.json({ message: result.error }, { status: result.status });
  }

  setRefreshCookie(result.data.refreshToken);
  return NextResponse.json({ accessToken: result.data.accessToken });
}
