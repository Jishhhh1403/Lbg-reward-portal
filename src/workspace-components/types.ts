import type { SDUIComponent } from '../types/sdui'
import type { PlanType } from '../types/objective'

/** Live wizard state injected into registered workspace components by the renderer. */
export interface WorkspaceRenderContext {
  objectiveText: string
  selectedPlan: PlanType
  /** Execution steps with live status. */
  steps: Array<{ id: string; label: string; partner: string; status: string }>
  /** When true the primary Next action is disabled (e.g. missing input/selection). */
  nextDisabled: boolean
}

/** Action handlers the renderer wires onto registered workspace components. */
export interface WorkspaceHandlers {
  onTextChange: (value: string) => void
  onNext: () => void
  onModify: () => void
  onSelectPlan: (type: PlanType) => void
  onSelectStep: (id: string) => void
  onConfirmRedirect: (id: string) => void
  onCoplanRequest: (toolId: string, prompt: string) => void
  onReturnHome: () => void
  /** Refresh the two plans around a brand-new objective (Coplan "edit" tool). */
  onEditObjective: (objective: string) => void
  /** Switch the Coplan tools pane between the tool views (explain/combine/edit/compare). */
  onViewChange: (view: string) => void
}

/** Shared, minimal DOM-friendly visual primitives for the registry components. */
export const palette = {
  brand: '#006a4d',
  brandDark: '#045a42',
  brandSoft: '#dcfce7',
  brandBg: '#f0fdf4',
  border: '#e2e8f0',
  surface: '#ffffff',
  surfaceAlt: '#f8fafc',
  textStrong: '#0f172a',
  text: '#334155',
  textMuted: '#64748b',
  textFaint: '#94a3b8',
  accent: '#dc2626',
  accentSoft: '#fee2e2',
  gold: '#a98a41',
  goldBg: '#fdf9ef',
  amber: '#fef3c7',
  amberText: '#d97706',
} as const

export type { SDUIComponent }
