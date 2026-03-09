import { createTheme } from '@mui/material/styles';

const modeTokens = {
  light: {
    background: {
      default: '#e8ebed',
      paper: '#ffffff',
      elevated: '#f9fafb',
    },
    text: {
      primary: '#333333',
      secondary: '#6b7280',
    },
    primary: {
      main: '#df6035',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#2f4b79',
      contrastText: '#ffffff',
    },
    accent: {
      main: '#d6e4f0',
      contrastText: '#1e3a8a',
    },
    border: '#cccccc',
    input: '#f4f5f7',
    muted: '#f9fafb',
    ring: '#e05d38',
    destructive: '#ef4444',
    popover: '#ffffff',
    popoverForeground: '#333333',
    chart: {
      1: '#7399bf',
      2: '#e16f41',
      3: '#d54450',
      4: '#e2b146',
      5: '#3c4c76',
    },
  },
  dark: {
    background: {
      default: '#1a1a1a',
      paper: '#202020',
      elevated: '#2a2a2a',
    },
    text: {
      primary: '#e5e5e5',
      secondary: '#808080',
    },
    primary: {
      main: '#df6035',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#284167',
      contrastText: '#e5e5e5',
    },
    accent: {
      main: '#2a3656',
      contrastText: '#bfdbfe',
    },
    border: '#353535',
    input: '#303030',
    muted: '#2a2a2a',
    ring: '#e05d38',
    destructive: '#ef4444',
    popover: '#202020',
    popoverForeground: '#e5e5e5',
    chart: {
      1: '#85a6c7',
      2: '#e16f41',
      3: '#d54450',
      4: '#e2b146',
      5: '#3c4c76',
    },
  },
};

const getShadows = (mode) => {
  const shadows = createTheme().shadows;

  if (mode === 'light') {
    shadows[1] = '0px 1px 3px 0px rgba(26, 26, 26, 0.05)';
    shadows[2] = '0px 1px 3px 0px rgba(26, 26, 26, 0.10), 0px 1px 2px -1px rgba(26, 26, 26, 0.10)';
    shadows[3] = '0px 1px 3px 0px rgba(26, 26, 26, 0.10), 0px 2px 4px -1px rgba(26, 26, 26, 0.10)';
    shadows[4] = '0px 1px 3px 0px rgba(26, 26, 26, 0.10), 0px 4px 6px -1px rgba(26, 26, 26, 0.10)';
    shadows[8] = '0px 1px 3px 0px rgba(26, 26, 26, 0.10), 0px 8px 10px -1px rgba(26, 26, 26, 0.10)';
    shadows[16] = '0px 1px 3px 0px rgba(26, 26, 26, 0.25)';
  } else {
    shadows[1] = '0px 1px 3px 0px rgba(0, 0, 0, 0.15)';
    shadows[2] = '0px 1px 3px 0px rgba(0, 0, 0, 0.20), 0px 1px 2px -1px rgba(0, 0, 0, 0.20)';
    shadows[3] = '0px 1px 3px 0px rgba(0, 0, 0, 0.20), 0px 2px 4px -1px rgba(0, 0, 0, 0.20)';
    shadows[4] = '0px 1px 3px 0px rgba(0, 0, 0, 0.20), 0px 4px 6px -1px rgba(0, 0, 0, 0.20)';
    shadows[8] = '0px 1px 3px 0px rgba(0, 0, 0, 0.20), 0px 8px 10px -1px rgba(0, 0, 0, 0.20)';
    shadows[16] = '0px 1px 3px 0px rgba(0, 0, 0, 0.35)';
  }

  return shadows;
};

export const createAppTheme = (mode = 'light') => {
  const tokens = mode === 'dark' ? modeTokens.dark : modeTokens.light;

  return createTheme({
    palette: {
      mode,
      background: tokens.background,
      primary: tokens.primary,
      secondary: tokens.secondary,
      error: {
        main: tokens.destructive,
        contrastText: '#ffffff',
      },
      success: {
        main: '#10b981',
      },
      warning: {
        main: '#f59e0b',
      },
      info: {
        main: '#3b82f6',
      },
      text: tokens.text,
      divider: tokens.border,
      action: {
        hover: tokens.muted,
        selected: tokens.accent.main,
      },
      custom: {
        accent: tokens.accent.main,
        accentForeground: tokens.accent.contrastText,
        border: tokens.border,
        input: tokens.input,
        muted: tokens.muted,
        ring: tokens.ring,
        chart: tokens.chart,
      },
    },
    typography: {
      fontFamily: '"Outfit", "Segoe UI", sans-serif',
      fontWeightRegular: 400,
      fontWeightMedium: 500,
      fontWeightSemiBold: 600,
      fontWeightBold: 700,
      h1: { fontWeight: 700, letterSpacing: '-0.02em' },
      h2: { fontWeight: 700, letterSpacing: '-0.02em' },
      h3: { fontWeight: 600, letterSpacing: '-0.01em' },
      h4: { fontWeight: 600, letterSpacing: '-0.01em' },
      h5: { fontWeight: 600, letterSpacing: '0em' },
      h6: { fontWeight: 600, letterSpacing: '0em' },
      subtitle1: { fontWeight: 500, letterSpacing: '0em' },
      subtitle2: { fontWeight: 500, letterSpacing: '0em' },
      body1: { letterSpacing: '0em' },
      body2: { letterSpacing: '0em' },
      button: {
        fontWeight: 600,
        letterSpacing: '0em',
        textTransform: 'none',
      },
    },
    shadows: getShadows(mode),
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            letterSpacing: '0em',
            backgroundColor: tokens.background.default,
            color: tokens.text.primary,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: '0.5rem',
            textTransform: 'none',
            fontWeight: 600,
            padding: '10px 24px',
            transition: 'all 0.2s ease-in-out',
            '&:active': { transform: 'scale(0.98)' },
          },
          contained: {
            boxShadow: 'none',
            '&:hover': { boxShadow: getShadows(mode)[2] },
          },
          containedPrimary: {
            backgroundColor: tokens.primary.main,
            color: tokens.primary.contrastText,
            '&:hover': {
              backgroundColor: tokens.primary.main,
              filter: 'brightness(0.92)',
            },
          },
          outlined: {
            borderWidth: '1.5px',
            '&:hover': { borderWidth: '1.5px' },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: '0.5rem',
            backgroundImage: 'none',
            backgroundColor: tokens.background.paper,
            color: tokens.text.primary,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '0.5rem',
            transition: 'all 0.3s ease-in-out',
            backgroundColor: tokens.background.paper,
            color: tokens.text.primary,
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: '0.5rem',
            backgroundColor: tokens.input,
            '& fieldset': {
              borderColor: tokens.border,
              borderWidth: '1.5px',
            },
            '&:hover fieldset': {
              borderColor: tokens.ring,
            },
            '&.Mui-focused fieldset': {
              borderColor: tokens.ring,
              borderWidth: '2px',
            },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: '0.5rem',
            backgroundColor: tokens.background.paper,
            color: tokens.text.primary,
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:hover': {
              backgroundColor: tokens.muted,
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: tokens.border,
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: '0.5rem',
            marginTop: '8px',
            backgroundColor: tokens.popover,
            color: tokens.popoverForeground,
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            padding: '8px 12px',
            backgroundColor: tokens.popover,
            color: tokens.popoverForeground,
            border: `1px solid ${tokens.border}`,
          },
        },
      },
    },
  });
};

export default createAppTheme;
