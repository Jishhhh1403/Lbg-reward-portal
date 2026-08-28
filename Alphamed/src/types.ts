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
}

export interface SuccessRouteState {
  email?: string
  originalPoints?: number
  remainingPoints?: number
  lbgPoints?: number
  updatedLbgPoints?: number
  transactionId?: string
  completedAt?: string
}
