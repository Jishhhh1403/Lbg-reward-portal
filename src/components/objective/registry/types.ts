import type { PlanType } from '../../../types/objective'
import type { ExecutionStep } from '../../../types/objective'

/** Live wizard state the renderer injects into objective components. */
export interface ObjectiveRenderContext {
  objectiveText: string
  selectedPlan: PlanType
  steps: ExecutionStep[]
  /** When true the primary (Next) action is disabled, e.g. waiting for input/selection. */
  nextDisabled: boolean
}

/** Action handlers wired from the workspace to registered objective components. */
export interface ObjectiveHandlers {
  onTextChange: (value: string) => void
  onNext: () => void
  onModify: () => void
  onSelectPlan: (type: PlanType) => void
  onSelectStep: (id: string) => void
  onConfirmRedirect: (id: string) => void
  onReturnHome: () => void
}
