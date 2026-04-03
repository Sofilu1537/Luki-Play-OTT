'use client';
import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AuthShell from '@/components/cms/AuthShell';
import AuthInput from '@/components/cms/AuthInput';
import AuthButton from '@/components/cms/AuthButton';
import { useAuthStore, parseJwtPayload } from '@/stores/authStore';

const C = { text: '#EFF6FF', textSec: '#94A3B8', muted: '#3F5475', rose: '#F43F5E', accent: '#7B5EF8' };
const PASS_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/;

function FirstAccessForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const setSession = useAuthStore((s) => s.setSession);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <p style={{ color: C.rose, marginBottom: 16 }}>El enlace de activación es inválido o ha expirado.</p>
        <Link href="/login" style={{ color: C.accent, fontSize: 14 }}>Ir al inicio de sesión</Link>
      </div>
    );
  }

  function validate() {
    const errs: typeof errors = {};
    if (!password) errs.password = 'La contraseña es obligatoria.';
    else if (password.length < 12) errs.password = 'Mínimo 12 caracteres.';
    else if (!PASS_REGEX.test(password)) errs.password = 'Debe incluir mayúsculas, minúsculas, números y caracteres especiales.';
    if (password !== confirm) errs.confirm = 'Las contraseñas no coinciden.';
    return errs;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setApiError('');
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/first-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) { setApiError(data.message ?? 'No se pudo activar la cuenta.'); return; }
      const user = parseJwtPayload(data.accessToken);
      if (!user) { setApiError('Error en la respuesta del servidor.'); return; }
      setSession(data.accessToken, user);
      router.replace('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: 'rgba(123,94,248,0.1)', border: '1px solid rgba(123,94,248,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20, fontSize: 20,
        }}>🔑</div>
        <h1 style={{ color: C.text, fontSize: 22, fontWeight: 900, letterSpacing: -0.5, marginBottom: 8 }}>
          Activa tu cuenta
        </h1>
        <p style={{ color: C.textSec, fontSize: 13, lineHeight: 1.6, marginBottom: 28 }}>
          Es tu primer ingreso. Define una contraseña segura para proteger tu acceso al panel administrativo.
        </p>
      </div>
      <form onSubmit={handleSubmit} noValidate>
        <AuthInput label="Nueva contraseña" type="password" placeholder="Mínimo 12 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} autoFocus />
        <AuthInput label="Confirmar contraseña" type="password" placeholder="Repite la contraseña" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.confirm} />
        {apiError && (
          <div style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: C.rose, fontSize: 13 }}>
            {apiError}
          </div>
        )}
        <AuthButton type="submit" loading={loading} loadingText="Activando cuenta…">Activar cuenta</AuthButton>
      </form>
    </div>
  );
}

export default function FirstAccessPage() {
  return (
    <AuthShell>
      <Suspense fallback={<p style={{ color: '#94A3B8' }}>Cargando…</p>}>
        <FirstAccessForm />
      </Suspense>
    </AuthShell>
  );
}
