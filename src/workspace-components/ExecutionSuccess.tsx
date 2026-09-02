import ButtonBase from '@mui/material/ButtonBase'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { palette } from './types'

const MotionButton = motion.create(ButtonBase)

interface ExecutionSuccessProps {
  message?: string
  returnLabel?: string
  onReturnHome?: () => void
}

export default function ExecutionSuccess({
  message = 'Your redemption has been processed successfully.',
  returnLabel = 'Return to Rewards Home',
  onReturnHome,
}: ExecutionSuccessProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '8px 0',
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: '999px',
          bgcolor: palette.brandSoft,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '14px',
        }}
      >
        <Check size={30} color={palette.brand} strokeWidth={3} />
      </Box>
      <Typography
        sx={{
          fontSize: 18,
          fontWeight: 800,
          color: palette.textStrong,
          marginBottom: '6px',
        }}
      >
        Execution successful
      </Typography>
      <Typography sx={{ fontSize: 13, color: palette.textMuted, lineHeight: 1.6, maxWidth: 260 }}>
        {message}
      </Typography>
      <MotionButton
        whileTap={{ scale: 0.97 }}
        onClick={onReturnHome}
        disableRipple
        sx={{
          width: '100%',
          borderRadius: '12px',
          bgcolor: palette.brand,
          color: '#ffffff',
          padding: '13px',
          fontSize: 14,
          fontWeight: 600,
          fontFamily: 'inherit',
          marginTop: '20px',
          '&:hover': { bgcolor: palette.brandDark },
        }}
      >
        {returnLabel}
      </MotionButton>
    </Box>
  )
}
