import { useMemo, useState } from 'react'
import ButtonBase from '@mui/material/ButtonBase'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { motion } from 'framer-motion'
import { Brain, ChevronLeft, ChevronRight } from 'lucide-react'
import { palette } from './types'

const MotionButton = motion.create(ButtonBase)

const PER_PAGE = 2

interface CognitiveEvidenceProps {
  title?: string
  summary?: string
  factors?: string[]
}

export default function CognitiveEvidence({
  title = 'Cognitive evidence',
  summary = '',
  factors = [],
}: CognitiveEvidenceProps) {
  const pages = useMemo(() => {
    const out: string[][] = []
    for (let i = 0; i < factors.length; i += PER_PAGE) {
      out.push(factors.slice(i, i + PER_PAGE))
    }
    return out
  }, [factors])

  const [page, setPage] = useState(0)
  const current = pages[Math.min(page, Math.max(pages.length - 1, 0))] ?? []

  const goTo = (n: number) => setPage(Math.max(0, Math.min(pages.length - 1, n)))

  return (
    <Box
      sx={{
        borderRadius: '14px',
        border: '1px solid',
        borderColor: palette.border,
        bgcolor: palette.surface,
        padding: '2px 16px',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
        <Brain size={16} color={palette.textFaint} />
        <Typography sx={{ fontSize: 14, fontWeight: 700, color: palette.textStrong }}>
          {title}
        </Typography>
      </Box>
      <Typography sx={{ fontSize: 13, color: palette.text, lineHeight: 1.6 }}>
        {/* {summary} */}
      </Typography>

      {pages.length > 0 ? (
        <Box sx={{ marginTop: '4px' }}>
          {/* Carousel window — three points at a time */}
          <Box sx={{ overflow: 'hidden' }}>
            <motion.div
              key={page}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
            >
              {current.map((f, i) => (
                <Box
                  key={`${page}-${i}`}
                  sx={{ display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '3px 0' }}
                >
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '999px',
                      bgcolor: palette.border,
                      marginTop: '6px',
                      flexShrink: 0,
                    }}
                  />
                  <Typography sx={{ fontSize: 11, color: palette.textMuted, lineHeight: 1.20 }}>
                    {f}
                  </Typography>
                </Box>
              ))}
            </motion.div>
          </Box>

          {/* Carousel controls */}
          {pages.length > 1 ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
              <MotionButton
                whileTap={{ scale: 0.9 }}
                onClick={() => goTo(page - 1)}
                disableRipple
                disabled={page === 0}
                aria-label="Previous points"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: '999px',
                  border: `1px solid ${palette.border}`,
                  color: page === 0 ? palette.textFaint : palette.textStrong,
                  bgcolor: palette.surfaceAlt,
                  flexShrink: 0,
                  '&:hover': { borderColor: palette.textFaint, color: palette.textFaint },
                  '&:disabled': { color: palette.textFaint },
                }}
              >
                <ChevronLeft size={16} />
              </MotionButton>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                {pages.map((_, i) => (
                  <Box
                    key={i}
                    onClick={() => goTo(i)}
                    sx={{
                      width: i === page ? 16 : 6,
                      height: 6,
                      borderRadius: '999px',
                      bgcolor: i === page ? palette.textFaint : palette.border,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  />
                ))}
              </Box>

              <MotionButton
                whileTap={{ scale: 0.9 }}
                onClick={() => goTo(page + 1)}
                disableRipple
                disabled={page >= pages.length - 1}
                aria-label="Next points"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: '999px',
                  border: `1px solid ${palette.border}`,
                  color: page >= pages.length - 1 ? palette.textFaint : palette.textStrong,
                  bgcolor: palette.surfaceAlt,
                  flexShrink: 0,
                  '&:hover': { borderColor: palette.textFaint, color: palette.textFaint },
                  '&:disabled': { color: palette.textFaint },
                }}
              >
                <ChevronRight size={16} />
              </MotionButton>
            </Box>
          ) : null}
        </Box>
      ) : null}
    </Box>
  )
}
