import ButtonBase from '@mui/material/ButtonBase'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Tooltip from '@mui/material/Tooltip'
import { motion } from 'framer-motion'
import { Copy, Info, Sparkles } from 'lucide-react'
import { palette } from './types'

const MotionButton = motion.create(ButtonBase)

interface QuickObjectiveProps {
  hint?: string
  text: string
  selected?: boolean
  onSelect: (value: string) => void
}

export default function QuickObjective({
  hint = 'Quick start',
  text,
  selected = false,
  onSelect,
}: QuickObjectiveProps) {
  return (
    <MotionButton
      whileTap={{ scale: 0.99 }}
      onClick={() => onSelect(text)}
      disableRipple
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
        borderRadius: '12px',
        border: selected ? `1.5px solid ${palette.brand}` : `1.5px dashed ${palette.border}`,
        bgcolor: selected ? palette.brandBg : palette.surfaceAlt,
        padding: '10px 12px',
        textAlign: 'left',
        transition: 'all 0.2s',
        '&:hover': { borderColor: selected ? palette.brand : palette.brand },
      }}
    >
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: '9px',
          bgcolor: selected ? palette.brand : palette.surface,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          border: `1px solid ${selected ? 'transparent' : palette.border}`,
        }}
      >
        <Sparkles size={14} color={selected ? '#ffffff' : palette.brand} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          color: palette.textMuted,
          flexShrink: 0,
        }}
      >
        <Typography
          sx={{
            fontSize: 10,
            fontWeight: 700,
            color: palette.brand,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '2px',
          }}
        >
          {hint}
        </Typography>
         <Tooltip
          title={
            <Box sx={{ fontSize: 11.5, lineHeight: 1.5 }}>
              Quick start suggests an objective inferred from your connected brands and recent
              activity. It is chosen automatically so you can save time — tap it to use this
              objective without typing, or state your own below.
            </Box>
          }
          placement="top"
          arrow
          slotProps={{ tooltip: { sx: { bgcolor: palette.textStrong, maxWidth: 260 } } }}
        >
          <Box
            component="span"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 20,
              height: 20,
              borderRadius: '999px',
              border: `1px solid ${palette.border}`,
              color: palette.textMuted,
              cursor: 'pointer',
              '&:hover': { color: palette.brand, borderColor: palette.brand },
            }}
          >
            <Info size={12} strokeWidth={2.2} />
          </Box>
        </Tooltip>
        </Box>
        <Typography
          sx={{
            fontSize: 12.5,
            fontWeight: 500,
            color: selected ? palette.textStrong : palette.text,
            lineHeight: 1.4,
          }}
        >
          {text}
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          color: palette.textMuted,
          flexShrink: 0,
        }}
      >
        {/* <Tooltip
          title={
            <Box sx={{ fontSize: 11.5, lineHeight: 1.5 }}>
              Quick start suggests an objective inferred from your connected brands and recent
              activity. It is chosen automatically so you can save time — tap it to use this
              objective without typing, or state your own below.
            </Box>
          }
          placement="top"
          arrow
          slotProps={{ tooltip: { sx: { bgcolor: palette.textStrong, maxWidth: 260 } } }}
        >
          <Box
            component="span"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 20,
              height: 20,
              borderRadius: '999px',
              border: `1px solid ${palette.border}`,
              color: palette.textMuted,
              cursor: 'pointer',
              '&:hover': { color: palette.brand, borderColor: palette.brand },
            }}
          >
            <Info size={12} strokeWidth={2.2} />
          </Box>
        </Tooltip> */}
       
        {selected ? (
          // <Copy size={13} color={palette.brand} />
          <Typography sx={{ fontSize: 10, fontWeight: 600, color: palette.textMuted }}>
            In use
          </Typography>
        ) : (
          <Typography sx={{ fontSize: 10, fontWeight: 600, color: palette.textMuted }}>
            Tap to use
          </Typography>
        )}
      </Box>
    </MotionButton>
  )
}