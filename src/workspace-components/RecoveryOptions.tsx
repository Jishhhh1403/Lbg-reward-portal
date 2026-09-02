import ButtonBase from '@mui/material/ButtonBase'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { motion } from 'framer-motion'
import { RefreshCw, RotateCcw, Undo2 } from 'lucide-react'
import { palette } from './types'

const MotionButton = motion.create(ButtonBase)

interface RecoveryOptionItem {
  id: string
  label: string
  description?: string
}

interface RecoveryOptionsProps {
  items?: RecoveryOptionItem[]
  onSelect?: (id: string) => void
  onReturnHome: () => void
}

export default function RecoveryOptions({
  items = [],
  onSelect,
  onReturnHome,
}: RecoveryOptionsProps) {
  const fallbackItems: RecoveryOptionItem[] = [
    { id: 'retry', label: 'Retry this step', description: 'Attempt the failed step again.' },
    { id: 'resume', label: 'Resume from last checkpoint', description: 'Continue without repeating.' },
  ]
  const options = items.length > 0 ? items : fallbackItems

  const iconFor = (id: string) =>
    id === 'retry' ? <RotateCcw size={15} /> : <RefreshCw size={15} />

  return (
    <Box>
      <Typography
        sx={{
          fontSize: 12,
          fontWeight: 700,
          color: palette.textMuted,
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        Recoverable options
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {options.map((o) => (
          <MotionButton
            key={o.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect?.(o.id)}
            disableRipple
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              borderRadius: '12px',
              border: `1.5px solid ${palette.border}`,
              bgcolor: palette.surface,
              padding: '12px 14px',
              textAlign: 'left',
              width: '100%',
              '&:hover': { borderColor: palette.brand, bgcolor: palette.brandBg },
            }}
          >
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: '999px',
                bgcolor: palette.brandBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: palette.brand,
              }}
            >
              {iconFor(o.id)}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: palette.textStrong }}>
                {o.label}
              </Typography>
              {o.description ? (
                <Typography sx={{ fontSize: 11, color: palette.textMuted, lineHeight: 1.4 }}>
                  {o.description}
                </Typography>
              ) : null}
            </Box>
          </MotionButton>
        ))}
      </Box>
      <MotionButton
        whileTap={{ scale: 0.97 }}
        onClick={onReturnHome}
        disableRipple
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          width: '100%',
          borderRadius: '12px',
          border: `1.5px solid ${palette.border}`,
          bgcolor: palette.surface,
          padding: '12px',
          fontSize: 13,
          fontWeight: 600,
          fontFamily: 'inherit',
          color: palette.textMuted,
          marginTop: '8px',
          '&:hover': { bgcolor: palette.surfaceAlt },
        }}
      >
        <Undo2 size={14} /> Return home
      </MotionButton>
    </Box>
  )
}
