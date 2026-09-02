import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { AlertTriangle } from 'lucide-react'
import { palette } from './types'

interface ExecutionFailureProps {
  message?: string
  reason?: string
}

export default function ExecutionFailure({
  message = 'Something went wrong during execution.',
  reason,
}: ExecutionFailureProps) {
  return (
    <Box
      sx={{
        borderRadius: '14px',
        border: '1px solid',
        borderColor: palette.accentSoft,
        bgcolor: '#fff7f7',
        padding: '16px',
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: '12px',
          bgcolor: palette.accentSoft,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '12px',
        }}
      >
        <AlertTriangle size={20} color={palette.accent} />
      </Box>
      <Typography sx={{ fontSize: 15, fontWeight: 800, color: palette.textStrong, marginBottom: '4px' }}>
        Execution step failed
      </Typography>
      <Typography sx={{ fontSize: 13, color: palette.textMuted, lineHeight: 1.6 }}>{message}</Typography>
      {reason ? (
        <Typography
          sx={{
            fontSize: 12,
            color: palette.accent,
            marginTop: '10px',
            textAlign: 'center',
            bgcolor: palette.accentSoft,
            borderRadius: '8px',
            padding: '8px',
          }}
        >
          {reason}
        </Typography>
      ) : null}
    </Box>
  )
}
