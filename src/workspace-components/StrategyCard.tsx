import { useState, useRef, useEffect, useCallback } from 'react'
import ButtonBase from '@mui/material/ButtonBase'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { motion } from 'framer-motion'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import type { PlanType } from '../types/objective'
import { palette } from './types'

const MotionButton = motion.create(ButtonBase)

interface StrategyCardItem {
  id: string
  type: string
  title: string
  description: string
  recommended?: boolean
}

interface StrategyCardProps {
  items: StrategyCardItem[]
  selectedPlan: PlanType | string | null
  onSelect: (type: PlanType) => void
}

/** Canonical plan headings highlighted on the strategies screen. */
function planBadge(type: string): { tag: string; title: string; color: string; bg: string } {
  if (type === 'simplicity') {
    return { tag: 'Plan A', title: 'Simplicity Plan', color: palette.brand, bg: palette.brandSoft }
  }
  if (type === 'max-redeem') {
    return { tag: 'Plan B', title: 'Maximum Value Plan', color: palette.gold, bg: palette.goldBg }
  }
  if (type === 'hybrid') {
    return { tag: 'Hybrid', title: 'Best of Both Plan', color: palette.brand, bg: palette.brandSoft }
  }
  if (type === 'monitor') {
    return { tag: 'Plan C', title: 'Monitor Plan', color: palette.brand, bg: palette.brandSoft }
  }
  if (type === 'no-redeem') {
    return { tag: 'Plan D', title: 'No Rewards Plan', color: palette.amberText, bg: palette.amber }
  }
  return { tag: 'Plan', title: type, color: palette.textStrong, bg: palette.surfaceAlt }
}

export default function StrategyCard({
  items,
  selectedPlan,
  onSelect,
}: StrategyCardProps) {
  const [current, setCurrent] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)
  const [cardWidth, setCardWidth] = useState(0)

  const measure = useCallback(() => {
    if (trackRef.current) {
      setCardWidth(trackRef.current.offsetWidth)
    }
  }, [])

  useEffect(() => {
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure])

  const prev = () => setCurrent((c) => Math.max(0, c - 1))
  const next = () => setCurrent((c) => Math.min(items.length - 1, c + 1))

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <Typography sx={{ fontSize: 13, fontWeight: 800, color: palette.textStrong, lineHeight: 1.3, paddingLeft: '12px', textAlign: 'left' }}>
                Recommended plans
              </Typography>
      {/* Arrow-navigated carousel — cards fit fully within the screen */}
      <Box sx={{ position: 'relative', width: '100%' }}>
        <Box sx={{ overflow: 'hidden', width: '100%' }}>
          <Box
            ref={trackRef}
            sx={{
              display: 'flex',
              gap: '12px',
              transform: `translateX(${-current * (cardWidth + 12)}px)`,
              transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {items.map((s) => {
              const badge = planBadge(s.type)
              const selected = selectedPlan === s.type
              return (
                <MotionButton
                  key={s.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelect(s.type as PlanType)}
                  disableRipple
                  sx={{
                    flex: '0 0 100%',
                    width: '100%',
                    display: 'flex',
                    borderRadius: '16px',
                    border: selected ? `2px solid ${palette.brand}` : `1.5px solid ${palette.border}`,
                    bgcolor: selected ? palette.brandBg : palette.surface,
                    padding: '14px',
                    textAlign: 'left',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    gap: '8px',
                    boxShadow: selected ? '0 0 0 3px rgba(0,106,77,0.1)' : '0 1px 3px rgba(15,23,42,0.04)',
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: selected ? palette.brand : palette.textFaint },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Box
                      sx={{
                        padding: '3px 10px',
                        borderRadius: '999px',
                        bgcolor: badge.bg,
                        color: badge.color,
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {badge.tag}
                    </Box>
                    <Box sx={{ flex: 1 }} />
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '999px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        bgcolor: selected ? palette.brand : palette.surfaceAlt,
                        border: selected ? '1px solid transparent' : `1.5px solid ${palette.border}`,
                      }}
                    >
                      {selected ? (
                        <Check size={14} color="#ffffff" strokeWidth={3} />
                      ) : (
                        <Box sx={{ width: 5, height: 5, borderRadius: '999px', bgcolor: palette.textFaint }} />
                      )}
                    </Box>
                  </Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 800, color: palette.textStrong, lineHeight: 1.3 }}>
                    {badge.title}
                  </Typography>
                  {/* <Box
                    sx={{
                      alignSelf: 'flex-start',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '3px 9px',
                      borderRadius: '999px',
                      bgcolor: palette.brandSoft,
                      color: palette.brand,
                      fontSize: 9.5,
                      fontWeight: 800,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Recommended plan
                  </Box> */}
                  <Typography sx={{ fontSize: 11, color: palette.textMuted, lineHeight: 1.20 }}>
                    {s.description}
                  </Typography>
                </MotionButton>
              )
            })}
          </Box>
        </Box>

        {/* Back / Forward arrows */}
        {items.length > 0 && (
          <>
            <Box
              component="button"
              onClick={prev}
              disabled={current === 0}
              aria-label="Previous plan"
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
              disabled={current >= items.length - 1}
              aria-label="Next plan"
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
                color: current >= items.length - 1 ? palette.textFaint : palette.textStrong,
                cursor: current >= items.length - 1 ? 'default' : 'pointer',
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
