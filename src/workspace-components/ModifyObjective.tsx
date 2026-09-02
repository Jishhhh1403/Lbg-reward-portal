import ButtonBase from '@mui/material/ButtonBase'
import { motion } from 'framer-motion'
import { Pencil } from 'lucide-react'
import { palette } from './types'

const MotionButton = motion.create(ButtonBase)

interface ModifyObjectiveProps {
  label?: string
  onModify?: () => void
}

export default function ModifyObjective({
  label = 'Modify Objective',
  onModify,
}: ModifyObjectiveProps) {
  return (
    <MotionButton
      whileTap={{ scale: 0.97 }}
      onClick={onModify}
      disableRipple
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        alignSelf: 'flex-start',
        borderRadius: '10px',
        border: `1.5px solid ${palette.border}`,
        bgcolor: palette.surface,
        padding: '8px 16px',
        fontSize: 13,
        fontWeight: 600,
        fontFamily: 'inherit',
        color: palette.textMuted,
        '&:hover': { bgcolor: palette.surfaceAlt, color: palette.textStrong },
      }}
    >
      <Pencil size={13} /> {label}
    </MotionButton>
  )
}
