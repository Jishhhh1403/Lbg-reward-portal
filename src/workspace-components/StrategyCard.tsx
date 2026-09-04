import ButtonBase from '@mui/material/ButtonBase'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
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
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <Typography sx={{ fontSize: 13, fontWeight: 800, color: palette.textStrong, lineHeight: 1.3 }}>
                Recommended plans
              </Typography>
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
                flex: '0 0 78%',
                width: '78%',
                scrollSnapAlign: 'start',
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
  )
}
