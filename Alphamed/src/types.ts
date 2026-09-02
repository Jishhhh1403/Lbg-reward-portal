export interface DashboardRouteState {
  email?: string
  userName?: string
}

export interface ConvertRouteState {
  email?: string
  points?: number
  remainingPoints?: number
  userName?: string
  hasLinkedAccount?: boolean
  /** Full URL to hand back to the parent app after conversion. */
  returnTo?: string
}

export interface SuccessRouteState {
  email?: string
  originalPoints?: number
  remainingPoints?: number
  lbgPoints?: number
  updatedLbgPoints?: number
  transactionId?: string
  completedAt?: string
  /** Full URL to hand back to the parent app after viewing success. */
  returnTo?: string
}
