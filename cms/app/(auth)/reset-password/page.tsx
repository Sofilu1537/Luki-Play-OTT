'use client';
import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import AuthShell from '@/components/cms/AuthShell';
import AuthInput from '@/components/cms/AuthInput';
import AuthButton from '@/components/cms/AuthButton';

const C = { text: '#EFF6FF', textSec: '#94A3B8', muted: '#3F5475', rose: '#F43F5E' };

const PASS_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/;

function PasswordStrength({ password }: { password: string }) {
  const score = [password.length >= 12, /[A-Z]/.test(password), /[0-9]/.test(password), PASS_REGEX.test(password)].filter(Boolean).length;
  const labels = ['', 'Débil', 'Regular', 'Fuerte', 'Muy fuerte'];
  const colors = ['', '#F43F5E', '#FBBF24', '#22D3EE', '#10B981'];
  if (!password) return null;
  return (
    <div style={{ marginTop: 8, marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= score ? colors[score] : 'rgba(255,255,255,0.08)', transition: 'background 0.2s' }} />
        ))}
      </div>
      <span style={{ color: colors[score], fontSize: 11, fontWeight: 600 }}>{labels[score]}</span>
    </div>
  );
}

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <p style={{ color: C.rose, marginBottom: 16 }}>El enlace es inválido o ha expirado.</p>
        <Link href="/forgot-password" style={{ color: '#7B5EF8', fontSize: 14 }}>Solicitar un nuevo enlace</Link>
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
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) { setApiError(data.message ?? 'No se pudo actualizar la contraseña.'); return; }
      router.replace('/login?reset=1');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: C.text, fontSize: 22, fontWeight: 900, letterSpacing: -0.5, marginBottom: 8 }}>
          Nueva contraseña
        </h1>
        <p style={{ color: C.textSec, fontSize: 13, lineHeight: 1.6 }}>
          Elige una contraseña segura de al menos 12 caracteres con mayúsculas, números y caracteres especiales.
        </p>
      </div>
      <form onSubmit={handleSubmit} noValidate>
        <AuthInput label="Nueva contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} autoFocus />
        <PasswordStrength password={password} />
        <AuthInput label="Confirmar contraseña" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.confirm} />
        {apiError && (
          <div style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: C.rose, fontSize: 13 }}>
            {apiError}
          </div>
        )}
        <AuthButton type="submit" loading={loading} loadingText="Actualizando…">Actualizar contraseña</AuthButton>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <Suspense fallback={<p style={{ color: '#94A3B8' }}>Cargando…</p>}>
        <ResetForm />
      </Suspense>
    </AuthShell>
  );
}
