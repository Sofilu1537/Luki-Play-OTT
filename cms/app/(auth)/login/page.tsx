'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthShell from '@/components/cms/AuthShell';
import AuthInput from '@/components/cms/AuthInput';
import AuthButton from '@/components/cms/AuthButton';
import { useAuthStore, parseJwtPayload } from '@/stores/authStore';

const C = {
  text: '#EFF6FF', textSec: '#94A3B8', muted: '#3F5475',
  accent: '#7B5EF8', rose: '#F43F5E', border: 'rgba(255,255,255,0.06)',
};

function validate(email: string, password: string) {
  const errs: { email?: string; password?: string } = {};
  if (!email) errs.email = 'El correo es obligatorio.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Ingresa un correo válido.';
  if (!password) errs.password = 'La contraseña es obligatoria.';
  return errs;
}

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setApiError('');
    const errs = validate(email.trim(), password);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setApiError(data.message ?? 'Error al iniciar sesión.');
        return;
      }
      const user = parseJwtPayload(data.accessToken);
      if (!user) { setApiError('Respuesta inválida del servidor.'); return; }
      setSession(data.accessToken, user);
      router.replace('/dashboard');
    } catch {
      setApiError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ color: C.text, fontSize: 24, fontWeight: 900, letterSpacing: -0.5, marginBottom: 6 }}>
            Bienvenido de vuelta
          </h1>
          <p style={{ color: C.muted, fontSize: 13 }}>Panel administrativo · Acceso restringido</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <AuthInput
            label="Correo electrónico"
            type="email"
            placeholder="tu@lukiplay.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            autoComplete="email"
            autoFocus
          />

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
              <span style={{ color: C.textSec, fontSize: 12, fontWeight: 600, letterSpacing: 0.5 }}>Contraseña</span>
              <Link
                href="/forgot-password"
                style={{ color: C.accent, fontSize: 12, textDecoration: 'none' }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
              >
                ¿Olvidó su contraseña?
              </Link>
            </div>
            <AuthInput
              label=""
              type="password"
              placeholder="Tu contraseña segura"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              autoComplete="current-password"
            />
          </div>

          {apiError && (
            <div style={{
              background: 'rgba(244,63,94,0.08)',
              border: '1px solid rgba(244,63,94,0.25)',
              borderRadius: 8,
              padding: '10px 14px',
              marginBottom: 16,
              color: C.rose,
              fontSize: 13,
            }}>
              {apiError}
            </div>
          )}

          <AuthButton type="submit" loading={loading} loadingText="Verificando…">
            Ingresar al CMS
          </AuthButton>
        </form>
      </div>
    </AuthShell>
  );
}
