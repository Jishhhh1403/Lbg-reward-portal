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
}

interface StrategyCardProps {
  items: StrategyCardItem[]
  selectedPlan: PlanType | string | null
  onSelect: (type: PlanType) => void
  objective?: string
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
  return { tag: 'Plan', title: type, color: palette.textStrong, bg: palette.surfaceAlt }
}

export default function StrategyCard({
  items,
  selectedPlan,
  onSelect,
  objective,
}: StrategyCardProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {items.map((s) => {
        const badge = planBadge(s.type)
        const selected = selectedPlan === s.type
        return (
          <Box key={s.id} sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {s.type === 'simplicity' && objective && (
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: palette.textStrong,
                }}
              >
                {objective}
              </Typography>
            )}
            <MotionButton
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(s.type as PlanType)}
              disableRipple
              sx={{
                display: 'flex',
                width: '100%',
                borderRadius: '14px',
                border: selected ? `2px solid ${palette.brand}` : `1.5px solid ${palette.border}`,
                bgcolor: selected ? palette.brandBg : palette.surface,
                padding: '12px 14px',
                textAlign: 'left',
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: '8px',
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
              <Typography sx={{ fontSize: 15, fontWeight: 800, color: palette.textStrong, lineHeight: 1.3 }}>
                {badge.title}
              </Typography>
              <Typography sx={{ fontSize: 12, color: palette.textMuted, lineHeight: 1.5 }}>
                {s.description}
              </Typography>
            </MotionButton>
          </Box>
        )
      })}
    </Box>
  )
}