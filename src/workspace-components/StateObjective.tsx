import { useState } from 'react'
import ButtonBase from '@mui/material/ButtonBase'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { motion } from 'framer-motion'
import { PenLine, X } from 'lucide-react'
import { palette } from './types'

const MotionButton = motion.create(ButtonBase)

interface StateObjectiveProps {
  label?: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  onOpenChange?: (open: boolean) => void
}

export default function StateObjective({
  label = 'Set new objective',
  placeholder = 'e.g. I want to redeem my points for the best value',
  value,
  onChange,
  onOpenChange,
}: StateObjectiveProps) {
  const [open, setOpen] = useState(false)

  const toggle = () => {
    setOpen((o) => {
      const next = !o
      onOpenChange?.(next)
      return next
    })
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <MotionButton
        whileTap={{ scale: 0.99 }}
        onClick={toggle}
        disableRipple
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          width: '100%',
          borderRadius: '12px',
          border: `1.5px solid ${palette.brand}`,
          bgcolor: open ? 'transparent' : palette.brand,
          color: open ? palette.brand : '#ffffff',
          padding: '12px 16px',
          transition: 'all 0.2s',
          '&:hover': { bgcolor: open ? palette.brandBg : palette.brandDark },
        }}
      >
        {open ? <X size={16} /> : <PenLine size={16} />}
        <Typography sx={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.02em' }}>
          {open ? 'Cancel' : 'Set new objective'}
        </Typography>
      </MotionButton>

      {open && (
        <Box
          component="textarea"
          value={value}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          autoFocus
          sx={{
            width: '100%',
            resize: 'none',
            borderRadius: '12px',
            border: `1.5px solid ${palette.border}`,
            padding: '12px 14px',
            fontSize: 14,
            fontFamily: 'inherit',
            color: palette.textStrong,
            bgcolor: palette.surface,
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s',
            '&:focus': { borderColor: palette.brand, boxShadow: `0 0 0 3px rgba(0,106,77,0.1)` },
            '&::placeholder': { color: palette.textFaint },
          }}
        />
      )}
    </Box>
  )
}