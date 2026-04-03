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
  { label: 'Contratos activos',    value: '—', sub: 'Con suscripción vigente', trend: '↑ este mes', color: C.cyan },
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
      {/* Greeting banner */}
      <div style={{
        background: C.surface, borderRadius: 16, padding: '28px 32px',
        border: `1px solid ${C.border}`, marginBottom: 24,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Orb violet */}
        <div style={{
          position: 'absolute', width: 280, height: 280,
          borderRadius: '50%', background: `radial-gradient(circle, ${C.accentGlow} 0%, transparent 70%)`,
          top: -80, right: 40, pointerEvents: 'none',
        }} />
        {/* Orb cyan */}
        <div style={{
          position: 'absolute', width: 180, height: 180,
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,238,0.12) 0%, transparent 70%)',
          bottom: -40, right: 200, pointerEvents: 'none',
        }} />
        <p style={{ color: C.muted, fontSize: 12, fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>
          {getDateStr().toUpperCase()}
        </p>
        <h1 style={{ color: C.text, fontSize: 26, fontWeight: 900, letterSpacing: -0.5, marginBottom: 4 }}>
          {getGreeting()}, {displayName}
        </h1>
        <p style={{ color: C.textSec, fontSize: 14 }}>
          Bienvenido al panel administrativo de Luki Play.
        </p>
      </div>

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        {metrics.map((m) => (
          <div key={m.label} style={{
            background: C.surface, borderRadius: 14, padding: '20px 22px',
            border: `1px solid ${C.border}`, position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ height: 3, background: m.color, borderRadius: 2, position: 'absolute', top: 0, left: 0, right: 0 }} />
            <p style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: 1.2, marginBottom: 10 }}>
              {m.label.toUpperCase()}
            </p>
            <p style={{ color: C.text, fontSize: 32, fontWeight: 900, lineHeight: 1, marginBottom: 6 }}>{m.value}</p>
            <p style={{ color: C.textSec, fontSize: 12, marginBottom: 10 }}>{m.sub}</p>
            <span style={{ color: m.color, fontSize: 11, fontWeight: 600 }}>{m.trend}</span>
          </div>
        ))}
      </div>

      {/* System status */}
      <div style={{ background: C.surface, borderRadius: 14, padding: '16px 22px', border: `1px solid ${C.border}` }}>
        <p style={{ color: C.muted, fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 14 }}>ESTADO DEL SISTEMA</p>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {['API Backend', 'Autenticación', 'Base de datos', 'Streaming'].map((s) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.green }} />
              <span style={{ color: C.textSec, fontSize: 12 }}>{s}</span>
            </div>
          ))}
        </div>
      </div>
    </CmsShell>
  );
}
