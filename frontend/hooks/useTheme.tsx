import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { darkTheme, lightTheme, ThemeTokens } from '../styles/theme';

interface ThemeContextValue {
  isDark: boolean;
  theme: ThemeTokens;
  toggleTheme: () => void;
}

const STORAGE_KEY = 'luki-cms-theme';

export const ThemeContext = createContext<ThemeContextValue>({
  isDark: true,
  theme: darkTheme,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === 'light') setIsDark(false);
      }
    } catch {}
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
        }
      } catch {}
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ isDark, theme: isDark ? darkTheme : lightTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  return useMemo(() => ({
    isDark: ctx?.isDark ?? true,
    theme: ctx?.theme ?? darkTheme,
    toggleTheme: ctx?.toggleTheme ?? (() => {}),
  }), [ctx]);
}
