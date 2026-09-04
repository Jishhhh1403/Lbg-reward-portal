import { useState, useRef, useEffect, useCallback } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import ButtonBase from '@mui/material/ButtonBase'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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

type BucketKey = 'shortlisted' | 'rejected'

export default function RewardOpportunity({
  items,
  shortlisted,
  rejected,
  eyebrow = 'Reward opportunities',
}: RewardOpportunityProps) {
  /* Shortlisted wins by default; fall back to items for back-compat. */
  const shortlist = shortlisted ?? items
  const reject = rejected ?? []
  const [active, setActive] = useState<BucketKey>('shortlisted')

  const heading = eyebrow || 'Reward opportunities'

  const bucket: RewardOpportunityItem[] = active === 'shortlisted' ? shortlist : reject
  const [current, setCurrent] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const [cardWidth, setCardWidth] = useState(0)

  const measure = useCallback(() => {
    if (containerRef.current) {
      setCardWidth(containerRef.current.offsetWidth)
    }
  }, [])

  useEffect(() => {
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure])

  useEffect(() => {
    setCurrent(0)
  }, [active])

  const prev = () => setCurrent((c) => Math.max(0, c - 1))
  const next = () => setCurrent((c) => Math.min(bucket.length - 1, c + 1))

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
          paddingLeft: '12px',
          textAlign: 'left',
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

      {/* Carousel with back/forward arrows */}
      <Box sx={{ position: 'relative', width: '100%' }}>
        {bucket.length === 0 ? (
          <Typography
            sx={{ fontSize: 13, color: palette.textFaint, padding: '12px 4px' }}
          >
            No {active} reward opportunities for this objective yet.
          </Typography>
        ) : (
          <Box sx={{ overflow: 'hidden', width: '100%' }}>
            <Box
              ref={containerRef}
              sx={{
                display: 'flex',
                gap: '12px',
                transform: `translateX(${-current * (cardWidth + 12)}px)`,
                transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {bucket.map((opp) => {
                const isRejected = active === 'rejected'
                return (
                  <Box
                    key={opp.id}
                    sx={{
                      flex: '0 0 100%',
                      width: '100%',
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
                        marginTop: '10px',
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
              })}
            </Box>
          </Box>
        )}

        {/* Back / Forward arrows */}
        {bucket.length > 0 && (
          <>
            <Box
              component="button"
              onClick={prev}
              disabled={current === 0}
              aria-label="Previous"
              sx={{
                position: 'absolute',
                top: '50%',
                left: -12,
                transform: 'translateY(-50%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 30,
                height: 30,
                borderRadius: '50%',
                bgcolor: '#ffffff',
                border: `1px solid ${palette.border}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                color: current === 0 ? palette.textFaint : palette.textStrong,
                cursor: current === 0 ? 'default' : 'pointer',
                zIndex: 5,
                '&:hover:not(:disabled)': { bgcolor: palette.surfaceAlt },
                '&:disabled': { opacity: 0.4 },
              }}
            >
              <ChevronLeft size={16} />
            </Box>
            <Box
              component="button"
              onClick={next}
              disabled={current >= bucket.length - 1}
              aria-label="Next"
              sx={{
                position: 'absolute',
                top: '50%',
                right: -12,
                transform: 'translateY(-50%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 30,
                height: 30,
                borderRadius: '50%',
                bgcolor: '#ffffff',
                border: `1px solid ${palette.border}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                color: current >= bucket.length - 1 ? palette.textFaint : palette.textStrong,
                cursor: current >= bucket.length - 1 ? 'default' : 'pointer',
                zIndex: 5,
                '&:hover:not(:disabled)': { bgcolor: palette.surfaceAlt },
                '&:disabled': { opacity: 0.4 },
              }}
            >
              <ChevronRight size={16} />
            </Box>
          </>
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
