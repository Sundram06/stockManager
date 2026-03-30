import { useContext } from 'react';
import { ThemeModeContext } from './ThemeContext';

export function useTheme() {
  const { mode, toggleTheme, setThemeMode } = useContext(ThemeModeContext);
  return { mode, toggleTheme, setThemeMode };
}

export default useTheme;
