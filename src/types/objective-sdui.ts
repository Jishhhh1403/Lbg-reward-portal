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

export interface ObjectiveGenerateResponsePayload {
  status: 'PERSONALIZED' | 'REJECTED'
  correlationId?: string
  /** Generic SDUI component list for the generated stage, rendered via the registry. */
  components: SDUIComponent[]
  intelligence?: Record<string, unknown>
  confidence?: number
  reasonCodes?: string[]
  error?: string
}