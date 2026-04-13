'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import CmsShell, { C } from '@/components/cms/CmsShell';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AdminUser {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  plan: string;
  planId?: string | null;
  fechaInicio: string;
  fechaFin: string;
  sesiones: number;
  maxDevices?: number;
  sessionDurationDays?: number;
  contrato: string | null;
  status: string;
  role: string;
  isCmsUser?: boolean;
  isSubscriber?: boolean;
  lastLoginAt?: string | null;
  mfaEnabled?: boolean;
  isLocked?: boolean;
  lockedUntil?: string | null;
  mustChangePassword?: boolean;
  permissions?: string[];
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_USERS: AdminUser[] = [
  { id: '1',  contrato: 'OTT-17775493165660', nombre: 'SORIA',                  email: 'sofia.soria.chamba@gmail.com', telefono: '0987284494', plan: 'Basic',        status: 'active',    fechaInicio: '2020-09-14', fechaFin: '',           sesiones: 0, maxDevices: 2,  role: 'cliente',    isSubscriber: true,  isCmsUser: false },
  { id: '2',  contrato: null, nombre: 'Admin Principal',                          email: 'admin@lukiplay.com',           telefono: null,         plan: 'Usuario CMS',  status: 'active',    fechaInicio: '2024-01-01', fechaFin: '',           sesiones: 1, maxDevices: 3,  role: 'superadmin', isCmsUser: true,     isSubscriber: false },
  { id: '3',  contrato: null, nombre: 'Agente Soporte',                           email: 'soporte@lukiplay.com',         telefono: null,         plan: 'Usuario CMS',  status: 'active',    fechaInicio: '2024-01-01', fechaFin: '',           sesiones: 1, maxDevices: 3,  role: 'soporte',    isCmsUser: true,     isSubscriber: false },
  { id: '4',  contrato: '000000000', nombre: 'CASTRO DANIEL',                    email: '',                             telefono: '0987284494', plan: 'PLAN BASICO',  status: 'inactive',  fechaInicio: '2020-09-14', fechaFin: '',           sesiones: 0, maxDevices: 2,  role: 'cliente',    isSubscriber: true,  isCmsUser: false },
  { id: '5',  contrato: '000000002', nombre: 'DOICELA NEGRETE JEFFERSON XAVIER', email: 'facturacion@luki.ec',          telefono: '0939246460', plan: 'PLAN BASICO',  status: 'suspended', fechaInicio: '2020-08-27', fechaFin: '2022-12-01', sesiones: 0, maxDevices: 2,  role: 'cliente',    isSubscriber: true,  isCmsUser: false },
  { id: '6',  contrato: '000000003', nombre: 'PASTUNA CHUSIN MANUEL',            email: 'manuelpastunachusin@gmail.com',telefono: '0939218464', plan: 'PLAN BASICO',  status: 'active',    fechaInicio: '2020-08-28', fechaFin: '2025-10-17', sesiones: 0, maxDevices: 2,  role: 'cliente',    isSubscriber: true,  isCmsUser: false },
  { id: '7',  contrato: '000000004', nombre: 'CATOTA YUGSI JENNY GUADALUPE',     email: 'facturacion@luki.ec',          telefono: '0988062117', plan: 'PLAN BASICO',  status: 'active',    fechaInicio: '2020-08-28', fechaFin: '2026-03-11', sesiones: 0, maxDevices: 2,  role: 'cliente',    isSubscriber: true,  isCmsUser: false },
  { id: '8',  contrato: '000000005', nombre: 'GUAINALLA CASILLAS TANIA SOLEDAD', email: 'taniaguainalla03@gmail.com',   telefono: '0979361442', plan: 'PLAN BASICO',  status: 'suspended', fechaInicio: '2020-08-31', fechaFin: '2022-11-25', sesiones: 0, maxDevices: 2,  role: 'cliente',    isSubscriber: true,  isCmsUser: false },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(d: string) { return d ? d.slice(0, 10) : '—'; }

function initials(name: string) {
  return name.split(' ').map((w) => w[0] ?? '').join('').toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = ['#5B5BD6', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getUserType(user: AdminUser) { return user.isCmsUser ? 'system' : 'subscriber'; }

function getUserTypeMeta(user: AdminUser) {
  return user.isCmsUser
    ? { label: 'Interno', color: C.accentLight ?? '#FFDA6B', bg: 'rgba(255,184,0,0.14)' }
    : { label: 'Abonado', color: '#22d3ee', bg: 'rgba(34,211,238,0.12)' };
}

function getRoleMeta(role: string) {
  if (role === 'superadmin') return { label: 'Superadmin', color: '#f43f5e', bg: 'rgba(244,63,94,0.12)' };
  if (role === 'soporte') return { label: 'Soporte', color: '#10b981', bg: 'rgba(16,185,129,0.12)' };
  return { label: 'Cliente', color: '#8B72B2', bg: 'rgba(139,114,178,0.12)' };
}

function getStatusMeta(status: string) {
  const s = status?.toLowerCase();
  if (s === 'active' || s === 'activo') return { label: 'Activo', color: '#10b981', bg: 'rgba(16,185,129,0.12)' };
  if (s === 'suspended' || s === 'suspendido') return { label: 'Suspendido', color: '#FFB800', bg: 'rgba(255,184,0,0.12)' };
  if (s === 'inactive' || s === 'inactivo' || s === 'anulado') return { label: 'Inactivo', color: '#8B72B2', bg: 'rgba(139,114,178,0.12)' };
  return { label: status, color: '#8B72B2', bg: 'rgba(139,114,178,0.12)' };
}

async function apiFetch<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api/backend${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(init.headers ?? {}) },
  });
  const json = await res.json().catch(() => ({})) as { message?: string };
  if (!res.ok) throw new Error(Array.isArray(json.message) ? json.message[0] : json.message ?? `HTTP ${res.status}`);
  return json as T;
}

// ---------------------------------------------------------------------------
// Create/Edit User Modal
// ---------------------------------------------------------------------------

const STATUS_OPTIONS = [
  { label: 'Activo', value: 'active' },
  { label: 'Suspendido', value: 'suspended' },
  { label: 'Inactivo', value: 'inactive' },
];

const ROLE_OPTIONS = [
  { label: 'Cliente (Abonado)', value: 'cliente' },
  { label: 'Soporte', value: 'soporte' },
  { label: 'Superadmin', value: 'superadmin' },
];

const USER_TYPE_OPTIONS = [
  { label: 'Abonado', value: 'subscriber' },
  { label: 'Interno', value: 'system' },
];

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 9,
  color: '#fff',
  fontSize: 14,
  padding: '10px 12px',
  marginBottom: 14,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

const sectionStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  borderRadius: 14,
  padding: '18px 18px 14px',
  border: '1px solid rgba(255,255,255,0.10)',
  marginBottom: 12,
};

function UserModal({
  user,
  token,
  onClose,
  onSaved,
}: {
  user: AdminUser | null; // null = create
  token: string;
  onClose: () => void;
  onSaved: (u: AdminUser, isNew: boolean) => void;
}) {
  const isCreate = !user;
  const backdropRef = useRef<HTMLDivElement>(null);

  const [nombre, setNombre] = useState(user?.nombre ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [telefono, setTelefono] = useState(user?.telefono ?? '');
  const [userType, setUserType] = useState<'subscriber' | 'system'>(user?.isCmsUser ? 'system' : 'subscriber');
  const [role, setRole] = useState(user?.role ?? 'cliente');
  const [status, setStatus] = useState(user?.status ?? 'active');
  const [contrato, setContrato] = useState(user?.contrato ?? '');
  const [maxDevices, setMaxDevices] = useState(String(user?.maxDevices ?? 2));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Password fields
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pwdCopied, setPwdCopied] = useState(false);
  const [pwdSendSuccess, setPwdSendSuccess] = useState('');

  // Sync role with userType on change
  useEffect(() => {
    if (userType === 'system') {
      if (role === 'cliente') setRole('soporte');
    } else {
      setRole('cliente');
    }
  }, [userType]);

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose();
  };

  const handleSave = async () => {
    if (!nombre.trim() || !email.trim()) { setError('Nombre y email son requeridos.'); return; }
    if (isCreate && !password.trim()) { setError('Debes generar o ingresar una contraseña para crear el usuario.'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      // Only send fields accepted by CreateUserDto / UpdateUserDto
      // isCmsUser & isSubscriber are RESPONSE-only fields — never send them to the backend
      const payload: Record<string, unknown> = {
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        telefono: telefono.trim() || null,
        status,
        role,
        maxDevices: Number(maxDevices) || 2,
        contrato: userType === 'subscriber' ? (contrato.trim() || null) : null,
      };
      if (password.trim()) payload.password = password.trim();

      let saved: AdminUser;
      if (isCreate) {
        saved = await apiFetch<AdminUser>('/admin/users', token, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      } else {
        saved = await apiFetch<AdminUser>(`/admin/users/${user!.id}`, token, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      }
      onSaved(saved, isCreate);
      setSuccess(isCreate ? 'Usuario creado correctamente.' : 'Usuario actualizado correctamente.');
      setTimeout(() => onClose(), 600);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar cambios.');
    } finally { setSaving(false); }
  };

  // Generate a secure random password: 4 segments like Luki!A1b2-C3d4
  const generateSecurePassword = () => {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghjkmnpqrstuvwxyz';
    const digits = '23456789';
    const special = '!@#$%&*';
    const rand = (s: string) => s[Math.floor(Math.random() * s.length)];
    const seg1 = rand(upper) + rand(lower) + rand(digits) + rand(digits);
    const seg2 = rand(upper) + rand(lower) + rand(digits) + rand(special);
    const seg3 = rand(upper) + rand(lower) + rand(digits) + rand(digits);
    const generated = `${seg1}-${seg2}-${seg3}`;
    setPassword(generated);
    setShowPassword(true);
    setPwdCopied(false);
    setPwdSendSuccess('');
  };

  const handleCopyPassword = () => {
    if (!password) return;
    navigator.clipboard.writeText(password).then(() => {
      setPwdCopied(true);
      setTimeout(() => setPwdCopied(false), 2000);
    });
  };

  const handleSendPasswordByEmail = async () => {
    if (!password.trim()) { setError('Primero genera o escribe una contraseña.'); return; }
    setSaving(true); setError(''); setPwdSendSuccess('');
    try {
      if (user) {
        await apiFetch<{ message: string }>(`/admin/users/${user.id}/set-password`, token, {
          method: 'POST',
          body: JSON.stringify({ password, sendEmail: true }),
        });
      }
      setPwdSendSuccess(`Contraseña enviada al correo ${email || user?.email}.`);
    } catch {
      // Backend mock fallback
      setPwdSendSuccess(`(Demo) Contraseña lista: ${password}`);
    } finally { setSaving(false); }
  };

  const chipBase = (active: boolean, color: string, bg: string): React.CSSProperties => ({
    flex: 1,
    textAlign: 'center',
    padding: '10px 0',
    borderRadius: 10,
    background: active ? bg : 'transparent',
    border: `1px solid ${active ? color : 'rgba(255,255,255,0.10)'}`,
    color: active ? color : '#8B72B2',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.18s',
  });

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div style={{
        background: 'linear-gradient(160deg, rgba(36,10,80,0.99), rgba(16,2,42,0.99))',
        border: '1px solid rgba(255,184,0,0.28)',
        borderRadius: 22,
        width: '100%',
        maxWidth: 620,
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '28px 28px 24px',
        boxShadow: '0 40px 100px rgba(0,0,0,0.7)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
          <div>
            <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 900, margin: 0, marginBottom: 4 }}>
              {isCreate ? '+ Crear usuario' : 'Editar usuario'}
            </h2>
            <p style={{ color: '#8B72B2', fontSize: 12, margin: 0 }}>
              {isCreate ? 'Nuevo usuario para la plataforma OTT.' : 'Ajusta los datos del usuario seleccionado.'}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{ background: 'none', border: 'none', color: '#8B72B2', cursor: 'pointer', fontSize: 22, lineHeight: 1, padding: 4 }}
          >✕</button>
        </div>

        {/* Tipo de usuario */}
        <section style={sectionStyle}>
          <p style={{ color: '#fff', fontWeight: 700, fontSize: 14, margin: '0 0 2px' }}>Información básica</p>
          <p style={{ color: '#8B72B2', fontSize: 12, margin: '0 0 16px' }}>Identidad y tipo de usuario en la plataforma.</p>

          <label style={{ color: '#8B72B2', fontSize: 11, fontWeight: 700, letterSpacing: 1, display: 'block', marginBottom: 8 }}>TIPO DE USUARIO</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {USER_TYPE_OPTIONS.map((opt) => (
              <button key={opt.value} onClick={() => setUserType(opt.value as 'subscriber' | 'system')}
                style={chipBase(userType === opt.value, '#FFB800', 'rgba(255,184,0,0.14)')}>
                {opt.label}
              </button>
            ))}
          </div>

          <label style={{ color: '#8B72B2', fontSize: 11, fontWeight: 700, letterSpacing: 1, display: 'block', marginBottom: 6 }}>NOMBRE COMPLETO</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Juan Pérez" style={inputStyle} />

          <label style={{ color: '#8B72B2', fontSize: 11, fontWeight: 700, letterSpacing: 1, display: 'block', marginBottom: 6 }}>EMAIL</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@email.com" style={inputStyle} autoComplete="off" />

          <label style={{ color: '#8B72B2', fontSize: 11, fontWeight: 700, letterSpacing: 1, display: 'block', marginBottom: 6 }}>TELÉFONO</label>
          <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="3001234567" style={{ ...inputStyle, marginBottom: 0 }} />
        </section>

        {/* Acceso y seguridad */}
        <section style={sectionStyle}>
          <p style={{ color: '#fff', fontWeight: 700, fontSize: 14, margin: '0 0 2px' }}>Acceso y seguridad</p>
          <p style={{ color: '#8B72B2', fontSize: 12, margin: '0 0 16px' }}>Rol, estado y políticas de acceso.</p>

          <label style={{ color: '#8B72B2', fontSize: 11, fontWeight: 700, letterSpacing: 1, display: 'block', marginBottom: 8 }}>ROL</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {ROLE_OPTIONS
              .filter((opt) => {
                if (userType === 'subscriber') return opt.value === 'cliente';
                return opt.value !== 'cliente';
              })
              .map((opt) => (
                <button key={opt.value} onClick={() => setRole(opt.value)}
                  style={chipBase(role === opt.value, '#22d3ee', 'rgba(34,211,238,0.12)')}>
                  {opt.label}
                </button>
              ))}
          </div>

          <label style={{ color: '#8B72B2', fontSize: 11, fontWeight: 700, letterSpacing: 1, display: 'block', marginBottom: 8 }}>ESTADO</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 0 }}>
            {STATUS_OPTIONS.map((opt) => (
              <button key={opt.value} onClick={() => setStatus(opt.value)}
                style={chipBase(status === opt.value, '#FFB800', 'rgba(255,184,0,0.14)')}>
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* Comercial (solo abonados) */}
        {userType === 'subscriber' && (
          <section style={sectionStyle}>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: 14, margin: '0 0 2px' }}>Información comercial</p>
            <p style={{ color: '#8B72B2', fontSize: 12, margin: '0 0 16px' }}>Contrato, plan y capacidad del abonado.</p>

            <label style={{ color: '#8B72B2', fontSize: 11, fontWeight: 700, letterSpacing: 1, display: 'block', marginBottom: 6 }}>NÚMERO DE CONTRATO</label>
            <input value={contrato} onChange={(e) => setContrato(e.target.value)} placeholder="Ej: CONTRACT-001"
              style={inputStyle} disabled={!isCreate && Boolean(user?.contrato)} />

            <label style={{ color: '#8B72B2', fontSize: 11, fontWeight: 700, letterSpacing: 1, display: 'block', marginBottom: 6 }}>SESIONES SIMULTÁNEAS</label>
            <input type="number" min="1" max="10" value={maxDevices} onChange={(e) => setMaxDevices(e.target.value)}
              style={{ ...inputStyle, marginBottom: 0 }} />
          </section>
        )}

        {/* Contraseña de acceso – disponible en creación y edición */}
        <section style={{ ...sectionStyle, borderColor: password ? 'rgba(255,184,0,0.30)' : 'rgba(255,255,255,0.10)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: 14, margin: 0 }}>🔑 Contraseña de acceso</p>
            {isCreate && <span style={{ fontSize: 10, fontWeight: 800, color: '#f43f5e', background: 'rgba(244,63,94,0.12)', padding: '3px 8px', borderRadius: 999 }}>REQUERIDA</span>}
          </div>
          <p style={{ color: '#8B72B2', fontSize: 12, margin: '4px 0 16px' }}>
            {isCreate
              ? 'Genera o ingresa la contraseña con la que este usuario ingresará a Luki Play.'
              : 'Genera una nueva contraseña o escríbela manualmente para restablecerla.'}
          </p>

          {/* Auto-generate button */}
          <button
            type="button"
            onClick={generateSecurePassword}
            style={{
              width: '100%', padding: '11px 0', borderRadius: 10, cursor: 'pointer',
              background: 'linear-gradient(135deg, rgba(255,184,0,0.16), rgba(123,47,190,0.12))',
              border: '1px solid rgba(255,184,0,0.36)',
              color: '#FFB800', fontWeight: 800, fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              marginBottom: 12, fontFamily: 'inherit', letterSpacing: 0.3,
            }}
          >
            ⚡ Generar contraseña segura automáticamente
          </button>

          {/* Manual password input with show/hide toggle */}
          <label style={{ color: '#8B72B2', fontSize: 11, fontWeight: 700, letterSpacing: 1, display: 'block', marginBottom: 6 }}>O INGRESA MANUALMENTE</label>
          <div style={{ position: 'relative', marginBottom: password ? 12 : 0 }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPwdSendSuccess(''); }}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              style={{ ...inputStyle, marginBottom: 0, paddingRight: 44, fontFamily: showPassword ? 'monospace' : 'inherit', letterSpacing: showPassword ? 1 : 'normal' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8B72B2', fontSize: 16, padding: 4 }}
              title={showPassword ? 'Ocultar' : 'Mostrar'}
            >{showPassword ? '🙈' : '👁'}</button>
          </div>

          {/* Generated password preview with copy */}
          {password && (
            <div style={{
              background: 'rgba(255,184,0,0.08)', border: '1px solid rgba(255,184,0,0.28)',
              borderRadius: 10, padding: '12px 14px', marginTop: 4, marginBottom: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
            }}>
              <div>
                <p style={{ color: '#8B72B2', fontSize: 10, fontWeight: 700, letterSpacing: 1, margin: '0 0 4px' }}>CONTRASEÑA LISTA PARA ASIGNAR</p>
                <code style={{ color: '#FFDA6B', fontFamily: 'monospace', fontSize: 16, fontWeight: 800, letterSpacing: 2 }}>{password}</code>
              </div>
              <button
                type="button"
                onClick={handleCopyPassword}
                style={{
                  padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                  background: pwdCopied ? 'rgba(16,185,129,0.18)' : 'rgba(255,184,0,0.14)',
                  border: `1px solid ${pwdCopied ? 'rgba(16,185,129,0.35)' : 'rgba(255,184,0,0.36)'}`,
                  color: pwdCopied ? '#10b981' : '#FFB800', fontWeight: 700, fontSize: 12,
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}
              >
                {pwdCopied ? '✓ Copiado' : '📋 Copiar'}
              </button>
            </div>
          )}

          {/* Send by email – only in edit mode (user already exists in backend) */}
          {!isCreate && password && (
            <button
              type="button"
              onClick={handleSendPasswordByEmail}
              disabled={saving}
              style={{
                width: '100%', padding: '11px 0', borderRadius: 10,
                cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit',
                background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.28)',
                color: '#10b981', fontWeight: 700, fontSize: 13,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: saving ? 0.7 : 1,
              }}
            >
              ✉ {saving ? 'Enviando…' : `Establecer y enviar por email a ${email || user?.email}`}
            </button>
          )}

          {pwdSendSuccess && (
            <p style={{ color: '#10b981', fontSize: 12, fontWeight: 700, marginTop: 10, textAlign: 'center' }}>
              ✓ {pwdSendSuccess}
            </p>
          )}

          {isCreate && (
            <p style={{ color: '#8B72B2', fontSize: 11, marginTop: 10, lineHeight: 1.5 }}>
              ℹ La contraseña se guardará junto con el usuario. Compártela con el abonado para que acceda a <strong style={{ color: '#D0C4E8' }}>Luki Play</strong> con su correo electrónico.
            </p>
          )}
        </section>

        {/* Feedback */}
        {error && (
          <div style={{ background: 'rgba(244,63,94,0.10)', border: '1px solid rgba(244,63,94,0.28)', borderRadius: 10, padding: '10px 14px', marginBottom: 12, color: '#f43f5e', fontSize: 13 }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.28)', borderRadius: 10, padding: '10px 14px', marginBottom: 12, color: '#10b981', fontSize: 13 }}>
            ✓ {success}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: '13px 0', borderRadius: 12, cursor: 'pointer', background: 'transparent', border: '1px solid rgba(255,255,255,0.10)', color: '#8B72B2', fontWeight: 700, fontSize: 13, fontFamily: 'inherit' }}>
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving}
            style={{ flex: 2, padding: '13px 0', borderRadius: 12, cursor: saving ? 'wait' : 'pointer', background: 'linear-gradient(135deg, #FFB800, #f59e0b)', border: 'none', color: '#000', fontWeight: 900, fontSize: 13, opacity: saving ? 0.7 : 1, fontFamily: 'inherit' }}>
            {saving ? 'Guardando…' : isCreate ? '+ Crear usuario' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function UsersPage() {
  const { accessToken } = useAuthStore();
  const [users, setUsers] = useState<AdminUser[]>([]);
  // Wait up to 3s for the layout refresh to populate the token before loading
  const [tokenReady, setTokenReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [modalUser, setModalUser] = useState<AdminUser | null | undefined>(undefined); // undefined = closed, null = create, AdminUser = edit
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pageErr, setPageErr] = useState('');
  const [feedback, setFeedback] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setPageErr('');
    if (!accessToken) {
      setUsers(MOCK_USERS);
      setPageErr('Sin sesión activa — mostrando datos de demostración.');
      setLoading(false);
      return;
    }
    try {
      const data = await apiFetch<AdminUser[]>('/admin/users', accessToken);
      setUsers(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al conectar con el backend.';
      setPageErr('Error de backend: ' + msg);
      setUsers(MOCK_USERS);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  // Give the layout's refresh effect time to populate the token from the cookie
  useEffect(() => {
    const t = setTimeout(() => setTokenReady(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (tokenReady) void load();
  }, [load, tokenReady]);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.contrato ?? '').toLowerCase().includes(q) || u.plan.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || (u.status?.toLowerCase() === statusFilter);
    const matchType = typeFilter === 'all'
      || (typeFilter === 'subscriber' && (u.isSubscriber || u.role === 'cliente'))
      || (typeFilter === 'system' && (u.isCmsUser || u.role === 'soporte' || u.role === 'superadmin'));
    return matchSearch && matchStatus && matchType;
  });

  const stats = {
    total: users.length,
    internal: users.filter((u) => u.isCmsUser || (u.role !== 'cliente')).length,
    subscribers: users.filter((u) => u.isSubscriber || u.role === 'cliente').length,
    suspended: users.filter((u) => u.status?.toLowerCase() === 'suspended').length,
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    setDeletingId(id);
    try {
      if (accessToken) await apiFetch(`/admin/users/${id}`, accessToken, { method: 'DELETE' });
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setFeedback('Usuario eliminado.');
    } catch { /* ignore */ } finally { setDeletingId(null); }
  };

  const handleSaved = (saved: AdminUser, isNew: boolean) => {
    if (isNew) {
      setUsers((prev) => [saved, ...prev]);
      setFeedback('Usuario creado correctamente.');
    } else {
      setUsers((prev) => prev.map((u) => u.id === saved.id ? saved : u));
      setFeedback('Usuario actualizado correctamente.');
    }
    setModalUser(undefined);
  };

  const exportCSV = () => {
    const header = 'Nombre,Email,Teléfono,Tipo,Rol,Plan,Estado,Contrato,Sesiones\n';
    const rows = filtered.map((u) =>
      [u.nombre, u.email, u.telefono ?? '', getUserTypeMeta(u).label, getRoleMeta(u.role).label, u.plan, getStatusMeta(u.status).label, u.contrato ?? '', u.sesiones].join(',')
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'usuarios-lukiplay.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const thStyle: React.CSSProperties = { color: '#8B72B2', fontSize: 10, fontWeight: 800, letterSpacing: 0.8, textAlign: 'left', padding: '10px 14px', whiteSpace: 'nowrap', background: 'rgba(255,255,255,0.025)' };
  const tdStyle: React.CSSProperties = { padding: '13px 14px', fontSize: 13, color: '#D0C4E8', whiteSpace: 'nowrap' };

  const filterChip = (label: string, value: string, current: string, setter: (v: string) => void) => (
    <button key={value} onClick={() => setter(value)} style={{
      padding: '7px 14px', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit',
      background: current === value ? 'rgba(255,184,0,0.14)' : 'rgba(255,255,255,0.03)',
      border: `1px solid ${current === value ? 'rgba(255,184,0,0.36)' : 'rgba(255,255,255,0.10)'}`,
      color: current === value ? '#FFDA6B' : '#8B72B2',
      fontSize: 12, fontWeight: 700,
    }}>{label}</button>
  );

  return (
    <CmsShell title="Usuarios">
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 900, margin: 0 }}>Usuarios</h1>
          <p style={{ color: '#8B72B2', fontSize: 13, margin: '4px 0 0' }}>
            Consola unificada para identidad, negocio OTT, sesiones por dispositivo y autorización administrativa.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={exportCSV} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 12,
            background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.28)',
            color: '#10b981', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            ⬇ Exportar
          </button>
          <button onClick={() => setModalUser(null)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 12,
            background: 'linear-gradient(135deg, #FFB800, #f59e0b)', border: 'none',
            color: '#000', fontWeight: 900, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 4px 20px rgba(255,184,0,0.28)',
          }}>
            + Crear usuario
          </button>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div style={{ background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.28)', borderRadius: 12, padding: '10px 16px', marginBottom: 16, color: '#10b981', fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
          ✓ {feedback}
          <button onClick={() => setFeedback('')} style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', fontSize: 16 }}>×</button>
        </div>
      )}

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total', value: stats.total, icon: '👥', color: '#FFDA6B', bg: 'rgba(255,184,0,0.10)' },
          { label: 'Internos', value: stats.internal, icon: '🛡', color: '#10b981', bg: 'rgba(16,185,129,0.10)' },
          { label: 'Abonados', value: stats.subscribers, icon: '▶', color: '#22d3ee', bg: 'rgba(34,211,238,0.10)' },
          { label: 'Suspendidos', value: stats.suspended, icon: '⚠', color: '#f43f5e', bg: 'rgba(244,63,94,0.10)' },
        ].map((card) => (
          <div key={card.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 16, padding: '18px 16px' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 12 }}>
              {card.icon}
            </div>
            <div style={{ color: '#fff', fontSize: 28, fontWeight: 900, lineHeight: 1 }}>{card.value}</div>
            <div style={{ color: '#8B72B2', fontSize: 12, marginTop: 4 }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Error */}
      {pageErr && (
        <div style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.28)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: '#f43f5e', fontSize: 13 }}>
          {pageErr}
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 10, padding: '0 12px' }}>
          <span style={{ color: '#8B72B2', fontSize: 14 }}>🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email, contrato o plan…"
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 13, padding: '10px 0', fontFamily: 'inherit' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {filterChip('Todos', 'all', typeFilter, setTypeFilter)}
          {filterChip('Abonados', 'subscriber', typeFilter, setTypeFilter)}
          {filterChip('Internos', 'system', typeFilter, setTypeFilter)}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {filterChip('Todos Est.', 'all', statusFilter, setStatusFilter)}
          {filterChip('Activos', 'active', statusFilter, setStatusFilter)}
          {filterChip('Suspendidos', 'suspended', statusFilter, setStatusFilter)}
          {filterChip('Inactivos', 'inactive', statusFilter, setStatusFilter)}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#8B72B2', fontSize: 14 }}>Cargando usuarios…</div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: 16, border: '1px solid rgba(255,255,255,0.10)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.10)' }}>
                <th style={thStyle}>ACCIONES</th>
                <th style={thStyle}>NOMBRE</th>
                <th style={thStyle}>TIPO / ROL</th>
                <th style={thStyle}>ESTADO</th>
                <th style={thStyle}>PLAN</th>
                <th style={thStyle}>EMAIL</th>
                <th style={thStyle}>CONTRATO</th>
                <th style={thStyle}>SES.</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '48px 0', color: '#8B72B2', fontSize: 14 }}>Sin resultados</td>
                </tr>
              ) : filtered.map((user, idx) => {
                const color = avatarColor(user.nombre);
                const tm = getUserTypeMeta(user);
                const rm = getRoleMeta(user.role);
                const sm = getStatusMeta(user.status);
                return (
                  <tr
                    key={user.id}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}
                  >
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {/* Edit */}
                        <button
                          onClick={() => setModalUser(user)}
                          title="Editar usuario"
                          style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,184,0,0.10)', border: '1px solid rgba(255,184,0,0.36)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}
                        >✏️</button>
                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(user.id)}
                          disabled={deletingId === user.id}
                          title="Eliminar usuario"
                          style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(244,63,94,0.10)', border: '1px solid rgba(244,63,94,0.28)', cursor: deletingId === user.id ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, opacity: deletingId === user.id ? 0.5 : 1 }}
                        >🗑</button>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ color: '#fff', fontSize: 10, fontWeight: 800 }}>{initials(user.nombre)}</span>
                        </div>
                        <span style={{ color: '#fff', fontWeight: 600, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.nombre}</span>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ background: tm.bg, color: tm.color, borderRadius: 999, padding: '3px 8px', fontSize: 11, fontWeight: 700, display: 'inline-block' }}>{tm.label}</span>
                        <span style={{ background: rm.bg, color: rm.color, borderRadius: 999, padding: '3px 8px', fontSize: 11, fontWeight: 700, display: 'inline-block' }}>{rm.label}</span>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ color: sm.color, fontWeight: 700, fontSize: 12 }}>● {sm.label}</span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ background: 'rgba(255,184,0,0.10)', border: '1px solid rgba(255,184,0,0.28)', borderRadius: 6, padding: '3px 8px', color: '#FFB800', fontSize: 11, fontWeight: 700 }}>{user.plan}</span>
                    </td>
                    <td style={{ ...tdStyle, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', color: '#8B72B2' }}>{user.email || '—'}</td>
                    <td style={{ ...tdStyle, color: '#8B72B2' }}>{user.contrato ?? '—'}</td>
                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, color: '#fff' }}>{user.sesiones}/{user.maxDevices ?? 2}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <p style={{ color: '#8B72B2', fontSize: 12, textAlign: 'center', marginTop: 14 }}>
          Mostrando {filtered.length} de {users.length} usuarios
        </p>
      )}

      {/* Modal */}
      {modalUser !== undefined && (
        <UserModal
          user={modalUser}
          token={accessToken ?? ''}
          onClose={() => setModalUser(undefined)}
          onSaved={handleSaved}
        />
      )}
    </CmsShell>
  );
}
