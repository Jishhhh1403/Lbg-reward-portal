import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { Check } from 'lucide-react'

interface ObjectiveConstraintItem {
  id: string
  text: string
  applied: boolean
}

interface ObjectiveConstraintsProps {
  items: ObjectiveConstraintItem[]
}

export default function ObjectiveConstraints({ items }: ObjectiveConstraintsProps) {
  return (
    <Box>
      <Typography
        sx={{
          fontSize: 12,
          fontWeight: 600,
          color: '#475569',
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        Applied Constraints
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {items.map((c) => (
          <Box
            key={c.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              borderRadius: '10px',
              bgcolor: '#f8fafc',
              border: '1px solid #e2e8f0',
              padding: '10px 14px',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 22,
                height: 22,
                borderRadius: '999px',
                bgcolor: c.applied ? '#dcfce7' : '#f1f5f9',
                flexShrink: 0,
              }}
            >
              {c.applied && <Check size={12} color="#16a34a" strokeWidth={3} />}
            </Box>
            <Typography sx={{ fontSize: 13, color: '#334155' }}>{c.text}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
