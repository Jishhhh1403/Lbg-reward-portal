import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { Check } from 'lucide-react'
import { palette } from './types'

interface ConstraintItem {
  id: string
  text: string
  applied: boolean
}

interface ConstraintListProps {
  items: ConstraintItem[]
}

export default function ConstraintList({ items }: ConstraintListProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {items.map((c) => (
        <Box
          key={c.id}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            borderRadius: '12px',
            border: '1px solid',
            borderColor: palette.border,
            bgcolor: c.applied ? palette.brandBg : palette.surfaceAlt,
            padding: '10px 14px',
          }}
        >
          <Box
            sx={{
              width: 22,
              height: 22,
              borderRadius: '999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              bgcolor: c.applied ? palette.brand : palette.border,
            }}
          >
            {c.applied ? <Check size={12} color="#ffffff" strokeWidth={3} /> : null}
          </Box>
          <Typography sx={{ fontSize: 13, color: palette.text, lineHeight: 1.5 }}>
            {c.text}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}