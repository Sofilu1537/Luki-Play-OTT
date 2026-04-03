'use client';
import { useState } from 'react';

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const S = {
  wrapper: { marginBottom: 16 } as React.CSSProperties,
  label: { display: 'block', color: '#94A3B8', fontSize: 12, fontWeight: 600, letterSpacing: 0.5, marginBottom: 7 } as React.CSSProperties,
  input: {
    width: '100%', padding: '12px 14px',
    background: '#0C1829',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    color: '#EFF6FF',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  } as React.CSSProperties,
  inputFocus: {
    borderColor: '#7B5EF8',
    boxShadow: '0 0 0 3px rgba(123,94,248,0.15)',
  } as React.CSSProperties,
  error: { color: '#F43F5E', fontSize: 12, marginTop: 5 } as React.CSSProperties,
  eyeBtn: {
    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer', color: '#3F5475',
    fontSize: 13, padding: 4,
  } as React.CSSProperties,
};

export default function AuthInput({ label, error, type, ...props }: AuthInputProps) {
  const [focused, setFocused] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword ? (showPass ? 'text' : 'password') : type;

  return (
    <div style={S.wrapper}>
      <label style={S.label}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          {...props}
          type={inputType}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
          style={{
            ...S.input,
            ...(focused ? S.inputFocus : {}),
            ...(error ? { borderColor: '#F43F5E' } : {}),
            paddingRight: isPassword ? 40 : 14,
          }}
        />
        {isPassword && (
          <button type="button" style={S.eyeBtn} onClick={() => setShowPass((v) => !v)} tabIndex={-1}>
            {showPass ? '🙈' : '👁'}
          </button>
        )}
      </div>
      {error && <p style={S.error}>{error}</p>}
    </div>
  );
}
