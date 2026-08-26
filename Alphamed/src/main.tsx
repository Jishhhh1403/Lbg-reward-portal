import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import App from './App'
import './index.css'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1565c0', dark: '#0d47a1', light: '#42a5f5' },
    secondary: { main: '#00897b' },
    success: { main: '#2e7d32' },
    background: { default: '#f4f7fb', paper: '#ffffff' },
    text: { primary: '#16283c', secondary: '#5b6b7c' },
  },
  typography: {
    fontFamily:
      '"Inter", "Segoe UI", "Helvetica Neue", Arial, system-ui, sans-serif',
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 10, boxShadow: 'none' },
        containedPrimary: {
          boxShadow: '0 8px 18px -8px rgba(21,101,192,.65)',
          '&:hover': { boxShadow: '0 10px 22px -8px rgba(21,101,192,.75)' },
        },
      },
    },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
)
