import { createTheme } from '@mui/material/styles';

// ─── Design Tokens ─────────────────────────────────────────────────────────
// Single source of truth. See DESIGN_SYSTEM.md for full rationale.
const modeTokens = {
  light: {
    background: {
      default: '#F9F9FB',
      paper: '#FFFFFF',
      elevated: '#F0F0F5',
    },
    text: {
      primary: '#1A1A1C',
      secondary: '#64748B',
    },
    primary: {
      main: '#0A7B7B',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#0A7B7B',
      contrastText: '#FFFFFF',
    },
    border: '#E2E8F0',
    input: '#F8FAFC',
    muted: '#F1F5F9',
    ring: '#0A7B7B',
    destructive: '#ef4444',
    popover: '#FFFFFF',
    popoverForeground: '#1A1A1C',
    gain: '#16a34a',
    loss: '#dc2626',
    chart: {
      1: '#0A7B7B',
      2: '#16a34a',
      3: '#dc2626',
      4: '#f59e0b',
      5: '#3b82f6',
    },
  },
  dark: {
    background: {
      default: '#0a0a0a',
      paper: '#111111',
      elevated: '#1a1a1a',
    },
    text: {
      primary: '#EDEDED',
      secondary: '#888888',
    },
    primary: {
      main: '#0fb3af',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#0fb3af',
      contrastText: '#FFFFFF',
    },
    border: '#262626',
    input: '#161616',
    muted: '#111111',
    ring: '#0fb3af',
    destructive: '#ef4444',
    popover: '#1a1f2e',
    popoverForeground: '#E0E6EB',
    gain: '#22c55e',
    loss: '#ef4444',
    chart: {
      1: '#0fb3af',
      2: '#22c55e',
      3: '#ef4444',
      4: '#f59e0b',
      5: '#60a5fa',
    },
  },
};

const getShadows = (mode) => {
  const shadows = createTheme().shadows;
  if (mode === 'light') {
    shadows[1] = '0px 1px 3px 0px rgba(26,26,28,0.05)';
    shadows[2] = '0px 1px 3px 0px rgba(26,26,28,0.08), 0px 1px 2px -1px rgba(26,26,28,0.08)';
    shadows[3] = '0px 1px 3px 0px rgba(26,26,28,0.08), 0px 2px 4px -1px rgba(26,26,28,0.08)';
    shadows[4] = '0px 1px 3px 0px rgba(26,26,28,0.08), 0px 4px 6px -1px rgba(26,26,28,0.08)';
    shadows[8] = '0px 1px 3px 0px rgba(26,26,28,0.10), 0px 8px 16px -4px rgba(26,26,28,0.10)';
    shadows[16] = '0px 4px 24px rgba(26,26,28,0.14)';
  } else {
    shadows[1] = '0px 1px 3px 0px rgba(0,0,0,0.40)';
    shadows[2] = '0px 1px 3px 0px rgba(0,0,0,0.45), 0px 1px 2px -1px rgba(0,0,0,0.45)';
    shadows[3] = '0px 1px 3px 0px rgba(0,0,0,0.45), 0px 2px 4px -1px rgba(0,0,0,0.45)';
    shadows[4] = '0px 1px 3px 0px rgba(0,0,0,0.45), 0px 4px 6px -1px rgba(0,0,0,0.45)';
    shadows[8] = '0px 1px 3px 0px rgba(0,0,0,0.50), 0px 8px 16px -4px rgba(0,0,0,0.50)';
    shadows[16] = '0px 4px 24px rgba(0,0,0,0.70)';
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
      error: { main: tokens.destructive, contrastText: '#ffffff' },
      success: { main: tokens.gain },
      warning: { main: '#f59e0b' },
      info: { main: '#3b82f6' },
      text: tokens.text,
      divider: tokens.border,
      action: {
        hover: tokens.muted,
        selected: mode === 'dark' ? 'rgba(15,179,175,0.12)' : 'rgba(10,123,123,0.08)',
      },
      custom: {
        border: tokens.border,
        input: tokens.input,
        muted: tokens.muted,
        ring: tokens.ring,
        gain: tokens.gain,
        loss: tokens.loss,
        chart: tokens.chart,
        elevated: tokens.background.elevated,
      },
    },
    typography: {
      // DM Sans as MUI base — used for all components, forms, tables, buttons
      fontFamily: '"DM Sans", system-ui, sans-serif',
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
      subtitle1: { fontWeight: 500 },
      subtitle2: { fontWeight: 500 },
      body1: { letterSpacing: '0em' },
      body2: { letterSpacing: '0em' },
      button: { fontWeight: 600, letterSpacing: '0.02em', textTransform: 'none' },
    },
    shadows: getShadows(mode),
    shape: { borderRadius: 8 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: tokens.background.default,
            color: tokens.text.primary,
            letterSpacing: '0em',
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
            '&:hover': { boxShadow: 'none', filter: 'brightness(0.9)' },
          },
          containedPrimary: {
            backgroundColor: tokens.primary.main,
            color: tokens.primary.contrastText,
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
            transition: 'all 0.2s ease-in-out',
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
            '& fieldset': { borderColor: tokens.border, borderWidth: '1.5px' },
            '&:hover fieldset': { borderColor: tokens.ring },
            '&.Mui-focused fieldset': { borderColor: tokens.ring, borderWidth: '2px' },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: '0.75rem',
            backgroundColor: tokens.background.paper,
            color: tokens.text.primary,
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: { '&:hover': { backgroundColor: tokens.muted } },
        },
      },
      MuiTableCell: {
        styleOverrides: { root: { borderColor: tokens.border } },
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
      MuiChip: {
        styleOverrides: {
          root: { fontFamily: '"DM Sans", sans-serif', fontWeight: 600 },
        },
      },
    },
  });
};

export default createAppTheme;
