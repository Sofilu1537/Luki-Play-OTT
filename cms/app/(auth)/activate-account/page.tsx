'use client';
import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AuthShell from '@/components/cms/AuthShell';
import AuthInput from '@/components/cms/AuthInput';
import AuthButton from '@/components/cms/AuthButton';

const C = { text: '#FAF6E7', textSec: '#CBC2B2', muted: '#9E9E9E', rose: '#D1105A', green: '#17D1C6', accent: '#FFB800' };
const PASS_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

// ---------------------------------------------------------------------------
// Step 1 — Verify email + code
// ---------------------------------------------------------------------------

function ActivateForm() {
  const router = useRouter();
  const params = useSearchParams();

  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 fields
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [code, setCode] = useState('');
  const [errors1, setErrors1] = useState<{ email?: string; code?: string }>({});

  // Step 2 fields
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors2, setErrors2] = useState<{ password?: string; confirm?: string }>({});

  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // ---- Step 1 validation ---------------------------------------------------
  function validateStep1() {
    const errs: typeof errors1 = {};
    if (!email.trim()) errs.email = 'El correo es obligatorio.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Ingresa un correo válido.';
    if (!code.trim()) errs.code = 'El código de activación es obligatorio.';
    return errs;
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setApiError('');
    const errs = validateStep1();
    setErrors1(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/validate-activation-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: code.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) { setApiError(data.message ?? 'Código inválido o expirado.'); return; }
      setStep(2);
    } finally {
      setLoading(false);
    }
  }

  // ---- Step 2 validation ---------------------------------------------------
  function validateStep2() {
    const errs: typeof errors2 = {};
    if (!password) errs.password = 'La contraseña es obligatoria.';
    else if (password.length < 8) errs.password = 'Mínimo 8 caracteres.';
    else if (!PASS_REGEX.test(password)) errs.password = 'Debe incluir mayúsculas, minúsculas y números.';
    if (password !== confirm) errs.confirm = 'Las contraseñas no coinciden.';
    return errs;
  }

  async function handleActivate(e: FormEvent) {
    e.preventDefault();
    setApiError('');
    const errs = validateStep2();
    setErrors2(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/activate-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: code.trim().toUpperCase(),
          newPassword: password,
          confirmPassword: confirm,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setApiError(data.message ?? 'No se pudo activar la cuenta.'); return; }
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  // ---- Done state ----------------------------------------------------------
  if (done) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'rgba(23,209,198,0.12)', border: '1px solid rgba(23,209,198,0.32)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke={C.green} strokeWidth="1.6"/>
            <path d="m8.5 12 2.5 2.5 4.5-5" stroke={C.green} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 style={{ color: C.text, fontSize: 22, fontWeight: 900, marginBottom: 10 }}>¡Cuenta activada!</h1>
        <p style={{ color: C.textSec, fontSize: 13, lineHeight: 1.6, marginBottom: 28 }}>
          Tu cuenta ha sido activada correctamente. Ya puedes iniciar sesión con tu contraseña.
        </p>
        <button
          onClick={() => router.replace('/login')}
          style={{
            width: '100%', padding: '13px 0', borderRadius: 10,
            background: C.accent, border: 'none',
            color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer',
          }}
        >
          Ir al inicio de sesión
        </button>
      </div>
    );
  }

  // ---- Step 1 — Email + código -------------------------------------------
  if (step === 1) {
    return (
      <div>
        <div style={{ marginBottom: 8 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'rgba(255,184,0,0.1)', border: '1px solid rgba(123,94,248,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 20, fontSize: 20,
          }}>🔐</div>
          <h1 style={{ color: C.text, fontSize: 22, fontWeight: 900, letterSpacing: -0.5, marginBottom: 8 }}>
            Activa tu cuenta
          </h1>
          <p style={{ color: C.textSec, fontSize: 13, lineHeight: 1.6, marginBottom: 28 }}>
            Ingresa tu correo y el código de activación que recibiste para continuar.
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {[1, 2].map((s) => (
            <div key={s} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: step >= s ? C.accent : 'rgba(255,255,255,0.1)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        <form onSubmit={handleVerify} noValidate>
          <AuthInput
            label="Correo electrónico"
            type="email"
            placeholder="tu@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors1.email}
            autoFocus
          />
          <AuthInput
            label="Código de activación"
            type="text"
            placeholder="Ej: A1B2C3D4"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            error={errors1.code}
          />
          {apiError && (
            <div style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: C.rose, fontSize: 13 }}>
              {apiError}
            </div>
          )}
          <AuthButton type="submit" loading={loading} loadingText="Verificando…">
            Verificar código
          </AuthButton>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, color: C.muted, fontSize: 13 }}>
          <Link href="/login" style={{ color: C.accent, textDecoration: 'none' }}>← Volver al inicio de sesión</Link>
        </p>
      </div>
    );
  }

  // ---- Step 2 — Nueva contraseña -----------------------------------------
  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: 'rgba(255,184,0,0.1)', border: '1px solid rgba(123,94,248,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20, fontSize: 20,
        }}>🔑</div>
        <h1 style={{ color: C.text, fontSize: 22, fontWeight: 900, letterSpacing: -0.5, marginBottom: 8 }}>
          Define tu contraseña
        </h1>
        <p style={{ color: C.textSec, fontSize: 13, lineHeight: 1.6, marginBottom: 28 }}>
          Elige una contraseña segura para proteger tu acceso al panel.
        </p>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
        {[1, 2].map((s) => (
          <div key={s} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: step >= s ? C.accent : 'rgba(255,255,255,0.1)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>

      <form onSubmit={handleActivate} noValidate>
        <AuthInput
          label="Nueva contraseña"
          type="password"
          placeholder="Mínimo 8 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors2.password}
          autoFocus
        />
        <AuthInput
          label="Confirmar contraseña"
          type="password"
          placeholder="Repite la contraseña"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={errors2.confirm}
        />
        {apiError && (
          <div style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: C.rose, fontSize: 13 }}>
            {apiError}
          </div>
        )}
        <AuthButton type="submit" loading={loading} loadingText="Activando cuenta…">
          Activar cuenta
        </AuthButton>
      </form>

      <p style={{ textAlign: 'center', marginTop: 16, color: C.muted, fontSize: 13 }}>
        <button
          onClick={() => { setStep(1); setApiError(''); setErrors2({}); }}
          style={{ background: 'none', border: 'none', color: C.accent, cursor: 'pointer', fontSize: 13 }}
        >← Volver al paso anterior</button>
      </p>
    </div>
  );
}

export default function ActivateAccountPage() {
  return (
    <AuthShell>
      <Suspense fallback={<p style={{ color: '#94A3B8' }}>Cargando…</p>}>
        <ActivateForm />
      </Suspense>
    </AuthShell>
  );
}
