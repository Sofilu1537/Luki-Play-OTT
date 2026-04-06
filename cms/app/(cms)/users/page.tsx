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
  fechaInicio: string;
  fechaFin: string;
  sesiones: number;
  contrato: string | null;
  status: string;
  role: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(d: string) {
  return d ? d.slice(0, 10) : '—';
}

function initials(name: string) {
  return name.split(' ').map((w) => w[0] ?? '').join('').toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = ['#5B5BD6', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function statusLabel(s: string) {
  if (!s) return { label: '—', color: C.muted };
  const u = s.toUpperCase();
  if (u === 'ACTIVE' || u === 'ACTIVO') return { label: 'Activo', color: C.green };
  if (u === 'SUSPENDED' || u === 'SUSPENDIDO') return { label: 'Suspendido', color: C.amber };
  return { label: 'Inactivo', color: C.rose };
}

// ---------------------------------------------------------------------------
// API helpers (calls the NestJS backend via Next.js rewrite proxy)
// ---------------------------------------------------------------------------

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
// Edit User Modal
// ---------------------------------------------------------------------------

const STATUS_OPTIONS = [
  { label: 'Activo',     value: 'active' },
  { label: 'Suspendido', value: 'suspended' },
  { label: 'Inactivo',   value: 'inactive' },
];

function EditUserModal({
  user,
  token,
  onClose,
  onUpdated,
}: {
  user: AdminUser | null;
  token: string;
  onClose: () => void;
  onUpdated: (u: AdminUser) => void;
}) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [status, setStatus] = useState('active');
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    setNombre(user.nombre);
    setEmail(user.email);
    setTelefono(user.telefono ?? '');
    setStatus(user.status?.toLowerCase() ?? 'active');
    setError('');
    setSuccess('');
  }, [user]);

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose();
  };

  const handleSave = async () => {
    if (!nombre.trim() || !email.trim()) { setError('Nombre y email son requeridos.'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      const updated = await apiFetch<AdminUser>(`/admin/users/${user!.id}`, token, {
        method: 'PATCH',
        body: JSON.stringify({ nombre, email, telefono, status }),
      });
      onUpdated(updated);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar cambios.');
    } finally { setSaving(false); }
  };

  const handleGeneratePassword = async () => {
    setResetting(true); setError(''); setSuccess('');
    try {
      const res = await apiFetch<{ message: string }>(`/admin/users/${user!.id}/generate-password`, token, { method: 'POST' });
      setSuccess(res.message);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al generar contraseña.');
    } finally { setResetting(false); }
  };

  if (!user) return null;

  const isAbonado = user.role?.toLowerCase() === 'cliente';

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div style={{
        background: 'linear-gradient(160deg, rgba(22,22,22,0.98), rgba(14,14,14,0.98))',
        border: `1px solid ${C.border}`,
        borderRadius: 20,
        width: '100%',
        maxWidth: 540,
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '28px 28px 24px',
        boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h2 style={{ color: C.text, fontSize: 18, fontWeight: 800, margin: 0, marginBottom: 4 }}>Editar usuario</h2>
            <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>Refactor OTT por dominios: identidad, seguridad, sesiones y negocio.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 4 }}
          >✕</button>
        </div>

        {/* Información básica */}
        <section style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: '18px 18px 14px', border: `1px solid ${C.border}`, marginBottom: 12 }}>
          <p style={{ color: C.text, fontWeight: 700, fontSize: 14, margin: '0 0 2px' }}>Información básica</p>
          <p style={{ color: C.muted, fontSize: 12, margin: '0 0 16px' }}>Identidad principal del usuario o abonado.</p>

          {/* Tipo de usuario */}
          <label style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: 1, display: 'block', marginBottom: 8 }}>TIPO DE USUARIO</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['Abonado', 'Interno'].map((t) => {
              const active = t === 'Abonado' ? isAbonado : !isAbonado;
              return (
                <div key={t} style={{
                  flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: 10,
                  background: active ? C.accent : 'transparent',
                  border: `1px solid ${active ? C.accent : C.border}`,
                  color: active ? '#000' : C.muted,
                  fontWeight: 700, fontSize: 13,
                }}>{t}</div>
              );
            })}
          </div>

          <label style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: 1, display: 'block', marginBottom: 6 }}>NOMBRE COMPLETO</label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            style={inputStyle}
          />

          <label style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: 1, display: 'block', marginBottom: 6 }}>EMAIL</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />

          <label style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: 1, display: 'block', marginBottom: 6 }}>TELÉFONO</label>
          <input
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            style={{ ...inputStyle, marginBottom: 0 }}
          />
        </section>

        {/* Acceso y seguridad */}
        <section style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: '18px 18px 14px', border: `1px solid ${C.border}`, marginBottom: 12 }}>
          <p style={{ color: C.text, fontWeight: 700, fontSize: 14, margin: '0 0 2px' }}>Acceso y seguridad</p>
          <p style={{ color: C.muted, fontSize: 12, margin: '0 0 16px' }}>Autorización, estado y políticas básicas de acceso.</p>

          {/* Rol info */}
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 14px', marginBottom: 16, border: `1px solid ${C.border}` }}>
            <p style={{ color: C.text, fontWeight: 700, fontSize: 13, margin: '0 0 4px' }}>Rol de abonado</p>
            <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>Los abonados usan el rol de negocio Cliente y no admiten edición manual de autorización.</p>
          </div>

          {/* Estado */}
          <label style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: 1, display: 'block', marginBottom: 8 }}>ESTADO</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatus(opt.value)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10, cursor: 'pointer',
                  background: status === opt.value ? C.accent : 'transparent',
                  border: `1px solid ${status === opt.value ? C.accent : C.border}`,
                  color: status === opt.value ? '#000' : C.muted,
                  fontWeight: 700, fontSize: 13,
                }}
              >{opt.label}</button>
            ))}
          </div>

          {/* Generate password */}
          <label style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: 1, display: 'block', marginBottom: 8 }}>CONTRASEÑA</label>
          <button
            onClick={handleGeneratePassword}
            disabled={resetting}
            style={{
              width: '100%', padding: '12px 0', borderRadius: 10, cursor: resetting ? 'wait' : 'pointer',
              background: 'rgba(255,198,41,0.08)',
              border: `1px solid ${C.accentBorder}`,
              color: C.accent, fontWeight: 700, fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: resetting ? 0.7 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {resetting ? 'Generando y enviando…' : 'Generar y enviar contraseña por email'}
          </button>
          <p style={{ color: C.muted, fontSize: 11, marginTop: 6, marginBottom: 0 }}>
            Se generará una contraseña segura de 16 caracteres y se enviará al correo del usuario. Se marcará para cambio obligatorio al próximo inicio de sesión.
          </p>
        </section>

        {/* Feedback */}
        {error && (
          <div style={{ background: 'rgba(255,122,89,0.10)', border: `1px solid rgba(255,122,89,0.28)`, borderRadius: 10, padding: '10px 14px', marginBottom: 12, color: C.rose, fontSize: 13 }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ background: 'rgba(155,191,99,0.10)', border: `1px solid rgba(155,191,99,0.28)`, borderRadius: 10, padding: '10px 14px', marginBottom: 12, color: C.green, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
              <path d="m8.5 12 2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {success}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: '12px 0', borderRadius: 10, cursor: 'pointer', background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, fontWeight: 700, fontSize: 13 }}
          >Cancelar</button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ flex: 1, padding: '12px 0', borderRadius: 10, cursor: saving ? 'wait' : 'pointer', background: C.accent, border: 'none', color: '#000', fontWeight: 800, fontSize: 13, opacity: saving ? 0.7 : 1 }}
          >{saving ? 'Guardando…' : 'Guardar cambios'}</button>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.05)',
  border: `1px solid ${C.border}`,
  borderRadius: 9,
  color: C.text,
  fontSize: 14,
  padding: '10px 12px',
  marginBottom: 14,
  outline: 'none',
  boxSizing: 'border-box',
};

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function UsersPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pageErr, setPageErr] = useState('');

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const data = await apiFetch<AdminUser[]>('/admin/users', accessToken);
      setUsers(data);
    } catch (err: unknown) {
      setPageErr(err instanceof Error ? err.message : 'Error al cargar usuarios.');
    } finally { setLoading(false); }
  }, [accessToken]);

  useEffect(() => { void load(); }, [load]);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return !q || u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.contrato ?? '').toLowerCase().includes(q);
  });

  const handleDelete = async (id: string) => {
    if (!accessToken) return;
    if (!confirm('¿Eliminar este usuario?')) return;
    setDeletingId(id);
    try {
      await apiFetch(`/admin/users/${id}`, accessToken, { method: 'DELETE' });
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch { /* ignore */ } finally { setDeletingId(null); }
  };

  const handleUpdated = (updated: AdminUser) => {
    setUsers((prev) => prev.map((u) => u.id === updated.id ? updated : u));
  };

  const exportCSV = () => {
    const header = 'Nombre,Email,Teléfono,Plan,Estado,Contrato,Fecha Inicio,Fecha Fin\n';
    const rows = filtered.map((u) =>
      [u.nombre, u.email, u.telefono ?? '', u.plan, u.status, u.contrato ?? '', u.fechaInicio, u.fechaFin].join(',')
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'usuarios.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const thStyle: React.CSSProperties = { color: C.muted, fontSize: 10, fontWeight: 800, letterSpacing: 0.8, textAlign: 'left', padding: '10px 12px', whiteSpace: 'nowrap' };
  const tdStyle: React.CSSProperties = { padding: '12px 12px', fontSize: 13, color: C.textSec, whiteSpace: 'nowrap' };

  return (
    <CmsShell title="Usuarios">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ color: C.text, fontSize: 22, fontWeight: 900, margin: 0 }}>Usuarios</h1>
          <p style={{ color: C.muted, fontSize: 13, margin: '4px 0 0' }}>{users.length} usuarios registrados</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={exportCSV}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, background: 'rgba(155,191,99,0.12)', border: `1px solid rgba(155,191,99,0.28)`, color: C.green, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 3v13m0 0-4-4m4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 10, padding: '0 12px' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke={C.muted} strokeWidth="1.8"/>
            <path d="m16 16 4 4" stroke={C.muted} strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email o contrato…"
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: C.text, fontSize: 13, padding: '10px 0' }}
          />
        </div>
      </div>

      {/* Error */}
      {pageErr && (
        <div style={{ background: 'rgba(255,122,89,0.1)', border: `1px solid rgba(255,122,89,0.28)`, borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: C.rose, fontSize: 13 }}>
          {pageErr}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: C.muted, fontSize: 14 }}>Cargando usuarios…</div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: 14, border: `1px solid ${C.border}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: `1px solid ${C.border}` }}>
                <th style={thStyle}>ACCIONES</th>
                <th style={thStyle}>NOMBRE</th>
                <th style={thStyle}>EMAIL</th>
                <th style={thStyle}>PLAN</th>
                <th style={thStyle}>ESTADO</th>
                <th style={thStyle}>CONTRATO</th>
                <th style={thStyle}>F. INICIO</th>
                <th style={thStyle}>F. FIN</th>
                <th style={thStyle}>SES.</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '48px 0', color: C.muted, fontSize: 14 }}>Sin resultados</td>
                </tr>
              ) : filtered.map((user, idx) => {
                const color = avatarColor(user.nombre);
                const sl = statusLabel(user.status);
                return (
                  <tr
                    key={user.id}
                    style={{ borderBottom: `1px solid ${C.border}`, background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.017)' }}
                  >
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {/* Edit */}
                        <button
                          onClick={() => setEditing(user)}
                          title="Editar usuario"
                          style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,198,41,0.1)', border: `1px solid ${C.accentBorder}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke={C.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" stroke={C.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(user.id)}
                          disabled={deletingId === user.id}
                          title="Eliminar usuario"
                          style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,122,89,0.1)', border: `1px solid rgba(255,122,89,0.28)`, cursor: deletingId === user.id ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: deletingId === user.id ? 0.5 : 1 }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <polyline points="3 6 5 6 21 6" stroke={C.rose} strokeWidth="1.8" strokeLinecap="round"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke={C.rose} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ color: '#fff', fontSize: 10, fontWeight: 800 }}>{initials(user.nombre)}</span>
                        </div>
                        <span style={{ color: C.text, fontWeight: 600, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.nombre}</span>
                      </div>
                    </td>
                    <td style={{ ...tdStyle, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</td>
                    <td style={tdStyle}>
                      <span style={{ background: 'rgba(255,198,41,0.1)', border: `1px solid ${C.accentBorder}`, borderRadius: 6, padding: '3px 8px', color: C.accent, fontSize: 11, fontWeight: 700 }}>{user.plan}</span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ color: sl.color, fontWeight: 700, fontSize: 12 }}>● {sl.label}</span>
                    </td>
                    <td style={{ ...tdStyle, color: C.muted }}>{user.contrato ?? '—'}</td>
                    <td style={{ ...tdStyle, color: C.muted }}>{fmt(user.fechaInicio)}</td>
                    <td style={{ ...tdStyle, color: C.muted }}>{fmt(user.fechaFin)}</td>
                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, color: C.text }}>{user.sesiones}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <p style={{ color: C.muted, fontSize: 12, textAlign: 'center', marginTop: 14 }}>
          Mostrando {filtered.length} de {users.length} usuarios
        </p>
      )}

      {/* Edit modal */}
      {editing && (
        <EditUserModal
          user={editing}
          token={accessToken ?? ''}
          onClose={() => setEditing(null)}
          onUpdated={handleUpdated}
        />
      )}
    </CmsShell>
  );
}
