'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  const applyTheme = useCallback((t: Theme) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const currentThemeAttr = root.getAttribute('data-theme');
    const hasDark = root.classList.contains('dark');
    const hasLight = root.classList.contains('light');

    if (t === 'dark') {
      if (currentThemeAttr !== 'dark') root.setAttribute('data-theme', 'dark');
      if (!hasDark) root.classList.add('dark');
      if (hasLight) root.classList.remove('light');
    } else {
      if (currentThemeAttr !== 'light') root.setAttribute('data-theme', 'light');
      if (hasDark) root.classList.remove('dark');
      if (!hasLight) root.classList.add('light');
    }
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('tcg_theme') as Theme | null;
      const initialTheme: Theme =
        saved === 'light' || saved === 'dark'
          ? saved
          : window.matchMedia('(prefers-color-scheme: light)').matches
          ? 'light'
          : 'dark';

      setThemeState(initialTheme);
      applyTheme(initialTheme);
    } catch {
      applyTheme('dark');
    }
    setMounted(true);
  }, [applyTheme]);

  const setTheme = useCallback(
    (t: Theme) => {
      setThemeState((prev) => {
        if (prev === t) return prev;
        try {
          localStorage.setItem('tcg_theme', t);
        } catch {}
        applyTheme(t);
        return t;
      });
    },
    [applyTheme]
  );

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('tcg_theme', next);
      } catch {}
      applyTheme(next);
      return next;
    });
  }, [applyTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

