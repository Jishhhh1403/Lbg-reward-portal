import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { palette } from './types'

export default function UnderstoodAnchor() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Box
        sx={{
          width: 4,
          height: 18,
          borderRadius: '999px',
          bgcolor: palette.brand,
          flexShrink: 0,
        }}
      />
      <Typography
        sx={{
          fontSize: 16,
          fontWeight: 800,
          color: palette.textStrong,
          lineHeight: 1.3,
        }}
      >
        WHAT I UNDERSTOOD
      </Typography>
    </Box>
  )
}
