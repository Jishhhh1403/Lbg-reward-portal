export type ObjectiveScreen =
  | '1a' | '1b' | '1c'
  | '2a' | '2b' | '2c' | '2d' | '2e'
  | '3a' | '3b' | '3c'
  | '4a' | '4b' | '4c'

export type ObjectiveStage = 'capture' | 'strategy' | 'execution'

export type PlanType =
  | 'simplicity'
  | 'max-redeem'
  | 'hybrid'
  | 'monitor'
  | 'no-redeem'
  | null

/**
 * Continuation payload handed back to the workspace after a partner portal
 * returns. Encodes where the user was so the wizard can re-open at the exact
 * step they left (no monitoring/date — a redirect prompt instead).
 */
export interface WorkspaceResume {
  objective: string
  plan: PlanType
  /** Step ids already completed before the current hand-off. */
  completed: string[]
  /** The step id that was handed off to the partner portal. */
  current: string
}

export interface ObjectiveConstraint {
  id: string
  text: string
  applied: boolean
}

export interface RewardOpportunity {
  id: string
  title: string
  description: string
  partner: string
  estimatedValue: string
  constraints?: string[]
  cashback?: string | null
  conversionRate?: string | null
  transactionFee?: string | null
  offerType?: string | null
}

export interface StrategyCard {
  id: string
  type: PlanType
  title: string
  description: string
  order: number
}

export interface CognitiveEvidence {
  summary: string
  factors: string[]
}

export interface ExecutionStep {
  id: string
  label: string
  partner: string
  partnerUrl: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  error?: string
}

export interface ObjectiveState {
  screen: ObjectiveScreen
  stage: ObjectiveStage
  progressSegments: [boolean, boolean, boolean]
  objectiveText: string
  objectiveSummary: string
  constraints: ObjectiveConstraint[]
  opportunities: RewardOpportunity[]
  shortlisted: RewardOpportunity[]
  rejected: RewardOpportunity[]
  strategies: StrategyCard[]
  selectedPlan: PlanType
  cognitiveEvidence: CognitiveEvidence | null
  executionSteps: ExecutionStep[]
  stepResults: Record<string, 'success' | 'failure'>
}
