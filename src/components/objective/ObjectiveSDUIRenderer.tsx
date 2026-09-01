import type { ComponentType } from 'react'
import { motion } from 'framer-motion'
import type { SDUIComponent } from '../../types/sdui'
import type { PlanType } from '../../types/objective'
import {
  ObjectiveAiTools,
  ObjectiveConstraints,
  ObjectiveEvidence,
  ObjectiveExecutionHeader,
  ObjectiveExecutionSteps,
  ObjectiveHeadline,
  ObjectiveInput,
  ObjectiveNav,
  ObjectiveOpportunities,
  ObjectiveRedirect,
  ObjectiveResult,
  ObjectiveStrategies,
  ObjectiveSummaryCard,
} from './registry'
import type { ObjectiveHandlers, ObjectiveRenderContext } from './registry/types'

/**
 * Registry of every component type emitted by /objective/generate, mapped onto
 * the real atomic UI components in ./registry. Mirrors the Rewards Dashboard
 * SDUIRenderer pattern so the AI composes each wizard stage declaratively.
 */
const REGISTRY: Record<string, ComponentType<Record<string, unknown>>> = {
  OBJECTIVE_HEADLINE: ObjectiveHeadline as unknown as ComponentType<Record<string, unknown>>,
  OBJECTIVE_INPUT: ObjectiveInput as unknown as ComponentType<Record<string, unknown>>,
  OBJECTIVE_SUMMARY_CARD: ObjectiveSummaryCard as unknown as ComponentType<Record<string, unknown>>,
  OBJECTIVE_CONSTRAINTS: ObjectiveConstraints as unknown as ComponentType<Record<string, unknown>>,
  OBJECTIVE_OPPORTUNITIES: ObjectiveOpportunities as unknown as ComponentType<Record<string, unknown>>,
  OBJECTIVE_STRATEGIES: ObjectiveStrategies as unknown as ComponentType<Record<string, unknown>>,
  OBJECTIVE_AI_TOOLS: ObjectiveAiTools as unknown as ComponentType<Record<string, unknown>>,
  OBJECTIVE_EVIDENCE: ObjectiveEvidence as unknown as ComponentType<Record<string, unknown>>,
  OBJECTIVE_EXECUTION_HEADER: ObjectiveExecutionHeader as unknown as ComponentType<Record<string, unknown>>,
  OBJECTIVE_EXECUTION_STEPS: ObjectiveExecutionSteps as unknown as ComponentType<Record<string, unknown>>,
  OBJECTIVE_REDIRECT: ObjectiveRedirect as unknown as ComponentType<Record<string, unknown>>,
  OBJECTIVE_RESULT: ObjectiveResult as unknown as ComponentType<Record<string, unknown>>,
  OBJECTIVE_NAV: ObjectiveNav as unknown as ComponentType<Record<string, unknown>>,
}

/** Actions the registry renderer understands and wires to workspace handlers. */
export interface ObjectiveSduiRendererProps {
  components: SDUIComponent[]
  context: ObjectiveRenderContext
  handlers: ObjectiveHandlers
}

function resolveActions(
  component: SDUIComponent,
  handlers: ObjectiveHandlers,
): Record<string, unknown> {
  const actions: Record<string, unknown> = {}
  for (const action of component.actions ?? []) {
    switch (action.type) {
      case 'OBJECTIVE_NEXT':
        actions.onNext = handlers.onNext
        break
      case 'OBJECTIVE_MODIFY':
        actions.onModify = handlers.onModify
        break
      case 'OBJECTIVE_SELECT_PLAN':
        actions.onSelect = (type: string) => handlers.onSelectPlan(type as PlanType)
        break
      case 'OBJECTIVE_SELECT_STEP':
        actions.onSelect = (id: string) => handlers.onSelectStep(id)
        break
      case 'OBJECTIVE_CONFIRM_REDIRECT':
        actions.onConfirm = handlers.onConfirmRedirect
        break
      case 'OBJECTIVE_RETURN_HOME':
        actions.onReturnHome = handlers.onReturnHome
        break
      default:
        break
    }
  }
  return actions
}

function renderComponent(
  component: SDUIComponent,
  context: ObjectiveRenderContext,
  handlers: ObjectiveHandlers,
): React.ReactNode {
  const actions = resolveActions(component, handlers)
  const Card = REGISTRY[component.type]
  if (!Card) {
    console.warn(`[ObjectiveSDUIRenderer] Unknown component type "${component.type}" skipped`)
    return null
  }

  try {
    const base = component.props ?? {}
    const merged: Record<string, unknown> = { ...base, ...actions }

    switch (component.type) {
      case 'OBJECTIVE_INPUT':
        merged.value = context.objectiveText
        merged.onChange = handlers.onTextChange
        break
      case 'OBJECTIVE_STRATEGIES':
        merged.selectedPlan = context.selectedPlan
        merged.onSelect = (type: string) => handlers.onSelectPlan(type as PlanType)
        break
      case 'OBJECTIVE_EXECUTION_STEPS': {
        const backendItems = (base.items ?? []) as Array<{
          id: string
          label: string
          partner: string
          status: string
        }>
        const liveById = new Map(context.steps.map((s) => [s.id, s.status]))
        merged.items = backendItems.map((it) => ({
          ...it,
          status: liveById.get(it.id) ?? it.status,
        }))
        merged.onSelect = (id: string) => handlers.onSelectStep(id)
        break
      }
      case 'OBJECTIVE_NAV':
        merged.disabled = context.nextDisabled
        break
      default:
        break
    }

    return <Card key={component.id} {...merged} />
  } catch (err) {
    console.warn(`[ObjectiveSDUIRenderer] Component ${component.type} (${component.id}) crashed, skipped:`, err)
    return null
  }
}

/**
 * Renders a single stage of the objective wizard as an SDUI component stream.
 * Mirrors the Rewards Dashboard SDUIRenderer: each stage returns a homogenous
 * list of components that map through the registry with entrance animation.
 */
export default function ObjectiveSDUIRenderer({
  components,
  context,
  handlers,
}: ObjectiveSduiRendererProps) {
  return (
    <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-1 pb-2">
      {components.map((component, i) => (
        <motion.div
          key={component.id ?? i}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {renderComponent(component, context, handlers)}
        </motion.div>
      ))}
    </div>
  )
}
