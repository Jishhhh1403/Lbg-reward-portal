import { useCallback, useEffect, useRef, useState } from 'react'
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
} from '../../types/objective'
import type {
  ObjectiveStage,
  ObjectiveWalletPayload,
} from '../../types/objective-sdui'
import { generateObjectiveStage } from '../../services/objectiveApi'
import { shadows } from '../../theme'
import ObjectiveSDUIRenderer from './ObjectiveSDUIRenderer'
import type {
  ObjectiveHandlers,
  ObjectiveRenderContext,
} from './registry/types'

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

/** Capture screen (1a) — pure client composition, no AI call yet. */
function captureComponents(objectiveText: string): SDUIComponent[] {
  return [
    makeComponent('capture-headline', 'OBJECTIVE_HEADLINE', {
      title: 'Hi, what are you looking for today?',
    }),
    makeComponent('capture-input', 'OBJECTIVE_INPUT', {
      label: 'Enter Objective',
      placeholder: 'e.g. I want to redeem my points for the best value',
      value: objectiveText,
    }),
    makeComponent(
      'capture-nav',
      'OBJECTIVE_NAV',
      { primary: 'Next' },
      [{ type: 'OBJECTIVE_NEXT', payload: {} }],
    ),
  ]
}

/** Redirect confirmation screen (3b / 4b / 4c). */
function redirectComponents(
  redirectConfirm: ExecutionStep | null,
  planLabel: string,
): SDUIComponent[] {
  return [
    makeComponent(
      'redirect',
      'OBJECTIVE_REDIRECT',
      {
        planLabel,
        stepLabel: redirectConfirm?.label ?? '',
        partner: redirectConfirm?.partner ?? '',
        confirmLabel: `Go to ${redirectConfirm?.partner ?? ''}`,
      },
      [{ type: 'OBJECTIVE_CONFIRM_REDIRECT', payload: {} }],
    ),
  ]
}

/** Execution result screen (3c). */
function resultComponents(result: {
  success: boolean
  title: string
  message: string
}): SDUIComponent[] {
  return [
    makeComponent(
      'result',
      'OBJECTIVE_RESULT',
      {
        success: result.success,
        title: result.title,
        message: result.message,
        returnLabel: 'Return to Rewards Home',
      },
      [{ type: 'OBJECTIVE_RETURN_HOME', payload: {} }],
    ),
  ]
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
  onPartnerHandoff: (partner: string, url: string) => void
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
        display: 'flex',
        gap: '8px',
        padding: '16px 20px',
        paddingBottom: '24px',
        bgcolor: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(8px)',
        borderTop: '1px solid #e2e8f0',
      }}
    >
      {segments.map((active, i) => (
        <Box
          key={i}
          sx={{
            flex: 1,
            height: 5,
            borderRadius: '999px',
            bgcolor: active ? '#006a4d' : '#e2e8f0',
            transition: 'background-color 0.3s ease',
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
}: ObjectiveWorkspaceProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  /* Screen state */
  const [screen, setScreen] = useState<ObjectiveScreen>('1a')
  const [objectiveText, setObjectiveText] = useState('')
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(null)
  const [steps, setSteps] = useState<ExecutionStep[]>([])
  const [redirectConfirm, setRedirectConfirm] = useState<ExecutionStep | null>(null)

  /* AI-generated SDUI for the active generated stage */
  const [stageComponents, setStageComponents] = useState<SDUIComponent[]>([])
  const [stageLoading, setStageLoading] = useState(false)
  const [stageError, setStageError] = useState<string | null>(null)
  const [stageInFlight, setStageInFlight] = useState<ObjectiveStage | null>(null)
  const [provisionalNav, setProvisionalNav] = useState<{ stage: ObjectiveStage; nextScreen: ObjectiveScreen } | null>(null)

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
    ) => {
      if (stage === 'execution' && stageInFlight !== null) return
      setProvisionalNav({ stage, nextScreen })
      setStageLoading(true)
      setStageError(null)
      setStageInFlight(stage)
      try {
        const res = await generateObjectiveStage({
          customerReference: customerId,
          objectiveText,
          stage,
          selectedPlan,
          wallet,
        })
        if (res.status !== 'PERSONALIZED') {
          setStageError(res.error || 'The AI could not generate this content. Please try again.')
          return
        }
        setStageComponents(res.components ?? [])
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

  /* Re-run the stage that failed, using the recorded navigation target. */
  const retryStage = useCallback(() => {
    if (!provisionalNav) return
    generateStage(provisionalNav.stage, navigateTo, provisionalNav.nextScreen)
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
    setScreen('1a')
    setObjectiveText('')
    setSelectedPlan(null)
    setSteps([])
    setRedirectConfirm(null)
    setStageComponents([])
    setStageLoading(false)
    setStageError(null)
    setStageInFlight(null)
    setProvisionalNav(null)
  }, [isOpen])

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
    setSteps((prev) =>
      prev.map((s) =>
        s.id === redirectConfirm.id ? { ...s, status: 'completed' as const } : s,
      ),
    )

    const allCompleted = steps.every(
      (s) => s.id === redirectConfirm.id || s.status === 'completed',
    )
    if (allCompleted) {
      setScreen('3c')
    } else {
      const nextStep = steps.find((s) => s.status === 'pending' && s.id !== redirectConfirm.id)
      if (nextStep) {
        setSteps((prev) =>
          prev.map((s) =>
            s.id === nextStep.id ? { ...s, status: 'running' as const } : s,
          ),
        )
        setRedirectConfirm(nextStep)
      }
    }
    onPartnerHandoff(redirectConfirm.partner, redirectConfirm.partnerUrl)
  }, [redirectConfirm, steps, onPartnerHandoff])

  /* Primary (Next) action advances the wizard depending on the active screen. */
  const handleNext = useCallback(() => {
    switch (screen) {
      case '1a':
        generateStage('summary', navigateTo, '1b')
        break
      case '1b':
        generateStage('constraints', navigateTo, '1c')
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
      case '2c':
        generateStage('execution', navigateTo, selectedPlan === 'simplicity' ? '3a' : '4a')
        break
      default:
        break
    }
  }, [screen, generateStage, navigateTo, selectedPlan])

  const handleModify = useCallback(() => {
    setStageError(null)
    setStageLoading(false)
    navigateTo('1a')
  }, [navigateTo])

  const handleSelectStep = useCallback(
    (id: string) => {
      const step = steps.find((s) => s.id === id)
      if (step) setRedirectConfirm(step)
    },
    [steps],
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
      case '2b':
      case '2c':
      case '3a':
      case '4a':
        return stageComponents
      case '3b':
      case '4b':
      case '4c':
        return redirectComponents(
          redirectConfirm,
          selectedPlan === 'max-redeem' ? 'Maximum Redeem Value Plan' : 'Simplicity Plan',
        )
      case '3c':
        return resultComponents({
          success: totalSuccess,
          title: totalSuccess ? 'Execution Successful' : 'Execution Step Failed',
          message: totalSuccess
            ? 'Your redemption has been processed successfully. Your rewards have been updated.'
            : 'Something went wrong during the execution. Your points have not been changed.',
        })
      default:
        return []
    }
  })()

  /* Live render context + handlers passed to the SDUI renderer. */
  const sduiContext: ObjectiveRenderContext = {
    objectiveText,
    selectedPlan,
    steps,
    nextDisabled:
      screen === '1a' ? !objectiveText.trim() : screen === '2b' ? !selectedPlan : false,
  }

  const sduiHandlers: ObjectiveHandlers = {
    onTextChange: setObjectiveText,
    onNext: handleNext,
    onModify: handleModify,
    onSelectPlan: setSelectedPlan,
    onSelectStep: handleSelectStep,
    onConfirmRedirect: handleConfirmRedirect,
    onReturnHome: handleReturnHome,
  }

  const renderScreen = () => (
    <ObjectiveSDUIRenderer components={components} context={sduiContext} handlers={sduiHandlers} />
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

          {/* Workspace label — top-right, outside modal */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: 0.1 }}
            className="absolute right-5 top-4 z-20"
          >
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.85)',
                letterSpacing: '0.02em',
              }}
            >
              Your Workspace
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
            {/* Close button — top-left */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                borderBottom: '1px solid #f1f5f9',
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
                sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
              >
                <StageGate
                  loading={stageLoading}
                  loadingLabel="Generating your next step with AI…"
                  error={stageError}
                  onRetry={retryStage}
                  render={renderScreen}
                />
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
