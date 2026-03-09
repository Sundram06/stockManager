import { useContext } from 'react';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { ThemeModeContext } from './ThemeContext';

/**
 * Custom hook to access theme mode and MUI theme
 * @returns {{ mode: string, toggleTheme: function, setThemeMode: function, theme: object }}
 */
export function useTheme() {
  const { mode, toggleTheme, setThemeMode } = useContext(ThemeModeContext);
  const muiTheme = useMuiTheme();
  
  return {
    mode,
    toggleTheme,
    setThemeMode,
    theme: muiTheme,
  };
}

export default useTheme;
