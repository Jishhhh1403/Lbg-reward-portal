import type { SDUIComponent, SDUINarrative } from '../types/sdui'
import type { PointsProvider, BrandOption } from '../types/rewards'

export interface SduiRendererProps {
  components: SDUIComponent[]
  onLocatePoints: () => void
  onRedeemPoints: () => void
  narrative?: SDUINarrative
  pointsByBrand?: PointsProvider[]
  brands?: BrandOption[]
}

/** Layout keys managed by the renderer — never forwarded to card props. */
const LAYOUT_KEYS = ['layout', 'accentToken', 'narrative']

export function stripLayoutProps(props: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(props).filter(([k]) => !LAYOUT_KEYS.includes(k)))
}

export function componentSpan(component: SDUIComponent): 'full' | 'half' {
  const layout = component.props?.layout as { span?: string } | undefined
  return layout?.span === 'half' ? 'half' : 'full'
}

const ACTION_TARGETS: Record<string, 'locate' | 'redeem'> = {
  OPEN_LOCATE_MODAL: 'locate',
  LINK_BRAND: 'locate',
  EXPLORE_REWARDS: 'locate',
  VIEW_LOCAL_DEALS: 'locate',
  LINK_NEW_BRAND: 'locate',
  OPEN_REDEEM_MODAL: 'redeem',
  REDEEM_REWARD: 'redeem',
  USE_EXPIRING_POINTS: 'redeem',
  CLAIM_OFFER: 'redeem',
  QUICK_WIN: 'redeem',
  VIEW_HISTORY: 'redeem',
  REDEEM_OPTIMAL: 'redeem',
  TRANSFER_TO_POT: 'redeem',
  GIFT_POINTS: 'redeem',
  DONATE_POINTS: 'redeem',
  CLAIM_BIRTHDAY_REWARD: 'redeem',
}

export function actionTarget(type: string): 'locate' | 'redeem' | null {
  return ACTION_TARGETS[type] ?? null
}
