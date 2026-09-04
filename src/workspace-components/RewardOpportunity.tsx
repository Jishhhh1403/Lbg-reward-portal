import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import ButtonBase from '@mui/material/ButtonBase'
import { palette } from './types'

interface RewardOpportunityItem {
  id: string
  title: string
  description: string
  partner: string
  estimatedValue: string
  constraints?: string[]
  cashback?: string | null
  conversionRate?: string | null
  transactionFee?: string | null
  offerType?: string | null
}

interface RewardOpportunityProps {
  items: RewardOpportunityItem[]
  shortlisted?: RewardOpportunityItem[]
  rejected?: RewardOpportunityItem[]
  eyebrow?: string
  objective?: string
}

/** Turns the (often verbose) objective into a short, plain-English essence. */
function summariseObjective(objective: string): string {
  const clean = objective.trim().replace(/\s+/g, ' ').replace(/^so[\s,]+/i, '')
  if (!clean) return ''
  return clean.charAt(0).toUpperCase() + clean.slice(1)
}

type BucketKey = 'shortlisted' | 'rejected'

export default function RewardOpportunity({
  items,
  shortlisted,
  rejected,
  eyebrow = 'Reward opportunities',
  objective,
}: RewardOpportunityProps) {
  /* Shortlisted wins by default; fall back to items for back-compat. */
  const shortlist = shortlisted ?? items
  const reject = rejected ?? []
  const [active, setActive] = useState<BucketKey>('shortlisted')

  const heading = eyebrow || 'Reward opportunities'
  const objectiveSummary = objective ? summariseObjective(objective) : ''

  const bucket: RewardOpportunityItem[] = active === 'shortlisted' ? shortlist : reject

  const tabStyles = (tab: BucketKey) => ({
    flex: 1,
    padding: '8px 0',
    borderRadius: '10px',
    fontSize: 13,
    fontWeight: 600,
    fontFamily: 'inherit',
    color: active === tab ? '#ffffff' : palette.textMuted,
    bgcolor: active === tab ? palette.brand : 'transparent',
    transition: 'background-color 0.2s ease, color 0.2s ease',
    '&:hover': {
      bgcolor: active === tab ? palette.brandDark : palette.surfaceAlt,
    },
  })

  return (
    <Box sx={{ width: '100%' }}>

      {/* Heading */}
      <Typography
        sx={{
          fontSize: 13,
          fontWeight: 700,
          color: palette.textStrong,
          marginBottom: '5px',
        }}
      >
        {heading}
      </Typography>

      {/* Navigation tabs */}
      <Box
        sx={{
          display: 'flex',
          gap: '4px',
          padding: '4px',
          borderRadius: '12px',
          bgcolor: palette.surfaceAlt,
          border: `1px solid ${palette.border}`,
          marginBottom: '12px',
        }}
      >
        <ButtonBase
          disableRipple
          onClick={() => setActive('shortlisted')}
          sx={tabStyles('shortlisted')}
        >
          Shortlisted
        </ButtonBase>
        <ButtonBase
          disableRipple
          onClick={() => setActive('rejected')}
          sx={tabStyles('rejected')}
        >
          Rejected
        </ButtonBase>
      </Box>

      {/* Horizontal scrollable carousel — expands edge-to-edge of the modal */}
      <Box
        sx={{
          width: 'calc(100% + 24px)',
          maxWidth: 'none',
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          marginInline: '-12px',
          padding: '2px',
          paddingRight: '16px',
          pb: '6px',
          '&::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none',
        }}
      >
        {bucket.length === 0 ? (
          <Typography
            sx={{ fontSize: 13, color: palette.textFaint, padding: '12px 4px' }}
          >
            No {active} reward opportunities for this objective yet.
          </Typography>
        ) : (
          bucket.map((opp) => {
            const isRejected = active === 'rejected'
            return (
              <Box
                key={opp.id}
                sx={{
                  flex: '0 0 82%',
                  width: '82%',
                  scrollSnapAlign: 'start',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  borderRadius: '16px',
                  border: '1px solid',
                  borderColor: isRejected ? '#fecaca' : palette.border,
                  bgcolor: isRejected ? '#fef2f2' : palette.surface,
                  padding: '12px 14px',
                  boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}
                >
                  <Typography
                    sx={{ fontSize: 13, fontWeight: 700, color: palette.textStrong }}
                  >
                    {opp.title}
                  </Typography>
                  <Box
                    sx={{
                      borderRadius: '8px',
                      bgcolor: isRejected ? '#fee2e2' : palette.goldBg,
                      paddingX: '8px',
                      paddingY: '2px',
                      fontSize: 11,
                      fontWeight: 700,
                      color: isRejected ? '#dc2626' : palette.gold,
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {opp.estimatedValue}
                  </Box>
                </Box>
                <Typography
                  sx={{
                    fontSize: 12,
                    color: palette.textMuted,
                    lineHeight: 1.20,
                    marginBottom: '4px',
                  }}
                >
                  {opp.description}
                </Typography>
                <Typography sx={{ fontSize: 11, color: palette.textFaint }}>
                  {/* {opp.partner} */}
                </Typography>

                {/* Constraint chips */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '4px', mt: 'auto', pt: '6px' }}>
                  {opp.cashback && (
                    <Chip label={`Cashback ${opp.cashback}`} variant={isRejected ? 'muted' : 'good'} />
                  )}
                  {opp.conversionRate && (
                    <Chip label={`Rate ${opp.conversionRate}`} variant={isRejected ? 'muted' : 'good'} />
                  )}
                  {opp.transactionFee !== undefined && (
                    <Chip
                      label={opp.transactionFee === '£0' || opp.transactionFee === '0' ? 'No fee' : `Fee ${opp.transactionFee}`}
                      variant={isRejected ? 'muted' : (opp.transactionFee === '£0' || opp.transactionFee === '0' ? 'good' : 'bad')}
                    />
                  )}
                </Box>
              </Box>
            )
          })
        )}
      </Box>
    </Box>
  )
}

function Chip({
  label,
  variant = 'good',
}: {
  label: string
  variant?: 'good' | 'bad' | 'muted'
}) {
  const styles =
    variant === 'good'
      ? { color: palette.brand, bgcolor: palette.brandBg }
      : variant === 'bad'
        ? { color: '#dc2626', bgcolor: '#fee2e2' }
        : { color: palette.textFaint, bgcolor: palette.surfaceAlt }
  return (
    <Box
      sx={{
        borderRadius: '999px',
        paddingX: '8px',
        paddingY: '2px',
        fontSize: 10,
        fontWeight: 600,
        ...styles,
      }}
    >
      {label}
    </Box>
  )
}
