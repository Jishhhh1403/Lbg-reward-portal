import ButtonBase from '@mui/material/ButtonBase'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { motion } from 'framer-motion'
import { ArrowRight, PenLine, Wand2, X } from 'lucide-react'
import { palette } from './types'

const MotionButton = motion.create(ButtonBase)

interface StateObjectiveProps {
  label?: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onNext?: () => void
  onQuickStart?: () => void
  quickStartText?: string
  disabled?: boolean
}

const btnBase = {
  display: 'flex' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  gap: '6px',
  flex: 1,
  height: '42px',
  borderRadius: '12px',
  transition: 'all 0.25s ease',
}

export default function StateObjective({
  label = 'Set new objective',
  placeholder = 'e.g. I want to redeem my points for the best value',
  value,
  onChange,
  open: controlledOpen,
  onOpenChange,
  onNext,
  onQuickStart,
  disabled = false,
}: StateObjectiveProps) {
  const open = controlledOpen ?? false

  const toggle = () => {
    onOpenChange?.(!open)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
      <Box sx={{ display: 'flex', gap: '10px', alignItems: 'stretch' }}>
        {/* Set new objective / Cancel */}
        <MotionButton
          whileTap={{ scale: 0.97 }}
          onClick={toggle}
          disableRipple
          sx={{
            ...btnBase,
            border: 'none',
            bgcolor: open ? 'transparent' : palette.brand,
            color: open ? palette.brand : '#ffffff',
            '&:hover': open ? { bgcolor: palette.brandBg } : { bgcolor: palette.brandDark },
          }}
        >
          {open ? <X size={16} color={palette.brand} /> : <PenLine size={0} />}
          <Typography sx={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.02em', color: open ? palette.brand : '#ffffff' }}>
            {open ? 'Cancel' : label}
          </Typography>
        </MotionButton>

        {/* Use quick objective / NEXT */}
        <MotionButton
          whileTap={{ scale: 0.97 }}
          onClick={open ? onNext : onQuickStart}
          disabled={open && disabled}
          disableRipple
          sx={{
            ...btnBase,
            border: 'none',
            bgcolor: open
              ? disabled
                ? palette.textFaint
                : palette.brand
              : palette.brand,
            color: '#ffffff',
            '&:hover': {
              bgcolor: open
                ? disabled
                  ? palette.textFaint
                  : palette.brandDark
                : palette.brandDark,
            },
          }}
        >
          {open ? (
            <>
              <Typography sx={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.02em', color: '#ffffff' }}>
                NEXT
              </Typography>
              <ArrowRight size={18} color="#ffffff" />
            </>
          ) : (
            <>
              <Wand2 size={0} />
              <Typography sx={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.02em', color: '#ffffff' }}>
                Use quick start
              </Typography>
            </>
          )}
        </MotionButton>
      </Box>
    </Box>
  )
}
