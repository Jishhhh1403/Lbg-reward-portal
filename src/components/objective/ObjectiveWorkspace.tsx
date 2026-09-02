import { useCallback, useEffect, useRef, useState, Component } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import ButtonBase from '@mui/material/ButtonBase'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { Loader2, X } from 'lucide-react'
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
    }),
    makeComponent(
      'capture-nav',
      'WS_NAV',
      { primary: 'Next' },
      [{ type: 'WS_NEXT', payload: {} }],
    ),
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

/* ------------------------------------------------------------------ */
/* Plan A / Plan B execution flows                                     */
/* ------------------------------------------------------------------ */

export const PORTAL_URLS = {
  alphaConvert: 'http://localhost:5174/lbg-rewards/convert',
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
export function buildExecutionSteps(plan: PlanType): ExecutionStep[] {
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
        id: 'lbg-return',
        label: 'Transfer points to LBG coins and return to your workspace',
        partner: 'LBG Coins',
        partnerUrl: '',
        status: 'pending',
      },
      {
        id: 'cavendish-pay',
        label: 'Pay for your Cavendish Online insurance',
        partner: 'Cavendish Online',
        partnerUrl: PORTAL_URLS.cavendishCheckout,
        status: 'pending',
      },
    ]
  }
  if (plan === 'hybrid') {
    return [
      {
        id: 'alpha-convert',
        label: 'Auto-convert your Alpha Medical points to LBG coins',
        partner: 'Alpha Medical',
        partnerUrl: '',
        status: 'pending',
      },
      {
        id: 'cavendish-pay',
        label: 'Pay for your Cavendish Online insurance',
        partner: 'Cavendish Online',
        partnerUrl: PORTAL_URLS.cavendishCheckout,
        status: 'pending',
      },
    ]
  }
  return [
    {
      id: 'lbg-balance',
      label: 'Use your existing LBG coin balance to pay',
      partner: 'LBG Coins',
      partnerUrl: '',
      status: 'pending',
    },
    {
      id: 'cavendish-pay',
      label: 'Pay for your Cavendish Online insurance',
      partner: 'Cavendish Online',
      partnerUrl: PORTAL_URLS.cavendishCheckout,
      status: 'pending',
    },
  ]
}

/** Execution screen (3a / 4a) — deterministic, driven by the chosen plan. */
function executionComponents(plan: PlanType): SDUIComponent[] {
  const steps = buildExecutionSteps(plan)
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
        label: s.label,
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
  return {
    steps: steps.map((s) => (s.id === next.id ? running : s)),
    screen: isValueTrack(resume.plan) ? '4b' : '3b',
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

  const wallet: ObjectiveWalletPayload = {
    totalPoints,
    tier,
    lbgCoins,
    brandsConnected: pointsByBrand.length,
    pointsByBrand: pointsByBrand.map((b) => ({ brandName: b.brandName, points: b.points })),
  }

  /* Screen navigation */
  const navigateTo = useCallback((s: ObjectiveScreen) => {
    setScreen(s)
  }, [])

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
          wallet,
        })
        if (res.status !== 'PERSONALIZED') {
          setStageError(res.error || 'The AI could not generate this content. Please try again.')
          return
        }
        const screen = res.screen ?? {}
        setStageComponents(
          buildStageComponents(stage, screen, activeObjective, selectedPlan),
        )
        navigator(nextScreen)
      } catch (e) {
        console.warn('[ObjectiveWorkspace] Stage generation failed:', e)
        setStageError('Something went wrong while generating this step. Please try again.')
      } finally {
        setStageLoading(false)
        setStageInFlight(null)
      }
    },
    [customerId, objectiveText, selectedPlan, wallet, stageInFlight],
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
        setStageComponents(
          buildMergedSummaryStageComponents(summaryScreen.summary ?? '', constraintItems),
        )
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
        navigateTo(isValueTrack(selectedPlan) ? '4b' : '3b')
        break
      }
      default:
        break
    }
  }, [screen, generateStage, generateSummaryAndConstraints, navigateTo, selectedPlan])

  const handleModify = useCallback(() => {
    setStageError(null)
    setStageLoading(false)
    setCoplanView('idle')
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

  /** Coplan "edit" tool: adopt a new objective and rebuild both plans around it. */
  const handleEditObjective = useCallback(
    (newObjective: string) => {
      const trimmed = newObjective.trim()
      if (!trimmed) return
      setObjectiveText(trimmed)
      setCoplanView('idle')
      void generateStage(
        'strategies',
        navigateTo,
        '2b',
        `Coplan tool "edit": rebuild both plans for the updated objective: "${trimmed}"`,
        trimmed,
      )
    },
    [generateStage, navigateTo],
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

      const running: ExecutionStep = { ...step, status: 'running' }
      setRedirectConfirm(running)
      setSteps((prev) =>
        prev.map((s) => (s.id === id ? running : s)),
      )
      navigateTo(isValueTrack(selectedPlan) ? '4b' : '3b')
    },
    [steps, navigateTo, selectedPlan],
  )

  const handleReturnHome = useCallback(() => {
    onClose()
  }, [onClose])

  const totalSuccess = steps.length > 0 && steps.every((s) => s.status === 'completed')

  /* Compose the SDUI component list for the active screen. */
  const components: SDUIComponent[] = (() => {
    switch (screen) {
      case '1a':
        return captureComponents(objectiveText)
      case '1b':
      case '1c':
      case '2a':
      case '2c':
        return stageComponents
      case '2b':
        /* A Coplan tool view replaces the plan cards with the tool content,
           keeping only the nav so the screen always stays fits without scroll. */
        if (coplanView !== 'idle') {
          const coplan = stageComponents.find((c) => c.type === 'WS_COPLAN')
          const nav = stageComponents.find((c) => c.id === 'str-nav')
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
        return stageComponents
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
    onEditObjective: handleEditObjective,
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

          {/* Workspace label — just above the modal, top-right */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: 0.1 }}
            className="absolute right-23 z-20"
            style={{ top: 'calc(10% - 28px)' }}
          >
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 600,
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

            {/* Close button — top-left */}
            <Box
              sx={{
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                borderBottom: '1px solid rgba(241,245,249,0.7)',
                flexShrink: 0,
              }}
            >
              <MotionButton
                ref={closeRef}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                disableRipple
                aria-label="Close workspace"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  borderRadius: '8px',
                  padding: '6px',
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: 'inherit',
                  color: '#64748b',
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
