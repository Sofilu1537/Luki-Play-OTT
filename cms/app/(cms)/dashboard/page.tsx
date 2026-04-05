'use client';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import CmsShell, { C } from '@/components/cms/CmsShell';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

function getDateStr() {
  return new Date().toLocaleDateString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  }).replace(/^\w/, (c) => c.toUpperCase());
}

interface Metric { label: string; value: string; sub: string; trend: string; color: string; }

const METRICS: Metric[] = [
  { label: 'Usuarios registrados', value: '—', sub: 'Total en el sistema', trend: '↑ activos', color: C.accent },
  { label: 'Contratos activos',    value: '—', sub: 'Con suscripción vigente', trend: '↑ este mes', color: C.stone },
  { label: 'Canales activos',      value: '5', sub: 'En catálogo',          trend: '— sin cambios', color: C.green },
  { label: 'Planes disponibles',   value: '4', sub: 'Configurados',         trend: '— sin cambios', color: C.amber },
];

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [metrics, setMetrics] = useState<Metric[]>(METRICS);

  useEffect(() => {
    if (!accessToken) return;
    fetch('/api/backend/admin/monitor', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => r.json())
      .then((data) => {
        setMetrics((prev) => prev.map((m, i) =>
          i === 0 ? { ...m, value: String(data.totalUsuarios ?? '—') } :
          i === 1 ? { ...m, value: String(data.contratosActivos ?? '—') } : m,
        ));
      })
      .catch(() => null);
  }, [accessToken]);

  const displayName = user?.firstName ?? user?.email?.split('@')[0] ?? 'Admin';

  return (
    <CmsShell title="Inicio">
      <section style={{
        background: 'linear-gradient(135deg, rgba(28,28,28,0.98), rgba(12,12,12,0.96))',
        borderRadius: 30,
        padding: '30px 30px 28px',
        border: `1px solid ${C.border}`,
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 30px 90px rgba(0,0,0,0.36)',
      }}>
        <div style={{
          position: 'absolute',
          width: 360,
          height: 360,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${C.accentGlow} 0%, transparent 68%)`,
          top: -160,
          right: -40,
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.03) 45%, transparent 70%)',
          opacity: 0.45,
        }} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, alignItems: 'stretch' }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ color: C.muted, fontSize: 12, fontWeight: 800, letterSpacing: 2.2, marginBottom: 10 }}>
              {getDateStr().toUpperCase()}
            </p>
            <h2 style={{ color: C.text, fontFamily: 'Sora, sans-serif', fontSize: 34, fontWeight: 700, letterSpacing: -1.2, lineHeight: 1.08, marginBottom: 10 }}>
              {getGreeting()}, {displayName}
            </h2>
            <p style={{ color: C.textSec, fontSize: 15, maxWidth: 620, lineHeight: 1.6, marginBottom: 26 }}>
              Centro de control visual para LUKI NET: más contraste, más jerarquía y una presencia de marca clara para operar el CMS sin sensación de plantilla.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button style={{
                padding: '13px 18px',
                borderRadius: 16,
                border: `1px solid ${C.accentBorder}`,
                background: 'linear-gradient(180deg, rgba(255,198,41,0.24), rgba(255,198,41,0.12))',
                color: C.text,
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
              }}>
                Revisar actividad del panel
              </button>
              <button style={{
                padding: '13px 18px',
                borderRadius: 16,
                border: `1px solid ${C.border}`,
                background: 'rgba(255,255,255,0.03)',
                color: C.textSec,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}>
                Ver módulos disponibles
              </button>
            </div>
          </div>

          <div style={{
            position: 'relative',
            zIndex: 1,
            borderRadius: 24,
            padding: '20px 20px 18px',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
            border: `1px solid ${C.border}`,
            alignSelf: 'stretch',
          }}>
            <p style={{ color: C.muted, fontSize: 10, fontWeight: 800, letterSpacing: 2, marginBottom: 12 }}>RESUMEN RÁPIDO</p>
            <div style={{ display: 'grid', gap: 14 }}>
              {[
                { label: 'Experiencia', value: 'Brand-first UI' },
                { label: 'Paleta', value: 'Amarillo, negro y grafito' },
                { label: 'Estado', value: 'Listo para revisión local' },
              ].map((item) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ color: C.textSec, fontSize: 12 }}>{item.label}</span>
                  <span style={{ color: C.text, fontSize: 12, fontWeight: 700 }}>{item.value}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 18, padding: '12px 14px', borderRadius: 18, background: C.accentFaint, border: `1px solid ${C.accentBorder}` }}>
              <p style={{ color: C.accentLight, fontSize: 11, fontWeight: 800, letterSpacing: 1.2, marginBottom: 5 }}>FOCO DE ESTA ITERACIÓN</p>
              <p style={{ color: C.text, fontSize: 13, lineHeight: 1.5 }}>
                Sidebar, header, cards y tabla de referencia con una identidad más sobria, cálida y premium.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        {metrics.map((m) => (
          <div key={m.label} style={{
            background: 'linear-gradient(180deg, rgba(26,26,26,0.96), rgba(18,18,18,0.96))',
            borderRadius: 24,
            padding: '22px 22px 20px',
            border: `1px solid ${C.border}`,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 18px 44px rgba(0,0,0,0.26)',
          }}>
            <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at top right, ${m.color}22, transparent 38%)`, pointerEvents: 'none' }} />
            <div style={{ height: 4, width: 68, background: m.color, borderRadius: 999, marginBottom: 18, position: 'relative', zIndex: 1 }} />
            <p style={{ color: C.muted, fontSize: 11, fontWeight: 800, letterSpacing: 1.4, marginBottom: 12, position: 'relative', zIndex: 1 }}>
              {m.label.toUpperCase()}
            </p>
            <p style={{ color: C.text, fontFamily: 'Sora, sans-serif', fontSize: 34, fontWeight: 700, lineHeight: 1, marginBottom: 8, position: 'relative', zIndex: 1 }}>{m.value}</p>
            <p style={{ color: C.textSec, fontSize: 13, marginBottom: 14, position: 'relative', zIndex: 1 }}>{m.sub}</p>
            <span style={{ color: m.color, fontSize: 11, fontWeight: 800, position: 'relative', zIndex: 1 }}>{m.trend}</span>
          </div>
        ))}
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18 }}>
        <div style={{ background: 'linear-gradient(180deg, rgba(22,22,22,0.97), rgba(14,14,14,0.95))', borderRadius: 26, padding: '22px 22px 20px', border: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
            <div>
              <p style={{ color: C.muted, fontSize: 10, fontWeight: 800, letterSpacing: 2, marginBottom: 6 }}>TABLA DE CONTROL</p>
              <h3 style={{ color: C.text, fontFamily: 'Sora, sans-serif', fontSize: 22, fontWeight: 700, letterSpacing: -0.6, margin: 0 }}>Referencia visual para tablas</h3>
            </div>
            <span style={{ color: C.textSec, fontSize: 12 }}>Base reusable para futuras vistas CMS</span>
          </div>

          <div style={{ borderRadius: 20, overflow: 'auto', border: `1px solid ${C.border}` }}>
            <div style={{ minWidth: 640 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.8fr 0.9fr 0.7fr', gap: 12, padding: '14px 18px', background: 'rgba(255,198,41,0.09)', borderBottom: `1px solid ${C.border}` }}>
                {['Módulo', 'Estado', 'Enfoque', 'Prioridad'].map((label) => (
                  <span key={label} style={{ color: C.text, fontSize: 11, fontWeight: 800, letterSpacing: 1.4 }}>{label.toUpperCase()}</span>
                ))}
              </div>

              {[
                { modulo: 'Dashboard principal', estado: 'Activo', enfoque: 'Jerarquía visual', prioridad: 'Alta', tone: C.accent },
                { modulo: 'Navegación lateral', estado: 'Actualizado', enfoque: 'Marca LUKI NET', prioridad: 'Alta', tone: C.stone },
                { modulo: 'Panel superior', estado: 'Ajustado', enfoque: 'Lectura rápida', prioridad: 'Media', tone: C.green },
                { modulo: 'Vistas futuras', estado: 'Base lista', enfoque: 'Tablas y cards', prioridad: 'Media', tone: C.amber },
              ].map((row, index) => (
                <div key={row.modulo} style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.8fr 0.9fr 0.7fr', gap: 12, padding: '16px 18px', background: index % 2 === 0 ? 'rgba(255,255,255,0.018)' : 'rgba(255,255,255,0.03)', borderBottom: index < 3 ? `1px solid ${C.border}` : 'none', alignItems: 'center' }}>
                  <span style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>{row.modulo}</span>
                  <span style={{ color: row.tone, fontSize: 12, fontWeight: 800 }}>{row.estado}</span>
                  <span style={{ color: C.textSec, fontSize: 12 }}>{row.enfoque}</span>
                  <span style={{ color: C.text, fontSize: 11, fontWeight: 800, padding: '7px 10px', borderRadius: 999, border: `1px solid ${C.border}`, justifySelf: 'start', background: 'rgba(255,255,255,0.03)' }}>{row.prioridad}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 18 }}>
          <div style={{ background: 'linear-gradient(180deg, rgba(22,22,22,0.97), rgba(14,14,14,0.95))', borderRadius: 26, padding: '20px 22px', border: `1px solid ${C.border}` }}>
            <p style={{ color: C.muted, fontSize: 10, fontWeight: 800, letterSpacing: 2, marginBottom: 14 }}>ESTADO DEL SISTEMA</p>
            <div style={{ display: 'grid', gap: 12 }}>
              {['API Backend', 'Autenticación', 'Base de datos', 'Streaming'].map((s) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 14px', borderRadius: 18, background: 'rgba(255,255,255,0.025)', border: `1px solid ${C.border}` }}>
                  <span style={{ color: C.textSec, fontSize: 13 }}>{s}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: C.green, fontSize: 11, fontWeight: 800 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.green }} />
                    ESTABLE
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'linear-gradient(180deg, rgba(255,198,41,0.10), rgba(255,198,41,0.04))', borderRadius: 26, padding: '20px 22px', border: `1px solid ${C.accentBorder}` }}>
            <p style={{ color: C.accentLight, fontSize: 10, fontWeight: 800, letterSpacing: 2, marginBottom: 10 }}>IDENTIDAD VISUAL</p>
            <p style={{ color: C.text, fontSize: 15, lineHeight: 1.65, marginBottom: 14 }}>
              El CMS ahora prioriza negro profundo, grises cálidos y acentos amarillos para separarse de los dashboards genéricos con estética azulada.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {['Premium', 'Sobrio', 'Moderno', 'Marca clara'].map((tag) => (
                <span key={tag} style={{ padding: '8px 12px', borderRadius: 999, background: 'rgba(0,0,0,0.18)', border: `1px solid ${C.accentBorder}`, color: C.text, fontSize: 11, fontWeight: 700 }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </CmsShell>
  );
}
