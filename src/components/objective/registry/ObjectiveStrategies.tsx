import ButtonBase from '@mui/material/ButtonBase'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { motion } from 'framer-motion'
import type { PlanType } from '../../../types/objective'

interface ObjectiveStrategyItem {
  id: string
  type: string
  title: string
  description: string
}

interface ObjectiveStrategiesProps {
  items: ObjectiveStrategyItem[]
  selectedPlan: PlanType
  onSelect: (type: PlanType) => void
}

const MotionButton = motion.create(ButtonBase)

export default function ObjectiveStrategies({
  items,
  selectedPlan,
  onSelect,
}: ObjectiveStrategiesProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
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
          const isSelected = selectedPlan === s.type
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
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '4px',
                borderRadius: '16px',
                border: isSelected ? '2px solid #006a4d' : '1.5px solid #e2e8f0',
                bgcolor: isSelected ? '#f0fdf4' : '#ffffff',
                padding: '14px',
                textAlign: 'left',
                boxShadow: isSelected ? '0 0 0 3px rgba(0,106,77,0.1)' : '0 1px 3px rgba(15,23,42,0.04)',
                transition: 'all 0.2s',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '999px',
                    border: isSelected ? '6px solid #006a4d' : '2px solid #cbd5e1',
                    flexShrink: 0,
                  }}
                />
                <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                  {s.title}
                </Typography>
              </Box>
              <Typography
                sx={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, paddingLeft: '28px' }}
              >
                {s.description}
              </Typography>
            </MotionButton>
          )
        })}
      </Box>
    </Box>
  )
}
