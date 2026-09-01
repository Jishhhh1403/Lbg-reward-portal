import ButtonBase from '@mui/material/ButtonBase'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { motion } from 'framer-motion'
import { Check, Clock, Sparkles, X } from 'lucide-react'
import { shadows } from '../../../theme'

interface ObjectiveResultProps {
  success: boolean
  title: string
  message: string
  detail?: string
  returnLabel: string
  onReturnHome: () => void
}

const MotionButton = motion.create(ButtonBase)

export default function ObjectiveResult({
  success,
  title,
  message,
  detail,
  returnLabel,
  onReturnHome,
}: ObjectiveResultProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          marginBottom: '24px',
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '999px',
            bgcolor: success ? '#dcfce7' : '#fef2f2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}
        >
          {success ? (
            <Check size={28} color="#16a34a" strokeWidth={3} />
          ) : (
            <X size={28} color="#dc2626" strokeWidth={3} />
          )}
        </Box>
        <Typography sx={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
          {title}
        </Typography>
        <Typography sx={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, maxWidth: 280 }}>
          {message}
        </Typography>
      </Box>

      <Box
        sx={{
          borderRadius: '16px',
          overflow: 'hidden',
          bgcolor: success ? '#f0fdf4' : '#fef2f2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          marginBottom: '20px',
        }}
      >
        {success ? (
          <Sparkles size={48} color="#006a4d" strokeWidth={1.2} />
        ) : (
          <Clock size={48} color="#dc2626" strokeWidth={1.2} />
        )}
      </Box>

      {detail ? (
        <Typography sx={{ fontSize: 12, color: '#94a3b8', marginBottom: '16px', textAlign: 'center' }}>
          {detail}
        </Typography>
      ) : null}

      <MotionButton
        whileTap={{ scale: 0.97 }}
        onClick={onReturnHome}
        disableRipple
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          borderRadius: '12px',
          bgcolor: '#006a4d',
          color: '#ffffff',
          padding: '14px',
          fontSize: 14,
          fontWeight: 600,
          fontFamily: 'inherit',
          width: '100%',
          boxShadow: shadows.card,
          '&:hover': { bgcolor: '#045a42' },
        }}
      >
        {returnLabel}
      </MotionButton>
    </Box>
  )
}
