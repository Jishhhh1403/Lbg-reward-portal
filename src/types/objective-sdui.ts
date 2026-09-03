export type ObjectiveStage =
  | 'summary'
  | 'constraints'
  | 'opportunities'
  | 'strategies'
  | 'evidence'
  | 'execution'

import type { SDUIComponent } from './sdui'

export interface ObjectiveBrandBalance {
  brandName: string
  points: number
}

export interface ObjectiveWalletPayload {
  totalPoints: number
  tier: string
  lbgCoins: number
  brandsConnected: number
  pointsByBrand: ObjectiveBrandBalance[]
}

export interface ObjectiveGenerateRequest {
  customerReference: string
  objectiveText: string
  stage: ObjectiveStage
  selectedPlan?: string | null
  toolRequest?: string | null
  constraintValues?: string[]
  wallet: ObjectiveWalletPayload
}

export interface ObjectiveSummaryPayload {
  summary?: string
}

export interface ObjectiveConstraintPayload {
  id: string
  text: string
  applied: boolean
}

export interface RewardOpportunityPayload {
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

export interface StrategyCardPayload {
  id: string
  type: string
  title: string
  description: string
  order: number
}

export interface CognitiveEvidencePayload {
  summary: string
  factors: string[]
}

export interface ExecutionStepPayload {
  id: string
  label: string
  partner: string
  partnerUrl: string
  status: 'pending' | 'running' | 'completed' | 'failed'
}

/** Structured content returned by the CEAEI middleware for each wizard stage. */
export interface ObjectiveScreenPayload {
  screenType?: string
  summary?: string
  constraints?: ObjectiveConstraintPayload[]
  opportunities?: RewardOpportunityPayload[]
  shortlisted?: RewardOpportunityPayload[]
  rejected?: RewardOpportunityPayload[]
  strategies?: StrategyCardPayload[]
  evidence?: CognitiveEvidencePayload
  executionSteps?: ExecutionStepPayload[]
}

export interface ObjectiveGenerateResponsePayload {
  status: 'PERSONALIZED' | 'REJECTED'
  correlationId?: string
  /** Structured stage content returned by the middleware. */
  screen?: ObjectiveScreenPayload
  /** Legacy: client-composed SDUI component list (used by local screens). */
  components?: SDUIComponent[]
  intelligence?: Record<string, unknown>
  confidence?: number
  reasonCodes?: string[]
  error?: string
}