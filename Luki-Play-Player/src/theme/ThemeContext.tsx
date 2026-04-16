import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

type ThemeMode = 'light' | 'dark' | 'automatic';

export interface ThemeColors {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  primary: string; // The specific Luki-Play branding color (will assume a deep elegant purple/blue for now, which can be adapted based on lukiplay.png later)
}

const lightColors: ThemeColors = {
  background: '#F9FAFB',
  card: '#FFFFFF',
  text: '#111827',
  textSecondary: '#6B7280',
  primary: '#4F46E5', // Luki Primary color (placeholder)
};

const darkColors: ThemeColors = {
  background: '#0B0F19', // Deep dark for OTTs, better than pure black for depth
  card: '#1F2937',
  text: '#F9FAFB',
  textSecondary: '#D1D5DB',
  primary: '#6366F1', // Luki Primary color for dark mode
};

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('automatic');

  const isDark = mode === 'automatic' ? systemScheme === 'dark' : mode === 'dark';
  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ mode, setMode, colors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);
