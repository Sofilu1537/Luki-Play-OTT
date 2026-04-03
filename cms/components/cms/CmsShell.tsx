'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';

export const C = {
  void: '#050B17', panel: '#070E1D', surface: '#0C1829', lift: '#102236',
  border: 'rgba(255,255,255,0.06)', borderMid: 'rgba(255,255,255,0.11)',
  accent: '#7B5EF8', accentGlow: 'rgba(123,94,248,0.22)',
  accentLight: '#A78BFA', accentFaint: 'rgba(123,94,248,0.08)', accentBorder: 'rgba(123,94,248,0.30)',
  cyan: '#22D3EE', green: '#10B981', amber: '#FBBF24', rose: '#F43F5E',
  text: '#EFF6FF', textSec: '#94A3B8', muted: '#3F5475', dimmed: '#1C2E45',
};

interface NavItem { label: string; icon: string; path: string; soon?: boolean; }

const NAV_ITEMS: NavItem[] = [
  { label: 'Usuarios',         icon: '👥', path: '/users' },
  { label: 'Componentes',      icon: '⊞',  path: '/componentes',           soon: true },
  { label: 'Planes',           icon: '💳', path: '/planes' },
  { label: 'Canales',          icon: '📺', path: '/canales' },
  { label: 'Categorías',       icon: '🏷', path: '/categorias' },
  { label: 'Sliders',          icon: '🖼', path: '/sliders' },
  { label: 'Monitor',          icon: '📊', path: '/monitor' },
  { label: 'Notific. Admin',   icon: '🔔', path: '/notificaciones-admin',   soon: true },
  { label: 'Analítica',        icon: '📈', path: '/analitica',              soon: true },
  { label: 'Propaganda',       icon: '📣', path: '/propaganda',             soon: true },
  { label: 'Notific. Abonado', icon: '💬', path: '/notificaciones-abonado', soon: true },
  { label: 'Abonado',          icon: '👤', path: '/abonado',                soon: true },
];

function getDisplayName(email: string, first?: string | null, last?: string | null) {
  if (first && last) return `${first} ${last}`;
  if (first) return first;
  return email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function CmsShell({ children, title }: { children: React.ReactNode; title?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, clearSession } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = () => setMenuOpen(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [menuOpen]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    clearSession();
    router.replace('/login');
  }

  const displayName = user ? getDisplayName(user.email, user.firstName, user.lastName) : '';
  const initials = displayName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const isActive = (path: string) => pathname?.includes(path) ?? false;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.void }}>
      {/* SIDEBAR */}
      <aside style={{
        width: 220, background: C.panel, borderRight: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 40,
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontWeight: 900, fontSize: 17, letterSpacing: -0.5 }}>
            <span style={{ color: C.text }}>LUKI </span>
            <span style={{ color: C.accent }}>PLAY</span>
          </span>
          <p style={{ color: C.muted, fontSize: 10, fontWeight: 700, letterSpacing: 2, marginTop: 4 }}>
            PANEL ADMIN
          </p>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                href={item.soon ? '#' : item.path}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 20px', textDecoration: 'none',
                  position: 'relative', cursor: item.soon ? 'default' : 'pointer',
                  background: active ? C.accentFaint : 'transparent',
                  borderLeft: `3px solid ${active ? C.accent : 'transparent'}`,
                  transition: 'background 0.15s',
                }}
                onClick={(e) => item.soon && e.preventDefault()}
              >
                <span style={{ fontSize: 14, opacity: item.soon ? 0.4 : 1 }}>{item.icon}</span>
                <span style={{
                  fontSize: 13, fontWeight: active ? 700 : 400,
                  color: active ? C.accentLight : item.soon ? C.muted : C.textSec,
                  flex: 1,
                }}>{item.label}</span>
                {item.soon && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, color: C.muted,
                    background: C.dimmed, borderRadius: 4, padding: '2px 5px', letterSpacing: 1,
                  }}>PRÓ</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.green }} />
            <span style={{ color: C.muted, fontSize: 11 }}>Sistema en línea</span>
          </div>
          <p style={{ color: C.dimmed, fontSize: 10, marginTop: 6 }}>v2.0 · Luki Play</p>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ marginLeft: 220, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* TOPBAR */}
        <header style={{
          height: 60, background: C.panel,
          borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 28px', position: 'sticky', top: 0, zIndex: 30,
        }}>
          {/* Page title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 3, height: 18, background: C.accent, borderRadius: 2 }} />
            <span style={{ color: C.text, fontSize: 15, fontWeight: 700 }}>{title ?? 'Panel'}</span>
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Bell */}
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 16, padding: 4 }}>🔔</button>

            {/* User button */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
                }}
              >
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: C.accentFaint, border: `1px solid ${C.accentBorder}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 800, color: C.accentLight,
                }}>{initials}</div>
                <span style={{ color: C.textSec, fontSize: 12, fontWeight: 500, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {displayName}
                </span>
                <span style={{ color: C.muted, fontSize: 10 }}>▾</span>
              </button>

              {/* Dropdown */}
              {menuOpen && (
                <div style={{
                  position: 'absolute', top: '110%', right: 0, minWidth: 180,
                  background: C.surface, border: `1px solid ${C.borderMid}`,
                  borderRadius: 12, overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 50,
                }}>
                  <div style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}` }}>
                    <p style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>{displayName}</p>
                    <p style={{ color: C.muted, fontSize: 11 }}>{user?.role}</p>
                  </div>
                  {[
                    { label: 'Mi perfil', action: () => setProfileOpen(true) },
                    { label: 'Soporte', action: () => {} },
                    { label: 'Cerrar sesión', action: handleLogout, rose: true },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => { setMenuOpen(false); item.action(); }}
                      style={{
                        width: '100%', textAlign: 'left', background: 'none', border: 'none',
                        padding: '10px 14px', cursor: 'pointer', fontSize: 13,
                        color: item.rose ? C.rose : C.textSec,
                        borderTop: item.rose ? `1px solid ${C.border}` : 'none',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = C.lift)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                    >{item.label}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main style={{ flex: 1, padding: 28 }}>
          {children}
        </main>
      </div>

      {/* PROFILE MODAL */}
      {profileOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(5,11,23,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setProfileOpen(false)}
        >
          <div
            style={{ background: C.surface, border: `1px solid ${C.borderMid}`, borderRadius: 20, padding: 32, width: 360, maxWidth: '90vw' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: C.accentFaint, border: `2px solid ${C.accentBorder}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 900, color: C.accentLight,
                boxShadow: `0 0 20px ${C.accentGlow}`,
              }}>{initials}</div>
              <div>
                <p style={{ color: C.text, fontWeight: 800, fontSize: 16 }}>{displayName}</p>
                <p style={{ color: C.accent, fontSize: 12, fontWeight: 600 }}>{user?.role}</p>
              </div>
            </div>
            {[
              { label: 'Correo', value: user?.email },
              { label: 'ID', value: user?.id },
            ].map((f) => (
              <div key={f.label} style={{ marginBottom: 12 }}>
                <p style={{ color: C.muted, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, marginBottom: 3 }}>{f.label.toUpperCase()}</p>
                <p style={{ color: C.textSec, fontSize: 13 }}>{f.value ?? '—'}</p>
              </div>
            ))}
            <button
              onClick={() => setProfileOpen(false)}
              style={{
                marginTop: 20, width: '100%', padding: '10px 0',
                background: C.lift, border: `1px solid ${C.border}`,
                borderRadius: 8, color: C.textSec, fontSize: 13, cursor: 'pointer',
              }}
            >Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
