import { createTheme } from '@mui/material/styles'

export const brand = {
  magenta: '#840544',
  deepMagenta: '#670539',
  mauve: '#aa8094',
  dark: '#191919',
  muted: '#706f6f',
  card: '#fbf9f9',
  border: '#f2f2f2',
  postFooter: '#F0F0F0',
  trustpilotGreen: '#00b67a',
}

export const fontFamily =
  '"Inter", system-ui, -apple-system, "Segoe UI", Arial, sans-serif'

const theme = createTheme({
  palette: {
    primary: { main: brand.magenta, contrastText: '#ffffff' },
    secondary: { main: brand.deepMagenta, contrastText: '#ffffff' },
    background: { default: '#ffffff', paper: brand.card },
    text: { primary: brand.dark, secondary: brand.muted },
  },
  typography: {
    fontFamily,
    h1: {
      fontWeight: 700,
      color: brand.dark,
      fontSize: '2.75rem',
      lineHeight: 1.27,
      letterSpacing: '0.5px',
    },
    h2: {
      fontWeight: 700,
      color: brand.dark,
      fontSize: '2.25rem',
      lineHeight: 1.11,
      letterSpacing: '0.71px',
    },
    h3: {
      fontWeight: 700,
      color: brand.magenta,
      fontSize: '1.75rem',
      lineHeight: 1.28,
      letterSpacing: '0.45px',
    },
    h4: { fontWeight: 700, color: brand.deepMagenta, fontSize: '1rem' },
    button: { textTransform: 'none', fontWeight: 700 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: '#ffffff' },
        '::selection': { backgroundColor: brand.magenta, color: '#fff' },
      },
    },
  },
})

export default theme
