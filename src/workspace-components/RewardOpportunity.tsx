import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { palette } from './types'

interface RewardOpportunityItem {
  id: string
  title: string
  description: string
  partner: string
  estimatedValue: string
}

interface RewardOpportunityProps {
  items: RewardOpportunityItem[]
  eyebrow?: string
}

export default function RewardOpportunity({
  items,
  eyebrow = 'Reward opportunities',
}: RewardOpportunityProps) {
  return (
    <Box>
      <Typography
        sx={{
          fontSize: 12,
          fontWeight: 700,
          color: palette.textMuted,
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {eyebrow}
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
        {items.map((opp) => (
          <Box
            key={opp.id}
            sx={{
              borderRadius: '14px',
              border: '1px solid',
              borderColor: palette.border,
              bgcolor: palette.surface,
              padding: '12px 14px',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '8px',
                marginBottom: '4px',
              }}
            >
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: palette.textStrong }}>
                {opp.title}
              </Typography>
              <Box
                sx={{
                  borderRadius: '8px',
                  bgcolor: palette.goldBg,
                  paddingX: '8px',
                  paddingY: '2px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: palette.gold,
                  flexShrink: 0,
                }}
              >
                {opp.estimatedValue}
              </Box>
            </Box>
            <Typography
              sx={{ fontSize: 12, color: palette.textMuted, lineHeight: 1.5, marginBottom: '4px' }}
            >
              {opp.description}
            </Typography>
            <Typography sx={{ fontSize: 11, color: palette.textFaint }}>{opp.partner}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
