import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import ButtonBase from '@mui/material/ButtonBase'

interface ObjectiveOpportunityItem {
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

interface ObjectiveOpportunitiesProps {
  items: ObjectiveOpportunityItem[]
  shortlisted?: ObjectiveOpportunityItem[]
  rejected?: ObjectiveOpportunityItem[]
}

type BucketKey = 'shortlisted' | 'rejected'

const brand = '#006a4d'
const brandDark = '#045a42'
const brandBg = '#f0fdf4'
const border = '#e2e8f0'
const surfaceAlt = '#f8fafc'
const textStrong = '#0f172a'
const textMuted = '#64748b'
const textFaint = '#94a3b8'
const gold = '#a98a41'
const goldBg = '#fdf9ef'

export default function ObjectiveOpportunities({
  items,
  shortlisted,
  rejected,
}: ObjectiveOpportunitiesProps) {
  const shortlist = shortlisted ?? items
  const reject = rejected ?? []
  const [active, setActive] = useState<BucketKey>('shortlisted')
  const bucket: ObjectiveOpportunityItem[] = active === 'shortlisted' ? shortlist : reject

  const tabStyles = (tab: BucketKey) => ({
    flex: 1,
    padding: '8px 0',
    borderRadius: '10px',
    fontSize: 13,
    fontWeight: 600,
    fontFamily: 'inherit',
    color: active === tab ? '#ffffff' : textMuted,
    bgcolor: active === tab ? brand : 'transparent',
    transition: 'background-color 0.2s ease, color 0.2s ease',
    '&:hover': {
      bgcolor: active === tab ? brandDark : surfaceAlt,
    },
  })

  return (
    <Box>
      <Typography
        sx={{ fontSize: 15, fontWeight: 700, color: textStrong, marginBottom: '10px' }}
      >
        Reward opportunities
      </Typography>

      <Box
        sx={{
          display: 'flex',
          gap: '4px',
          padding: '4px',
          borderRadius: '12px',
          bgcolor: surfaceAlt,
          border: `1px solid ${border}`,
          marginBottom: '12px',
        }}
      >
        <ButtonBase disableRipple onClick={() => setActive('shortlisted')} sx={tabStyles('shortlisted')}>
          Shortlisted
        </ButtonBase>
        <ButtonBase disableRipple onClick={() => setActive('rejected')} sx={tabStyles('rejected')}>
          Rejected
        </ButtonBase>
      </Box>

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
          <Typography sx={{ fontSize: 13, color: textFaint, padding: '12px 4px' }}>
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
                  borderColor: isRejected ? '#fecaca' : border,
                  bgcolor: isRejected ? '#fef2f2' : '#ffffff',
                  padding: '12px 14px',
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
                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: textStrong }}>
                    {opp.title}
                  </Typography>
                  <Box
                    sx={{
                      borderRadius: '8px',
                      bgcolor: isRejected ? '#fee2e2' : goldBg,
                      paddingX: '8px',
                      paddingY: '2px',
                      fontSize: 11,
                      fontWeight: 700,
                      color: isRejected ? '#dc2626' : gold,
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {opp.estimatedValue}
                  </Box>
                </Box>
                <Typography
                  sx={{ fontSize: 12, color: textMuted, lineHeight: 1.5, marginBottom: '4px' }}
                >
                  {opp.description}
                </Typography>
                <Typography sx={{ fontSize: 11, color: textFaint }}>{opp.partner}</Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '4px', mt: 'auto', pt: '6px' }}>
                  {opp.cashback && (
                    <Chip
                      label={`Cashback ${opp.cashback}`}
                      variant={isRejected ? 'muted' : 'good'}
                    />
                  )}
                  {opp.conversionRate && (
                    <Chip
                      label={`Rate ${opp.conversionRate}`}
                      variant={isRejected ? 'muted' : 'good'}
                    />
                  )}
                  {opp.transactionFee !== undefined && (
                    <Chip
                      label={
                        opp.transactionFee === '£0' || opp.transactionFee === '0'
                          ? 'No fee'
                          : `Fee ${opp.transactionFee}`
                      }
                      variant={
                        isRejected
                          ? 'muted'
                          : opp.transactionFee === '£0' || opp.transactionFee === '0'
                            ? 'good'
                            : 'bad'
                      }
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
      ? { color: brand, bgcolor: brandBg }
      : variant === 'bad'
        ? { color: '#dc2626', bgcolor: '#fee2e2' }
        : { color: textFaint, bgcolor: surfaceAlt }
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
