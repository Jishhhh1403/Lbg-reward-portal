import type { SDUIComponent } from '../types/sdui'
import type {
  ObjectiveScreenPayload,
  ObjectiveStage,
} from '../types/objective-sdui'
import type { PlanType } from '../types/objective'

/**
 * Converts the structured stage content returned by the CEAEI middleware
 * (`ObjectiveScreenPayload`) into the SDUI component stream consumed by
 * WorkspaceSDUIRenderer. This is what drives personalization in the modal:
 * the middleware only ever returns content; the registry owns the visuals.
 */

function makeComponent(
  id: string,
  type: string,
  props: Record<string, unknown>,
  actions?: SDUIComponent['actions'],
): SDUIComponent {
  return { id, type, version: '1.0', priority: 0, props, actions }
}

/** The four Coplan tools offered on the strategies screen (2b). */
const COPLAN_TOOLS = [
  {
    id: 'explain',
    label: 'Explain the selected plan',
    hint: 'Explain the selected plan in simple words and highlight the value it gives me.',
  },
  {
    id: 'combine',
    label: 'Combine the selected plans and create new plan',
    hint: 'Combine the strengths of both plans into a single third plan.',
  },
  {
    id: 'edit',
    label: 'Edit the constraints and change the objective',
    hint: 'Update the constraints and objective to suit me, then refresh the plans.',
  },
  {
    id: 'compare',
    label: 'Compare selected the plans',
    hint: 'Compare both plans side by side on ease, value and risk.',
  },
]

/** Generic, insurance-focused header for the planning screens (1c).
 *  Brand-agnostic on purpose — partners are only revealed later in the flow. */
function constraintsHeading(objectiveText: string): string {
  const lean = (objectiveText || '').toLowerCase()
  if (lean.includes('insurance') || lean.includes('premium') || lean.includes('pay')) {
    return 'We’ll use your rewards to pay for your insurance — simply and with the best value.'
  }
  if (lean.trim()) {
    return `We’ll use your rewards to make "${objectiveText}" happen — simply and with the best value.`
  }
  return 'We’ll use your rewards in the simplest way that gets you the most value.'
}

/** Merged "What I understood + Constraints extracted" screen (1b).
 *  Combines the summary stage content and the constraint stage content into a
 *  single screen so the summary and the inferred hard-fact constraints are
 *  shown together before the reward opportunities. */
export function buildMergedSummaryStageComponents(
  summary: string,
  constraintItems: Array<{ id: string; text: string }>,
): SDUIComponent[] {
  return [
    makeComponent('sum-understood', 'WS_UNDERSTOOD', { text: 'What I understood' }),
    // makeComponent('sum-captured', 'WS_SUMMARY', { summary }),
    makeComponent('sum-extracted', 'WS_EXTRACTED_CONSTRAINTS', {
      title: 'Constraints extracted',
      items: constraintItems,
    }),
    makeComponent(
      'sum-nav',
      'WS_NAV',
      { primary: 'Next', secondary: 'Modify' },
      [
        { type: 'WS_NEXT', payload: {} },
        { type: 'WS_MODIFY', payload: {} },
      ],
    ),
  ]
}

export function buildStageComponents(
  stage: ObjectiveStage,
  screen: ObjectiveScreenPayload,
  objectiveText: string,
  selectedPlan: PlanType,
): SDUIComponent[] {
  switch (stage) {
    case 'summary':
      return [
        makeComponent('sum-understood', 'WS_UNDERSTOOD', { text: 'What I understood' }),
        makeComponent('sum-captured', 'WS_SUMMARY', { summary: screen.summary ?? '' }),
        makeComponent('sum-objective', 'WS_OBJECTIVE_HERO', {
          eyebrow: 'Your objective',
          objective: objectiveText,
        }),
        makeComponent(
          'sum-nav',
          'WS_NAV',
          { primary: 'Next', secondary: 'Modify' },
          [
            { type: 'WS_NEXT', payload: {} },
            { type: 'WS_MODIFY', payload: {} },
          ],
        ),
      ]

    case 'constraints':
      return [
        makeComponent('con-understood', 'WS_UNDERSTOOD', {
          text: constraintsHeading(objectiveText),
        }),
        makeComponent('con-list', 'WS_CONSTRAINTS', {
          items: (screen.constraints ?? []).map((c) => ({
            id: c.id,
            text: c.text,
            applied: c.applied,
          })),
        }),
        makeComponent('con-nav', 'WS_NAV', { primary: 'Next' }, [
          { type: 'WS_NEXT', payload: {} },
        ]),
      ]

    case 'opportunities':
      return [
        makeComponent('opp-list', 'WS_OPPORTUNITY', {
          eyebrow: 'Reward opportunities',
          objective: objectiveText,
          items: (screen.opportunities ?? []).map((o) => ({
            id: o.id,
            title: o.title,
            description: o.description,
            partner: o.partner,
            estimatedValue: o.estimatedValue,
          })),
        }),
        makeComponent('opp-nav', 'WS_NAV', { primary: 'Next' }, [
          { type: 'WS_NEXT', payload: {} },
        ]),
      ]

    case 'strategies':
      return [
        makeComponent('str-list', 'WS_STRATEGY', {
          objective: objectiveText,
          items: (screen.strategies ?? []).map((s) => ({
            id: s.id,
            type: s.type,
            title:
              s.type === 'simplicity'
                ? 'Simplicity Plan'
                : s.type === 'max-redeem'
                  ? 'Maximum Value Plan'
                  : s.title,
            description: s.description,
          })),
          selectedPlan,
        }, [{ type: 'WS_SELECT_PLAN', payload: {} }]),
        makeComponent('str-coplan', 'WS_COPLAN', {
          label: 'Tools for you',
          tools: COPLAN_TOOLS,
          strategies: (screen.strategies ?? []).map((s) => ({
            id: s.id,
            type: s.type,
            title:
              s.type === 'simplicity'
                ? 'Simplicity Plan'
                : s.type === 'max-redeem'
                  ? 'Maximum Value Plan'
                  : s.title,
            description: s.description,
          })),
          view: 'idle',
        }, [{ type: 'WS_COPLAN_REQUEST', payload: {} }]),
        makeComponent('str-nav', 'WS_NAV', { primary: 'Next' }, [
          { type: 'WS_NEXT', payload: {} },
        ]),
      ]

    case 'evidence':
      return [
        makeComponent('ev-objective', 'WS_OBJECTIVE_HERO', {
          eyebrow: 'Your objective',
          objective: objectiveText,
        }),
        makeComponent('ev-card', 'WS_EVIDENCE', {
          title: 'Cognitive evidence',
          summary: screen.evidence?.summary ?? '',
          factors: screen.evidence?.factors ?? [],
        }),
        makeComponent('ev-nav', 'WS_NAV', { primary: 'Next' }, [
          { type: 'WS_NEXT', payload: {} },
        ]),
      ]

    default:
      return []
  }
}