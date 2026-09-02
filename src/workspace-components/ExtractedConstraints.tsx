import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { ListFilter } from 'lucide-react'
import { palette } from './types'

interface ExtractedConstraintItem {
  id: string
  text: string
}

interface ExtractedConstraintsProps {
  title?: string
  items: ExtractedConstraintItem[]
}

export default function ExtractedConstraints({
  title = 'Constraints extracted',
  items = [],
}: ExtractedConstraintsProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '7px', paddingX: '4px' }}>
        <ListFilter size={15} color={palette.brand} />
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 700,
            color: palette.textStrong,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {title}
        </Typography>
      </Box>

      {items.length === 0 ? (
        <Typography sx={{ fontSize: 13, color: palette.textMuted }}>
          No constraints extracted.
        </Typography>
      ) : (
        <Box component="ul" sx={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {items.map((c) => (
            <Box
              key={c.id}
              component="li"
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                borderRadius: '12px',
                border: '1px solid',
                borderColor: palette.border,
                bgcolor: palette.surfaceAlt,
                padding: '10px 14px',
              }}
            >
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
              <Typography sx={{ fontSize: 13, color: palette.text, lineHeight: 1.5 }}>
                {c.text}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}