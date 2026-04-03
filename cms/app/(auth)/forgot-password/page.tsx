'use client';
import { useState, FormEvent } from 'react';
import Link from 'next/link';
import AuthShell from '@/components/cms/AuthShell';
import AuthInput from '@/components/cms/AuthInput';
import AuthButton from '@/components/cms/AuthButton';

const C = { text: '#EFF6FF', textSec: '#94A3B8', muted: '#3F5475', accent: '#7B5EF8', green: '#10B981' };

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }
    setLoading(true);
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      setSent(true); // Always show success — anti-enumeration
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      {sent ? (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(16,185,129,0.12)',
            border: '1px solid rgba(16,185,129,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: 24,
          }}>✓</div>
          <h2 style={{ color: C.text, fontSize: 20, fontWeight: 800, marginBottom: 10 }}>Revisa tu correo</h2>
          <p style={{ color: C.textSec, fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
            Si el correo está registrado en el sistema, recibirás las instrucciones en los próximos minutos.
          </p>
          <Link href="/login" style={{ color: C.accent, fontSize: 14, textDecoration: 'underline' }}>
            Volver al inicio de sesión
          </Link>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: 28 }}>
            <Link href="/login" style={{ color: C.muted, fontSize: 12, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 20 }}>
              ← Volver
            </Link>
            <h1 style={{ color: C.text, fontSize: 22, fontWeight: 900, letterSpacing: -0.5, marginBottom: 8 }}>
              Recuperar acceso
            </h1>
            <p style={{ color: C.textSec, fontSize: 13, lineHeight: 1.6 }}>
              Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
            </p>
          </div>
          <form onSubmit={handleSubmit} noValidate>
            <AuthInput
              label="Correo electrónico"
              type="email"
              placeholder="tu@lukiplay.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
              autoFocus
            />
            <AuthButton type="submit" loading={loading} loadingText="Enviando…">
              Enviar instrucciones
            </AuthButton>
          </form>
        </div>
      )}
    </AuthShell>
  );
}
