import ButtonBase from '@mui/material/ButtonBase'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { motion } from 'framer-motion'
import { ExternalLink, Loader2 } from 'lucide-react'
import { shadows } from '../../../theme'

interface ObjectiveRedirectProps {
  planLabel: string
  stepLabel: string
  partner: string
  confirmLabel: string
  onConfirm: () => void
}

const MotionButton = motion.create(ButtonBase)

export default function ObjectiveRedirect({
  planLabel,
  stepLabel,
  partner,
  confirmLabel,
  onConfirm,
}: ObjectiveRedirectProps) {
  return (
    <Box>
      <Box
        sx={{
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          bgcolor: '#f0fdf4',
          padding: '16px',
          marginBottom: '20px',
        }}
      >
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 600,
            color: '#006a4d',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '4px',
          }}
        >
          {planLabel}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Loader2 size={16} color="#d97706" className="animate-spin" />
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
            {stepLabel}
          </Typography>
        </Box>
        <Typography sx={{ fontSize: 12, color: '#64748b', marginTop: '4px' }}>
          Redirecting to {partner}...
        </Typography>
      </Box>

      <MotionButton
        whileTap={{ scale: 0.97 }}
        onClick={onConfirm}
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
        <ExternalLink size={15} /> {confirmLabel}
      </MotionButton>
    </Box>
  )
}
