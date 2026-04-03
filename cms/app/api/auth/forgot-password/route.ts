import { NextRequest, NextResponse } from 'next/server';
import { backendPost } from '@/lib/auth/api';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.email) return NextResponse.json({ message: 'Correo requerido.' }, { status: 400 });

  await backendPost('/auth/cms/forgot-password', { email: body.email });
  // Always return 200 — anti-enumeration
  return NextResponse.json({ message: 'Si el correo está registrado, recibirás las instrucciones en breve.' });
}
