import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { palette } from './types'

interface UnderstoodAnchorProps {
  text?: string
}

export default function UnderstoodAnchor({
  text = 'What I understood',
}: UnderstoodAnchorProps) {
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
        {text}
      </Typography>
    </Box>
  )
}
