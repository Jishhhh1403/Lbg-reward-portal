import ButtonBase from '@mui/material/ButtonBase'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { motion } from 'framer-motion'
import { ArrowDownToLine, Check, Loader2 } from 'lucide-react'
import { palette } from './types'

const MotionButton = motion.create(ButtonBase)

interface ExecutionStepItem {
  id: string
  label: string
  partner: string
  status: string
}

interface ExecutionStepsCardProps {
  items: ExecutionStepItem[]
  onSelect: (id: string) => void
}

export default function ExecutionStepsCard({
  items,
  onSelect,
}: ExecutionStepsCardProps) {
  return (
    <Box
      sx={{
        borderRadius: '16px',
        border: '1px solid',
        borderColor: palette.border,
        bgcolor: palette.surface,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 14px',
          borderBottom: `1px solid ${palette.border}`,
          bgcolor: palette.surfaceAlt,
        }}
      >
        <ArrowDownToLine size={15} color={palette.brand} />
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: palette.textStrong }}>
          Execution steps
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', padding: '8px' }}>
        {items.map((step, i) => (
          <MotionButton
            key={step.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(step.id)}
            disableRipple
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              borderRadius: '10px',
              padding: '10px',
              textAlign: 'left',
              width: '100%',
              '&:hover': { bgcolor: palette.surfaceAlt },
            }}
          >
            <Box
              sx={{
                width: 20,
                height: 20,
                borderRadius: '999px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                bgcolor:
                  step.status === 'completed'
                    ? palette.brandSoft
                    : step.status === 'running'
                      ? palette.amber
                      : palette.surfaceAlt,
              }}
            >
              {step.status === 'completed' ? (
                <Check size={13} color={palette.brand} strokeWidth={3} />
              ) : step.status === 'running' ? (
                <Loader2 size={13} color={palette.amberText} className="animate-spin" />
              ) : (
                <Typography sx={{ fontSize: 8, fontWeight: 700, color: palette.textMuted }}>
                  {i + 1}
                </Typography>
              )}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: palette.textStrong }}>
                {step.label}
              </Typography>
              {/* <Typography sx={{ fontSize: 11, color: palette.textFaint }}>{step.partner}</Typography> */}
            </Box>
          </MotionButton>
        ))}
      </Box>
    </Box>
  )
}
