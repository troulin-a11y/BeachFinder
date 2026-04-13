import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'auto';
type ResolvedTheme = 'light' | 'dark';

interface ThemeColors {
  bg: string[];          // gradient colors
  card: string;
  cardBorder: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  tabBar: string;
  tabActive: string;
  tabInactive: string;
  accent: string;
  surface: string;
}

interface ThemeContextValue {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
}

const LIGHT: ThemeColors = {
  bg: ['#0077b6', '#00b4d8', '#90e0ef', '#caf0f8'],
  card: 'rgba(255,255,255,0.95)',
  cardBorder: 'rgba(0,0,0,0.04)',
  text: '#1a1a2e',
  textSecondary: '#888',
  textMuted: '#bbb',
  tabBar: 'rgba(255,255,255,0.95)',
  tabActive: '#0077b6',
  tabInactive: '#999',
  accent: '#0077b6',
  surface: '#f0f8ff',
};

const DARK: ThemeColors = {
  bg: ['#071E3D', '#0C2D5A', '#1A5E9A', '#0C2D5A'],
  card: '#161B22',
  cardBorder: 'rgba(255,255,255,0.06)',
  text: '#E6EDF3',
  textSecondary: '#8B949E',
  textMuted: '#484F58',
  tabBar: 'rgba(13,17,23,0.92)',
  tabActive: '#E07254',
  tabInactive: '#6E7681',
  accent: '#E07254',
  surface: '#1C2333',
};

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'auto',
  resolved: 'light',
  colors: LIGHT,
  setMode: () => {},
});

const STORAGE_KEY = 'bf_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('auto');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'auto') {
        setModeState(saved);
      }
    });
  }, []);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    AsyncStorage.setItem(STORAGE_KEY, newMode);
  };

  const resolved: ResolvedTheme = useMemo(() => {
    if (mode === 'auto') return systemScheme === 'dark' ? 'dark' : 'light';
    return mode;
  }, [mode, systemScheme]);

  const colors = resolved === 'dark' ? DARK : LIGHT;

  return (
    <ThemeContext.Provider value={{ mode, resolved, colors, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
