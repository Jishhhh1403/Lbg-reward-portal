import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { Brain } from 'lucide-react'
import { palette } from './types'

interface CognitiveEvidenceProps {
  title?: string
  summary?: string
  factors?: string[]
}

export default function CognitiveEvidence({
  title = 'Cognitive evidence',
  summary = '',
  factors = [],
}: CognitiveEvidenceProps) {
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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <Brain size={16} color={palette.brand} />
        <Typography sx={{ fontSize: 14, fontWeight: 700, color: palette.textStrong }}>
          {title}
        </Typography>
      </Box>
      <Typography sx={{ fontSize: 13, color: palette.text, lineHeight: 1.6 }}>
        {summary}
      </Typography>
      {factors.length > 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '7px', marginTop: '10px' }}>
          {factors.map((f, i) => (
            <Box key={i} sx={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '999px',
                  bgcolor: palette.brand,
                  marginTop: '6px',
                  flexShrink: 0,
                }}
              />
              <Typography sx={{ fontSize: 12, color: palette.textMuted, lineHeight: 1.5 }}>
                {f}
              </Typography>
            </Box>
          ))}
        </Box>
      ) : null}
    </Box>
  )
}
