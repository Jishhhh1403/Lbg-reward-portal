import { useCallback, useEffect, useRef, useState, Component } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import ButtonBase from '@mui/material/ButtonBase'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { ArrowLeft, Loader2, X } from 'lucide-react'
import type { SDUIComponent } from '../../types/sdui'
import type {
  ExecutionStep,
  ObjectiveScreen,
  PlanType,
  WorkspaceResume,
} from '../../types/objective'
import type {
  ObjectiveStage,
  ObjectiveWalletPayload,
} from '../../types/objective-sdui'
import { generateObjectiveStage } from '../../services/objectiveApi'
import { shadows } from '../../theme'
import screen1aBg from '../../assets/screen-1a.png'
import toolsBg from '../../assets/toolsscreen.png'
import WorkspaceSDUIRenderer, {
  renderWorkspaceComponent,
} from '../../workspace-components/WorkspaceSDUIRenderer'
import { buildMergedSummaryStageComponents, buildStageComponents } from '../../workspace-components/buildStageComponents'
import type { CoplanToolView } from '../../workspace-components/CoplanTools'
import type {
  WorkspaceHandlers,
  WorkspaceRenderContext,
} from '../../workspace-components/types'
import { palette } from '../../workspace-components/types'

/* ------------------------------------------------------------------ */
/* Helpers to build local (client-driven) SDUI component lists          */
/* ------------------------------------------------------------------ */

function makeComponent(
  id: string,
  type: string,
  props: Record<string, unknown>,
  actions?: SDUIComponent['actions'],
): SDUIComponent {
  return { id, type, version: '1.0', priority: 0, props, actions }
}

/** Canonical display name for each plan across all screens. */
function planLabel(plan: PlanType): string {
  if (plan === 'max-redeem') return 'Maximum Value Plan'
  if (plan === 'hybrid') return 'Best of Both Plan'
  if (plan === 'monitor') return 'Monitor Plan'
  if (plan === 'no-redeem') return 'No Rewards Plan'
  return 'Simplicity Plan'
}

/** Plans that prioritise value follow the Plan B (4x) screen group. */
function isValueTrack(plan: PlanType): boolean {
  return plan === 'max-redeem' || plan === 'hybrid'
}

/** Surfaces any unexpected render error as visible text instead of a blank screen. */
class WorkspaceErrorBoundary extends Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('[ObjectiveWorkspace] Render error:', error)
  }

  render() {
    if (this.state.error) {
      return (
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '20px',
            textAlign: 'center',
          }}
        >
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
            Something went wrong while rendering this step
          </Typography>
          <Typography sx={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
            {String(this.state.error?.message ?? this.state.error)}
          </Typography>
        </Box>
      )
    }
    return this.props.children
  }
}

/** Capture screen (1a) — pure client composition, no AI call yet. */
export function captureComponents(objectiveText: string): SDUIComponent[] {
  return [
    makeComponent('capture-bg', 'WS_BACKGROUND', {
      image: screen1aBg,
      fill: true,
    }),
    makeComponent('capture-anchor', 'WS_ANCHOR', {
  text: 'What is your objective today?',
}),

    makeComponent('capture-quick', 'WS_QUICK_PICK', {
      hint: 'Quick start',
      text: 'I want to pay for my insurance using LBG coins while maximizing the value',
    }),
    makeComponent('capture-state', 'WS_STATE_OBJECTIVE', {
      label: 'State objective',
      placeholder: 'e.g. I want to redeem my points for the best value',
      value: objectiveText,
      quickStartText: 'I want to pay for my insurance using LBG coins while maximizing the value',
    }),
  ]
}

/** Redirect confirmation screen (3b / 4b) — no monitoring, no expected date. */
function redirectComponents(
  redirectConfirm: ExecutionStep | null,
  planLabel: string,
): SDUIComponent[] {
  const partner = redirectConfirm?.partner ?? ''
  const promptText =
    partner === 'Cavendish Online'
      ? 'Do you want to redirect to Cavendish Online to make your insurance payment?'
      : partner === 'Alpha Medical'
        ? 'Do you want to redirect to Alpha Medical to convert your points into LBG coins?'
        : `Do you want to redirect to ${partner} to continue?`
  return [
    makeComponent('redirect-plan', 'WS_PLAN_HERO', {
      planLabel,
      description: redirectConfirm?.label ?? '',
    }),
    makeComponent('redirect-prompt', 'WS_REDIRECT_PROMPT', {
      partner,
      prompt: promptText,
    }),
    makeComponent(
      'redirect-confirm',
      'WS_NAV',
      { primary: `Go to ${partner}` },
      [{ type: 'WS_CONFIRM', payload: {} }],
    ),
  ]
}

/** Execution result screen (3c / 4c). */
function resultComponents(result: {
  success: boolean
  message: string
}): SDUIComponent[] {
  if (result.success) {
    return [
      makeComponent(
        'result-success',
        'WS_SUCCESS',
        { message: result.message },
        [{ type: 'WS_RETURN_HOME', payload: {} }],
      ),
    ]
  }
  return [
    makeComponent('result-failure', 'WS_FAILURE', { message: result.message }),
    makeComponent(
      'result-recovery',
      'WS_RECOVERY',
      {},
      [{ type: 'WS_RETURN_HOME', payload: {} }],
    ),
  ]
}

/** Monitoring confirmation screen (2d) — chosen when no action is taken yet. */
function monitoringComponents(): SDUIComponent[] {
  return [
    makeComponent('mon-plan', 'WS_PLAN_HERO', {
      planLabel: 'Monitor Plan',
      description:
        'No action taken for now. We will keep watching for new strategies that match your objective and surface the best opportunities when they appear.',
    }),
    makeComponent('mon-prompt', 'WS_REDIRECT_PROMPT', {
      partner: 'LBG Coins',
      prompt:
        'Monitoring is on. We will actively watch for new strategies for this objective and let you know as soon as something valuable becomes available.',
    }),
    makeComponent(
      'mon-nav',
      'WS_NAV',
      { primary: 'Done' },
      [{ type: 'WS_NEXT', payload: {} }],
    ),
  ]
}

/** Retain-all / No Rewards redirect screen (2e) — pay directly, use no coins. */
function retainComponents(
  redirectConfirm: ExecutionStep | null,
): SDUIComponent[] {
  const partner = redirectConfirm?.partner ?? 'Cavendish Online'
  return [
    makeComponent('retain-plan', 'WS_PLAN_HERO', {
      planLabel: 'No Rewards Plan',
      description: redirectConfirm?.label ?? 'Pay for your insurance directly — no LBG coins used.',
    }),
    makeComponent('retain-prompt', 'WS_REDIRECT_PROMPT', {
      partner,
      prompt:
        'Do you want to redirect to Cavendish Online to pay for your insurance directly? You will pay the full amount and keep all of your LBG coins and rewards.',
    }),
    makeComponent(
      'retain-confirm',
      'WS_NAV',
      { primary: `Go to ${partner}` },
      [{ type: 'WS_CONFIRM', payload: {} }],
    ),
  ]
}

/* ------------------------------------------------------------------ */
/* Plan A / Plan B execution flows                                     */
/* ------------------------------------------------------------------ */

export const PORTAL_URLS = {
  alphaConvert: 'http://localhost:5174/lbg-rewards/convert',
  cavendishPolicy: 'http://localhost:5175/#/policy',
  cavendishCheckout: 'http://localhost:5175/#/checkout',
} as const

/**
 * Deterministic execution steps per plan.
 *
 * Plan A (Simplicity): use the existing LBG coin balance directly, then pay for
 * Cavendish Online insurance.
 * Plan B (Maximum Value): convert Alpha Medical points into LBG coins at the
 * Alpha Medical conversion page, return to the workspace, then pay for
 * Cavendish Online insurance.
 * Hybrid (Best of Both): the conversion runs automatically (internal step), so
 * the customer still only takes one action to pay — with the bigger balance.
 */
/**
 * Deterministic execution steps per plan.
 *
 * Redeem plans (Simplicity, Maximum Value, Hybrid) share a single, inline
 * 4-step flowchart shown on one execution screen:
 *   1. Use your real LBG coin balance for the Cavendish insurance payment.
 *   2. Review the insurance plan details (Cavendish policy page).
 *   3. Authorize card details (Cavendish checkout — coins auto-applied).
 *   4. Payment completed.
 * The first and last steps are internal (no redirect); the two middle steps
 * hand off to the Cavendish portal and return to this screen, ticking off as
 * the user completes them.
 */
export function buildExecutionSteps(plan: PlanType): ExecutionStep[] {
  if (plan === 'monitor') {
    return [
      {
        id: 'monitor-active',
        label: 'We are monitoring for new strategies for your objective',
        partner: 'LBG Coins',
        partnerUrl: '',
        status: 'pending',
      },
    ]
  }
  if (plan === 'no-redeem') {
    return [
      {
        id: 'cavendish-direct-pay',
        label: 'Pay for your Cavendish Online insurance directly, with no LBG coins',
        partner: 'Cavendish Online',
        partnerUrl: PORTAL_URLS.cavendishCheckout,
        status: 'pending',
      },
    ]
  }
  if (plan === 'max-redeem') {
    return [
      {
        id: 'alpha-convert',
        label: 'Convert your Alpha Medical points to LBG coins',
        partner: 'Alpha Medical',
        partnerUrl: PORTAL_URLS.alphaConvert,
        status: 'pending',
      },
      {
        id: 'lbg-balance',
        label: 'Use your increased LBG coin balance for payment',
        partner: 'LBG Coins',
        partnerUrl: '',
        status: 'pending',
      },
      {
        id: 'review-plan',
        label: 'Review the insurance plan details',
        partner: 'Cavendish Online',
        partnerUrl: PORTAL_URLS.cavendishPolicy,
        status: 'pending',
      },
      {
        id: 'authorize-card',
        label: 'Authorize card details',
        partner: 'Cavendish Online',
        partnerUrl: PORTAL_URLS.cavendishCheckout,
        status: 'pending',
      },
      {
        id: 'payment-completed',
        label: 'Payment completed',
        partner: 'LBG Coins',
        partnerUrl: '',
        status: 'pending',
      },
    ]
  }
  return [
    {
      id: 'lbg-balance',
      label: 'Use your LBG coin balance for payment',
      partner: 'LBG Coins',
      partnerUrl: '',
      status: 'pending',
    },
    {
      id: 'review-plan',
      label: 'Review the insurance plan details',
      partner: 'Cavendish Online',
      partnerUrl: PORTAL_URLS.cavendishPolicy,
      status: 'pending',
    },
    {
      id: 'authorize-card',
      label: 'Authorize card details',
      partner: 'Cavendish Online',
      partnerUrl: PORTAL_URLS.cavendishCheckout,
      status: 'pending',
    },
    {
      id: 'payment-completed',
      label: 'Payment completed',
      partner: 'LBG Coins',
      partnerUrl: '',
      status: 'pending',
    },
  ]
}

/** Execution screen (3a / 4a) — deterministic, driven by the chosen plan. */
function executionComponents(plan: PlanType, lbgCoins = 0): SDUIComponent[] {
  const steps = buildExecutionSteps(plan)
  const coinValue = Math.round(lbgCoins / COINS_PER_POUND * 100) / 100
  return [
    makeComponent('exec-plan', 'WS_PLAN_HERO', {
      planLabel: planLabel(plan),
      description:
        plan === 'max-redeem'
          ? "Let's carry out your Maximum Value Plan to complete your objective."
          : plan === 'hybrid'
            ? "Let's carry out your Best of Both Plan to complete your objective."
            : "Let's carry out your Simplicity Plan to complete your objective.",
    }),
    makeComponent('exec-steps', 'WS_EXECUTION_STEPS', {
      items: steps.map((s) => ({
        id: s.id,
        label:
          s.id === 'lbg-balance' && lbgCoins > 0
            ? `Use your LBG coin balance (${lbgCoins.toLocaleString('en-GB')} coins = £${coinValue.toFixed(2)})`
            : s.label,
        partner: s.partner,
        status: s.status,
      })),
    }, [{ type: 'WS_SELECT_STEP', payload: {} }]),
    makeComponent('exec-nav', 'WS_NAV', { primary: 'Next' }, [
      { type: 'WS_NEXT', payload: {} },
    ]),
  ]
}

/* ------------------------------------------------------------------ */
/* Step progression + workspace resume                                 */
/* ------------------------------------------------------------------ */

/** Auto-completes leading internal steps (no partner portal) so only the
 *  next portal step surfaces as an action. */
export function withInternalCompleted(steps: ExecutionStep[]): ExecutionStep[] {
  const out = [...steps]
  for (let i = 0; i < out.length; i++) {
    if (out[i].status !== 'pending') continue
    if (!out[i].partnerUrl) out[i] = { ...out[i], status: 'completed' }
    else break
  }
  return out
}

/** First step still pending, or null when everything is done. */
export function getNextPending(steps: ExecutionStep[]): ExecutionStep | null {
  return steps.find((s) => s.status === 'pending') ?? null
}

/**
 * Rebuilds wizard state after the user returns from a partner portal.
 * The handed-off step counts as completed (they paid/acted there), any
 * internal steps in between are auto-completed, and the wizard re-opens at
 * the next portal's redirect prompt — or the result screen when finished.
 */
export function applyResume(
  resume: WorkspaceResume,
): { steps: ExecutionStep[]; screen: ObjectiveScreen; redirectConfirm: ExecutionStep | null } {
  const done = new Set<string>([...resume.completed, resume.current])
  const base = buildExecutionSteps(resume.plan)
  const marked = base.map((s) => ({
    ...s,
    status: done.has(s.id) ? ('completed' as const) : (s.status as ExecutionStep['status']),
  }))
  const steps = withInternalCompleted(marked)
  const next = getNextPending(steps)
  const resultScreen: ObjectiveScreen = isValueTrack(resume.plan) ? '4c' : '3c'
  if (!next) {
    return { steps, screen: resultScreen, redirectConfirm: null }
  }
  const running: ExecutionStep = { ...next, status: 'running' }
  /* Redeem plans resume on the single execution screen (3a/4a); only the
     no-redeem direct-pay flow still uses the redirect-confirmation screen. */
  if (resume.plan === 'no-redeem') {
    return {
      steps: steps.map((s) => (s.id === next.id ? running : s)),
      screen: '3b',
      redirectConfirm: running,
    }
  }
  return {
    steps: steps.map((s) => (s.id === next.id ? running : s)),
    screen: isValueTrack(resume.plan) ? '4a' : '3a',
    redirectConfirm: running,
  }
}

/* ------------------------------------------------------------------ */
/* Props                                                                */
/* ------------------------------------------------------------------ */

interface ObjectiveWorkspaceProps {
  isOpen: boolean
  onClose: () => void
  userName: string
  customerId: string
  totalPoints: number
  lbgCoins: number
  tier: string
  pointsByBrand: Array<{ brandName: string; points: number }>
  onPartnerHandoff: (partner: string, url: string, resume: WorkspaceResume) => void
  /** Continuation state so the wizard re-opens where the user left after a
   *  partner portal returns them to this app. */
  resume?: WorkspaceResume | null
}

/* ------------------------------------------------------------------ */
/* Motion primitives                                                    */
/* ------------------------------------------------------------------ */

const MotionBox = motion.create(Box)
const MotionButton = motion.create(ButtonBase)

/* ------------------------------------------------------------------ */
/* Progress bar                                                         */
/* ------------------------------------------------------------------ */

function ProgressBar({ segments }: { segments: [boolean, boolean, boolean] }) {
  return (
    <Box
      sx={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        gap: '8px',
        padding: '16px 20px',
        paddingBottom: '24px',
      }}
    >
      {segments.map((active, i) => (
        <Box
          key={i}
          sx={{
            flex: 1,
            height: 5,
            borderRadius: '999px',
            bgcolor: active ? '#ffffff' : 'rgba(255,255,255,0.45)',
            boxShadow: active ? '0 0 0 1px rgba(15,23,42,0.25), 0 1px 3px rgba(15,23,42,0.3)' : 'none',
            border: active ? 'none' : '1px solid rgba(255,255,255,0.9)',
            transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
          }}
        />
      ))}
    </Box>
  )
}

/* ------------------------------------------------------------------ */
/* Stage gate (loading / error / render)                                */
/* ------------------------------------------------------------------ */

function StageGate({
  loading,
  loadingLabel,
  error,
  onRetry,
  render,
}: {
  loading: boolean
  loadingLabel: string
  error: string | null
  onRetry: () => void
  render: () => React.ReactNode
}) {
  if (loading) {
    return (
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          padding: '20px',
        }}
        aria-busy="true"
        aria-label="Generating your next step"
      >
        <Loader2 size={28} color="#006a4d" className="animate-spin" />
        <Typography sx={{ fontSize: 13, color: '#64748b' }}>{loadingLabel}</Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          padding: '20px',
          textAlign: 'center',
        }}
      >
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: '999px',
            bgcolor: '#fef2f2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={24} color="#dc2626" strokeWidth={2.5} />
        </Box>
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
          We could not generate this step
        </Typography>
        <Typography sx={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, maxWidth: 260 }}>
          {error}
        </Typography>
        <MotionButton
          whileTap={{ scale: 0.97 }}
          onClick={onRetry}
          disableRipple
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderRadius: '12px',
            bgcolor: '#006a4d',
            color: '#ffffff',
            padding: '12px 32px',
            fontSize: 14,
            fontWeight: 600,
            fontFamily: 'inherit',
            boxShadow: shadows.card,
            '&:hover': { bgcolor: '#045a42' },
          }}
        >
          Retry
        </MotionButton>
      </Box>
    )
  }

  return render()
}

/* ------------------------------------------------------------------ */
/* Main Workspace Component                                             */
/* ------------------------------------------------------------------ */

export default function ObjectiveWorkspace({
  isOpen,
  onClose,
  userName: _userName,
  customerId,
  totalPoints,
  lbgCoins,
  tier,
  pointsByBrand,
  onPartnerHandoff,
  resume = null,
}: ObjectiveWorkspaceProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  /* Screen state */
  const [screen, setScreen] = useState<ObjectiveScreen>('1a')
  const [objectiveText, setObjectiveText] = useState('')
  const [objectiveOpen, setObjectiveOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(null)
  const [steps, setSteps] = useState<ExecutionStep[]>([])
  const [redirectConfirm, setRedirectConfirm] = useState<ExecutionStep | null>(null)

  /* AI-generated SDUI for the active generated stage */
  const [stageComponents, setStageComponents] = useState<SDUIComponent[]>([])
  const [stageLoading, setStageLoading] = useState(false)
  const [stageError, setStageError] = useState<string | null>(null)
  const [stageInFlight, setStageInFlight] = useState<ObjectiveStage | null>(null)
  const [provisionalNav, setProvisionalNav] = useState<{ stage: ObjectiveStage; nextScreen: ObjectiveScreen; toolRequest: string | null } | null>(null)
  const [coplanView, setCoplanView] = useState<CoplanToolView>('idle')
  const [history, setHistory] = useState<ObjectiveScreen[]>([])

  /* Cache of generated SDUI per screen so back navigation can restore the exact
     content of a previous AI-generated screen without re-calling the AI. */
  const stageCacheRef = useRef<Partial<Record<ObjectiveScreen, SDUIComponent[]>>>({})

  /* Extracted constraint texts (from screen 1b) used to filter opportunities. */
  const [constraintTexts, setConstraintTexts] = useState<string[]>([])
  /* Full extracted constraints (label/value) shown/edited in the Coplan edit view. */
  const [constraintItems, setConstraintItems] = useState<
    Array<{ id: string; text: string; label: string; value: string; applied: boolean }>
  >([])

  const wallet: ObjectiveWalletPayload = {
    totalPoints,
    tier,
    lbgCoins,
    brandsConnected: pointsByBrand.length,
    pointsByBrand: pointsByBrand.map((b) => ({ brandName: b.brandName, points: b.points })),
  }

  /* Screen navigation */
  const navigateTo = useCallback((s: ObjectiveScreen) => {
    setHistory((h) => [...h, screen])
    setScreen(s)
  }, [screen])

  const handleBack = useCallback(() => {
    if (history.length === 0) return
    const prev = history[history.length - 1]
    if (prev !== '2b') setCoplanView('idle')
    if (prev === '1a') setObjectiveOpen(false)
    setHistory((h) => h.slice(0, -1))
    setScreen(prev)
  }, [history])

  /* Generate a stage's SDUI at runtime, store it, and navigate. */
  const generateStage = useCallback(
    async (
      stage: ObjectiveStage,
      navigator: (screen: ObjectiveScreen) => void,
      nextScreen: ObjectiveScreen,
      toolRequest: string | null = null,
      objectiveOverride?: string,
    ) => {
      if (stage === 'execution' && stageInFlight !== null) return
      setProvisionalNav({ stage, nextScreen, toolRequest })
      setStageLoading(true)
      setStageError(null)
      setStageInFlight(stage)
      const activeObjective = objectiveOverride ?? objectiveText
      try {
        const res = await generateObjectiveStage({
          customerReference: customerId,
          objectiveText: activeObjective,
          stage,
          selectedPlan,
          toolRequest: toolRequest ?? undefined,
          constraintValues:
            stage === 'opportunities' || stage === 'evidence' || stage === 'strategies'
              ? constraintTexts
              : undefined,
          wallet,
        })
        if (res.status !== 'PERSONALIZED') {
          setStageError(res.error || 'The AI could not generate this content. Please try again.')
          return
        }
        const screen = res.screen ?? {}
        const built = buildStageComponents(stage, screen, activeObjective, selectedPlan)
        setStageComponents(built)
        stageCacheRef.current[nextScreen] = built
        navigator(nextScreen)
      } catch (e) {
        console.warn('[ObjectiveWorkspace] Stage generation failed:', e)
        setStageError('Something went wrong while generating this step. Please try again.')
      } finally {
        setStageLoading(false)
        setStageInFlight(null)
      }
    },
    [customerId, objectiveText, selectedPlan, wallet, stageInFlight, constraintTexts],
  )

  /* Generate the merged "What I understood + Constraints extracted" screen (1b):
     fetch the summary and constraint stages together, combine their content into a
     single component stream, then navigate. */
  const generateSummaryAndConstraints = useCallback(
    async (navigator: (s: ObjectiveScreen) => void, nextScreen: ObjectiveScreen) => {
      setStageLoading(true)
      setStageError(null)
      setStageInFlight('summary')
      try {
        const [summaryRes, constraintsRes] = await Promise.all([
          generateObjectiveStage({
            customerReference: customerId,
            objectiveText,
            stage: 'summary',
            selectedPlan,
            wallet,
          }),
          generateObjectiveStage({
            customerReference: customerId,
            objectiveText,
            stage: 'constraints',
            selectedPlan,
            wallet,
          }),
        ])
        if (summaryRes.status !== 'PERSONALIZED' || constraintsRes.status !== 'PERSONALIZED') {
          const err =
            summaryRes.error || constraintsRes.error || 'The AI could not generate this content. Please try again.'
          setStageError(err)
          return
        }
        const summaryScreen = summaryRes.screen ?? {}
        const constraintsScreen = constraintsRes.screen ?? {}
        const constraintItems = (constraintsScreen.constraints ?? []).map((c) => ({
          id: c.id,
          text: c.text,
        }))
        setConstraintItems(
          (constraintsScreen.constraints ?? []).map((c) => ({
            id: c.id,
            text: c.text,
            label: c.label ?? '',
            value: c.value ?? '',
            applied: c.applied,
          })),
        )
        setConstraintTexts(
          (constraintsScreen.constraints ?? [])
            .filter((c) => c.applied)
            .map((c) => c.text),
        )
        const built = buildMergedSummaryStageComponents(
          summaryScreen.summary ?? '',
          constraintItems,
        )
        setStageComponents(built)
        stageCacheRef.current[nextScreen] = built
        navigator(nextScreen)
      } catch (e) {
        console.warn('[ObjectiveWorkspace] Summary/constraints generation failed:', e)
        setStageError('Something went wrong while generating this step. Please try again.')
      } finally {
        setStageLoading(false)
        setStageInFlight(null)
      }
    },
    [customerId, objectiveText, selectedPlan, wallet],
  )

  /* Re-run the stage that failed, using the recorded navigation target. */
  const retryStage = useCallback(() => {
    if (!provisionalNav) return
    generateStage(
      provisionalNav.stage,
      navigateTo,
      provisionalNav.nextScreen,
      provisionalNav.toolRequest,
    )
  }, [provisionalNav, generateStage, navigateTo])

  /* Stage → progress mapping */
  const getProgress = useCallback((): [boolean, boolean, boolean] => {
    if (screen === '1a') return [true, false, false]
    if (screen === '1b') return [false, true, false]
    if (screen === '1c') return [false, false, true]
    if (screen === '2a') return [true, false, false]
    if (screen === '2b') return [false, true, false]
    if (screen === '2c') return [false, false, true]
    if (screen === '2d' || screen === '2e') return [false, false, true]
    if (screen === '3a' || screen === '4a') return [true, false, false]
    if (screen === '3b' || screen === '4b') return [false, true, false]
    if (screen === '3c' || screen === '4c') return [false, false, true]
    return [false, false, false]
  }, [screen])

  /* Focus trap */
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement
      setTimeout(() => closeRef.current?.focus(), 50)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      previousFocusRef.current?.focus()
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  /* Reset wizard + AI content each time the modal opens. */
  useEffect(() => {
    if (!isOpen) return
    setStageComponents([])
    setStageLoading(false)
    setStageError(null)
    setStageInFlight(null)
    setProvisionalNav(null)
    setCoplanView('idle')
    setConstraintTexts([])
    setConstraintItems([])

    if (resume) {
      const resumed = applyResume(resume)
      setObjectiveText(resume.objective)
      setSelectedPlan(resume.plan)
      setSteps(resumed.steps)
      setRedirectConfirm(resumed.redirectConfirm)
      setScreen(resumed.screen)
      return
    }

    setScreen('1a')
    setObjectiveText('')
    setSelectedPlan(null)
    setSteps([])
    setRedirectConfirm(null)
  }, [isOpen, resume])

  /* Keyboard handling */
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  /* Partner redirect confirmation */
  const handleConfirmRedirect = useCallback(() => {
    if (!redirectConfirm) return
    const completed = steps
      .filter((s) => s.id === redirectConfirm.id || s.status === 'completed')
      .map((s) => s.id)

    /* Mark the just-confirmed step complete (plus auto-skipping internal ones). */
    setSteps((prev) =>
      withInternalCompleted(
        prev.map((s) =>
          s.id === redirectConfirm.id ? { ...s, status: 'completed' as const } : s,
        ),
      ),
    )

    const allCompleted = withInternalCompleted(
      steps.map((s) =>
        s.id === redirectConfirm.id ? { ...s, status: 'completed' as const } : s,
      ),
    ).every((s) => s.status === 'completed')
    if (allCompleted) {
      setScreen(isValueTrack(selectedPlan) ? '4c' : '3c')
    }

    if (redirectConfirm.partnerUrl) {
      onPartnerHandoff(redirectConfirm.partner, redirectConfirm.partnerUrl, {
        objective: objectiveText,
        plan: selectedPlan,
        completed,
        current: redirectConfirm.id,
      })
    }
  }, [redirectConfirm, steps, onPartnerHandoff, selectedPlan, objectiveText])

  /* Primary (Next) action advances the wizard depending on the active screen. */
  const handleNext = useCallback(() => {
    switch (screen) {
      case '1a':
        generateSummaryAndConstraints(navigateTo, '1b')
        break
      case '1b':
        generateStage('opportunities', navigateTo, '2a')
        break
      case '1c':
        generateStage('opportunities', navigateTo, '2a')
        break
      case '2a':
        generateStage('strategies', navigateTo, '2b')
        break
      case '2b':
        if (selectedPlan === 'monitor') {
          setStageComponents([])
          setStageLoading(false)
          setStageError(null)
          navigateTo('2d')
          break
        }
        if (selectedPlan === 'no-redeem') {
          const step = buildExecutionSteps('no-redeem')[0]
          setRedirectConfirm(step)
          setSteps(buildExecutionSteps('no-redeem'))
          setStageComponents([])
          setStageLoading(false)
          setStageError(null)
          navigateTo('2e')
          break
        }
        generateStage('evidence', navigateTo, '2c')
        break
      case '2c': {
        const plan = selectedPlan
        setSteps(buildExecutionSteps(plan))
        setStageComponents([])
        setStageLoading(false)
        setStageError(null)
        navigateTo(isValueTrack(plan) ? '4a' : '3a')
        break
      }
      case '2d':
        onClose()
        break
      case '3a':
      case '4a': {
        const advanced = withInternalCompleted(steps)
        setSteps(advanced)
        const next = getNextPending(advanced)
        if (!next) {
          navigateTo(isValueTrack(selectedPlan) ? '4c' : '3c')
          break
        }
        const running: ExecutionStep = { ...next, status: 'running' }
        setSteps((prev) => prev.map((s) => (s.id === next.id ? running : s)))
        setRedirectConfirm(running)
        /* Redeem plans hand off straight to the partner from the single execution
           screen (no redirect-confirmation page); only no-redeem still uses 3b. */
        if (selectedPlan !== 'no-redeem') {
          const completed = steps
            .filter((s) => s.id === running.id || s.status === 'completed')
            .map((s) => s.id)
          setSteps((prev) =>
            withInternalCompleted(
              prev.map((s) =>
                s.id === running.id ? { ...s, status: 'completed' as const } : s,
              ),
            ),
          )
          if (running.partnerUrl) {
            onPartnerHandoff(running.partner, running.partnerUrl, {
              objective: objectiveText,
              plan: selectedPlan,
              completed,
              current: running.id,
            })
          }
          break
        }
        navigateTo(isValueTrack(selectedPlan) ? '4b' : '3b')
        break
      }
      default:
        break
    }
  }, [screen, generateStage, generateSummaryAndConstraints, navigateTo, selectedPlan, steps, onPartnerHandoff, objectiveText])

  const handleModify = useCallback(() => {
    setStageError(null)
    setStageLoading(false)
    setCoplanView('idle')
    setObjectiveOpen(true)
    navigateTo('1a')
  }, [navigateTo])

  /** Coplan tools regenerate the two plans, adapting them to the user's request. */
  const handleCoplanRequest = useCallback(
    (toolId: string, prompt: string) => {
      generateStage(
        'strategies',
        navigateTo,
        '2b',
        `Coplan tool "${toolId}": ${prompt}`,
      )
    },
    [generateStage, navigateTo],
  )

  /** Switch the Coplan pane between its tool views (explain/combine/edit/compare). */
  const handleCoplanViewChange = useCallback((view: string) => {
    setCoplanView(view as CoplanToolView)
  }, [])

  /** Coplan "edit constraints" tool: adopt edited constraint deltas and rebuild
   *  both plans around the updated constraints, keeping the objective unchanged. */
  const handleEditConstraints = useCallback(
    (constraints: Array<{ id: string; label: string; value: string }>) => {
      const updated = constraints.map((c) => ({
        id: c.id,
        label: c.label.trim() || 'Constraint',
        value: c.value.trim(),
      }))
      if (updated.every((c) => !c.value)) return
      const deltas = updated.map(
        (c) => `${c.label}: ${c.value}`,
      )
      setConstraintTexts(deltas)
      setConstraintItems((prev) =>
        prev.map((c) => {
          const found = updated.find((n) => n.id === c.id)
          if (!found) return c
          return {
            ...c,
            label: found.label,
            value: found.value,
            text: `${found.label}: ${found.value}`,
          }
        }),
      )
      setCoplanView('idle')
      void generateStage(
        'strategies',
        navigateTo,
        '2b',
        `Coplan tool "edit": rebuild both plans for the objective with updated constraints: ${JSON.stringify(deltas)}`,
        objectiveText,
      )
    },
    [generateStage, navigateTo, objectiveText],
  )

  /** Execute the partner hand-off for a step, marking it complete and going to
   *  the partner portal straight from the execution screen. */
  const handleConfirm = useCallback(
    (step: ExecutionStep) => {
      const completed = steps
        .filter((s) => s.id === step.id || s.status === 'completed')
        .map((s) => s.id)

      setSteps((prev) =>
        withInternalCompleted(
          prev.map((s) =>
            s.id === step.id ? { ...s, status: 'completed' as const } : s,
          ),
        ),
      )

      if (step.partnerUrl) {
        onPartnerHandoff(step.partner, step.partnerUrl, {
          objective: objectiveText,
          plan: selectedPlan,
          completed,
          current: step.id,
        })
      }
    },
    [steps, onPartnerHandoff, selectedPlan, objectiveText],
  )

  const handleSelectStep = useCallback(
    (id: string) => {
      const step = steps.find((s) => s.id === id)
      if (!step) return

      /* Internal steps (no partner portal) complete in place. */
      if (!step.partnerUrl) {
        setSteps((prev) =>
          withInternalCompleted(
            prev.map((s) =>
              s.id === id ? { ...s, status: 'completed' as const } : s,
            ),
          ),
        )
        return
      }

      /* Portal steps hand off to the partner directly from the execution screen
         (no separate redirect-confirmation page), then return to this screen. */
      setRedirectConfirm({ ...step, status: 'running' })
      setSteps((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: 'running' as const } : s)),
      )
      handleConfirm({ ...step, status: 'running' })
    },
    [steps, handleConfirm],
  )

  const handleReturnHome = useCallback(() => {
    onClose()
  }, [onClose])

  const totalSuccess = steps.length > 0 && steps.every((s) => s.status === 'completed')

  /* Resolve the AI-generated components for a screen: prefer the live generation
     when it matches the active screen, otherwise fall back to the cached copy so
     back navigation shows the correct (previous) content. */
  const resolveStage = (s: ObjectiveScreen): SDUIComponent[] =>
    s === screen && stageComponents.length > 0
      ? stageComponents
      : (stageCacheRef.current[s] ?? stageComponents)

  /* Compose the SDUI component list for the active screen. */
  const components: SDUIComponent[] = (() => {
    switch (screen) {
      case '1a':
        return captureComponents(objectiveText)
      case '1b':
      case '1c':
      case '2a':
      case '2c':
        return resolveStage(screen)
      case '2b':
        /* A Coplan tool view replaces the plan cards with the tool content,
           keeping only the nav so the screen always stays fits without scroll. */
        if (coplanView !== 'idle') {
          const coplan = resolveStage(screen).find((c) => c.type === 'WS_COPLAN')
          const nav = resolveStage(screen).find((c) => c.id === 'str-nav')
          return [
            makeComponent('coplan-bg', 'WS_BACKGROUND', {
              image: toolsBg,
              fill: true,
            }),
            makeComponent(
              'coplan-view',
              'WS_COPLAN',
              { ...(coplan?.props ?? {}), view: coplanView },
              [{ type: 'WS_COPLAN_REQUEST', payload: {} }],
            ),
            ...(nav ? [nav] : []),
          ]
        }
        return resolveStage(screen)
      case '3a':
      case '4a':
        return executionComponents(selectedPlan)
      case '3b':
      case '4b':
        return redirectComponents(
          redirectConfirm,
          planLabel(selectedPlan),
        )
      case '3c':
      case '4c':
        return resultComponents({
          success: totalSuccess,
          message: totalSuccess
            ? 'Your redemption has been processed successfully. Your rewards have been updated.'
            : 'Something went wrong during execution. Your points have not been changed.',
        })
      case '2d':
        return monitoringComponents()
      case '2e':
        return retainComponents(redirectConfirm)
      default:
        return []
    }
  })()

  /* Live render context + handlers passed to the workspace renderer. */
  const sduiContext: WorkspaceRenderContext = {
    objectiveText,
    selectedPlan,
    steps,
    nextDisabled:
      screen === '1a' ? !objectiveText.trim() : screen === '2b' ? !selectedPlan : false,
    objectiveOpen,
    constraintItems,
  }

const sduiHandlers: WorkspaceHandlers = {
    onTextChange: setObjectiveText,
    onNext: handleNext,
    onModify: handleModify,
    onSelectPlan: setSelectedPlan,
    onSelectStep: handleSelectStep,
    onConfirmRedirect: handleConfirmRedirect,
    onCoplanRequest: handleCoplanRequest,
    onReturnHome: handleReturnHome,
    onEditConstraints: handleEditConstraints,
    onViewChange: handleCoplanViewChange,
    onObjectiveOpenChange: setObjectiveOpen,
  }

  /* Background components paint across the entire modal (behind header, content
     and progress bar); everything else floats on top. */
  const backgroundComponents = components.filter((c) => c.type === 'WS_BACKGROUND')
  const contentComponents = components.filter((c) => c.type !== 'WS_BACKGROUND')

  const renderScreen = () => (
    <WorkspaceSDUIRenderer components={contentComponents} context={sduiContext} handlers={sduiHandlers} />
  )

  return (
    <AnimatePresence>
      {isOpen && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Objective Workspace"
        >
          {/* Background overlay with blur */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(6px)' }}
            onClick={onClose}
          />

          {/* Workspace label — centered just above the modal */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: 0.1 }}
            className="absolute z-20"
            style={{
              top: 'calc(10% - 18px)',
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                color: 'rgba(255,255,255,0.85)',
                letterSpacing: '0.02em',
              }}
            >
              {`${_userName.split(' ')[0]}'s LBG Coin Workspace`}
            </Typography>
          </motion.div>

          {/* Modal container */}
          <MotionBox
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            sx={{
              position: 'relative',
              zIndex: 10,
              margin: 'auto',
              width: '90%',
              height: '80%',
              maxWidth: 400,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '20px',
              bgcolor: '#ffffff',
              boxShadow: '0 25px 60px -12px rgba(0,0,0,0.4)',
              overflow: 'hidden',
            }}
          >
            {/* Full-modal background layer (pointer-events disabled so controls pass through) */}
            {backgroundComponents.length > 0 && (
              <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                {backgroundComponents.map((component) =>
                  renderWorkspaceComponent(component, sduiContext, sduiHandlers),
                )}
              </div>
            )}

            {/* Header — back button (left), centered title, and close button (right) */}
            <Box
              sx={{
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                // borderBottom: '1px solid rgba(241,245,249,0.7)',
                flexShrink: 0,
              }}
            >
              {screen !== '1a' && (
                <MotionButton
                  whileTap={{ scale: 0.9 }}
                  onClick={handleBack}
                  disableRipple
                  disabled={history.length === 0}
                  aria-label="Go back"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    borderRadius: '8px',
                    padding: '6px',
                    fontFamily: 'inherit',
                    color: '#0f172a',
                    flexShrink: 0,
                    '&:hover': { bgcolor: '#f1f5f9', color: '#0f172a' },
                    '&:disabled': { color: '#94a3b8' },
                  }}
                >
                  <ArrowLeft size={16} />
                </MotionButton>
              )}
              {['2a', '2b', '2c', '2d', '2e', '3a', '3b', '3c', '4a', '4b', '4c'].includes(screen) ? (
                <Box
                  sx={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: palette.brand,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      whiteSpace: 'nowrap',
                      maxWidth: '70%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                  
                  </Typography>
                </Box>
              ) : null}
              <MotionButton
                ref={closeRef}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                disableRipple
                  aria-label="Close workspace"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    borderRadius: '8px',
                    padding: '6px',
                    marginLeft: 'auto',
                    fontFamily: 'inherit',
                    color: '#0f172a',
                    flexShrink: 0,
                    '&:hover': { bgcolor: '#f1f5f9', color: '#0f172a' },
                  }}
              >
                <X size={16} />
              </MotionButton>
            </Box>

            {/* Screen content */}
            <AnimatePresence mode="wait">
              <MotionBox
                key={stageLoading || stageError ? 'state' : screen}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                sx={{
                  position: 'relative',
                  zIndex: 1,
                  flex: 1,
                  minHeight: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                <WorkspaceErrorBoundary>
                  <StageGate
                    loading={stageLoading}
                    loadingLabel="Generating your next step with AI…"
                    error={stageError}
                    onRetry={retryStage}
                    render={renderScreen}
                  />
                </WorkspaceErrorBoundary>
              </MotionBox>
            </AnimatePresence>

            {/* Progress bar — fixed at bottom */}
            <ProgressBar segments={getProgress()} />
          </MotionBox>
        </Box>
      )}
    </AnimatePresence>
  )
}
