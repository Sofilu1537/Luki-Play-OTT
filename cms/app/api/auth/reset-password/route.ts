import { NextRequest, NextResponse } from 'next/server';
import { backendPost } from '@/lib/auth/api';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ message: 'Cuerpo inválido.' }, { status: 400 });

  const result = await backendPost('/auth/cms/reset-password', body);
  if (result.error) return NextResponse.json({ message: result.error }, { status: result.status });
  return NextResponse.json({ message: 'Contraseña actualizada.' });
}
