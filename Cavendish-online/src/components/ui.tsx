import type { ReactNode } from 'react'
import { Box, Button, Typography } from '@mui/material'
import { ChevronRight } from 'lucide-react'

export function Shell({ children, sx = [] }: { children: ReactNode; sx?: object }) {
  return (
    <Box sx={[{ maxWidth: 1240, mx: 'auto', px: '20px' }, ...(Array.isArray(sx) ? sx : [sx])] as any}>
      {children}
    </Box>
  )
}

export function PillButton({
  children,
  href,
  onClick,
  sx = [],
}: {
  children: ReactNode
  href?: string
  onClick?: () => void
  sx?: object
}) {
  return (
    <Button
      href={href}
      onClick={onClick}
      disableElevation
      sx={[
        {
          bgcolor: '#840544',
          color: '#fff',
          border: '2px solid #670539',
          borderRadius: '150px',
          fontSize: 14,
          fontWeight: 700,
          lineHeight: '16px',
          padding: '16px 52px',
          textTransform: 'uppercase',
          '&:hover': { bgcolor: 'transparent', color: '#670539' },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ] as any}
    >
      {children}
    </Button>
  )
}

export function Kicker({ children }: { children: ReactNode }) {
  return (
    <Typography
      component="p"
      sx={{
        color: '#670539',
        fontSize: 14,
        fontWeight: 700,
        letterSpacing: '.28px',
        textTransform: 'uppercase',
        mb: '6px',
      }}
    >
      {children}
    </Typography>
  )
}

export function LinkArrow({ children, href }: { children: ReactNode; href: string }) {
  return (
    <Box
      component="a"
      href={href}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        color: '#670539',
        fontSize: 14,
        fontWeight: 700,
        textDecoration: 'none',
        '& svg': { transition: 'transform .2s ease' },
        '&:hover': { color: '#aa8094', '& svg': { transform: 'translateX(4px)' } },
      }}
    >
      {children}
      <ChevronRight size={16} strokeWidth={3} />
    </Box>
  )
}

export function SectionHeading({ title, align = 'center' }: { title: string; align?: 'center' | 'left' }) {
  return (
    <Typography variant="h2" sx={{ fontSize: { xs: 28, md: 36 }, textAlign: align }}>
      {title}
    </Typography>
  )
}
