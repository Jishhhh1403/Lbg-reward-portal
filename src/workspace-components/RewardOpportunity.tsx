import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
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
  objective?: string
}

/** Turns the (often verbose) objective into a short, plain-English essence. */
function summariseObjective(objective: string): string {
  const clean = objective.trim().replace(/\s+/g, ' ').replace(/^so[\s,]+/i, '')
  if (!clean) return ''
  return clean.charAt(0).toUpperCase() + clean.slice(1)
}

export default function RewardOpportunity({
  items,
  eyebrow = 'Reward opportunities',
  objective,
}: RewardOpportunityProps) {
  const objectiveSummary = objective ? summariseObjective(objective) : ''
  const [index, setIndex] = useState(0)

  const prev = () => setIndex((i) => (i - 1 + items.length) % items.length)
  const next = () => setIndex((i) => (i + 1) % items.length)

  return (
    <Box>
      {objective && (
        <Typography
          sx={{
            fontSize: 15,
            fontWeight: 700,
            color: palette.textStrong,
            marginBottom: '20px',
          }}
        >
          {objectiveSummary}
        </Typography>
      )}
      <Typography
        sx={{
          fontSize: 12,
          fontWeight: 700,
          color: palette.textMuted,
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          textAlign: 'center',
        }}
      >
        {eyebrow}
      </Typography>
      {items.length > 0 ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconButton
            onClick={prev}
            disabled={items.length <= 1}
            size="small"
            aria-label="Previous opportunity"
            sx={{ color: palette.textStrong }}
          >
            &lt;
          </IconButton>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box
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
                  {items[index].title}
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
                  {items[index].estimatedValue}
                </Box>
              </Box>
              <Typography
                sx={{ fontSize: 12, color: palette.textMuted, lineHeight: 1.5, marginBottom: '4px' }}
              >
                {items[index].description}
              </Typography>
              <Typography sx={{ fontSize: 11, color: palette.textFaint }}>
                {items[index].partner}
              </Typography>
            </Box>
            {items.length > 1 && (
              <Typography
                sx={{
                  fontSize: 11,
                  color: palette.textFaint,
                  textAlign: 'center',
                  marginTop: '8px',
                }}
              >
                {index + 1} / {items.length}
              </Typography>
            )}
          </Box>
          <IconButton
            onClick={next}
            disabled={items.length <= 1}
            size="small"
            aria-label="Next opportunity"
            sx={{ color: palette.textStrong }}
          >
            &gt;
          </IconButton>
        </Box>
      ) : null}
    </Box>
  )
}
