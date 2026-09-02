import ButtonBase from '@mui/material/ButtonBase'
import Box from '@mui/material/Box'
import TextareaAutosize from '@mui/material/TextareaAutosize'
import Typography from '@mui/material/Typography'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Check,
  Combine,
  PencilLine,
  Scale,
  Sparkles,
  WandSparkles,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { PlanType } from '../types/objective'
import { palette } from './types'

const MotionButton = motion.create(ButtonBase)

export type CoplanToolView = 'idle' | 'explain' | 'combine' | 'edit' | 'compare'

interface CoTool {
  id: string
  label: string
  hint: string
}

interface CoStrategy {
  id: string
  type: string
  title: string
  description: string
}

interface CoplanToolsProps {
  label?: string
  tools?: CoTool[]
  strategies?: CoStrategy[]
  selectedPlan?: PlanType | null
  /** Which Coplan tool view is open ('idle' shows the tool grid). */
  view?: CoplanToolView
  objectiveText?: string
  onRequest?: (toolId: string, prompt: string) => void
  onSelectPlan?: (type: PlanType) => void
  onEditObjective?: (objective: string) => void
  onViewChange?: (view: CoplanToolView) => void
}

const TOOL_ICONS: Record<string, React.ReactNode> = {
  explain: <Sparkles size={15} />,
  combine: <Combine size={15} />,
  edit: <PencilLine size={15} />,
  compare: <Scale size={15} />,
}

/** Canonical names for the two (or three) plans. */
export function planTitle(plan: PlanType | string): string {
  if (plan === 'max-redeem') return 'Maximum Value Plan'
  if (plan === 'hybrid' || plan === 'combine') return 'Best of Both Plan'
  return 'Simplicity Plan'
}

const EXPLAIN_HIGHLIGHTS: Record<string, string[]> = {
  simplicity: [
    'Pays in one quick step',
    'Uses coins that are ready to spend right now',
    'No waiting on conversions from partner brands',
  ],
  'max-redeem': [
    'Converts your partner-brand points into LBG coins first',
    'Your combined balance covers more of the payment',
    'A couple of extra steps for noticeably more value',
  ],
  hybrid: [
    'Stays as simple as a single payment',
    'Still folds in your partner points for extra value',
    'No extra actions from you',
  ],
}

const GENERIC_DESCRIPTIONS: Record<string, string> = {
  simplicity:
    'Use your existing LBG coins to pay your insurance in a single, instant step — nothing to convert, nothing to wait for.',
  'max-redeem':
    'Convert your partner-brand points into LBG coins first, then pay your insurance with the bigger combined balance.',
  hybrid:
    'Keeps the single-step feel of the Simplicity Plan while folding in the extra value of the Maximum Value Plan.',
}

/** Detailed, fixed comparison shown by the "compare" tool. */
const COMPARE_ROWS: Array<{ label: string; a: string; b: string }> = [
  { label: 'Steps', a: 'One action — pay directly', b: 'Convert points first, then pay' },
  { label: 'Speed', a: 'Instant', b: 'A few extra minutes' },
  { label: 'Value', a: 'Uses your current LBG coins', b: 'Adds partner points for a bigger balance' },
  { label: 'Risk', a: 'Lowest — nothing to convert', b: 'Low — value depends on the conversion' },
  { label: 'Best for', a: 'A quick, simple payment', b: 'Getting the most out of rewards' },
]

function BackRow({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
      <MotionButton
        whileTap={{ scale: 0.92 }}
        onClick={onBack}
        disableRipple
        aria-label="Go back to tools"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          borderRadius: '9px',
          padding: '5px 10px 5px 6px',
          fontSize: 12,
          fontWeight: 600,
          fontFamily: 'inherit',
          color: palette.textMuted,
          bgcolor: palette.surfaceAlt,
          '&:hover': { bgcolor: palette.border, color: palette.textStrong },
        }}
      >
        <ArrowLeft size={14} />
        Go back
      </MotionButton>
      <Typography sx={{ fontSize: 13, fontWeight: 700, color: palette.textStrong }}>{title}</Typography>
    </Box>
  )
}

function PlanTag({ text, color, bg }: { text: string; color: string; bg: string }) {
  return (
    <Box
      sx={{
        padding: '3px 10px',
        borderRadius: '999px',
        bgcolor: bg,
        color,
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}
    >
      {text}
    </Box>
  )
}

export default function CoplanTools({
  label = 'Coplan tools workspace',
  tools = [],
  strategies = [],
  selectedPlan = null,
  view = 'idle',
  objectiveText = '',
  onSelectPlan,
  onEditObjective,
  onViewChange,
}: CoplanToolsProps) {
  const [editObjective, setEditObjective] = useState(objectiveText)
  const [explainPlan, setExplainPlan] = useState<PlanType>(
    (selectedPlan as PlanType) === 'hybrid' ? 'simplicity' : (selectedPlan as PlanType),
  )

  /* When the explain view opens, explain whichever plan is currently selected. */
  useEffect(() => {
    if (view === 'explain') {
      const picked = selectedPlan === 'hybrid' ? 'simplicity' : selectedPlan
      if (picked) setExplainPlan(picked)
    }
  }, [view, selectedPlan])

  const strategyByType = useMemo(() => {
    const map = new Map<string, CoStrategy>()
    for (const s of strategies) map.set(s.type, s)
    return map
  }, [strategies])

  const goBack = () => onViewChange?.('idle')
  const currentExplainPlan: PlanType = explainPlan ?? 'simplicity'

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
        <WandSparkles size={15} color={palette.brand} />
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: palette.textStrong }}>
          {label}
        </Typography>
      </Box>

      <Box sx={{ padding: '10px' }}>
        {view === 'idle' ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {tools.map((t) => (
              <MotionButton
                key={t.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => onViewChange?.(t.id as CoplanToolView)}
                disableRipple
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderRadius: '10px',
                  border: `1px solid ${palette.border}`,
                  bgcolor: palette.surfaceAlt,
                  padding: '9px 10px',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'all 0.2s',
                  '&:hover': { borderColor: palette.brand, bgcolor: palette.brandBg },
                }}
              >
                <Box sx={{ color: palette.brand, flexShrink: 0 }}>
                  {TOOL_ICONS[t.id] ?? <Sparkles size={15} />}
                </Box>
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: palette.text,
                    lineHeight: 1.35,
                  }}
                >
                  {t.label}
                </Typography>
              </MotionButton>
            ))}
          </Box>
        ) : null}

        {view === 'explain' ? (
          <Box>
            <BackRow onBack={goBack} title="Plan explained" />
            <Box sx={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
              {(['simplicity', 'max-redeem'] as const).map((t) => {
                const active = currentExplainPlan === t
                return (
                  <MotionButton
                    key={t}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setExplainPlan(t)}
                    disableRipple
                    sx={{
                      flex: 1,
                      borderRadius: '999px',
                      border: active ? `1.5px solid ${palette.brand}` : `1px solid ${palette.border}`,
                      bgcolor: active ? palette.brand : palette.surfaceAlt,
                      color: active ? '#ffffff' : palette.textMuted,
                      padding: '7px 10px',
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: 'inherit',
                      lineHeight: 1.3,
                    }}
                  >
                    {planTitle(t)}
                  </MotionButton>
                )
              })}
            </Box>
            <Box
              sx={{
                borderRadius: '12px',
                border: '1px solid',
                borderColor: palette.border,
                bgcolor: palette.surfaceAlt,
                padding: '12px',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PlanTag
                  text={currentExplainPlan === 'max-redeem' ? 'Plan B' : 'Plan A'}
                  color={currentExplainPlan === 'max-redeem' ? palette.gold : palette.brand}
                  bg={currentExplainPlan === 'max-redeem' ? palette.goldBg : palette.brandSoft}
                />
                <Typography sx={{ fontSize: 14, fontWeight: 800, color: palette.textStrong }}>
                  {planTitle(currentExplainPlan)}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 12, color: palette.text, lineHeight: 1.55, marginTop: '8px' }}>
                {strategyByType.get(currentExplainPlan)?.description ??
                  GENERIC_DESCRIPTIONS[currentExplainPlan]}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                {(EXPLAIN_HIGHLIGHTS[currentExplainPlan] ?? []).map((h) => (
                  <Box key={h} sx={{ display: 'flex', alignItems: 'flex-start', gap: '7px' }}>
                    <Check size={13} color={palette.brand} style={{ marginTop: 2, flexShrink: 0 }} />
                    <Typography sx={{ fontSize: 11.5, color: palette.textMuted, lineHeight: 1.4 }}>{h}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        ) : null}

        {view === 'combine' ? (
          <Box>
            <BackRow onBack={goBack} title="A third, balanced plan" />
            <MotionButton
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectPlan?.('hybrid')}
              disableRipple
              sx={{
                display: 'flex',
                width: '100%',
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: '8px',
                borderRadius: '12px',
                border: selectedPlan === 'hybrid' ? `2px solid ${palette.brand}` : `1.5px solid ${palette.border}`,
                bgcolor: selectedPlan === 'hybrid' ? palette.brandBg : palette.surface,
                padding: '12px',
                textAlign: 'left',
                transition: 'all 0.2s',
                '&:hover': { borderColor: palette.brand },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PlanTag text="Hybrid" color={palette.brand} bg={palette.brandSoft} />
                <Typography sx={{ fontSize: 14, fontWeight: 800, color: palette.textStrong }}>
                  {planTitle('hybrid')}
                </Typography>
                <Box sx={{ flex: 1 }} />
                {selectedPlan === 'hybrid' ? (
                  <Check size={16} color={palette.brand} />
                ) : null}
              </Box>
              <Typography sx={{ fontSize: 12, color: palette.text, lineHeight: 1.55 }}>
                {strategies.length
                  ? `Combines the one-step ease of the Simplicity Plan with the bigger value of the Maximum Value Plan: your partner points are converted into LBG coins automatically, so you still take just one action to pay.`
                  : GENERIC_DESCRIPTIONS.hybrid}
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  alignSelf: 'flex-start',
                  borderRadius: '999px',
                  padding: '5px 12px',
                  bgcolor: selectedPlan === 'hybrid' ? palette.brand : palette.brandSoft,
                  color: selectedPlan === 'hybrid' ? '#ffffff' : palette.brand,
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: 'inherit',
                }}
              >
                {selectedPlan === 'hybrid' ? 'Selected' : 'Choose this plan'}
                <Check size={12} />
              </Box>
            </MotionButton>
            <Typography sx={{ fontSize: 11, color: palette.textFaint, marginTop: '8px', lineHeight: 1.45 }}>
              This retains the simplicity of Plan A while maximising your value — tap the card to make it your choice.
            </Typography>
          </Box>
        ) : null}

        {view === 'edit' ? (
          <Box>
            <BackRow onBack={goBack} title="Edit your objective" />
            <Typography sx={{ fontSize: 12, color: palette.textMuted, marginBottom: '8px', lineHeight: 1.5 }}>
              Tell us your new objective and we will rebuild both plans around it.
            </Typography>
            <TextareaAutosize
              minRows={2}
              value={editObjective}
              onChange={(e) => setEditObjective(e.target.value)}
              placeholder="e.g. I want to redeem my points for the best value"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                resize: 'none',
                borderRadius: '10px',
                border: `1.5px solid ${palette.border}`,
                padding: '10px 12px',
                fontSize: 13,
                font: 'inherit',
                color: palette.textStrong,
                backgroundColor: palette.surface,
                outline: 'none',
              }}
            />
            <Box sx={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'flex-end' }}>
              <MotionButton
                whileTap={{ scale: 0.97 }}
                onClick={goBack}
                disableRipple
                sx={{
                  borderRadius: '10px',
                  border: `1px solid ${palette.border}`,
                  bgcolor: palette.surface,
                  padding: '8px 14px',
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  color: palette.textMuted,
                  '&:hover': { bgcolor: palette.surfaceAlt },
                }}
              >
                Cancel
              </MotionButton>
              <MotionButton
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  if (!editObjective.trim()) return
                  onEditObjective?.(editObjective.trim())
                }}
                disabled={!editObjective.trim()}
                disableRipple
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '10px',
                  bgcolor: editObjective.trim() ? palette.brand : palette.textFaint,
                  padding: '8px 14px',
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  color: '#ffffff',
                  '&:hover': { bgcolor: editObjective.trim() ? palette.brandDark : palette.textFaint },
                }}
              >
                <WandSparkles size={13} /> Refresh plans
              </MotionButton>
            </Box>
          </Box>
        ) : null}

        {view === 'compare' ? (
          <Box>
            <BackRow onBack={goBack} title="Plans side by side" />
            <Box
              sx={{
                borderRadius: '12px',
                border: '1px solid',
                borderColor: palette.border,
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto',
                  gap: '6px',
                  padding: '9px 12px',
                  bgcolor: palette.brandBg,
                }}
              >
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: palette.textStrong }}>Detail</Typography>
                <Typography sx={{ fontSize: 11, fontWeight: 800, color: palette.brand }}>Simplicity</Typography>
                <Typography sx={{ fontSize: 11, fontWeight: 800, color: palette.gold }}>Max value</Typography>
              </Box>
              {COMPARE_ROWS.map((row, i) => (
                <Box
                  key={row.label}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto auto',
                    gap: '6px',
                    padding: '8px 12px',
                    borderTop: `1px solid ${palette.border}`,
                    bgcolor: i % 2 ? palette.surfaceAlt : palette.surface,
                  }}
                >
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: palette.textMuted }}>{row.label}</Typography>
                  <Typography sx={{ fontSize: 11, fontWeight: 600, color: palette.textStrong }}>{row.a}</Typography>
                  <Typography sx={{ fontSize: 11, fontWeight: 600, color: palette.textStrong }}>{row.b}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        ) : null}
      </Box>
    </Box>
  )
}