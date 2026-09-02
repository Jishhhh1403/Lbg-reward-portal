import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { AlertCircle } from 'lucide-react'
import { palette } from './types'

interface SummaryCapturedProps {
  summary?: string
}

export default function SummaryCaptured({ summary = '' }: SummaryCapturedProps) {
  return (
    <Box
      sx={{
        borderRadius: '14px',
        border: '1px solid',
        borderColor: palette.border,
        bgcolor: palette.surface,
        padding: '14px 16px',
      }}
    >
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: '10px',
          bgcolor: palette.brandBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '10px',
        }}
      >
        <AlertCircle size={18} color={palette.brand} />
      </Box>
      <Typography sx={{ fontSize: 13, color: palette.text, lineHeight: 1.6 }}>
        {summary}
      </Typography>
    </Box>
  )
}
