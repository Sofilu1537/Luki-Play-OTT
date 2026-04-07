'use client';
import { useEffect, useMemo, useState } from 'react';
import CmsShell, { C } from '@/components/cms/CmsShell';
import { useAuthStore } from '@/stores/authStore';
import { useCategoriasStore, type AdminCategoria } from '@/stores/categoriasStore';

// ---------------------------------------------------------------------------
// API helpers (same pattern as canales)
// ---------------------------------------------------------------------------

async function apiFetch<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`/api/backend${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  const json = await res.json().catch(() => ({})) as { message?: string };
  if (!res.ok) throw new Error(Array.isArray(json.message) ? json.message[0] : (json.message ?? `HTTP ${res.status}`));
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
  if (!res.ok) throw new Error(Array.isArray(json.message) ? json.message[0] : (json.message ?? `HTTP ${res.status}`));
  return json as T;
}

// ---------------------------------------------------------------------------
// Form helpers
// ---------------------------------------------------------------------------

interface CategoriaPayload {
  nombre: string;
  descripcion: string;
  icono: string;
  activo: boolean;
}

function emptyForm(): CategoriaPayload {
  return { nombre: '', descripcion: '', icono: '', activo: true };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CategoriasPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const { categorias, syncFromApi, localCreate, localUpdate, localToggle, localDelete } =
    useCategoriasStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'activas' | 'inactivas'>('all');
  const [editing, setEditing] = useState<AdminCategoria | null>(null);
  const [form, setForm] = useState<CategoriaPayload>(emptyForm());
  const [formError, setFormError] = useState('');

  // ---- Load -----------------------------------------------------------------

  const loadCategorias = async () => {
    if (!accessToken) {
      setIsFallback(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch<AdminCategoria[]>('/admin/categorias', accessToken);
      syncFromApi(data);
      setIsFallback(false);
    } catch {
      setIsFallback(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadCategorias(); }, [accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Stats ----------------------------------------------------------------

  const stats = useMemo(() => ({
    total: categorias.length,
    activas: categorias.filter((c) => c.activo).length,
    inactivas: categorias.filter((c) => !c.activo).length,
  }), [categorias]);

  // ---- Filter ---------------------------------------------------------------

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return categorias.filter((c) => {
      if (statusFilter === 'activas' && !c.activo) return false;
      if (statusFilter === 'inactivas' && c.activo) return false;
      if (!query) return true;
      return [c.nombre, c.descripcion].some((v) => v.toLowerCase().includes(query));
    });
  }, [categorias, search, statusFilter]);

  // ---- Form helpers ---------------------------------------------------------

  function resetForm() {
    setEditing(null);
    setForm(emptyForm());
    setFormError('');
  }

  function openEdit(cat: AdminCategoria) {
    setEditing(cat);
    setForm({ nombre: cat.nombre, descripcion: cat.descripcion, icono: cat.icono, activo: cat.activo });
    setFormError('');
  }

  function updateField<K extends keyof CategoriaPayload>(key: K, value: CategoriaPayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function showFeedback(type: 'success' | 'error', message: string) {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  }

  // ---- Save (create / update) -----------------------------------------------

  async function handleSave() {
    const nombreTrimmed = form.nombre.trim();
    if (!nombreTrimmed) { setFormError('El nombre de la categoría es requerido.'); return; }

    setSaving(true);
    setFormError('');

    try {
      if (!accessToken || isFallback) {
        // Local-only path
        if (editing) {
          localUpdate(editing.id, { nombre: nombreTrimmed, descripcion: form.descripcion.trim(), icono: form.icono.trim(), activo: form.activo });
          showFeedback('success', 'Categoría actualizada (modo local).');
        } else {
          localCreate({ nombre: nombreTrimmed, descripcion: form.descripcion.trim(), icono: form.icono.trim() });
          showFeedback('success', 'Categoría creada (modo local).');
        }
        resetForm();
        return;
      }

      // API path
      const payload = { nombre: nombreTrimmed, descripcion: form.descripcion.trim(), icono: form.icono.trim(), activo: form.activo };

      if (editing) {
        const updated = await apiMutate<AdminCategoria>(`/admin/categorias/${editing.id}`, accessToken, { method: 'PATCH', body: JSON.stringify(payload) });
        localUpdate(editing.id, updated);
        showFeedback('success', 'Categoría actualizada correctamente.');
      } else {
        const created = await apiMutate<AdminCategoria>('/admin/categorias', accessToken, { method: 'POST', body: JSON.stringify(payload) });
        syncFromApi([...categorias, created]);
        showFeedback('success', 'Categoría creada correctamente.');
      }

      resetForm();
      await loadCategorias();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo guardar la categoría.';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  }

  // ---- Toggle ---------------------------------------------------------------

  async function handleToggle(cat: AdminCategoria) {
    setSaving(true);
    try {
      if (!accessToken || isFallback) {
        localToggle(cat.id);
        showFeedback('success', `Categoría ${cat.activo ? 'desactivada' : 'activada'} (modo local).`);
        return;
      }
      await apiMutate<AdminCategoria>(`/admin/categorias/${cat.id}/toggle`, accessToken, { method: 'POST' });
      localToggle(cat.id);
      showFeedback('success', `Categoría ${cat.activo ? 'desactivada' : 'activada'} correctamente.`);
    } catch (err: unknown) {
      showFeedback('error', err instanceof Error ? err.message : 'No se pudo cambiar el estado.');
    } finally {
      setSaving(false);
    }
  }

  // ---- Delete ---------------------------------------------------------------

  async function handleDelete(cat: AdminCategoria) {
    if (!window.confirm(`¿Eliminar la categoría "${cat.nombre}"?`)) return;
    setSaving(true);
    try {
      if (!accessToken || isFallback) {
        localDelete(cat.id);
        if (editing?.id === cat.id) resetForm();
        showFeedback('success', 'Categoría eliminada (modo local).');
        return;
      }
      await apiMutate<void>(`/admin/categorias/${cat.id}`, accessToken, { method: 'DELETE' });
      localDelete(cat.id);
      if (editing?.id === cat.id) resetForm();
      showFeedback('success', 'Categoría eliminada correctamente.');
    } catch (err: unknown) {
      showFeedback('error', err instanceof Error ? err.message : 'No se pudo eliminar la categoría.');
    } finally {
      setSaving(false);
    }
  }

  // ---- Render ---------------------------------------------------------------

  return (
    <CmsShell title="Categorías">
      <section style={{ display: 'grid', gap: 18 }}>

        {/* Header + stats */}
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
              <h2 style={{ color: C.text, fontFamily: 'Sora, sans-serif', fontSize: 28, fontWeight: 700, letterSpacing: -0.8, margin: 0 }}>Categorías</h2>
              <p style={{ color: C.textSec, fontSize: 14, marginTop: 8, maxWidth: 720 }}>
                Clasificación principal del contenido que el admin publica para la experiencia del player.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadCategorias()}
              disabled={loading}
              style={{
                padding: '12px 16px', borderRadius: 14, border: `1px solid ${C.accentBorder}`,
                background: C.accentFaint, color: C.text, fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Cargando…' : 'Actualizar'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            {[
              { label: 'Total categorías', value: stats.total, color: C.accent },
              { label: 'Activas', value: stats.activas, color: C.green },
              { label: 'Inactivas', value: stats.inactivas, color: C.rose },
            ].map((card) => (
              <div key={card.label} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: 18, padding: '16px 16px 14px' }}>
                <div style={{ width: 56, height: 4, borderRadius: 999, background: card.color, marginBottom: 14 }} />
                <div style={{ color: C.text, fontFamily: 'Sora, sans-serif', fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{card.value}</div>
                <div style={{ color: C.textSec, fontSize: 12, marginTop: 8 }}>{card.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{
          background: 'linear-gradient(180deg, rgba(22,22,22,0.97), rgba(14,14,14,0.95))',
          borderRadius: 24,
          padding: '20px 20px 18px',
          border: `1px solid ${C.border}`,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 360px) minmax(0, 1fr)', gap: 18, alignItems: 'start' }}>

            {/* ---- Form panel ---- */}
            <div style={{ background: 'rgba(255,255,255,0.025)', border: `1px solid ${C.border}`, borderRadius: 20, padding: '18px 18px 16px', display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                <div>
                  <div style={{ color: C.muted, fontSize: 10, fontWeight: 800, letterSpacing: 1.8, marginBottom: 6 }}>FORMULARIO</div>
                  <h3 style={{ margin: 0, color: C.text, fontSize: 18, fontWeight: 800 }}>
                    {editing ? 'Editar categoría' : 'Nueva categoría'}
                  </h3>
                </div>
                {editing ? (
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
                <div style={{ padding: '10px 12px', borderRadius: 14, background: 'rgba(255,218,107,0.10)', border: `1px solid rgba(255,218,107,0.24)`, color: C.amber, fontSize: 12, lineHeight: 1.5 }}>
                  Backend no disponible. Los cambios se guardan localmente en el navegador.
                </div>
              ) : null}

              {feedback ? (
                <div style={{
                  padding: '10px 12px', borderRadius: 14,
                  background: feedback.type === 'success' ? 'rgba(155,191,99,0.12)' : 'rgba(255,122,89,0.10)',
                  border: `1px solid ${feedback.type === 'success' ? 'rgba(155,191,99,0.24)' : 'rgba(255,122,89,0.24)'}`,
                  color: feedback.type === 'success' ? C.green : C.rose,
                  fontSize: 12, fontWeight: 700,
                }}>
                  {feedback.message}
                </div>
              ) : null}

              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ color: C.muted, fontSize: 10, fontWeight: 800, letterSpacing: 1.4 }}>NOMBRE <span style={{ color: C.rose }}>*</span></span>
                <input
                  value={form.nombre}
                  onChange={(e) => updateField('nombre', e.target.value)}
                  placeholder="Ej: Contenido Adulto"
                  style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, padding: '12px 14px', fontSize: 13 }}
                />
              </label>

              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ color: C.muted, fontSize: 10, fontWeight: 800, letterSpacing: 1.4 }}>DESCRIPCIÓN</span>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => updateField('descripcion', e.target.value)}
                  placeholder="Describe el tipo de contenido…"
                  rows={3}
                  style={{ resize: 'vertical', background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, padding: '12px 14px', fontSize: 13, fontFamily: 'inherit' }}
                />
              </label>

              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ color: C.muted, fontSize: 10, fontWeight: 800, letterSpacing: 1.4 }}>ÍCONO (clase CSS)</span>
                <input
                  value={form.icono}
                  onChange={(e) => updateField('icono', e.target.value)}
                  placeholder="Ej: futbol-o, film, music…"
                  style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, padding: '12px 14px', fontSize: 13 }}
                />
              </label>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => updateField('activo', !form.activo)}
                  style={{
                    padding: '10px 14px', borderRadius: 12,
                    border: `1px solid ${form.activo ? 'rgba(155,191,99,0.24)' : C.border}`,
                    background: form.activo ? 'rgba(155,191,99,0.12)' : 'rgba(255,255,255,0.03)',
                    color: form.activo ? C.green : C.textSec,
                    cursor: 'pointer', fontWeight: 700, fontSize: 13,
                  }}
                >
                  {form.activo ? '✓ Activa' : '○ Inactiva'}
                </button>
              </div>

              {formError ? (
                <div style={{ color: C.rose, fontSize: 12, fontWeight: 700 }}>{formError}</div>
              ) : null}

              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                style={{
                  padding: '13px 16px', borderRadius: 14,
                  border: `1px solid ${C.accentBorder}`,
                  background: 'linear-gradient(180deg, rgba(255,198,41,0.24), rgba(255,198,41,0.12))',
                  color: C.text, fontWeight: 800,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear categoría'}
              </button>
            </div>

            {/* ---- List panel ---- */}
            <div>
              {/* Search + filter */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nombre o descripción…"
                  style={{
                    flex: '1 1 280px', minWidth: 220,
                    background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`,
                    borderRadius: 14, color: C.text, padding: '12px 14px', fontSize: 13,
                  }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['all', 'activas', 'inactivas'] as const).map((f) => {
                    const selected = statusFilter === f;
                    const label = f === 'all' ? 'Todas' : f === 'activas' ? 'Activas' : 'Inactivas';
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setStatusFilter(f)}
                        style={{
                          padding: '11px 14px', borderRadius: 12,
                          border: `1px solid ${selected ? C.accentBorder : C.border}`,
                          background: selected ? C.accentFaint : 'rgba(255,255,255,0.03)',
                          color: selected ? C.accentLight : C.textSec,
                          fontSize: 12, fontWeight: 800, cursor: 'pointer',
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {loading ? (
                <div style={{ padding: '46px 0', textAlign: 'center', color: C.textSec }}>Cargando categorías…</div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: '46px 0', textAlign: 'center', border: `1px dashed ${C.border}`, borderRadius: 18, color: C.textSec }}>
                  No hay categorías para mostrar.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
                  {filtered.map((cat) => (
                    <article
                      key={cat.id}
                      style={{
                        background: 'rgba(255,255,255,0.025)', border: `1px solid ${C.border}`,
                        borderRadius: 20, padding: '18px 18px 16px', display: 'grid', gap: 10,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                        <div>
                          <h3 style={{ margin: 0, color: C.text, fontSize: 16, fontWeight: 800 }}>{cat.nombre}</h3>
                          <p style={{ margin: '4px 0 0', color: C.textSec, fontSize: 11 }}>{cat.id}</p>
                        </div>
                        <span style={{
                          padding: '6px 10px', borderRadius: 999, fontSize: 10, fontWeight: 800, whiteSpace: 'nowrap',
                          color: cat.activo ? C.green : C.rose,
                          background: cat.activo ? 'rgba(155,191,99,0.12)' : 'rgba(255,122,89,0.10)',
                          border: `1px solid ${cat.activo ? 'rgba(155,191,99,0.24)' : 'rgba(255,122,89,0.24)'}`,
                        }}>
                          {cat.activo ? 'ACTIVA' : 'INACTIVA'}
                        </span>
                      </div>

                      {cat.descripcion ? (
                        <p style={{ margin: 0, color: C.textSec, fontSize: 12, lineHeight: 1.55 }}>{cat.descripcion}</p>
                      ) : null}

                      {cat.icono ? (
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span style={{ padding: '5px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, color: C.textSec, fontSize: 11, fontWeight: 700 }}>
                            {cat.icono}
                          </span>
                        </div>
                      ) : null}

                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                        <button
                          type="button"
                          onClick={() => openEdit(cat)}
                          style={{ padding: '9px 12px', borderRadius: 11, border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.03)', color: C.text, cursor: 'pointer', fontWeight: 700, fontSize: 12 }}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleToggle(cat)}
                          disabled={saving}
                          style={{
                            padding: '9px 12px', borderRadius: 11,
                            border: `1px solid ${cat.activo ? 'rgba(255,122,89,0.24)' : 'rgba(155,191,99,0.24)'}`,
                            background: cat.activo ? 'rgba(255,122,89,0.10)' : 'rgba(155,191,99,0.12)',
                            color: cat.activo ? C.rose : C.green,
                            cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 12, opacity: saving ? 0.7 : 1,
                          }}
                        >
                          {cat.activo ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(cat)}
                          disabled={saving}
                          style={{
                            padding: '9px 12px', borderRadius: 11,
                            border: `1px solid rgba(255,122,89,0.24)`, background: 'rgba(255,122,89,0.10)',
                            color: C.rose, cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 12, opacity: saving ? 0.7 : 1,
                          }}
                        >
                          Eliminar
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </CmsShell>
  );
}
