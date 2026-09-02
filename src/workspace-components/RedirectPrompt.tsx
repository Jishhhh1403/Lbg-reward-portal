import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { ExternalLink } from 'lucide-react'
import { palette } from './types'

interface RedirectPromptProps {
  partner?: string
  prompt?: string
}

export default function RedirectPrompt({
  partner = '',
  prompt = '',
}: RedirectPromptProps) {
  return (
    <Box
      sx={{
        borderRadius: '16px',
        border: '1px solid',
        borderColor: palette.border,
        bgcolor: palette.brandBg,
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: '12px',
          bgcolor: palette.brand,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <ExternalLink size={18} color="#ffffff" strokeWidth={2} />
      </Box>
      <Box sx={{ flex: 1 }}>
        {partner ? (
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 800,
              color: palette.brand,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '3px',
            }}
          >
            {partner}
          </Typography>
        ) : null}
        <Typography sx={{ fontSize: 14, fontWeight: 700, color: palette.textStrong, lineHeight: 1.45 }}>
          {prompt}
        </Typography>
      </Box>
    </Box>
  )
}