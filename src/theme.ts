import { createTheme } from '@mui/material/styles'

/**
 * Shared Material UI theme for the app.
 * Mirrors the Tailwind tokens defined in index.css so converted
 * components look identical to the original design.
 */

declare module '@mui/material/styles' {
  interface Palette {
    brand: Record<50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900, string>
    gold: Record<50 | 100 | 300 | 400 | 500 | 600 | 700, string>
  }
  interface PaletteOptions {
    brand?: Record<50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900, string>
    gold?: Record<50 | 100 | 300 | 400 | 500 | 600 | 700, string>
  }
}

const brand = {
  50: '#eef7f3',
  100: '#d7ece2',
  200: '#b0d9c7',
  300: '#7fc0a5',
  400: '#4aa37f',
  500: '#238762',
  600: '#006a4d',
  700: '#045a42',
  800: '#064836',
  900: '#073a2d',
} as const

const gold = {
  50: '#fdf9ef',
  100: '#faf1da',
  300: '#ecd9a8',
  400: '#ddbe72',
  500: '#c6a55c',
  600: '#a98a41',
  700: '#866c30',
} as const

export const shadows = {
  card: '0 1px 2px rgb(16 40 34 / 0.06), 0 8px 24px -12px rgb(16 40 34 / 0.18)',
  sheet: '0 -12px 48px -12px rgb(7 26 21 / 0.35)',
} as const

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: brand[600],
      dark: brand[700],
      light: brand[400],
      contrastText: '#ffffff',
    },
    secondary: {
      main: gold[400],
      dark: gold[500],
      light: gold[300],
      contrastText: brand[900],
    },
    background: {
      default: '#e2e8f0',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#64748b',
    },
    // Custom scales (theme.palette.brand[600], theme.palette.gold[400], ...)
    brand,
    gold,
  },
  typography: {
    fontFamily:
      '"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
})

export default theme
