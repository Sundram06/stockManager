import { createContext, useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';

export const ThemeModeContext = createContext({
  mode: 'light',
  toggleTheme: () => {},
  setThemeMode: () => {},
});

const THEME_STORAGE_KEY = 'vittnest-theme-mode';

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') return stored;
    } catch (e) {
      console.warn('Failed to read theme preference:', e);
    }
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  });

  // Listen to system theme changes (only when user hasn't set a preference)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handle = (e) => {
      if (!localStorage.getItem(THEME_STORAGE_KEY)) {
        setMode(e.matches ? 'dark' : 'light');
      }
    };
    mq.addEventListener?.('change', handle) ?? mq.addListener?.(handle);
    return () => mq.removeEventListener?.('change', handle) ?? mq.removeListener?.(handle);
  }, []);

  // Persist + apply .dark class to <html>
  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (e) {
      console.warn('Failed to persist theme preference:', e);
    }
    const root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [mode]);

  const contextValue = useMemo(
    () => ({
      mode,
      toggleTheme: () => setMode((prev) => (prev === 'light' ? 'dark' : 'light')),
      setThemeMode: (newMode) => {
        if (newMode === 'light' || newMode === 'dark') setMode(newMode);
      },
    }),
    [mode]
  );

  return (
    <ThemeModeContext.Provider value={contextValue}>
      {children}
    </ThemeModeContext.Provider>
  );
}

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ThemeProvider;
