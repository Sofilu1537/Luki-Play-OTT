'use client';
import { useEffect, useMemo, useState } from 'react';
import CmsShell, { C } from '@/components/cms/CmsShell';
import { useAuthStore } from '@/stores/authStore';
import { useCategoriasStore } from '@/stores/categoriasStore';

interface AdminCanal {
  id: string;
  nombre: string;
  logo: string;
  streamUrl: string;
  detalle: string;
  categoria: string;
  tipo: string;
  requiereControlParental: boolean;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

interface AdminCanalPayload {
  nombre: string;
  logo: string;
  streamUrl: string;
  detalle: string;
  categoria: string;
  tipo: string;
  requiereControlParental: boolean;
  activo: boolean;
}

const MOCK_CANALES: AdminCanal[] = [
  {
    id: 'ch-001',
    nombre: 'Noticias 24',
    logo: '',
    streamUrl: 'https://g2qd3e2ay7an-hls-live.5centscdn.com/channel35/d0dbe915091d400bd8ee7f27f0791303.sdp/playlist.m3u8',
    detalle: 'Cobertura informativa continua para pruebas operativas del mosaico.',
    categoria: 'Noticias',
    tipo: 'live',
    requiereControlParental: false,
    activo: true,
    creadoEn: '2026-04-06T00:00:00.000Z',
    actualizadoEn: '2026-04-06T00:00:00.000Z',
  },
  {
    id: 'ch-002',
    nombre: 'Deportes HD',
    logo: '',
    streamUrl: 'https://stream.example.com/deportes',
    detalle: 'Eventos deportivos y programación de alta rotación.',
    categoria: 'Deportes',
    tipo: 'live',
    requiereControlParental: false,
    activo: true,
    creadoEn: '2026-04-05T00:00:00.000Z',
    actualizadoEn: '2026-04-05T00:00:00.000Z',
  },
  {
    id: 'ch-003',
    nombre: 'Infantil TV',
    logo: '',
    streamUrl: 'https://stream.example.com/infantil',
    detalle: 'Bloque infantil sujeto a control parental.',
    categoria: 'Infantil',
    tipo: 'live',
    requiereControlParental: true,
    activo: false,
    creadoEn: '2026-04-04T00:00:00.000Z',
    actualizadoEn: '2026-04-04T00:00:00.000Z',
  },
];

function emptyForm(): AdminCanalPayload {
  return {
    nombre: '',
    logo: '',
    streamUrl: '',
    detalle: '',
    categoria: 'General',
    tipo: 'live',
    requiereControlParental: false,
    activo: true,
  };
}

function asText(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function normalizeCanal(canal: Partial<AdminCanal>): AdminCanal {
  const now = new Date().toISOString();
  return {
    id: asText(canal.id, `canal-${Date.now()}`),
    nombre: asText(canal.nombre, 'Canal sin nombre'),
    logo: asText(canal.logo),
    streamUrl: asText(canal.streamUrl),
    detalle: asText(canal.detalle),
    categoria: asText(canal.categoria, 'General'),
    tipo: asText(canal.tipo, 'live'),
    requiereControlParental: Boolean(canal.requiereControlParental),
    activo: canal.activo !== false,
    creadoEn: asText(canal.creadoEn, now),
    actualizadoEn: asText(canal.actualizadoEn, asText(canal.creadoEn, now)),
  };
}

function isRealStream(url: string) {
  return /^https?:\/\//i.test(url) && !url.includes('stream.example.com');
}

async function apiFetch<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`/api/backend${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  const json = await res.json().catch(() => ({})) as { message?: string };
  if (!res.ok) throw new Error(Array.isArray(json.message) ? json.message[0] : json.message ?? `HTTP ${res.status}`);
  return json as T;
}

async function apiMutate<T>(path: string, token: string, init: RequestInit): Promise<T> {
  const res = await fetch(`/api/backend${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  });

  if (res.status === 204) return undefined as T;

  const json = await res.json().catch(() => ({})) as { message?: string };
  if (!res.ok) throw new Error(Array.isArray(json.message) ? json.message[0] : json.message ?? `HTTP ${res.status}`);
  return json as T;
}

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function CanalesPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const categoriasActivas = useCategoriasStore((state) => state.getActive());
  const [canales, setCanales] = useState<AdminCanal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editingCanal, setEditingCanal] = useState<AdminCanal | null>(null);
  const [form, setForm] = useState<AdminCanalPayload>(emptyForm());
  const [formError, setFormError] = useState('');

  const loadCanales = async () => {
    if (!accessToken) {
      setCanales(MOCK_CANALES.map(normalizeCanal));
      setIsFallback(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch<AdminCanal[]>('/admin/canales', accessToken);
      setCanales((data.length ? data : MOCK_CANALES).map(normalizeCanal));
      setError('');
      setIsFallback(false);
    } catch (err: unknown) {
      setCanales(MOCK_CANALES.map(normalizeCanal));
      setError(err instanceof Error ? err.message : 'No se pudo cargar el catálogo de canales.');
      setIsFallback(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCanales();
  }, [accessToken]);

  const stats = useMemo(() => ({
    total: canales.length,
    activos: canales.filter((item) => item.activo).length,
    parentales: canales.filter((item) => item.requiereControlParental).length,
    preview: canales.filter((item) => isRealStream(item.streamUrl)).length,
  }), [canales]);

  const categoryOptions = useMemo(() => {
    const fromCanales = canales.map((item) => item.categoria || 'General');
    const fromStore = categoriasActivas.map((c) => c.nombre);
    return ['all', ...Array.from(new Set([...fromCanales, ...fromStore]))];
  }, [canales, categoriasActivas]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return canales.filter((canal) => {
      if (categoryFilter !== 'all' && canal.categoria !== categoryFilter) return false;
      if (!query) return true;
      return [canal.nombre, canal.categoria, canal.detalle, canal.streamUrl].some((value) => value.toLowerCase().includes(query));
    });
  }, [canales, search, categoryFilter]);

  function resetForm() {
    setEditingCanal(null);
    setForm(emptyForm());
    setFormError('');
  }

  function openEdit(canal: AdminCanal) {
    setEditingCanal(canal);
    setForm({
      nombre: canal.nombre,
      logo: canal.logo,
      streamUrl: canal.streamUrl,
      detalle: canal.detalle,
      categoria: canal.categoria,
      tipo: canal.tipo,
      requiereControlParental: canal.requiereControlParental,
      activo: canal.activo,
    });
    setFormError('');
  }

  function updateField<K extends keyof AdminCanalPayload>(field: K, value: AdminCanalPayload[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSave() {
    if (!accessToken || isFallback) {
      setFormError('No hay conexión operativa con backend para guardar cambios reales.');
      return;
    }

    if (!form.nombre.trim()) {
      setFormError('El nombre del canal es requerido.');
      return;
    }
    if (!form.streamUrl.trim() || !isValidUrl(form.streamUrl.trim())) {
      setFormError('La URL del stream debe ser válida.');
      return;
    }
    if (!form.detalle.trim()) {
      setFormError('El detalle del canal es requerido.');
      return;
    }
    if (!form.categoria.trim()) {
      setFormError('La categoría es requerida.');
      return;
    }

    setSaving(true);
    setFormError('');
    setFeedback(null);
    try {
      const payload = {
        ...form,
        nombre: form.nombre.trim(),
        streamUrl: form.streamUrl.trim(),
        detalle: form.detalle.trim(),
        categoria: form.categoria.trim(),
        logo: form.logo.trim(),
      };

      if (editingCanal) {
        await apiMutate<AdminCanal>(`/admin/canales/${editingCanal.id}`, accessToken, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        setFeedback({ type: 'success', message: 'Canal actualizado correctamente.' });
      } else {
        await apiMutate<AdminCanal>('/admin/canales', accessToken, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setFeedback({ type: 'success', message: 'Canal creado correctamente.' });
      }

      resetForm();
      await loadCanales();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar el canal.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(canal: AdminCanal) {
    if (!accessToken || isFallback) {
      setFeedback({ type: 'error', message: 'No hay conexión operativa con backend para cambiar el estado.' });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      await apiMutate<AdminCanal>(`/admin/canales/${canal.id}/toggle`, accessToken, { method: 'POST' });
      setFeedback({ type: 'success', message: `Canal ${canal.activo ? 'desactivado' : 'activado'} correctamente.` });
      await loadCanales();
    } catch (err: unknown) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'No se pudo cambiar el estado del canal.' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(canal: AdminCanal) {
    if (!accessToken || isFallback) {
      setFeedback({ type: 'error', message: 'No hay conexión operativa con backend para eliminar.' });
      return;
    }
    if (!window.confirm(`¿Eliminar el canal ${canal.nombre}?`)) return;

    setSaving(true);
    setFeedback(null);
    try {
      await apiMutate<void>(`/admin/canales/${canal.id}`, accessToken, { method: 'DELETE' });
      setFeedback({ type: 'success', message: 'Canal eliminado correctamente.' });
      if (editingCanal?.id === canal.id) resetForm();
      await loadCanales();
    } catch (err: unknown) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'No se pudo eliminar el canal.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <CmsShell title="Canales">
      <section style={{ display: 'grid', gap: 18 }}>
        <div style={{
          background: 'linear-gradient(160deg, rgba(22,22,22,0.98), rgba(14,14,14,0.95))',
          borderRadius: 26,
          padding: '24px 24px 22px',
          border: `1px solid ${C.border}`,
          boxShadow: '0 24px 70px rgba(0,0,0,0.34)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
            <div>
              <p style={{ color: C.muted, fontSize: 10, fontWeight: 800, letterSpacing: 2, marginBottom: 8 }}>MÓDULO CMS</p>
              <h2 style={{ color: C.text, fontFamily: 'Sora, sans-serif', fontSize: 28, fontWeight: 700, letterSpacing: -0.8, margin: 0 }}>Canales</h2>
              <p style={{ color: C.textSec, fontSize: 14, marginTop: 8, maxWidth: 720 }}>
                Catálogo operativo para revisar disponibilidad, categoría, estado y señales listas para monitor.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadCanales()}
              style={{
                padding: '12px 16px',
                borderRadius: 14,
                border: `1px solid ${C.accentBorder}`,
                background: C.accentFaint,
                color: C.text,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Actualizar catálogo
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            {[
              { label: 'Canales cargados', value: stats.total, color: C.accent },
              { label: 'Canales activos', value: stats.activos, color: C.green },
              { label: 'Con parental', value: stats.parentales, color: C.amber },
              { label: 'Con stream real', value: stats.preview, color: C.stone },
            ].map((card) => (
              <div key={card.label} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: 18, padding: '16px 16px 14px' }}>
                <div style={{ width: 56, height: 4, borderRadius: 999, background: card.color, marginBottom: 14 }} />
                <div style={{ color: C.text, fontFamily: 'Sora, sans-serif', fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{card.value}</div>
                <div style={{ color: C.textSec, fontSize: 12, marginTop: 8 }}>{card.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(180deg, rgba(22,22,22,0.97), rgba(14,14,14,0.95))',
          borderRadius: 24,
          padding: '20px 20px 18px',
          border: `1px solid ${C.border}`,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 380px) minmax(0, 1fr)', gap: 18, alignItems: 'start' }}>
            <div style={{ background: 'rgba(255,255,255,0.025)', border: `1px solid ${C.border}`, borderRadius: 20, padding: '18px 18px 16px', display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                <div>
                  <div style={{ color: C.muted, fontSize: 10, fontWeight: 800, letterSpacing: 1.8, marginBottom: 6 }}>FORMULARIO</div>
                  <h3 style={{ margin: 0, color: C.text, fontSize: 18, fontWeight: 800 }}>{editingCanal ? 'Editar canal' : 'Nuevo canal'}</h3>
                </div>
                {editingCanal ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.textSec, borderRadius: 12, padding: '8px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
                  >
                    Cancelar
                  </button>
                ) : null}
              </div>

              {isFallback ? (
                <div style={{ padding: '10px 12px', borderRadius: 14, background: 'rgba(255,122,89,0.10)', border: `1px solid rgba(255,122,89,0.24)`, color: C.rose, fontSize: 12, lineHeight: 1.5 }}>
                  El backend no está operativo para canales. Puedes ver el catálogo, pero el CRUD real queda bloqueado hasta que responda `/admin/canales`.
                </div>
              ) : null}

              {feedback ? (
                <div style={{ padding: '10px 12px', borderRadius: 14, background: feedback.type === 'success' ? 'rgba(155,191,99,0.12)' : 'rgba(255,122,89,0.10)', border: `1px solid ${feedback.type === 'success' ? 'rgba(155,191,99,0.24)' : 'rgba(255,122,89,0.24)'}`, color: feedback.type === 'success' ? C.green : C.rose, fontSize: 12, fontWeight: 700 }}>
                  {feedback.message}
                </div>
              ) : null}

              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ color: C.muted, fontSize: 10, fontWeight: 800, letterSpacing: 1.4 }}>NOMBRE</span>
                <input value={form.nombre} onChange={(event) => updateField('nombre', event.target.value)} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, padding: '12px 14px', fontSize: 13 }} />
              </label>

              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ color: C.muted, fontSize: 10, fontWeight: 800, letterSpacing: 1.4 }}>STREAM URL</span>
                <input value={form.streamUrl} onChange={(event) => updateField('streamUrl', event.target.value)} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, padding: '12px 14px', fontSize: 13 }} />
              </label>

              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ color: C.muted, fontSize: 10, fontWeight: 800, letterSpacing: 1.4 }}>LOGO URL</span>
                <input value={form.logo} onChange={(event) => updateField('logo', event.target.value)} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, padding: '12px 14px', fontSize: 13 }} />
              </label>

              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ color: C.muted, fontSize: 10, fontWeight: 800, letterSpacing: 1.4 }}>DETALLE</span>
                <textarea value={form.detalle} onChange={(event) => updateField('detalle', event.target.value)} rows={4} style={{ resize: 'vertical', background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, padding: '12px 14px', fontSize: 13, fontFamily: 'inherit' }} />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ color: C.muted, fontSize: 10, fontWeight: 800, letterSpacing: 1.4 }}>CATEGORÍA</span>
                  <select
                    value={form.categoria}
                    onChange={(event) => updateField('categoria', event.target.value)}
                    style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, padding: '12px 14px', fontSize: 13 }}
                  >
                    {categoriasActivas.map((cat) => (
                      <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
                    ))}
                    {/* Preserve existing value if it's not in active list */}
                    {form.categoria && !categoriasActivas.some((c) => c.nombre === form.categoria) ? (
                      <option value={form.categoria}>{form.categoria}</option>
                    ) : null}
                  </select>
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ color: C.muted, fontSize: 10, fontWeight: 800, letterSpacing: 1.4 }}>TIPO</span>
                  <select value={form.tipo} onChange={(event) => updateField('tipo', event.target.value)} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, padding: '12px 14px', fontSize: 13 }}>
                    <option value="live">live</option>
                  </select>
                </label>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => updateField('activo', !form.activo)}
                  style={{ padding: '10px 12px', borderRadius: 12, border: `1px solid ${form.activo ? 'rgba(155,191,99,0.24)' : C.border}`, background: form.activo ? 'rgba(155,191,99,0.12)' : 'rgba(255,255,255,0.03)', color: form.activo ? C.green : C.textSec, cursor: 'pointer', fontWeight: 700 }}
                >
                  {form.activo ? 'Activo' : 'De baja'}
                </button>
                <button
                  type="button"
                  onClick={() => updateField('requiereControlParental', !form.requiereControlParental)}
                  style={{ padding: '10px 12px', borderRadius: 12, border: `1px solid ${form.requiereControlParental ? 'rgba(255,218,107,0.24)' : C.border}`, background: form.requiereControlParental ? 'rgba(255,218,107,0.12)' : 'rgba(255,255,255,0.03)', color: form.requiereControlParental ? C.amber : C.textSec, cursor: 'pointer', fontWeight: 700 }}
                >
                  {form.requiereControlParental ? 'Parental activado' : 'Sin parental'}
                </button>
              </div>

              {formError ? (
                <div style={{ color: C.rose, fontSize: 12, fontWeight: 700 }}>{formError}</div>
              ) : null}

              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                style={{ padding: '13px 16px', borderRadius: 14, border: `1px solid ${C.accentBorder}`, background: 'linear-gradient(180deg, rgba(255,198,41,0.24), rgba(255,198,41,0.12))', color: C.text, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
              >
                {saving ? 'Guardando…' : editingCanal ? 'Guardar cambios' : 'Crear canal'}
              </button>
            </div>

            <div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre, categoría o URL"
              style={{
                flex: '1 1 320px',
                minWidth: 220,
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${C.border}`,
                borderRadius: 14,
                color: C.text,
                padding: '12px 14px',
                fontSize: 13,
              }}
            />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {categoryOptions.map((category) => {
                const selected = categoryFilter === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setCategoryFilter(category)}
                    style={{
                      padding: '11px 14px',
                      borderRadius: 12,
                      border: `1px solid ${selected ? C.accentBorder : C.border}`,
                      background: selected ? C.accentFaint : 'rgba(255,255,255,0.03)',
                      color: selected ? C.accentLight : C.textSec,
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {category === 'all' ? 'Todos' : category}
                  </button>
                );
              })}
            </div>
          </div>

          {error ? (
            <div style={{ marginBottom: 14, padding: '12px 14px', borderRadius: 14, border: `1px solid rgba(255,122,89,0.28)`, background: 'rgba(255,122,89,0.10)', color: C.rose, fontSize: 12, fontWeight: 700 }}>
              {error}. Se muestra un catálogo local de respaldo para no perder la interfaz.
            </div>
          ) : null}

          {loading ? (
            <div style={{ padding: '46px 0', textAlign: 'center', color: C.textSec }}>Cargando canales…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '46px 0', textAlign: 'center', border: `1px dashed ${C.border}`, borderRadius: 18, color: C.textSec }}>
              No hay canales para mostrar con los filtros actuales.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
              {filtered.map((canal) => {
                const realStream = isRealStream(canal.streamUrl);
                return (
                  <article key={canal.id} style={{ background: 'rgba(255,255,255,0.025)', border: `1px solid ${C.border}`, borderRadius: 20, padding: '18px 18px 16px', display: 'grid', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div>
                        <h3 style={{ margin: 0, color: C.text, fontSize: 17, fontWeight: 800 }}>{canal.nombre}</h3>
                        <p style={{ margin: '6px 0 0', color: C.textSec, fontSize: 12 }}>{canal.categoria}</p>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <span style={{
                          padding: '7px 10px',
                          borderRadius: 999,
                          fontSize: 10,
                          fontWeight: 800,
                          color: canal.activo ? C.green : C.rose,
                          background: canal.activo ? 'rgba(155,191,99,0.12)' : 'rgba(255,122,89,0.10)',
                          border: `1px solid ${canal.activo ? 'rgba(155,191,99,0.24)' : 'rgba(255,122,89,0.24)'}`,
                        }}>
                          {canal.activo ? 'ACTIVO' : 'DE BAJA'}
                        </span>
                      </div>
                    </div>

                    <p style={{ margin: 0, color: C.textSec, fontSize: 13, lineHeight: 1.55, minHeight: 40 }}>{canal.detalle || 'Sin detalle operativo.'}</p>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ padding: '6px 10px', borderRadius: 999, background: C.accentFaint, border: `1px solid ${C.accentBorder}`, color: C.accentLight, fontSize: 10, fontWeight: 800 }}>
                        {canal.tipo.toUpperCase()}
                      </span>
                      {canal.requiereControlParental ? (
                        <span style={{ padding: '6px 10px', borderRadius: 999, background: 'rgba(255,218,107,0.12)', border: `1px solid rgba(255,218,107,0.24)`, color: C.amber, fontSize: 10, fontWeight: 800 }}>
                          CONTROL PARENTAL
                        </span>
                      ) : null}
                      <span style={{
                        padding: '6px 10px',
                        borderRadius: 999,
                        background: realStream ? 'rgba(155,191,99,0.12)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${realStream ? 'rgba(155,191,99,0.24)' : C.border}`,
                        color: realStream ? C.green : C.textSec,
                        fontSize: 10,
                        fontWeight: 800,
                      }}>
                        {realStream ? 'STREAM LISTO' : 'URL DE PRUEBA'}
                      </span>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.16)', border: `1px solid ${C.border}`, borderRadius: 14, padding: '12px 12px 10px' }}>
                      <div style={{ color: C.muted, fontSize: 10, fontWeight: 800, letterSpacing: 1.2, marginBottom: 6 }}>STREAM URL</div>
                      <div style={{ color: C.textSec, fontSize: 12, lineHeight: 1.5, wordBreak: 'break-all' }}>{canal.streamUrl || 'Sin URL configurada'}</div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button type="button" onClick={() => openEdit(canal)} style={{ padding: '10px 12px', borderRadius: 12, border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.03)', color: C.text, cursor: 'pointer', fontWeight: 700 }}>
                        Editar
                      </button>
                      <button type="button" onClick={() => void handleToggle(canal)} disabled={saving} style={{ padding: '10px 12px', borderRadius: 12, border: `1px solid ${canal.activo ? 'rgba(255,122,89,0.24)' : 'rgba(155,191,99,0.24)'}`, background: canal.activo ? 'rgba(255,122,89,0.10)' : 'rgba(155,191,99,0.12)', color: canal.activo ? C.rose : C.green, cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700, opacity: saving ? 0.7 : 1 }}>
                        {canal.activo ? 'Desactivar' : 'Activar'}
                      </button>
                      <button type="button" onClick={() => void handleDelete(canal)} disabled={saving} style={{ padding: '10px 12px', borderRadius: 12, border: `1px solid rgba(255,122,89,0.24)`, background: 'rgba(255,122,89,0.10)', color: C.rose, cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700, opacity: saving ? 0.7 : 1 }}>
                        Eliminar
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
            </div>
          </div>
        </div>
      </section>
    </CmsShell>
  );
}