import type { PropsWithChildren } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'

interface AuthScreenLayoutProps {
  title: string
  subtitle?: string
  footer?: React.ReactNode
}

/** Shared visual shell for /login, /forgot-password and /signup. */
export default function AuthScreenLayout({
  title,
  subtitle,
  children,
  footer,
}: PropsWithChildren<AuthScreenLayoutProps>) {
  return (
    <Box className="am-rise">
      <Box className="auth-hero-band" sx={{ px: 3, pt: 6, pb: 7 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
          <BrandMark />
          <Typography variant="h6" fontWeight={800} color="#fff" letterSpacing={0.2}>
            AlphaMedicol
          </Typography>
        </Box>
        <Typography variant="h5" fontWeight={800} color="#fff" gutterBottom>
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="body2" color="rgba(255,255,255,.85)">
            {subtitle}
          </Typography>
        ) : null}
      </Box>

      <Box
        sx={{
          mx: 2,
          mt: -3,
          mb: 3,
          p: 3,
          borderRadius: 5,
          bgcolor: 'background.paper',
          boxShadow: '0 18px 45px -22px rgba(13,40,80,.35)',
          position: 'relative',
        }}
      >
        {children}
      </Box>

      {footer ? (
        <Box sx={{ textAlign: 'center', pb: 4 }}>{footer}</Box>
      ) : null}
    </Box>
  )
}

export function BrandMark({ size = 38 }: { size?: number }) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: `${Math.round(size * 0.32)}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg,#42a5f5,#0d47a1)',
        boxShadow: '0 8px 18px -8px rgba(21,101,192,.8)',
      }}
    >
      <LocalHospitalIcon sx={{ color: '#fff', fontSize: size * 0.58 }} />
    </Box>
  )
}
