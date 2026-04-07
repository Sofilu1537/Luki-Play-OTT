'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export const C = {
  // ── Luki Play logo palette ─────────────────────────────
  void:        '#160035',                   // fondo más profundo
  panel:       'rgba(26, 6, 62, 0.96)',     // sidebar / topbar
  surface:     'rgba(42, 14, 90, 0.88)',    // cards
  lift:        'rgba(70, 28, 130, 0.92)',   // hover / active
  border:      'rgba(255,255,255,0.10)',
  borderMid:   'rgba(255,184,0,0.28)',
  accent:      '#FFB800',                   // dorado "play" badge
  accentGlow:  'rgba(255,184,0,0.26)',
  accentLight: '#FFDA6B',
  accentFaint: 'rgba(255,184,0,0.14)',
  accentBorder:'rgba(255,184,0,0.36)',
  stone:       '#D7CBB8',
  green:       '#10B981',
  amber:       '#FFB800',
  rose:        '#F43F5E',
  text:        '#FFFFFF',                   // blanco puro como el logo
  textSec:     '#D0C4E8',                   // lavanda suave
  muted:       '#8B72B2',                   // violeta apagado
  dimmed:      '#0D0020',
};

interface NavItem {
  label: string;
  icon: string;
  path: string;
  soon?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Usuarios', icon: 'users', path: '/users' },
  { label: 'Componentes', icon: 'grid', path: '/componentes', soon: true },
  { label: 'Planes', icon: 'wallet', path: '/planes' },
  { label: 'Canales', icon: 'screen', path: '/canales' },
  { label: 'Categorías', icon: 'tag', path: '/categorias' },
  { label: 'Sliders', icon: 'image', path: '/sliders' },
  { label: 'Monitor', icon: 'chart', path: '/monitor' },
  { label: 'Notific. Admin', icon: 'bell', path: '/notificaciones-admin', soon: true },
  { label: 'Analítica', icon: 'chart', path: '/analitica', soon: true },
  { label: 'Propaganda', icon: 'megaphone', path: '/propaganda', soon: true },
  { label: 'Notific. Abonado', icon: 'bell', path: '/notificaciones-abonado', soon: true },
  { label: 'Abonado', icon: 'person', path: '/abonado', soon: true },
];

function getDisplayName(email: string, first?: string | null, last?: string | null) {
  if (first && last) return `${first} ${last}`;
  if (first) return first;
  return email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function renderIcon(icon: string, active: boolean) {
  const color = active ? C.accent : C.textSec;
  const common = { width: 17, height: 17, viewBox: '0 0 24 24', fill: 'none' } as const;

  switch (icon) {
    case 'users':
      return (
        <svg {...common} aria-hidden="true">
          <path d="M16 19a4 4 0 0 0-8 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="10" r="3.2" stroke={color} strokeWidth="1.8" />
          <path d="M6 19a3.6 3.6 0 0 0-3-3.4M18 15.6A3.6 3.6 0 0 1 21 19" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'grid':
      return (
        <svg {...common} aria-hidden="true">
          <rect x="4" y="4" width="6" height="6" rx="1.4" stroke={color} strokeWidth="1.8" />
          <rect x="14" y="4" width="6" height="6" rx="1.4" stroke={color} strokeWidth="1.8" />
          <rect x="4" y="14" width="6" height="6" rx="1.4" stroke={color} strokeWidth="1.8" />
          <rect x="14" y="14" width="6" height="6" rx="1.4" stroke={color} strokeWidth="1.8" />
        </svg>
      );
    case 'wallet':
      return (
        <svg {...common} aria-hidden="true">
          <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6H18a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6.5A2.5 2.5 0 0 1 4 15.5v-7Z" stroke={color} strokeWidth="1.8" />
          <path d="M4 9h14.5A1.5 1.5 0 0 1 20 10.5v1A1.5 1.5 0 0 1 18.5 13H17" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="16.6" cy="11" r=".8" fill={color} />
        </svg>
      );
    case 'screen':
      return (
        <svg {...common} aria-hidden="true">
          <rect x="3.5" y="5" width="17" height="11" rx="2" stroke={color} strokeWidth="1.8" />
          <path d="M9 19h6M12 16v3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'tag':
      return (
        <svg {...common} aria-hidden="true">
          <path d="M11 4H6.8A1.8 1.8 0 0 0 5 5.8V10l6.3 6.3a2 2 0 0 0 2.8 0l4.2-4.2a2 2 0 0 0 0-2.8L11 4Z" stroke={color} strokeWidth="1.8" />
          <circle cx="8.4" cy="7.8" r="1" fill={color} />
        </svg>
      );
    case 'image':
      return (
        <svg {...common} aria-hidden="true">
          <rect x="3.5" y="4.5" width="17" height="15" rx="2" stroke={color} strokeWidth="1.8" />
          <circle cx="9" cy="9" r="1.5" fill={color} />
          <path d="m6.5 16 3.5-3.5 2.5 2.5 2.5-3 2.5 4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'chart':
      return (
        <svg {...common} aria-hidden="true">
          <path d="M5 19V9m7 10V5m7 14v-7" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M4 19h16" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'bell':
      return (
        <svg {...common} aria-hidden="true">
          <path d="M6.5 9.6a5.5 5.5 0 1 1 11 0c0 4.1 1.8 5 1.8 5H4.7s1.8-.9 1.8-5Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M10 18a2 2 0 0 0 4 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'megaphone':
      return (
        <svg {...common} aria-hidden="true">
          <path d="M4 13V9.5a1.5 1.5 0 0 1 1.5-1.5H8l8-3v14l-8-3H5.5A1.5 1.5 0 0 1 4 13Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="m8 15 1.5 4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'person':
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="12" cy="8" r="3.2" stroke={color} strokeWidth="1.8" />
          <path d="M6.5 19a5.5 5.5 0 0 1 11 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="12" cy="12" r="7" stroke={color} strokeWidth="1.8" />
        </svg>
      );
  }
}

export default function CmsShell({ children, title }: { children: React.ReactNode; title?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, clearSession } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const syncViewport = () => setIsMobile(window.innerWidth < 1100);
    syncViewport();
    window.addEventListener('resize', syncViewport);
    return () => window.removeEventListener('resize', syncViewport);
  }, []);

  useEffect(() => {
    if (!menuOpen && !navOpen) return;
    const handler = () => {
      setMenuOpen(false);
      if (isMobile) setNavOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [isMobile, menuOpen, navOpen]);

  useEffect(() => {
    setMenuOpen(false);
    setNavOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    clearSession();
    router.replace('/login');
  }

  const displayName = user ? getDisplayName(user.email, user.firstName, user.lastName) : '';
  const initials = displayName.split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase();
  const isActive = (path: string) => pathname === path || pathname?.startsWith(`${path}/`) || false;
  const sidebarWidth = 264;
  const navItems = NAV_ITEMS.map((item) => ({
    ...item,
    active: isActive(item.path),
    iconNode: renderIcon(item.icon, isActive(item.path)),
  }));

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: `linear-gradient(160deg, #1a0040 0%, #2e0a6e 40%, #4a18a0 70%, #2e0a6e 100%)`, color: C.text }}>
      {/* ── Decorative bokeh orbs (like the logo) ── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(123,47,190,0.25) 0%, transparent 70%)', top: '-120px', right: '-80px' }} />
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(90,30,158,0.20) 0%, transparent 70%)', bottom: '10%', left: '-100px' }} />
        <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,184,0,0.06) 0%, transparent 70%)', top: '30%', right: '20%' }} />
      </div>
      {isMobile && navOpen && (
        <button
          aria-label="Cerrar navegación"
          onClick={() => setNavOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 45,
            background: 'rgba(0,0,0,0.62)',
            border: 'none',
            backdropFilter: 'blur(8px)',
            cursor: 'pointer',
          }}
        />
      )}

      <aside
        onClick={(event) => event.stopPropagation()}
        style={{
          width: sidebarWidth,
          background: `linear-gradient(180deg, rgba(26,6,62,0.97) 0%, rgba(16,2,42,0.99) 100%)`,
          borderRight: `1px solid ${C.border}`,
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          zIndex: 50,
          padding: 18,
          boxShadow: isMobile ? '0 24px 80px rgba(0,0,0,0.5)' : 'none',
          transform: isMobile ? `translateX(${navOpen ? '0' : '-108%'})` : 'translateX(0)',
          transition: 'transform 0.28s ease, box-shadow 0.28s ease',
        }}
      >
        <div style={{
          padding: '18px 16px',
          border: `1px solid ${C.border}`,
          borderRadius: 24,
          background: 'linear-gradient(180deg, rgba(255,184,0,0.12), rgba(123,47,190,0.08))',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
          marginBottom: 18,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
            <div>
              <span style={{ display: 'block', fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 20, letterSpacing: -0.7 }}>
                <span style={{ color: C.text }}>luki</span>{' '}
                <span style={{ color: C.accent, background: C.accent, padding: '2px 8px', borderRadius: 8, color: '#fff', fontWeight: 800 }}>play</span>
              </span>
              <p style={{ color: C.muted, fontSize: 10, fontWeight: 800, letterSpacing: 2.4, marginTop: 6 }}>
                CONTROL CENTER
              </p>
            </div>
            <div style={{
              minWidth: 50,
              padding: '8px 10px',
              borderRadius: 14,
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${C.border}`,
              textAlign: 'center',
            }}>
              <div style={{ color: C.accent, fontFamily: 'Sora, sans-serif', fontSize: 16, fontWeight: 700, lineHeight: 1 }}>24</div>
              <div style={{ color: C.muted, fontSize: 9, letterSpacing: 1.2, marginTop: 4 }}>LIVE</div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 12px',
            borderRadius: 16,
            background: 'rgba(255,255,255,0.025)',
            border: `1px solid ${C.border}`,
          }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: C.green, boxShadow: '0 0 0 6px rgba(155,191,99,0.12)' }} />
            <div>
              <p style={{ color: C.text, fontSize: 12, fontWeight: 700 }}>Operación estable</p>
              <p style={{ color: C.muted, fontSize: 11 }}>Panel activo y listo para gestión</p>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
          <p style={{ color: C.muted, fontSize: 11, fontWeight: 800, letterSpacing: 2.2, margin: '6px 12px 14px' }}>
            NAVEGACIÓN
          </p>
          <div style={{ display: 'grid', gap: 8 }}>
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.soon ? '#' : item.path}
                onClick={(event) => item.soon && event.preventDefault()}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '20px 1fr auto',
                  alignItems: 'center',
                  gap: 12,
                  padding: '13px 14px',
                  textDecoration: 'none',
                  borderRadius: 18,
                  border: `1px solid ${item.active ? C.accentBorder : C.border}`,
                  background: item.active
                    ? 'linear-gradient(135deg, rgba(255,184,0,0.20), rgba(123,47,190,0.12))'
                    : 'rgba(255,255,255,0.02)',
                  boxShadow: item.active ? `0 18px 40px ${C.accentGlow}` : 'none',
                  cursor: item.soon ? 'default' : 'pointer',
                  transition: 'transform 0.18s ease, border-color 0.18s ease, background 0.18s ease',
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', opacity: item.soon ? 0.42 : 1 }}>
                  {item.iconNode}
                </span>
                <span style={{ color: item.active ? C.text : item.soon ? C.muted : C.textSec, fontSize: 13, fontWeight: item.active ? 800 : 700 }}>
                  {item.label}
                </span>
                {item.soon ? (
                  <span style={{
                    fontSize: 9,
                    fontWeight: 800,
                    color: C.muted,
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: 999,
                    padding: '4px 8px',
                    letterSpacing: 1.2,
                  }}>
                    PROX
                  </span>
                ) : item.active ? (
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.accent, boxShadow: `0 0 18px ${C.accentGlow}` }} />
                ) : null}
              </Link>
            ))}
          </div>
        </nav>

        <div style={{
          marginTop: 18,
          padding: '16px 14px',
          borderRadius: 22,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(123,47,190,0.06))',
          border: `1px solid ${C.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
            <span style={{ color: C.text, fontSize: 12, fontWeight: 700 }}>LUKI PLAY CMS</span>
            <span style={{ color: C.accent, fontSize: 10, fontWeight: 800, letterSpacing: 1.3 }}>LOCAL</span>
          </div>
          <p style={{ color: C.muted, fontSize: 11, lineHeight: 1.45, marginBottom: 14 }}>
            Diseño premium alineado a marca, listo para revisión local antes de despliegue.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.green }} />
            <span style={{ color: C.textSec, fontSize: 11 }}>Sistema en línea</span>
          </div>
        </div>
      </aside>

      <div style={{ marginLeft: isMobile ? 0 : sidebarWidth, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <header style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          padding: isMobile ? '18px 18px 0' : '24px 28px 0',
          backdropFilter: 'blur(18px)',
        }}>
          <div style={{
            minHeight: 84,
            borderRadius: 28,
            border: `1px solid ${C.border}`,
            background: 'linear-gradient(180deg, rgba(30,8,70,0.92), rgba(20,4,50,0.88))',
            boxShadow: '0 24px 80px rgba(0,0,0,0.28)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            padding: isMobile ? '16px 18px' : '18px 22px 18px 24px',
            flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
              {isMobile && (
                <button
                  aria-label="Abrir navegación"
                  onClick={(event) => {
                    event.stopPropagation();
                    setNavOpen(true);
                  }}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    border: `1px solid ${C.border}`,
                    background: 'rgba(255,255,255,0.03)',
                    color: C.text,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ display: 'grid', gap: 4 }}>
                    <span style={{ width: 16, height: 2, borderRadius: 99, background: C.text }} />
                    <span style={{ width: 16, height: 2, borderRadius: 99, background: C.text }} />
                    <span style={{ width: 16, height: 2, borderRadius: 99, background: C.text }} />
                  </span>
                </button>
              )}

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                  <span style={{
                    padding: '6px 10px',
                    borderRadius: 999,
                    background: C.accentFaint,
                    border: `1px solid ${C.accentBorder}`,
                    color: C.accentLight,
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: 1.4,
                  }}>
                    LUKI PLAY BRAND UI
                  </span>
                  <span style={{ color: C.muted, fontSize: 11, letterSpacing: 1.4 }}>OPERACIÓN ADMINISTRATIVA</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                  <h1 style={{ margin: 0, color: C.text, fontFamily: 'Sora, sans-serif', fontSize: isMobile ? 24 : 28, fontWeight: 700, letterSpacing: -0.8 }}>
                    {title ?? 'Panel'}
                  </h1>
                  <span style={{ color: C.textSec, fontSize: 13 }}>Monitoreo, gestión y control en una sola vista</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginLeft: 'auto' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 16,
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${C.border}`,
              }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: C.green, boxShadow: '0 0 0 6px rgba(155,191,99,0.12)' }} />
                <div>
                  <p style={{ color: C.text, fontSize: 11, fontWeight: 700 }}>Backend sincronizado</p>
                  <p style={{ color: C.muted, fontSize: 10 }}>Sesión segura activa</p>
                </div>
              </div>

              <button
                aria-label="Notificaciones"
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 16,
                  border: `1px solid ${C.border}`,
                  background: 'rgba(255,255,255,0.03)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {renderIcon('bell', false)}
              </button>

              <div style={{ position: 'relative' }}>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    setMenuOpen((value) => !value);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    minHeight: 52,
                    padding: '7px 10px 7px 7px',
                    borderRadius: 18,
                    border: `1px solid ${C.border}`,
                    background: 'rgba(255,255,255,0.03)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: 14,
                    background: 'linear-gradient(135deg, rgba(255,184,0,0.30), rgba(123,47,190,0.20))',
                    border: `1px solid ${C.accentBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: C.text,
                    fontSize: 12,
                    fontWeight: 800,
                    boxShadow: `0 14px 28px ${C.accentGlow}`,
                  }}>
                    {initials || 'LN'}
                  </div>
                  <div style={{ display: 'grid', textAlign: 'left', minWidth: 0 }}>
                    <span style={{ color: C.text, fontSize: 12, fontWeight: 700, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {displayName || 'Administrador'}
                    </span>
                    <span style={{ color: C.muted, fontSize: 10, letterSpacing: 1 }}>{user?.role ?? 'ADMIN'}</span>
                  </div>
                  <span style={{ color: C.muted, fontSize: 10 }}>▾</span>
                </button>

                {menuOpen && (
                  <div
                    onClick={(event) => event.stopPropagation()}
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 10px)',
                      right: 0,
                      minWidth: 220,
                      background: 'linear-gradient(180deg, rgba(36,10,80,0.98), rgba(22,4,55,0.98))',
                      border: `1px solid ${C.borderMid}`,
                      borderRadius: 22,
                      overflow: 'hidden',
                      boxShadow: '0 30px 70px rgba(0,0,0,0.48)',
                      zIndex: 60,
                    }}
                  >
                    <div style={{ padding: '16px 16px 14px', borderBottom: `1px solid ${C.border}` }}>
                      <p style={{ color: C.text, fontSize: 14, fontWeight: 800, marginBottom: 4 }}>{displayName || 'Administrador'}</p>
                      <p style={{ color: C.muted, fontSize: 11 }}>{user?.email}</p>
                    </div>
                    {[
                      { label: 'Mi perfil', action: () => setProfileOpen(true) },
                      { label: 'Soporte', action: () => {} },
                      { label: 'Cerrar sesión', action: handleLogout, rose: true },
                    ].map((item, index) => (
                      <button
                        key={item.label}
                        onClick={() => {
                          setMenuOpen(false);
                          item.action();
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          background: 'transparent',
                          border: 'none',
                          borderTop: index === 2 ? `1px solid ${C.border}` : 'none',
                          padding: '13px 16px',
                          cursor: 'pointer',
                          fontSize: 13,
                          fontWeight: 700,
                          color: item.rose ? C.rose : C.textSec,
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main style={{ flex: 1, padding: isMobile ? 18 : 28, paddingTop: isMobile ? 18 : 22 }}>
          {children}
        </main>
      </div>

      {profileOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(8px)' }}
          onClick={() => setProfileOpen(false)}
        >
          <div
            style={{ background: 'linear-gradient(180deg, rgba(36,10,80,0.98), rgba(20,4,50,0.98))', border: `1px solid ${C.borderMid}`, borderRadius: 28, padding: 32, width: 400, maxWidth: '100%', boxShadow: '0 40px 90px rgba(10,0,40,0.65)' }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{
                width: 58,
                height: 58,
                borderRadius: 18,
                background: 'linear-gradient(135deg, rgba(255,184,0,0.28), rgba(123,47,190,0.18))',
                border: `1px solid ${C.accentBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                fontWeight: 900,
                color: C.text,
                boxShadow: `0 0 20px ${C.accentGlow}`,
              }}>{initials || 'LN'}</div>
              <div>
                <p style={{ color: C.text, fontWeight: 800, fontSize: 18, marginBottom: 4 }}>{displayName || 'Administrador'}</p>
                <p style={{ color: C.accent, fontSize: 12, fontWeight: 700, letterSpacing: 1.2 }}>{user?.role ?? 'ADMIN'}</p>
              </div>
            </div>
            {[
              { label: 'Correo', value: user?.email },
              { label: 'ID', value: user?.id },
            ].map((field) => (
              <div key={field.label} style={{ marginBottom: 12, padding: '12px 14px', borderRadius: 18, background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.border}` }}>
                <p style={{ color: C.muted, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, marginBottom: 3 }}>{field.label.toUpperCase()}</p>
                <p style={{ color: C.textSec, fontSize: 13 }}>{field.value ?? '—'}</p>
              </div>
            ))}
            <button
              onClick={() => setProfileOpen(false)}
              style={{
                marginTop: 20,
                width: '100%',
                padding: '13px 0',
                background: 'linear-gradient(180deg, rgba(255,184,0,0.18), rgba(123,47,190,0.10))',
                border: `1px solid ${C.accentBorder}`,
                borderRadius: 16,
                color: C.text,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
