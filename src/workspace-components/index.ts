import type { ComponentType } from 'react'
import CognitiveEvidence from './CognitiveEvidence'
import ConstraintList from './ConstraintList'
import CoplanTools from './CoplanTools'
import ExecutionFailure from './ExecutionFailure'
import ExecutionStepsCard from './ExecutionStepsCard'
import ExecutionSuccess from './ExecutionSuccess'
import ExtractedConstraints from './ExtractedConstraints'
import ModifyObjective from './ModifyObjective'
import ObjectiveHero from './ObjectiveHero'
import PlanHero from './PlanHero'
import QuickObjective from './QuickObjective'
import RecoveryOptions from './RecoveryOptions'
import RedirectPrompt from './RedirectPrompt'
import RewardOpportunity from './RewardOpportunity'
import StateObjective from './StateObjective'
import StrategyCard from './StrategyCard'
import SummaryCaptured from './SummaryCaptured'
import UnderstoodAnchor from './UnderstoodAnchor'
import WorkshopNav from './WorkshopNav'
import WorkshopTextbox from './WorkshopTextbox'
import WorkspaceAnchor from './WorkspaceAnchor'
import WorkspaceBackground from './WorkspaceBackground'
import WorkspaceHero from './WorkspaceHero'

/**
 * Workspace component registry.
 *
 * Each `WS_*` key maps one atomic, clean UI component to a screen of the
 * objective workspace wizard. The SDUI backend (or the client) emits these
 * component ids and their props; WorkspaceSDUIRenderer resolves them through
 * this registry and wires live state + action handlers.
 */
export const WORKSPACE_REGISTRY: Record<string, ComponentType<Record<string, unknown>>> = {
  // Screen 1a — Capture
  WS_ANCHOR: WorkspaceAnchor as unknown as ComponentType<Record<string, unknown>>,
  WS_TEXTBOX: WorkshopTextbox as unknown as ComponentType<Record<string, unknown>>,
  WS_BACKGROUND: WorkspaceBackground as unknown as ComponentType<Record<string, unknown>>,
  WS_WORKSPACE_HERO: WorkspaceHero as unknown as ComponentType<Record<string, unknown>>,
  WS_OBJECTIVE_HERO: ObjectiveHero as unknown as ComponentType<Record<string, unknown>>,
  WS_QUICK_PICK: QuickObjective as unknown as ComponentType<Record<string, unknown>>,
  WS_STATE_OBJECTIVE: StateObjective as unknown as ComponentType<Record<string, unknown>>,
  WS_NAV: WorkshopNav as unknown as ComponentType<Record<string, unknown>>,

  // Screen 1b — Summary
  WS_UNDERSTOOD: UnderstoodAnchor as unknown as ComponentType<Record<string, unknown>>,
  WS_SUMMARY: SummaryCaptured as unknown as ComponentType<Record<string, unknown>>,
  WS_EXTRACTED_CONSTRAINTS: ExtractedConstraints as unknown as ComponentType<Record<string, unknown>>,
  WS_MODIFY: ModifyObjective as unknown as ComponentType<Record<string, unknown>>,

  // Screen 1c — Constraints
  WS_CONSTRAINTS: ConstraintList as unknown as ComponentType<Record<string, unknown>>,

  // Screen 2a — Opportunities
  WS_OPPORTUNITY: RewardOpportunity as unknown as ComponentType<Record<string, unknown>>,

  // Screen 2b — Strategies
  WS_STRATEGY: StrategyCard as unknown as ComponentType<Record<string, unknown>>,
  WS_COPLAN: CoplanTools as unknown as ComponentType<Record<string, unknown>>,

  // Screen 2c — Cognitive evidence
  WS_EVIDENCE: CognitiveEvidence as unknown as ComponentType<Record<string, unknown>>,

  // Screen 3a / 4a — Execution
  WS_EXECUTION_STEPS: ExecutionStepsCard as unknown as ComponentType<Record<string, unknown>>,
  WS_PLAN_HERO: PlanHero as unknown as ComponentType<Record<string, unknown>>,

  // Screens 3b / 4b — Redirect confirmation (no monitoring/date)
  WS_REDIRECT_PROMPT: RedirectPrompt as unknown as ComponentType<Record<string, unknown>>,

  // Screen 3c — Success
  WS_SUCCESS: ExecutionSuccess as unknown as ComponentType<Record<string, unknown>>,

  // Screen 4c — Failure + recovery
  WS_FAILURE: ExecutionFailure as unknown as ComponentType<Record<string, unknown>>,
  WS_RECOVERY: RecoveryOptions as unknown as ComponentType<Record<string, unknown>>,
}

export type { WorkspaceHandlers, WorkspaceRenderContext } from './types'
export { palette } from './types'
