import ButtonBase from '@mui/material/ButtonBase'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { motion } from 'framer-motion'
import { ArrowDownToLine, Check, Loader2 } from 'lucide-react'
import { palette } from './types'

const MotionButton = motion.create(ButtonBase)

interface ExecutionStepItem {
  id: string
  label: string
  partner: string
  status: string
}

interface ExecutionStepsCardProps {
  items: ExecutionStepItem[]
  onSelect: (id: string) => void
}

/** Step node state helper. */
function nodeState(status: string): 'done' | 'active' | 'todo' {
  if (status === 'completed') return 'done'
  if (status === 'running') return 'active'
  return 'todo'
}

function FlowNode({
  step,
  index,
  total,
  state,
  onSelect,
}: {
  step: ExecutionStepItem
  index: number
  total: number
  state: 'done' | 'active' | 'todo'
  onSelect: (id: string) => void
}) {
  const isLast = index === total - 1
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'stretch', gap: '10px', width: '100%' }}>
        {/* Node circle + connector */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 32 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.25s ease',
              ...(state === 'done' && { bgcolor: palette.brand, boxShadow: `0 0 0 4px ${palette.brandSoft}` }),
              ...(state === 'active' && { bgcolor: palette.amber, boxShadow: `0 0 0 4px ${palette.amber}` }),
              ...(state === 'todo' && { bgcolor: palette.surfaceAlt, border: `1.5px solid ${palette.border}` }),
            }}
          >
            {state === 'done' ? (
              <Check size={16} color="#ffffff" strokeWidth={3.5} />
            ) : state === 'active' ? (
              <Loader2 size={16} color={palette.amberText} className="animate-spin" />
            ) : (
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: palette.textFaint }}>{index + 1}</Typography>
            )}
          </Box>
          {!isLast && (
            <Box
              sx={{
                flex: 1,
                minHeight: 20,
                width: 2,
                bgcolor: state === 'done' ? palette.brand : palette.border,
              }}
            />
          )}
        </Box>

        {/* Step content */}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            pb: isLast ? 0 : '18px',
          }}
        >
          <MotionButton
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(step.id)}
            disableRipple
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              width: '100%',
              minHeight: 44,
              borderRadius: '12px',
              padding: '8px 12px',
              textAlign: 'left',
              border: `1px solid ${state === 'active' ? palette.brand : palette.border}`,
              bgcolor: state === 'active' ? palette.brandBg : palette.surfaceAlt,
              '&:hover': { borderColor: palette.brand },
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: 11.5,
                  fontWeight: state === 'todo' ? 500 : 700,
                  color: state === 'todo' ? palette.textMuted : palette.textStrong,
                  lineHeight: 1.35,
                }}
              >
                {step.label}
              </Typography>
              {partnerHint(step) ? (
                <Typography sx={{ fontSize: 10, color: palette.textFaint, marginTop: '2px' }}>
                  {partnerHint(step)}
                </Typography>
              ) : null}
            </Box>
            {state === 'active' ? (
              <Typography
                sx={{
                  flexShrink: 0,
                  fontSize: 10,
                  fontWeight: 800,
                  color: palette.brand,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Next
              </Typography>
            ) : null}
          </MotionButton>
        </Box>
      </Box>
    </Box>
  )
}

function partnerHint(step: ExecutionStepItem): string {
  if (step.status === 'completed' && step.id === 'payment-completed') return 'Done'
  if (step.id === 'review-plan') return 'Review your Cavendish insurance plan'
  if (step.id === 'authorize-card') return 'Pay securely at Cavendish Online'
  if (step.id === 'payment-completed') return 'Your payment is confirmed'
  return step.partner
}

export default function ExecutionStepsCard({
  items,
  onSelect,
}: ExecutionStepsCardProps) {
  return (
    <Box
      sx={{
        borderRadius: '16px',
        border: '1px solid',
        borderColor: palette.border,
        bgcolor: palette.surface,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 14px',
          borderBottom: `1px solid ${palette.border}`,
          bgcolor: palette.brandBg,
        }}
      >
        <ArrowDownToLine size={15} color={palette.brand} />
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: palette.textStrong }}>
          Execution steps
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', padding: '14px 14px 4px' }}>
        {items.map((step, i) => (
          <FlowNode
            key={step.id}
            step={step}
            index={i}
            total={items.length}
            state={nodeState(step.status)}
            onSelect={onSelect}
          />
        ))}
      </Box>
    </Box>
  )
}
