'use client';

/** Shared split-panel layout for all auth pages */
export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex" style={{ background: '#050B17' }}>
      {/* LEFT — Branding panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-[55%] relative overflow-hidden p-12"
        style={{ background: 'linear-gradient(135deg, #050B17 0%, #0C1829 100%)' }}
      >
        {/* Orb violet */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: 480, height: 480,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(123,94,248,0.18) 0%, transparent 70%)',
            top: '-100px', left: '-80px',
          }}
        />
        {/* Orb cyan */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: 360, height: 360,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(34,211,238,0.12) 0%, transparent 70%)',
            bottom: '60px', right: '-60px',
          }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <span style={{ color: '#EFF6FF', fontWeight: 900, fontSize: 28, letterSpacing: -1 }}>
            LUKI{' '}
            <span style={{ color: '#7B5EF8' }}>PLAY</span>
          </span>
        </div>

        {/* Center copy */}
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <p style={{ color: '#3F5475', fontSize: 10, fontWeight: 700, letterSpacing: 3, marginBottom: 16 }}>
            PANEL ADMINISTRATIVO
          </p>
          <h1 style={{ color: '#EFF6FF', fontSize: 38, fontWeight: 900, lineHeight: 1.15, letterSpacing: -1.5, marginBottom: 20 }}>
            Gestión inteligente<br />
            de tu plataforma OTT
          </h1>
          <p style={{ color: '#94A3B8', fontSize: 14, lineHeight: 1.7, maxWidth: 340 }}>
            Administra usuarios, contenido, planes y analítica desde un único panel seguro y moderno.
          </p>

          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {['Acceso seguro con autenticación robusta', 'Control total sobre usuarios y contratos', 'Métricas en tiempo real de tu plataforma'].map((text) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#7B5EF8', flexShrink: 0 }} />
                <span style={{ color: '#94A3B8', fontSize: 13 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center gap-2">
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981' }} />
          <span style={{ color: '#3F5475', fontSize: 12 }}>Sistema en línea</span>
        </div>
      </div>

      {/* RIGHT — Form panel */}
      <div
        className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12"
        style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <span style={{ color: '#EFF6FF', fontWeight: 900, fontSize: 22, letterSpacing: -0.5 }}>
            LUKI <span style={{ color: '#7B5EF8' }}>PLAY</span>
          </span>
        </div>

        <div style={{ width: '100%', maxWidth: 400 }}>
          {children}
        </div>

        <p style={{ color: '#3F5475', fontSize: 11, marginTop: 32 }}>
          © {new Date().getFullYear()} Luki Play · Panel Administrativo
        </p>
      </div>
    </div>
  );
}
