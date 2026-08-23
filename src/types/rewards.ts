export type AppStep = 'mobile' | 'otp' | 'password' | 'signup' | 'splash' | 'home' | 'dashboard'

export type DashboardTab = 'home' | 'activity' | 'profile'

export interface BrandOption {
  id: string
  name: string
  category: string
  logoText: string
  color: string
  minRedeem?: number
  /** Optional brand logo image; falls back to the colored logoText tile */
  logoUrl?: string
}

export interface PointsProvider {
  brandId: string
  brandName: string
  category: string
  points: number
  color: string
  logoText: string
  /** Optional brand logo image; falls back to the colored logoText tile */
  logoUrl?: string
}

export interface CustomerSummary {
  customerId: string
  userName: string
  phone: string
  totalLbgCoins: number
  totalBrandPoints: number
  brandsConnected: number
  tier: TierName
  lastSyncedAt: string
}

export type TierName = 'Silver' | 'Gold' | 'Platinum'

export interface WalletTransactionItem {
  id: string
  type: 'EARN' | 'REDEEM' | 'CONVERT'
  description: string
  amount: number
  currency: 'LBG_COIN' | 'BRAND_POINT'
  createdAt: string
}

export interface DashboardData {
  customer: CustomerSummary
  pointsByBrand: PointsProvider[]
}
