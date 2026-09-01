import ButtonBase from '@mui/material/ButtonBase'
import Box from '@mui/material/Box'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { shadows } from '../../../theme'

interface ObjectiveNavProps {
  primary?: string
  secondary?: string
  disabled?: boolean
  onNext?: () => void
  onModify?: () => void
}

const MotionButton = motion.create(ButtonBase)

export default function ObjectiveNav({
  primary = 'Next',
  secondary,
  disabled = false,
  onNext,
  onModify,
}: ObjectiveNavProps) {
  const secondaryButton = secondary ? (
    <MotionButton
      whileTap={{ scale: 0.97 }}
      onClick={onModify}
      disableRipple
      sx={{
        borderRadius: '12px',
        border: '1.5px solid #e2e8f0',
        bgcolor: '#ffffff',
        padding: '10px 24px',
        fontSize: 14,
        fontWeight: 600,
        fontFamily: 'inherit',
        color: '#475569',
        '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' },
      }}
    >
      {secondary}
    </MotionButton>
  ) : null

  const primaryButton = (
    <MotionButton
      whileTap={{ scale: 0.97 }}
      onClick={onNext}
      disabled={disabled}
      disableRipple
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        borderRadius: '12px',
        bgcolor: disabled ? '#cbd5e1' : '#006a4d',
        color: '#ffffff',
        padding: '10px 28px',
        fontSize: 14,
        fontWeight: 600,
        fontFamily: 'inherit',
        boxShadow: disabled ? 'none' : shadows.card,
        '&:hover': { bgcolor: disabled ? '#cbd5e1' : '#045a42' },
      }}
    >
      {primary} <ArrowRight size={14} />
    </MotionButton>
  )

  return (
    <Box
      sx={{
        display: 'flex',
        gap: '10px',
        justifyContent: secondary ? 'center' : 'flex-end',
      }}
    >
      {secondaryButton}
      {primaryButton}
    </Box>
  )
}
