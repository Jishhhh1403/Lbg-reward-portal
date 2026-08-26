import type { TierName } from './rewards'

export interface SDUIAction {
  type: string
  payload?: Record<string, unknown>
}

export interface SDUIComponent {
  id: string
  type: string
  version?: string
  priority?: number
  props: Record<string, unknown>
  actions?: SDUIAction[]
}

export interface NarrativeAct {
  id: string
  label: string
  role: string
  componentIds: string[]
}

export interface SDUINarrative {
  archetype?: string
  headline?: string
  tone?: string
  acts?: NarrativeAct[]
}

export interface SDUIScreen {
  schemaVersion?: string
  decisionId?: string
  experienceId?: string
  customerId?: string
  persona?: string
  components: SDUIComponent[]
  narrative?: SDUINarrative
}

export interface SduiValidationSummary {
  schemaValidation?: string
  uiConstitution?: string
  componentRegistry?: string
  contentRegistry?: string
  accessibility?: string
  consent?: string
  conduct?: string
}

export interface SduiGenerateResponse {
  status: 'PERSONALIZED' | 'FALLBACK' | 'REJECTED'
  correlationId: string
  decisionId: string
  sdui: SDUIScreen
  fallbackApplied: boolean
  reasonCodes: string[]
  confidence: number
  expiresAt?: string
  explainabilityRecordRef?: string
  validationSummary: SduiValidationSummary
  intelligence?: {
    available: boolean
    persona?: string
    confidence?: number
    error?: string
  }
  error?: string
}

export interface PersonaOption {
  id: string
  name: string
  tier: TierName | string
  points: number
}
