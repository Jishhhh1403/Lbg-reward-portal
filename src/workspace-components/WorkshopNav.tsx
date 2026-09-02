import ButtonBase from '@mui/material/ButtonBase'
import Box from '@mui/material/Box'
import { motion } from 'framer-motion'
import { ArrowRight, Pencil } from 'lucide-react'
import { palette } from './types'

const MotionButton = motion.create(ButtonBase)

interface WorkshopNavProps {
  primary?: string
  secondary?: string
  disabled?: boolean
  onNext?: () => void
  onModify?: () => void
  onConfirm?: () => void
}

export default function WorkshopNav({
  primary = 'Next',
  secondary,
  disabled = false,
  onNext,
  onModify,
  onConfirm,
}: WorkshopNavProps) {
  return (
    <Box sx={{ display: 'flex', gap: '10px', justifyContent: secondary ? 'center' : 'flex-end', alignItems: 'center' }}>
      {secondary ? (
        <MotionButton
          whileTap={{ scale: 0.97 }}
          onClick={onModify}
          disableRipple
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            borderRadius: '12px',
            bgcolor: palette.brand,
            color: '#ffffff',
            padding: '10px 18px',
            fontSize: 14,
            fontWeight: 600,
            fontFamily: 'inherit',
            '&:hover': { bgcolor: palette.brandDark },
          }}
        >
          <Pencil size={14} /> {secondary}
        </MotionButton>
      ) : null}
      <MotionButton
        whileTap={{ scale: 0.97 }}
        onClick={onConfirm ?? onNext}
        disabled={disabled}
        disableRipple
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          borderRadius: '12px',
          bgcolor: disabled ? palette.textFaint : palette.brand,
          color: '#ffffff',
          padding: '10px 22px',
          fontSize: 14,
          fontWeight: 600,
          fontFamily: 'inherit',
          '&:hover': { bgcolor: disabled ? palette.textFaint : palette.brandDark },
        }}
      >
        {primary} <ArrowRight size={14} />
      </MotionButton>
    </Box>
  )
}
