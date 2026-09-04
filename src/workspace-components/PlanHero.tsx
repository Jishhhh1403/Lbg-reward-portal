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
        gap: '3px',
      }}
    >
      <Box
        sx={{
          width: 15,
          height: 15,
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
      <Box sx={{ flex: 1 ,marginbottom: '2px' }}>
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 700,
            color: palette.brand,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '5px',
          }}
        >
          {planLabel}
        </Typography>
        <Typography sx={{ fontSize: 11, fontWeight: 500, color: palette.text, lineHeight: 1.20 }}>
          {description}
        </Typography>
      </Box>
    </Box>
  )
}
