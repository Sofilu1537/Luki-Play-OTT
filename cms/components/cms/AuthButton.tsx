'use client';

interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
}

export default function AuthButton({ loading, loadingText = 'Verificando…', children, style, ...props }: AuthButtonProps) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      style={{
        width: '100%',
        padding: '13px 0',
        background: loading ? '#4B3A9B' : '#7B5EF8',
        color: '#fff',
        border: 'none',
        borderRadius: 10,
        fontSize: 14,
        fontWeight: 700,
        cursor: loading ? 'not-allowed' : 'pointer',
        letterSpacing: 0.3,
        transition: 'background 0.15s, box-shadow 0.15s',
        boxShadow: loading ? 'none' : '0 0 0 0 transparent',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!loading) (e.currentTarget.style.boxShadow = '0 0 20px rgba(123,94,248,0.35)');
      }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
    >
      {loading ? (
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <span
            style={{
              width: 14, height: 14,
              border: '2px solid rgba(255,255,255,0.3)',
              borderTopColor: '#fff',
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'spin 0.7s linear infinite',
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          {loadingText}
        </span>
      ) : children}
    </button>
  );
}
