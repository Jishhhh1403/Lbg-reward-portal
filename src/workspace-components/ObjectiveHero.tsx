import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { palette } from './types'

interface ObjectiveHeroProps {
  objective?: string
  eyebrow?: string
}

export default function ObjectiveHero({
  objective = '',
  eyebrow = 'Objective',
}: ObjectiveHeroProps) {
  return (
    <Box
      sx={{
        borderRadius: '14px',
        border: '1px solid',
        borderColor: palette.border,
        bgcolor: palette.surfaceAlt,
        padding: '14px 16px',
      }}
    >
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 700,
          color: palette.brand,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: '4px',
        }}
      >
        {eyebrow}
      </Typography>
      <Typography sx={{ fontSize: 12, fontWeight: 700, color: palette.textStrong, lineHeight: 1.45 }}>
        {objective}
      </Typography>
    </Box>
  )
}
