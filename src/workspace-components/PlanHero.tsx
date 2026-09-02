import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { Target } from 'lucide-react'
import { palette } from './types'

interface PlanHeroProps {
  planLabel?: string
  description?: string
}

export default function PlanHero({
  planLabel = 'Your plan',
  description = '',
}: PlanHeroProps) {
  return (
    <Box
      sx={{
        borderRadius: '16px',
        border: '1px solid',
        borderColor: palette.border,
        bgcolor: palette.brandBg,
        padding: '16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
      }}
    >
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: '12px',
          bgcolor: palette.brand,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Target size={18} color="#ffffff" strokeWidth={2} />
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 700,
            color: palette.brand,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '3px',
          }}
        >
          {planLabel}
        </Typography>
        <Typography sx={{ fontSize: 14, fontWeight: 700, color: palette.textStrong, lineHeight: 1.5 }}>
          {description}
        </Typography>
      </Box>
    </Box>
  )
}
