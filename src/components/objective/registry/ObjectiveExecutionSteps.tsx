import ButtonBase from '@mui/material/ButtonBase'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { motion } from 'framer-motion'
import { Check, ExternalLink, Loader2 } from 'lucide-react'
import type { ExecutionStep } from '../../../types/objective'

interface ObjectiveExecutionStepsProps {
  items: Array<Pick<ExecutionStep, 'id' | 'label' | 'partner' | 'status'>>
  onSelect: (id: string) => void
  lockSequential?: boolean
}

const MotionButton = motion.create(ButtonBase)

export default function ObjectiveExecutionSteps({
  items,
  onSelect,
  lockSequential = true,
}: ObjectiveExecutionStepsProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {items.map((step, i) => {
        const locked =
          lockSequential &&
          step.status === 'pending' &&
          i > 0 &&
          items[i - 1]?.status !== 'completed'
        return (
          <MotionButton
            key={step.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(step.id)}
            disabled={locked}
            disableRipple
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              bgcolor: '#ffffff',
              padding: '14px',
              textAlign: 'left',
              width: '100%',
              '&:disabled': { opacity: 0.5 },
            }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '999px',
                bgcolor:
                  step.status === 'completed'
                    ? '#dcfce7'
                    : step.status === 'running'
                      ? '#fef3c7'
                      : '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {step.status === 'completed' ? (
                <Check size={14} color="#16a34a" strokeWidth={3} />
              ) : step.status === 'running' ? (
                <Loader2 size={14} color="#d97706" className="animate-spin" />
              ) : (
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>
                  {i + 1}
                </Typography>
              )}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                {step.label}
              </Typography>
              <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>{step.partner}</Typography>
            </Box>
            <ExternalLink size={14} color="#94a3b8" />
          </MotionButton>
        )
      })}
    </Box>
  )
}
