import { motion } from 'framer-motion'
import type { SDUIComponent } from '../types/sdui'
import type { PlanType } from '../types/objective'
import { WORKSPACE_REGISTRY } from './index'
import type { WorkspaceHandlers, WorkspaceRenderContext } from './types'

/**
 * Renders a stage of the objective workspace as an SDUI component stream.
 * Mirrors ObjectiveSDUIRenderer but resolves through the workspace registry,
 * injecting live wizard state and wiring action handlers per component type.
 */

function resolveActions(
  component: SDUIComponent,
  handlers: WorkspaceHandlers,
): Record<string, unknown> {
  const actions: Record<string, unknown> = {}
  for (const action of component.actions ?? []) {
    switch (action.type) {
      case 'WS_NEXT':
        actions.onNext = handlers.onNext
        break
      case 'WS_CONFIRM':
        actions.onConfirm = handlers.onConfirmRedirect
        break
      case 'WS_MODIFY':
        actions.onModify = handlers.onModify
        break
      case 'WS_SELECT_PLAN':
        actions.onSelect = (type: string) => handlers.onSelectPlan(type as PlanType)
        break
      case 'WS_SELECT_STEP':
        actions.onSelect = (id: string) => handlers.onSelectStep(id)
        break
      case 'WS_COPLAN_REQUEST':
        actions.onRequest = (toolId: string, prompt: string) =>
          handlers.onCoplanRequest(toolId, prompt)
        break
      case 'WS_RECOVER':
        actions.onSelect = (id: string) => handlers.onSelectStep(id)
        break
      case 'WS_RETURN_HOME':
        actions.onReturnHome = handlers.onReturnHome
        break
      case 'WS_EDIT_OBJECTIVE':
        actions.onEditObjective = (objective: string) => handlers.onEditObjective(objective)
        break
      case 'WS_COPLAN_VIEW':
        actions.onViewChange = (view: string) => handlers.onViewChange(view)
        break
      default:
        break
    }
  }
  return actions
}

export function renderWorkspaceComponent(
  component: SDUIComponent,
  context: WorkspaceRenderContext,
  handlers: WorkspaceHandlers,
): React.ReactNode {
  try {
    const actions = resolveActions(component, handlers)
    const Card = WORKSPACE_REGISTRY[component.type]
    if (!Card) {
      console.warn(`[WorkspaceSDUIRenderer] Unknown component type "${component.type}" skipped`)
      return null
    }

    const base = component.props ?? {}
    const merged: Record<string, unknown> = { ...base, ...actions }

    switch (component.type) {
      case 'WS_TEXTBOX':
        merged.value = context.objectiveText
        merged.onChange = handlers.onTextChange
        break
      case 'WS_STATE_OBJECTIVE':
        merged.value = context.objectiveText
        merged.onChange = handlers.onTextChange
        merged.onOpenChange = handlers.onObjectiveOpenChange
        break
      case 'WS_QUICK_PICK':
        merged.hidden = context.objectiveOpen
        merged.selected = context.objectiveText === (merged.text as string)
        merged.onSelect = (value: string) => handlers.onTextChange(value)
        break
      case 'WS_OBJECTIVE_HERO':
        merged.objective = context.objectiveText
        break
      case 'WS_COPLAN':
        merged.strategies = base.strategies ?? []
        merged.selectedPlan = context.selectedPlan
        merged.view = base.view ?? 'idle'
        merged.objectiveText = context.objectiveText
        merged.onSelectPlan = (type: string) => handlers.onSelectPlan(type as PlanType)
        merged.onEditObjective = (objective: string) => handlers.onEditObjective(objective)
        merged.onViewChange = (view: string) => handlers.onViewChange(view)
        break
      case 'WS_STRATEGY':
        merged.selectedPlan = context.selectedPlan
        merged.onSelect = (type: string) => handlers.onSelectPlan(type as PlanType)
        break
      case 'WS_EXECUTION_STEPS': {
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
      case 'WS_NAV':
        merged.disabled = context.nextDisabled
        break
      default:
        break
    }

    return <Card key={component.id} {...merged} />
  } catch (err) {
    console.warn(
      `[WorkspaceSDUIRenderer] Component ${component.type} (${component.id}) crashed, skipped:`,
      err,
    )
    return null
  }
}

export default function WorkspaceSDUIRenderer({
  components,
  context,
  handlers,
}: {
  components: SDUIComponent[]
  context: WorkspaceRenderContext
  handlers: WorkspaceHandlers
}) {
  const backgrounds = components.filter((c) => c.type === 'WS_BACKGROUND')
  const content = components.filter((c) => c.type !== 'WS_BACKGROUND')

  return (
    <div className="no-scrollbar relative flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-3 py-4">
      {backgrounds.map((component, i) => (
        <div
          key={component.id ?? `bg-${i}`}
          className="pointer-events-none absolute inset-0 z-0"
        >
          {renderWorkspaceComponent(component, context, handlers)}
        </div>
      ))}
      {content.map((component, i) => (
        <motion.div
          key={component.id ?? i}
          className="relative z-10"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {renderWorkspaceComponent(component, context, handlers)}
        </motion.div>
      ))}
    </div>
  )
}
