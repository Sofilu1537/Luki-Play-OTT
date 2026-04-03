import { NextRequest, NextResponse } from 'next/server';
import { backendPost } from '@/lib/auth/api';
import { setRefreshCookie } from '@/lib/auth/cookies';

interface AuthTokens { accessToken: string; refreshToken: string; }

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ message: 'Cuerpo inválido.' }, { status: 400 });

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? req.ip ?? '';
  const result = await backendPost<AuthTokens>('/auth/cms/login', { ...body, deviceId: 'web' });

  if (result.error || !result.data) {
    return NextResponse.json({ message: result.error }, { status: result.status });
  }

  // Store refresh token in HTTP-only cookie — never exposed to client JS
  setRefreshCookie(result.data.refreshToken);

  // Return only access token to client
  return NextResponse.json({ accessToken: result.data.accessToken });
}
