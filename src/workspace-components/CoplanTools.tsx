import ButtonBase from '@mui/material/ButtonBase'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Combine,
  PencilLine,
  Scale,
  Sparkles,
  WandSparkles,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
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
  constraints?: Array<{ id: string; text: string; label: string; value: string; applied: boolean }>
  onRequest?: (toolId: string, prompt: string) => void
  onSelectPlan?: (type: PlanType) => void
  onEditConstraints?: (constraints: Array<{ id: string; label: string; value: string }>) => void
  onViewChange?: (view: CoplanToolView) => void
}

const TOOL_ICONS: Record<string, React.ReactNode> = {
  explain: <Sparkles size={15} />,
  combine: <Combine size={15} />,
  edit: <PencilLine size={15} />,
  compare: <Scale size={15} />,
}

/** Canonical names for the plans. */
export function planTitle(plan: PlanType | string): string {
  if (plan === 'max-redeem') return 'Maximum Value Plan'
  if (plan === 'hybrid' || plan === 'combine') return 'Best of Both Plan'
  if (plan === 'monitor') return 'Monitor Plan'
  if (plan === 'no-redeem') return 'Retain Reward Plan'
  return 'Simplicity Plan'
}

/** Tag and accent colors for each plan, consistent with the strategy cards. */
export function planTag(plan: PlanType | string): { text: string; color: string; bg: string } {
  if (plan === 'max-redeem') return { text: 'Plan B', color: palette.gold, bg: palette.goldBg }
  if (plan === 'monitor') return { text: 'Plan C', color: palette.brand, bg: palette.brandSoft }
  if (plan === 'no-redeem') return { text: 'Plan D', color: palette.amberText, bg: palette.amber }
  return { text: 'Plan A', color: palette.brand, bg: palette.brandSoft }
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
  monitor: [
    'Holds on to your coins and points for now',
    'We watch for new, high-value opportunities',
    'You are notified the moment a better deal appears',
  ],
  'no-redeem': [
    'Keeps all of your rewards untouched',
    'Pays directly with your own money',
    'Full flexibility — you can redeem later at any time',
  ],
}

const GENERIC_DESCRIPTIONS: Record<string, string> = {
  simplicity:
    'Use your existing LBG coins to pay your insurance in a single, instant step — nothing to convert, nothing to wait for.',
  'max-redeem':
    'Convert your partner-brand points into LBG coins first, then pay your insurance with the bigger combined balance.',
  hybrid:
    'Keeps the single-step feel of the Simplicity Plan while folding in the extra value of the Maximum Value Plan.',
  monitor:
    'You hold onto your coins and points for now. We keep an eye on your objective and let you know as soon as a new, high-value opportunity becomes available — you decide when it is worth redeeming.',
  'no-redeem':
    'You keep all of your rewards untouched and pay directly with your own money. Nothing is converted or spent, so you retain every coin and point and can redeem them later whenever you choose.',
}

/** Detailed, fixed comparison pairs shown by the "compare" tool. */
interface ComparisonPair {
  left: PlanType
  right: PlanType
  rows: Array<{ label: string; a: string; b: string }>
}

const COMPARE_PAIRS: ComparisonPair[] = [
  {
    left: 'simplicity',
    right: 'max-redeem',
    rows: [
      { label: 'Steps', a: 'One action — pay directly', b: 'Convert points first, then pay' },
      { label: 'Speed', a: 'Instant', b: 'A few extra minutes' },
      { label: 'Value', a: 'Uses your current LBG coins', b: 'Adds partner points for a bigger balance' },
      { label: 'Risk', a: 'Lowest — nothing to convert', b: 'Low — value depends on the conversion' },
      { label: 'Best for', a: 'A quick, simple payment', b: 'Getting the most out of rewards' },
    ],
  },
  {
    left: 'monitor',
    right: 'no-redeem',
    rows: [
      { label: 'Steps', a: 'No payment step — just watch', b: 'One action — pay with your own money' },
      { label: 'Speed', a: 'Nothing to do now', b: 'Instant' },
      { label: 'Value', a: 'Keeps all rewards, reacts to new deals', b: 'Full flexibility — redeem later any time' },
      { label: 'Risk', a: 'Lowest — nothing spent or converted', b: 'Low — no rewards used at all' },
      { label: 'Best for', a: 'Waiting for a high-value opportunity', b: 'Paying outright and keeping every reward' },
    ],
  },
]

/** Only these two action plans can be merged; Monitor/Retain produce no action. */
const MERGEABLE_PLANS: PlanType[] = ['simplicity', 'max-redeem']
const NON_MERGEABLE_MESSAGES: Record<string, string> = {
  monitor:
    'This is a no-action plan, so it cannot be combined with other plans.',
  'no-redeem':
    'This plan cannot be combined, as it will not use any of your rewards.',
}

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
  constraints = [],
  onSelectPlan,
  onEditConstraints,
  onViewChange,
}: CoplanToolsProps) {
  const [constraintDrafts, setConstraintDrafts] = useState<
    Array<{ id: string; text: string; label: string; value: string; applied: boolean }>
  >(constraints)
  const [explainPlan, setExplainPlan] = useState<PlanType>(
    (selectedPlan as PlanType) === 'hybrid' ? 'simplicity' : (selectedPlan as PlanType),
  )
  /** Plans chosen for the combine tool (only Simplicity & Max Value are mergeable). */
  const [selectedCombine, setSelectedCombine] = useState<PlanType[]>([])
  /** Transient toast shown when the user taps a non-mergeable plan (Monitor/Retain). */
  const [combineNotice, setCombineNotice] = useState<string>('')
  /** Which comparison pair is shown in the "compare" carousel. */
  const [compareIndex, setCompareIndex] = useState(0)

  const showCombineNotice = (msg: string) => {
    setCombineNotice(msg)
  }

  /* Reset selection + toast each time the combine view opens. */
  useEffect(() => {
    if (view === 'combine') {
      setSelectedCombine([])
      setCombineNotice('')
    }
  }, [view])

  /* Reset the compare carousel to the first pair each time it opens. */
  useEffect(() => {
    if (view === 'compare') setCompareIndex(0)
  }, [view])

  /* When the edit view opens, initialise the constraint drafts from the latest
     extracted constraints so the user edits the current values. */
  useEffect(() => {
    if (view === 'edit') {
      setConstraintDrafts(constraints)
    }
  }, [view, constraints])

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
  const explainScrollRef = useRef<HTMLDivElement>(null)

  const scrollExplain = (dir: 'left' | 'right') => {
    const el = explainScrollRef.current
    if (!el) return
    const amount = el.clientWidth * 0.6
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }

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
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: palette.textStrong, marginBottom: '10px' }}>Plan explained</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '10px' }}>
              <MotionButton
                whileTap={{ scale: 0.9 }}
                onClick={() => scrollExplain('left')}
                disableRipple
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 26,
                  height: 26,
                  borderRadius: '999px',
                  border: `1px solid ${palette.border}`,
                  bgcolor: palette.surfaceAlt,
                  flexShrink: 0,
                  color: palette.textMuted,
                  '&:hover': { bgcolor: palette.border },
                }}
              >
                <ChevronLeft size={14} />
              </MotionButton>
              <Box
                ref={explainScrollRef}
                sx={{
                  display: 'flex',
                  gap: '6px',
                  overflowX: 'auto',
                  flex: 1,
                  scrollbarWidth: 'none',
                  '&::-webkit-scrollbar': { display: 'none' },
                }}
              >
                {(['simplicity', 'max-redeem', 'monitor', 'no-redeem'] as const).map((t) => {
                  const active = currentExplainPlan === t
                  return (
                    <MotionButton
                      key={t}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setExplainPlan(t)}
                      disableRipple
                      sx={{
                        flex: '0 0 auto',
                        borderRadius: '999px',
                        border: active ? `1.5px solid ${palette.brand}` : `1px solid ${palette.border}`,
                        bgcolor: active ? palette.brand : palette.surfaceAlt,
                        color: active ? '#ffffff' : palette.textMuted,
                        padding: '7px 10px',
                        fontSize: 11,
                        fontWeight: 700,
                        fontFamily: 'inherit',
                        lineHeight: 1.3,
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s',
                        '&:hover': { borderColor: palette.brand },
                      }}
                    >
                      {planTitle(t)}
                    </MotionButton>
                  )
                })}
              </Box>
              <MotionButton
                whileTap={{ scale: 0.9 }}
                onClick={() => scrollExplain('right')}
                disableRipple
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 26,
                  height: 26,
                  borderRadius: '999px',
                  border: `1px solid ${palette.border}`,
                  bgcolor: palette.surfaceAlt,
                  flexShrink: 0,
                  color: palette.textMuted,
                  '&:hover': { bgcolor: palette.border },
                }}
              >
                <ChevronRight size={14} />
              </MotionButton>
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <PlanTag
                  text={planTag(currentExplainPlan).text}
                  color={planTag(currentExplainPlan).color}
                  bg={planTag(currentExplainPlan).bg}
                />
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
            <BackRow onBack={goBack} title="Combine plans to create a new plan" />

            <Box
              sx={{
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                pb: '6px',
                scrollbarWidth: 'thin',
                '&::-webkit-scrollbar': { height: 6 },
                '&::-webkit-scrollbar-thumb': { bgcolor: palette.border, borderRadius: 3 },
              }}
            >
              {(['simplicity', 'max-redeem', 'monitor', 'no-redeem'] as const).map((t) => {
                const tag = planTag(t)
                const mergeable = MERGEABLE_PLANS.includes(t as PlanType)
                const checked = selectedCombine.includes(t as PlanType)
                const isCurrent = selectedPlan === t
                return (
                  <MotionButton
                    key={t}
                    whileTap={mergeable ? { scale: 0.95 } : undefined}
                    onClick={() => {
                      if (!mergeable) {
                        showCombineNotice(NON_MERGEABLE_MESSAGES[t] ?? '')
                        return
                      }
                      setCombineNotice('')
                      const next = selectedCombine.includes(t as PlanType)
                        ? selectedCombine.filter((x) => x !== t)
                        : [...selectedCombine, t as PlanType]
                      setSelectedCombine(next)
                      /* Auto-enable the plan (and so the Next nav) as soon as
                         both action plans are combined, with no extra tap. */
                      if (MERGEABLE_PLANS.every((p) => next.includes(p))) {
                        onSelectPlan?.('hybrid')
                      }
                    }}
                    disableRipple
                    sx={{
                      display: 'flex',
                      flexShrink: 0,
                      alignItems: 'center',
                      gap: '6px',
                      borderRadius: '999px',
                      border: checked ? `1.5px solid ${palette.brand}` : `1px solid ${palette.border}`,
                      bgcolor: checked ? palette.brandBg : palette.surfaceAlt,
                      padding: '6px 12px',
                      fontFamily: 'inherit',
                      opacity: mergeable ? 1 : 0.72,
                      transition: 'all 0.2s',
                      ...(mergeable
                        ? { '&:hover': { borderColor: palette.brand } }
                        : { cursor: 'not-allowed' }),
                    }}
                  >
                    <Box
                      sx={{
                        width: 15,
                        height: 15,
                        flexShrink: 0,
                        borderRadius: '4px',
                        border: checked ? 'none' : `1.5px solid ${palette.border}`,
                        bgcolor: checked ? palette.brand : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {checked ? <Check size={11} color="#ffffff" /> : null}
                    </Box>
                    <Typography
                      sx={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: palette.textStrong,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <Box component="span" sx={{ color: tag.color, marginRight: '5px' }}>
                        {tag.text}
                      </Box>
                      {planTitle(t)}
                    </Typography>
                    {isCurrent ? (
                      <Typography sx={{ fontSize: 9, color: palette.textFaint, flexShrink: 0 }}>
                        · current
                      </Typography>
                    ) : null}
                  </MotionButton>
                )
              })}
            </Box>

            {combineNotice ? (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  marginTop: '10px',
                  borderRadius: '10px',
                  border: `1px solid ${palette.amber}`,
                  bgcolor: palette.amber,
                  padding: '9px 12px',
                }}
              >
                <Typography sx={{ fontSize: 12, color: palette.amberText, lineHeight: 1.45 }}>
                  {combineNotice}
                </Typography>
              </Box>
            ) : null}

            {MERGEABLE_PLANS.every((p) => selectedCombine.includes(p)) ? (
              <Box
                sx={{
                  marginTop: '12px',
                  borderRadius: '12px',
                  border: `1.5px solid ${palette.brand}`,
                  bgcolor: palette.brandBg,
                  padding: '12px',
                }}
              >
                <Typography sx={{ fontSize: 11, fontWeight: 800, color: palette.brand, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Your combined new plan
                </Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 800, color: palette.textStrong, marginTop: '4px' }}>
                  {planTitle('hybrid')}
                </Typography>
                <Typography sx={{ fontSize: 12, color: palette.text, lineHeight: 1.55, marginTop: '6px' }}>
                  Combines the one-step ease of {planTitle('simplicity')} with the bigger value of {planTitle('max-redeem')}: your partner points are converted into LBG coins automatically, so you still take just one action to pay.
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px' }}>
                  {selectedCombine.map((s) => (
                    <PlanTag
                      key={s}
                      text={planTag(s).text}
                      color={planTag(s).color}
                      bg={planTag(s).bg}
                    />
                  ))}
                </Box>
              </Box>
            ) : null}
          </Box>
        ) : null}

        {view === 'edit' ? (
          <Box>
            <BackRow onBack={goBack} title="Edit constraints extracted from your objective" />
            {constraintDrafts.length === 0 ? (
              <Box
                sx={{
                  borderRadius: '10px',
                  border: `1px solid ${palette.border}`,
                  bgcolor: palette.surfaceAlt,
                  padding: '14px',
                  textAlign: 'center',
                }}
              >
                <Typography sx={{ fontSize: 12, color: palette.textMuted }}>
                  No constraints were extracted from your objective.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {constraintDrafts.map((c) => {
                  const label = (c.label || c.text).trim()
                  return (
                    <Box
                      key={c.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderRadius: '10px',
                        border: `1px solid ${palette.border}`,
                        bgcolor: palette.surfaceAlt,
                        padding: '8px 10px',
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: palette.text,
                          flexShrink: 0,
                          width: '38%',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {label || 'Constraint'}
                      </Typography>
                      <Box
                        component="input"
                        type="text"
                        value={c.value}
                        placeholder="0"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setConstraintDrafts((prev) =>
                            prev.map((d) =>
                              d.id === c.id ? { ...d, value: e.target.value } : d,
                            ),
                          )
                        }}
                        sx={{
                          flex: 1,
                          minWidth: 0,
                          width: '100%',
                          boxSizing: 'border-box',
                          borderRadius: '8px',
                          border: `1.5px solid ${palette.border}`,
                          padding: '7px 10px',
                          fontSize: 13,
                          fontFamily: 'inherit',
                          color: palette.textStrong,
                          bgcolor: palette.surface,
                          outline: 'none',
                          '&:focus': { borderColor: palette.brand },
                        }}
                      />
                    </Box>
                  )
                })}
              </Box>
            )}
            <Box sx={{ display: 'flex', gap: '8px', marginTop: '10px', justifyContent: 'flex-end' }}>
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
                  const updates = constraintDrafts
                    .map((c) => ({
                      id: c.id,
                      label: (c.label || c.text).trim() || 'Constraint',
                      value: c.value.trim(),
                    }))
                    .filter((c) => c.value.length > 0)
                  if (updates.length === 0) return
                  onEditConstraints?.(updates)
                }}
                disabled={constraintDrafts.every((c) => !c.value.trim())}
                disableRipple
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '10px',
                  bgcolor: constraintDrafts.some((c) => c.value.trim())
                    ? palette.brand
                    : palette.textFaint,
                  padding: '8px 14px',
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  color: '#ffffff',
                  '&:hover': {
                    bgcolor: constraintDrafts.some((c) => c.value.trim())
                      ? palette.brandDark
                      : palette.textFaint,
                  },
                }}
              >
                <WandSparkles size={13} /> Apply & refresh plans
              </MotionButton>
            </Box>
          </Box>
        ) : null}

        {view === 'compare' ? (
          <Box>
            <BackRow onBack={goBack} title="Plans side by side" />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <MotionButton
                whileTap={{ scale: 0.9 }}
                onClick={() => setCompareIndex((i) => Math.max(0, i - 1))}
                disableRipple
                disabled={compareIndex === 0}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: '999px',
                  border: `1px solid ${palette.border}`,
                  bgcolor: palette.surfaceAlt,
                  flexShrink: 0,
                  color: compareIndex === 0 ? palette.textFaint : palette.textMuted,
                  '&:hover': { bgcolor: palette.border },
                }}
              >
                <ChevronLeft size={15} />
              </MotionButton>
              <Box
                sx={{
                  display: 'flex',
                  gap: '6px',
                  justifyContent: 'center',
                  flex: 1,
                }}
              >
                {COMPARE_PAIRS.map((_, i) => (
                  <Box
                    key={i}
                    onClick={() => setCompareIndex(i)}
                    sx={{
                      height: 6,
                      width: i === compareIndex ? 18 : 6,
                      borderRadius: '999px',
                      bgcolor: i === compareIndex ? palette.brand : palette.border,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  />
                ))}
              </Box>
              <MotionButton
                whileTap={{ scale: 0.9 }}
                onClick={() => setCompareIndex((i) => Math.min(COMPARE_PAIRS.length - 1, i + 1))}
                disableRipple
                disabled={compareIndex === COMPARE_PAIRS.length - 1}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: '999px',
                  border: `1px solid ${palette.border}`,
                  bgcolor: palette.surfaceAlt,
                  flexShrink: 0,
                  color: compareIndex === COMPARE_PAIRS.length - 1 ? palette.textFaint : palette.textMuted,
                  '&:hover': { bgcolor: palette.border },
                }}
              >
                <ChevronRight size={15} />
              </MotionButton>
            </Box>
            {(() => {
              const pair = COMPARE_PAIRS[compareIndex]
              const leftTag = planTag(pair.left)
              const rightTag = planTag(pair.right)
              return (
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
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: '4px',
                      padding: '6px 10px',
                      bgcolor: palette.brandBg,
                    }}
                  >
                    <Typography sx={{ fontSize: 10, fontWeight: 700, color: palette.textMuted, alignSelf: 'center' }}>
                      Detail
                    </Typography>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography sx={{ fontSize: 9, fontWeight: 800, color: leftTag.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {leftTag.text}
                      </Typography>
                      <Typography sx={{ fontSize: 11, fontWeight: 800, color: palette.textStrong, lineHeight: 1.2 }}>
                        {/* {planTitle(pair.left)} */}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography sx={{ fontSize: 9, fontWeight: 800, color: rightTag.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {rightTag.text}
                      </Typography>
                      <Typography sx={{ fontSize: 11, fontWeight: 800, color: palette.textStrong, lineHeight: 1.2 }}>
                        {planTitle(pair.right)}
                      </Typography>
                    </Box>
                  </Box>
                  {pair.rows.map((row, i) => (
                    <Box
                      key={row.label}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: '4px',
                        padding: '5px 10px',
                        borderTop: `1px solid ${palette.border}`,
                        bgcolor: i % 2 ? palette.surfaceAlt : palette.surface,
                      }}
                    >
                      <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: palette.textMuted, alignSelf: 'center' }}>
                        {row.label}
                      </Typography>
                      <Typography sx={{ fontSize: 10.5, fontWeight: 600, color: palette.textStrong, textAlign: 'center', lineHeight: 1.4 }}>
                        {row.a}
                      </Typography>
                      <Typography sx={{ fontSize: 10.5, fontWeight: 600, color: palette.textStrong, textAlign: 'center', lineHeight: 1.4 }}>
                        {row.b}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )
            })()}
          </Box>
        ) : null}
      </Box>
    </Box>
  )
}