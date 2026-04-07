'use client';
import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import CmsShell, { C } from '@/components/cms/CmsShell';

/* ═══════════════════════════════════════════════════════════════════
   LUKI PLAY — Módulo de Planes OTT
   Diseño premium: violeta profundo + dorado, estilo Categorías
   ═══════════════════════════════════════════════════════════════════ */

/* ── Local deep-purple visual layer ──────────────────────────────── */
const V = {
  // page
  pageBg:      'linear-gradient(180deg, #08001a 0%, #0d0025 50%, #08001a 100%)',
  // cards
  cardBg:      'linear-gradient(170deg, #0e0330 0%, #160742 45%, #220e58 100%)',
  cardBorder:  'rgba(96,38,158,0.26)',
  cardHover:   'rgba(255,198,41,0.22)',
  // metric boxes
  metricBg:    'rgba(14,3,48,0.7)',
  metricBdr:   'rgba(96,38,158,0.22)',
  // banner
  bannerBg:    'linear-gradient(135deg, #130540 0%, #1c0960 50%, #260e6e 100%)',
  bannerBdr:   'rgba(167,139,250,0.22)',
  // purple shades
  purple:      '#A78BFA',
  purpleBg:    'rgba(167,139,250,0.12)',
  purpleBdr:   'rgba(167,139,250,0.26)',
  purpleMuted: '#7c6aaf',
  // gold CTA
  ctaBg:       'linear-gradient(135deg, rgba(255,198,41,0.14), rgba(255,198,41,0.04))',
  ctaBdr:      'rgba(255,198,41,0.32)',
  // glow
  glowGold:    '0 0 24px rgba(255,198,41,0.18)',
  glowPurple:  '0 0 30px rgba(123,94,248,0.14)',
  // surface
  insetBg:     'rgba(255,255,255,0.025)',
  insetBdr:    'rgba(255,255,255,0.05)',
};

/* ── Types ───────────────────────────────────────────────────────── */

interface OttPlan {
  id: string;
  nombre: string;
  descripcion: string;
  grupoUsuarios: string;
  precio: number;
  moneda: string;
  duracionDias: number;
  activo: boolean;
  maxDevices: number;
  maxConcurrentStreams: number;
  maxProfiles: number;
  videoQuality: string;
  allowDownloads: boolean;
  allowCasting: boolean;
  hasAds: boolean;
  trialDays: number;
  gracePeriodDays: number;
  entitlements: string[];
  allowedComponentIds: string[];
  allowedCategoryIds: string[];
}

/* ── Constants ───────────────────────────────────────────────────── */

const GROUP_LABEL: Record<string, string> = {
  INDIVIDUAL: 'Individual', FAMILIAR: 'Familiar',
  ISP_BUNDLE: 'ISP Bundle', EMPRESARIAL: 'Empresarial', PROMOCIONAL: 'Promo',
};

const ENT_LABEL: Record<string, string> = {
  'live-tv': 'TV en vivo', 'vod-basic': 'VOD básico', 'vod-premium': 'VOD premium',
  series: 'Series', kids: 'Kids', sports: 'Deportes', radio: 'Radio',
  '4k': '4K UHD', downloads: 'Descargas', ppv: 'PPV',
};

const QUALITY_ORDER: Record<string, number> = { SD: 1, HD: 2, FHD: 3, '4K': 4 };

/* ── API helper ──────────────────────────────────────────────────── */

async function apiFetch<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api/backend${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(init.headers ?? {}) },
  });
  const json = await res.json().catch(() => ({})) as { message?: string };
  if (!res.ok) throw new Error(Array.isArray(json.message) ? json.message[0] : json.message ?? `HTTP ${res.status}`);
  return json as T;
}

/* ═══════════════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════════════ */

/* ── Plan Card ───────────────────────────────────────────────────── */

function PlanCard({ plan, onEdit, onToggle, onDelete }: {
  plan: OttPlan;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [hov, setHov] = useState(false);
  const price = plan.precio === 0 ? 'Gratis' : `$${plan.precio.toFixed(2)}`;
  const features: string[] = [];
  if (plan.allowCasting) features.push('Casting');
  if (plan.allowDownloads) features.push('Descargas');
  features.push(plan.hasAds ? 'Con anuncios' : 'Sin anuncios');
  if (plan.trialDays > 0) features.push(`${plan.trialDays}d trial`);
  if (plan.gracePeriodDays > 0) features.push(`${plan.gracePeriodDays}d gracia`);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: V.cardBg,
        border: `1.5px solid ${hov ? V.cardHover : V.cardBorder}`,
        borderRadius: 20,
        display: 'flex', flexDirection: 'column',
        transition: 'all 0.28s cubic-bezier(0.22,1,0.36,1)',
        transform: hov ? 'translateY(-4px)' : 'none',
        boxShadow: hov
          ? `0 20px 50px rgba(10,0,40,0.55), ${V.glowGold}`
          : `0 6px 24px rgba(10,0,40,0.3), ${V.glowPurple}`,
        overflow: 'hidden',
      }}
    >
      {/* ── Header: badges + actions ── */}
      <div style={{ padding: '16px 18px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{
            padding: '4px 11px', borderRadius: 6, fontSize: 10, fontWeight: 800, letterSpacing: 0.6,
            background: plan.activo ? 'rgba(155,191,99,0.16)' : 'rgba(255,122,89,0.14)',
            color: plan.activo ? C.green : C.rose,
            border: `1px solid ${plan.activo ? 'rgba(155,191,99,0.30)' : 'rgba(255,122,89,0.28)'}`,
          }}>{plan.activo ? 'ACTIVO' : 'INACTIVO'}</span>
          <span style={{
            padding: '4px 11px', borderRadius: 6, fontSize: 10, fontWeight: 800, letterSpacing: 0.6,
            background: V.purpleBg, color: V.purple, border: `1px solid ${V.purpleBdr}`,
          }}>{GROUP_LABEL[plan.grupoUsuarios] ?? plan.grupoUsuarios}</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={onEdit} title="Editar" style={{
            width: 30, height: 30, borderRadius: 10, background: 'rgba(167,139,250,0.10)',
            border: `1px solid ${V.purpleBdr}`, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z" stroke={V.purple} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button onClick={onDelete} title="Eliminar" style={{
            width: 30, height: 30, borderRadius: 10, background: 'rgba(255,122,89,0.10)',
            border: '1px solid rgba(255,122,89,0.22)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2m1 0v12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V6" stroke={C.rose} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: '14px 18px 0', flex: 1 }}>
        {/* Name */}
        <h3 style={{ margin: 0, fontFamily: 'Sora, sans-serif', fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: -0.4 }}>{plan.nombre}</h3>
        <p style={{ color: C.textSec, fontSize: 13, lineHeight: 1.5, marginTop: 4, marginBottom: 14 }}>{plan.descripcion}</p>

        {/* Price */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 16 }}>
          <span style={{ fontFamily: 'Sora, sans-serif', fontSize: 30, fontWeight: 800, color: C.accent, letterSpacing: -1 }}>{price}</span>
          <span style={{ color: C.muted, fontSize: 12, fontWeight: 600 }}>{plan.moneda} / {plan.duracionDias} días</span>
        </div>

        {/* Limits row */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          {[
            { icon: '⊡', val: plan.maxDevices, label: 'dispositivos' },
            { icon: '◉', val: plan.maxConcurrentStreams, label: 'streams' },
            { icon: '♟', val: plan.maxProfiles, label: 'perfiles' },
          ].map(({ icon, val, label }) => (
            <span key={label} style={{
              padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
              background: V.insetBg, border: `1px solid ${V.insetBdr}`, color: C.textSec,
            }}>{icon} {val} {label}</span>
          ))}
        </div>

        {/* Quality badge */}
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
          background: (QUALITY_ORDER[plan.videoQuality] ?? 0) >= 3 ? V.purpleBg : V.insetBg,
          color: (QUALITY_ORDER[plan.videoQuality] ?? 0) >= 3 ? V.purple : C.textSec,
          border: `1px solid ${(QUALITY_ORDER[plan.videoQuality] ?? 0) >= 3 ? V.purpleBdr : V.insetBdr}`,
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M9 19h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          {plan.videoQuality}
        </span>

        {/* Entitlements */}
        {plan.entitlements.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <p style={{ color: C.muted, fontSize: 10, fontWeight: 800, letterSpacing: 1.4, marginBottom: 8 }}>ENTITLEMENTS</p>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {plan.entitlements.map((e) => (
                <span key={e} style={{
                  padding: '4px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700,
                  background: V.purpleBg, color: V.purple, border: `1px solid ${V.purpleBdr}`,
                }}>{ENT_LABEL[e] ?? e}</span>
              ))}
            </div>
          </div>
        )}

        {/* Metrics row: components + categories */}
        <div style={{ display: 'flex', marginTop: 16, borderRadius: 12, overflow: 'hidden', border: `1px solid ${V.metricBdr}` }}>
          {[
            { label: 'COMPONENTES', val: plan.allowedComponentIds.length },
            { label: 'CATEGORÍAS', val: plan.allowedCategoryIds.length },
          ].map(({ label, val }, i) => (
            <div key={label} style={{
              flex: 1, padding: '10px 14px',
              background: V.metricBg,
              borderLeft: i > 0 ? `1px solid ${V.metricBdr}` : 'none',
            }}>
              <p style={{ color: C.muted, fontSize: 9, fontWeight: 800, letterSpacing: 1.2, marginBottom: 3 }}>{label}</p>
              <p style={{ color: C.accent, fontFamily: 'Sora, sans-serif', fontSize: 20, fontWeight: 700 }}>{val}</p>
            </div>
          ))}
        </div>

        {/* Feature tags */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 12, marginBottom: 14 }}>
          {features.map((f) => (
            <span key={f} style={{
              padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 700,
              background: V.insetBg, color: C.textSec, border: `1px solid ${V.insetBdr}`,
            }}>{f}</span>
          ))}
        </div>
      </div>

      {/* ── Footer CTA ── */}
      <div
        onClick={onToggle}
        style={{
          margin: '0 14px 14px', padding: '14px 18px', borderRadius: 14, cursor: 'pointer',
          background: plan.activo ? V.ctaBg : 'rgba(155,191,99,0.06)',
          border: `1px solid ${plan.activo ? V.ctaBdr : 'rgba(155,191,99,0.22)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          transition: 'all 0.2s ease',
        }}
      >
        <div>
          <p style={{ color: plan.activo ? C.accent : C.green, fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
            {plan.activo ? 'Desactivar plan' : 'Activar plan'}
          </p>
          <p style={{ color: C.muted, fontSize: 11 }}>
            {plan.activo ? 'Suspender acceso para nuevos usuarios' : 'Habilitar contratación de este plan'}
          </p>
        </div>
        <span style={{ fontSize: 16, color: plan.activo ? C.accent : C.green }}>→</span>
      </div>
    </div>
  );
}

/* ── Edit/Create Modal ───────────────────────────────────────────── */

function PlanModal({ plan, token, onClose, onSaved }: {
  plan: OttPlan | null;
  token: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = !plan;
  const [form, setForm] = useState({
    nombre: plan?.nombre ?? '',
    descripcion: plan?.descripcion ?? '',
    grupoUsuarios: plan?.grupoUsuarios ?? 'INDIVIDUAL',
    precio: plan?.precio ?? 0,
    moneda: plan?.moneda ?? 'USD',
    duracionDias: plan?.duracionDias ?? 30,
    maxDevices: plan?.maxDevices ?? 1,
    maxConcurrentStreams: plan?.maxConcurrentStreams ?? 1,
    maxProfiles: plan?.maxProfiles ?? 1,
    videoQuality: plan?.videoQuality ?? 'HD',
    allowDownloads: plan?.allowDownloads ?? false,
    allowCasting: plan?.allowCasting ?? true,
    hasAds: plan?.hasAds ?? false,
    trialDays: plan?.trialDays ?? 0,
    gracePeriodDays: plan?.gracePeriodDays ?? 0,
    entitlements: plan?.entitlements ?? [],
    allowedComponentIds: plan?.allowedComponentIds ?? [],
    allowedCategoryIds: plan?.allowedCategoryIds ?? [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key: string, val: unknown) => setForm((prev) => ({ ...prev, [key]: val }));

  async function handleSave() {
    setSaving(true); setError('');
    try {
      const body = { ...form, activo: plan?.activo ?? true };
      if (isNew) {
        await apiFetch('/admin/planes', token, { method: 'POST', body: JSON.stringify(body) });
      } else {
        await apiFetch(`/admin/planes/${plan.id}`, token, { method: 'PATCH', body: JSON.stringify(body) });
      }
      onSaved();
      onClose();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error'); }
    finally { setSaving(false); }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${V.insetBdr}`,
    borderRadius: 10, color: C.text, fontSize: 14, padding: '11px 14px', outline: 'none',
    transition: 'border-color 0.15s',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', color: C.muted, fontSize: 10, fontWeight: 800, letterSpacing: 1.2, marginBottom: 6,
  };

  const toggleEnt = (e: string) => {
    const arr = form.entitlements.includes(e) ? form.entitlements.filter((x) => x !== e) : [...form.entitlements, e];
    set('entitlements', arr);
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.72)',
      backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: 560, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto',
        background: 'linear-gradient(170deg, rgba(14,3,48,0.98) 0%, rgba(10,2,32,0.99) 100%)',
        border: `1px solid ${V.purpleBdr}`, borderRadius: 24, padding: 28,
        boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
      }}>
        <h2 style={{ margin: 0, fontFamily: 'Sora, sans-serif', fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 4 }}>
          {isNew ? 'Nuevo Plan' : `Editar — ${plan.nombre}`}
        </h2>
        <p style={{ color: C.muted, fontSize: 12, marginBottom: 22 }}>
          {isNew ? 'Configura los detalles del nuevo plan OTT' : 'Modifica los parámetros del plan'}
        </p>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,122,89,0.10)', border: '1px solid rgba(255,122,89,0.25)', color: C.rose, fontSize: 12, fontWeight: 600, marginBottom: 16 }}>{error}</div>
        )}

        {/* Grid form */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
          <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>NOMBRE</label><input style={inputStyle} value={form.nombre} onChange={(e) => set('nombre', e.target.value)} /></div>
          <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>DESCRIPCIÓN</label><textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }} value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} /></div>
          <div><label style={labelStyle}>GRUPO</label><select style={inputStyle} value={form.grupoUsuarios} onChange={(e) => set('grupoUsuarios', e.target.value)}>
            {Object.entries(GROUP_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select></div>
          <div><label style={labelStyle}>CALIDAD</label><select style={inputStyle} value={form.videoQuality} onChange={(e) => set('videoQuality', e.target.value)}>
            {['SD', 'HD', 'FHD', '4K'].map((q) => <option key={q} value={q}>{q}</option>)}
          </select></div>
          <div><label style={labelStyle}>PRECIO ({form.moneda})</label><input type="number" step="0.01" min="0" style={inputStyle} value={form.precio} onChange={(e) => set('precio', parseFloat(e.target.value) || 0)} /></div>
          <div><label style={labelStyle}>DURACIÓN (DÍAS)</label><input type="number" min="1" style={inputStyle} value={form.duracionDias} onChange={(e) => set('duracionDias', parseInt(e.target.value) || 30)} /></div>
          <div><label style={labelStyle}>DISPOSITIVOS</label><input type="number" min="1" style={inputStyle} value={form.maxDevices} onChange={(e) => set('maxDevices', parseInt(e.target.value) || 1)} /></div>
          <div><label style={labelStyle}>STREAMS</label><input type="number" min="1" style={inputStyle} value={form.maxConcurrentStreams} onChange={(e) => set('maxConcurrentStreams', parseInt(e.target.value) || 1)} /></div>
          <div><label style={labelStyle}>PERFILES</label><input type="number" min="1" style={inputStyle} value={form.maxProfiles} onChange={(e) => set('maxProfiles', parseInt(e.target.value) || 1)} /></div>
          <div><label style={labelStyle}>TRIAL (DÍAS)</label><input type="number" min="0" style={inputStyle} value={form.trialDays} onChange={(e) => set('trialDays', parseInt(e.target.value) || 0)} /></div>
          <div><label style={labelStyle}>GRACIA (DÍAS)</label><input type="number" min="0" style={inputStyle} value={form.gracePeriodDays} onChange={(e) => set('gracePeriodDays', parseInt(e.target.value) || 0)} /></div>
        </div>

        {/* Toggles */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
          {([['allowDownloads', 'Descargas'], ['allowCasting', 'Casting'], ['hasAds', 'Anuncios']] as const).map(([key, label]) => (
            <button key={key} onClick={() => set(key, !form[key])} style={{
              padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              background: form[key] ? C.accentFaint : V.insetBg,
              border: `1px solid ${form[key] ? C.accentBorder : V.insetBdr}`,
              color: form[key] ? C.accent : C.textSec,
              transition: 'all 0.15s',
            }}>{label}</button>
          ))}
        </div>

        {/* Entitlements */}
        <label style={labelStyle}>ENTITLEMENTS</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 22 }}>
          {Object.entries(ENT_LABEL).map(([k, v]) => (
            <button key={k} onClick={() => toggleEnt(k)} style={{
              padding: '5px 12px', borderRadius: 999, fontSize: 10, fontWeight: 700, cursor: 'pointer',
              background: form.entitlements.includes(k) ? V.purpleBg : V.insetBg,
              border: `1px solid ${form.entitlements.includes(k) ? V.purpleBdr : V.insetBdr}`,
              color: form.entitlements.includes(k) ? V.purple : C.textSec,
              transition: 'all 0.15s',
            }}>{v}</button>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '11px 22px', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            background: 'transparent', border: `1px solid ${V.insetBdr}`, color: C.textSec,
          }}>Cancelar</button>
          <button onClick={handleSave} disabled={saving} style={{
            padding: '11px 24px', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            background: C.accent, border: 'none', color: '#000',
            boxShadow: V.glowGold, opacity: saving ? 0.6 : 1,
            transition: 'all 0.15s',
          }}>{saving ? 'Guardando…' : isNew ? 'Crear plan' : 'Guardar cambios'}</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════════════════ */

export default function PlanesPage() {
  const { accessToken } = useAuthStore();
  const [planes, setPlanes] = useState<OttPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<OttPlan | 'new' | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true); setError('');
    try {
      setPlanes(await apiFetch<OttPlan[]>('/admin/planes', accessToken));
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error al cargar planes'); }
    finally { setLoading(false); }
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);

  async function handleToggle(id: string) {
    if (!accessToken) return;
    try {
      await apiFetch(`/admin/planes/${id}/toggle`, accessToken, { method: 'POST' });
      load();
    } catch {}
  }

  async function handleDelete(plan: OttPlan) {
    if (!confirm(`¿Eliminar el plan "${plan.nombre}"?`)) return;
    if (!accessToken) return;
    try {
      await apiFetch(`/admin/planes/${plan.id}`, accessToken, { method: 'DELETE' });
      load();
    } catch {}
  }

  const activos = planes.filter((p) => p.activo).length;
  const avgDevices = planes.length ? Math.round(planes.reduce((s, p) => s + p.maxDevices, 0) / planes.length) : 0;

  return (
    <CmsShell title="Planes">
      {/* ═════ Purple atmosphere wrapper ═════ */}
      <div style={{ background: V.pageBg, margin: '-22px -28px 0', padding: '28px 28px 40px', minHeight: 'calc(100vh - 108px)' }}>

        {/* ── Section heading ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 22 }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: 'Sora, sans-serif', fontSize: 26, fontWeight: 700, color: C.text, letterSpacing: -0.5 }}>Planes OTT</h2>
            <p style={{ color: C.textSec, fontSize: 13, marginTop: 4 }}>Configura perfil comercial, acceso, entitlements y contenido visible por plan.</p>
          </div>
          <button onClick={() => setEditing('new')} style={{
            padding: '11px 22px', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            background: C.accent, border: 'none', color: '#000',
            boxShadow: V.glowGold, transition: 'all 0.18s',
            display: 'flex', alignItems: 'center', gap: 7,
          }}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Nuevo plan
          </button>
        </div>

        {/* ── Metric bar ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'PLANES TOTALES', value: planes.length, color: C.accent },
            { label: 'ACTIVOS', value: activos, color: C.green },
            { label: 'DISP. PROMEDIO', value: avgDevices, color: V.purple },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              background: V.metricBg, border: `1px solid ${V.metricBdr}`, borderRadius: 16, padding: '16px 20px',
              boxShadow: V.glowPurple,
            }}>
              <p style={{ color: C.muted, fontSize: 10, fontWeight: 800, letterSpacing: 1.4, marginBottom: 6 }}>{label}</p>
              <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{loading ? '…' : value}</p>
            </div>
          ))}
        </div>

        {/* ── Purpose banner ── */}
        <div style={{
          background: V.bannerBg, border: `1px solid ${V.bannerBdr}`, borderRadius: 18,
          padding: '18px 22px', marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 14,
          boxShadow: V.glowPurple,
        }}>
          <span style={{
            width: 38, height: 38, borderRadius: 12, flexShrink: 0,
            background: V.purpleBg, border: `1px solid ${V.purpleBdr}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>💎</span>
          <div>
            <p style={{ color: C.text, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Propósito del módulo</p>
            <p style={{ color: C.textSec, fontSize: 12, lineHeight: 1.55 }}>
              Aquí se gestionan los planes comerciales de la plataforma OTT. Cada plan define precio, acceso a contenido, límites de dispositivos, calidad de video y entitlements disponibles para los suscriptores.
            </p>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(255,122,89,0.10)', border: '1px solid rgba(255,122,89,0.25)', color: C.rose, fontSize: 13, fontWeight: 600, marginBottom: 20 }}>{error}</div>
        )}

        {/* ── Loading skeleton ── */}
        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{
                height: 420, borderRadius: 20, background: V.cardBg, border: `1.5px solid ${V.cardBorder}`,
                animation: 'pulse 1.8s ease-in-out infinite',
              }} />
            ))}
          </div>
        )}

        {/* ── Plan cards grid ── */}
        {!loading && planes.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {planes.map((p) => (
              <PlanCard key={p.id} plan={p} onEdit={() => setEditing(p)} onToggle={() => handleToggle(p.id)} onDelete={() => handleDelete(p)} />
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && planes.length === 0 && !error && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>📦</p>
            <p style={{ color: C.text, fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Sin planes configurados</p>
            <p style={{ color: C.muted, fontSize: 13 }}>Crea tu primer plan para comenzar a monetizar la plataforma.</p>
          </div>
        )}

      </div>{/* end purple wrapper */}

      {/* ── Modal ── */}
      {editing && (
        <PlanModal plan={editing === 'new' ? null : editing} token={accessToken ?? ''} onClose={() => setEditing(null)} onSaved={load} />
      )}

      {/* Pulse animation */}
      <style>{`@keyframes pulse { 0%,100% { opacity: 0.5; } 50% { opacity: 0.8; } }`}</style>
    </CmsShell>
  );
}
