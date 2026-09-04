import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import ButtonBase from '@mui/material/ButtonBase'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { motion } from 'framer-motion'
import { Info, Wand2 } from 'lucide-react'
import { palette } from './types'

const MotionButton = motion.create(ButtonBase)

interface QuickObjectiveProps {
  hint?: string
  text: string
  selected?: boolean
  onSelect: (value: string) => void
  hidden?: boolean
}

export default function QuickObjective({
  hint = 'Quick start',
  text,
  selected = false,
  onSelect,
  hidden = false,
}: QuickObjectiveProps) {
  const [hovered, setHovered] = useState(false)
  const triggerRef = useRef<HTMLSpanElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })

  useEffect(() => {
    if (hovered && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect()
      setPos({ top: r.top, left: r.left + r.width / 2 })
    }
  }, [hovered])

  if (hidden) return null
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
      {/* <Box
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
      </Box> */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '0px',
          color: palette.textMuted,
          flexShrink: 0,
        }}
      >
        <Box
        sx={{
          width: 15,
          height: 15,
          borderRadius: '9px',
          // bgcolor: selected ? palette.brand : palette.surface,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginRight:'4px',
          border: `1px solid ${selected ? 'transparent' : palette.border}`,
        }}
      >
        <Wand2 size={24} strokeWidth={3} />
      </Box>
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 700,
            color: palette.brand,
            // textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {hint}
        </Typography>
         <Box
            ref={triggerRef}
            component="span"
            sx={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'top',
              justifyContent: 'center',
              width: 20,
              height: 20,
              borderRadius: '9px',
              color: palette.textMuted,
              cursor: 'pointer',
              '&:hover': { color: palette.brand },
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <Info size={10} strokeWidth={2.2} />
          </Box>
          {hovered &&
            createPortal(
              <Box
                sx={{
                  position: 'fixed',
                  top: pos.top - 10,
                  left: pos.left,
                  transform: 'translate(-50%, -100%)',
                  width: 190,
                  p: '8px 11px',
                  borderRadius: '10px',
                  bgcolor: '#ffffff',
                  border: `1px solid ${palette.border}`,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
                  opacity: 1,
                  zIndex: 10000,
                  pointerEvents: 'none',
                }}
              >
                <Typography
                  sx={{
                    fontSize: 10,
                    color: palette.textMuted,
                    lineHeight: 1.5,
                    textAlign: 'left',
                    display: 'block',
                  }}
                >
                  Suggests an objective inferred from your connected brands and recent activity. You may choose to use this one.
                </Typography>
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: -5,
                    left: '50%',
                    transform: 'translateX(-50%) rotate(45deg)',
                    width: 10,
                    height: 10,
                    bgcolor: '#ffffff',
                    borderLeft: `1px solid ${palette.border}`,
                    borderTop: `1px solid ${palette.border}`,
                    zIndex: -1,
                  }}
                />
              </Box>,
              document.body,
            )}
        </Box>
        <Typography
          sx={{
            fontSize: 13,
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
       
        {/* {selected ? (
          // <Copy size={13} color={palette.brand} />
          <Typography sx={{ fontSize: 10, fontWeight: 100, color: palette.textMuted }}>
            In use
          </Typography>
        ) : (
          <Typography sx={{ fontSize: 10, fontWeight: 100, color: palette.textMuted }}>
            
          </Typography>
        )} */}
      </Box>
    </MotionButton>
  )
}