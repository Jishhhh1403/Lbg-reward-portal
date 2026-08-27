import type {
  BrandOption,
  CustomerSummary,
  DashboardData,
  PointsProvider,
  WalletTransactionItem,
} from '../types/rewards'
import alphaMedicolLogo from '../assets/AlphaMedicol.png'
import rinkoffBakeryLogo from '../assets/rinkoffbakery.png'
import broadwayMarketLogo from '../assets/broadwaymarket.png'
import bankOfScotlandLogo from '../assets/bankofscotland.png'
import amcLogo from '../assets/amc.png'
import blackHorseLogo from '../assets/blackhorse.png'
import birminghamLogo from '../assets/brimingham.png'
import cavendishOnlineLogo from '../assets/Cavendishonline.png'
import embarkLogo from '../assets/embark.jpeg'
import hgpLogo from '../assets/hgp.png'
import ldcLogo from '../assets/ldc.png'
import lexAutoleaseLogo from '../assets/lexautolease.png'
import lloydsWealthLogo from "../assets/Lloyd's wealth.png"
import lloydsLivingLogo from '../assets/lloydsliving.png'
import scottishWidowsLogo from '../assets/scottishwidows.png'
import mbnaLogo from '../assets/mbna.png'

const BRAND_LOGO_BY_ID: Record<string, string> = {
  brd_alphamedicol: alphaMedicolLogo,
  brd_rinkoff: rinkoffBakeryLogo,
  brd_broadway: broadwayMarketLogo,
  brd_bankofscotland: bankOfScotlandLogo,
  brd_amc: amcLogo,
  brd_blackhorse: blackHorseLogo,
  brd_birmingham: birminghamLogo,
  brd_cavendish: cavendishOnlineLogo,
  brd_embark: embarkLogo,
  brd_hgp: hgpLogo,
  brd_ldc: ldcLogo,
  brd_lexautolease: lexAutoleaseLogo,
  brd_lloydswealth: lloydsWealthLogo,
  brd_lloydsliving: lloydsLivingLogo,
  brd_scottishwidows: scottishWidowsLogo,
  brd_mbna: mbnaLogo,
}

/** Fills in missing brand logoUrls from the local asset map (backend may not
 *  store/serve logo files, so we map known brand ids to the bundled images). */
export function withBrandLogos<T extends { id?: string; brandId?: string; logoUrl?: string }>(
  items: T[] | null | undefined,
): T[] {
  if (!items?.length) return items ?? []
  return items.map((item) => {
    if (item.logoUrl) return item
    const key = (item.id ?? item.brandId) as string
    const logoUrl = BRAND_LOGO_BY_ID[key]
    return logoUrl ? { ...item, logoUrl } : item
  })
}

const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? ''

let _jwtToken: string | null = localStorage.getItem('rewards_jwt')

export function setAuthToken(token: string | null) {
  _jwtToken = token
  if (token) localStorage.setItem('rewards_jwt', token)
  else localStorage.removeItem('rewards_jwt')
}

export function getAuthToken(): string | null {
  return _jwtToken
}

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  if (_jwtToken) h['Authorization'] = `Bearer ${_jwtToken}`
  return h
}

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
}

function camelizeKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(camelizeKeys)
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [snakeToCamel(k), camelizeKeys(v)]),
    )
  }
  return obj
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  if (!API_BASE_URL) return null
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: authHeaders(),
      ...init,
    })
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`)
    const json = await res.json()
    return camelizeKeys(json) as T
  } catch (error) {
    console.warn(`[rewardsApi] Falling back to demo data for ${path}:`, error)
    return null
  }
}

/* ------------------------------------------------------------------ */
/* Demo seed data                                                      */
/* ------------------------------------------------------------------ */

export const DEMO_CUSTOMER: CustomerSummary = {
  customerId: 'cst_90124',
  userName: 'Alex Morgan',
  phone: '07700900123',
  totalLbgCoins: 12480,
  totalBrandPoints: 38250,
  brandsConnected: 6,
  tier: 'Gold',
  lastSyncedAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
}

export const DEMO_BRANDS: BrandOption[] = [
  { id: 'brd_alphamedicol', name: 'AlphaMedicol', category: 'Health', logoText: 'AM', color: '#0e7490', minRedeem: 600, logoUrl: alphaMedicolLogo, redirectUrl: 'http://localhost:5174' },
  { id: 'brd_rinkoff', name: 'Rinkoff Bakery', category: 'Dining', logoText: 'RB', color: '#b45309', minRedeem: 500, logoUrl: rinkoffBakeryLogo },
  { id: 'brd_broadway', name: 'Broadway Market', category: 'Shopping', logoText: 'BM', color: '#4d7c0f', minRedeem: 500, logoUrl: broadwayMarketLogo },
  { id: 'brd_bankofscotland', name: 'Bank of Scotland', category: 'Banking', logoText: 'BS', color: '#1e40af', minRedeem: 500, logoUrl: bankOfScotlandLogo },
  { id: 'brd_amc', name: 'AMC', category: 'Banking', logoText: 'AM', color: '#0369a1', minRedeem: 500, logoUrl: amcLogo },
  { id: 'brd_blackhorse', name: 'Black Horse', category: 'Banking', logoText: 'BH', color: '#065f46', minRedeem: 500, logoUrl: blackHorseLogo },
  { id: 'brd_birmingham', name: 'Birmingham', category: 'Banking', logoText: 'BI', color: '#7c2d12', minRedeem: 500, logoUrl: birminghamLogo },
  { id: 'brd_cavendish', name: 'Cavendish Online', category: 'Banking', logoText: 'CO', color: '#4338ca', minRedeem: 500, logoUrl: cavendishOnlineLogo, redirectUrl: 'http://localhost:5175' },
  { id: 'brd_embark', name: 'Embark', category: 'Insurance', logoText: 'EM', color: '#9d174d', minRedeem: 500, logoUrl: embarkLogo },
  { id: 'brd_hgp', name: 'HGP', category: 'Insurance', logoText: 'HG', color: '#a16207', minRedeem: 500, logoUrl: hgpLogo },
  { id: 'brd_ldc', name: 'LDC', category: 'Insurance', logoText: 'LD', color: '#155e75', minRedeem: 500, logoUrl: ldcLogo },
  { id: 'brd_lexautolease', name: 'Lex Autolease', category: 'Insurance', logoText: 'LA', color: '#374151', minRedeem: 500, logoUrl: lexAutoleaseLogo },
  { id: 'brd_lloydswealth', name: 'Lloyds Wealth', category: 'Banking', logoText: 'LW', color: '#006a4d', minRedeem: 500, logoUrl: lloydsWealthLogo },
  { id: 'brd_lloydsliving', name: 'Lloyds Living', category: 'Insurance', logoText: 'LL', color: '#045a42', minRedeem: 500, logoUrl: lloydsLivingLogo },
  { id: 'brd_scottishwidows', name: 'Scottish Widows', category: 'Insurance', logoText: 'SW', color: '#701a75', minRedeem: 500, logoUrl: scottishWidowsLogo },
  { id: 'brd_mbna', name: 'MBNA', category: 'Banking', logoText: 'MB', color: '#1d4ed8', minRedeem: 500, logoUrl: mbnaLogo },
]

export const DEMO_POINTS_BY_BRAND: PointsProvider[] = [
  { brandId: 'brd_alphamedicol', brandName: 'AlphaMedicol', category: 'Health', points: 2100, color: '#0e7490', logoText: 'AM', logoUrl: alphaMedicolLogo, redirectUrl: 'http://localhost:5174' },
  { brandId: 'brd_rinkoff', brandName: 'Rinkoff Bakery', category: 'Dining', points: 1750, color: '#b45309', logoText: 'RB', logoUrl: rinkoffBakeryLogo },
  { brandId: 'brd_broadway', brandName: 'Broadway Market', category: 'Shopping', points: 1300, color: '#4d7c0f', logoText: 'BM', logoUrl: broadwayMarketLogo },
  { brandId: 'brd_bankofscotland', brandName: 'Bank of Scotland', category: 'Banking', points: 2600, color: '#1e40af', logoText: 'BS', logoUrl: bankOfScotlandLogo },
  { brandId: 'brd_amc', brandName: 'AMC', category: 'Banking', points: 1450, color: '#0369a1', logoText: 'AM', logoUrl: amcLogo },
  { brandId: 'brd_blackhorse', brandName: 'Black Horse', category: 'Banking', points: 1900, color: '#065f46', logoText: 'BH', logoUrl: blackHorseLogo },
  { brandId: 'brd_birmingham', brandName: 'Birmingham', category: 'Banking', points: 900, color: '#7c2d12', logoText: 'BI', logoUrl: birminghamLogo },
  { brandId: 'brd_cavendish', brandName: 'Cavendish Online', category: 'Banking', points: 1150, color: '#4338ca', logoText: 'CO', logoUrl: cavendishOnlineLogo, redirectUrl: 'http://localhost:5175' },
  { brandId: 'brd_embark', brandName: 'Embark', category: 'Insurance', points: 1600, color: '#9d174d', logoText: 'EM', logoUrl: embarkLogo },
  { brandId: 'brd_hgp', brandName: 'HGP', category: 'Insurance', points: 750, color: '#a16207', logoText: 'HG', logoUrl: hgpLogo },
  { brandId: 'brd_ldc', brandName: 'LDC', category: 'Insurance', points: 2200, color: '#155e75', logoText: 'LD', logoUrl: ldcLogo },
  { brandId: 'brd_lexautolease', brandName: 'Lex Autolease', category: 'Insurance', points: 2800, color: '#374151', logoText: 'LA', logoUrl: lexAutoleaseLogo },
  { brandId: 'brd_lloydswealth', brandName: 'Lloyds Wealth', category: 'Banking', points: 2400, color: '#006a4d', logoText: 'LW', logoUrl: lloydsWealthLogo },
  { brandId: 'brd_lloydsliving', brandName: 'Lloyds Living', category: 'Insurance', points: 1350, color: '#045a42', logoText: 'LL', logoUrl: lloydsLivingLogo },
  { brandId: 'brd_scottishwidows', brandName: 'Scottish Widows', category: 'Insurance', points: 3100, color: '#701a75', logoText: 'SW', logoUrl: scottishWidowsLogo },
  { brandId: 'brd_mbna', brandName: 'MBNA', category: 'Banking', points: 2050, color: '#1d4ed8', logoText: 'MB', logoUrl: mbnaLogo },
]

function daysAgo(days: number, hour = 12): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(hour, 24, 0, 0)
  return d.toISOString()
}

export const DEMO_TRANSACTIONS: WalletTransactionItem[] = [
  { id: 'tx_01', type: 'EARN', description: 'Points earned from AlphaMedicol', amount: 320, currency: 'BRAND_POINT', createdAt: daysAgo(0, 13) },
  { id: 'tx_02', type: 'CONVERT', description: 'Converted partner points to LBG coins', amount: 850, currency: 'LBG_COIN', createdAt: daysAgo(1) },
  { id: 'tx_03', type: 'REDEEM', description: 'Redeemed coins with AlphaMedicol', amount: -450, currency: 'LBG_COIN', createdAt: daysAgo(3) },
  { id: 'tx_04', type: 'EARN', description: 'Points earned from Rinkoff Bakery', amount: 540, currency: 'BRAND_POINT', createdAt: daysAgo(5) },
  { id: 'tx_05', type: 'EARN', description: 'Points earned from Broadway Market', amount: 1250, currency: 'BRAND_POINT', createdAt: daysAgo(8) },
  { id: 'tx_06', type: 'CONVERT', description: 'Converted partner points to LBG coins', amount: 600, currency: 'LBG_COIN', createdAt: daysAgo(11) },
  { id: 'tx_07', type: 'REDEEM', description: 'Redeemed coins with Rinkoff Bakery', amount: -900, currency: 'LBG_COIN', createdAt: daysAgo(14) },
  { id: 'tx_08', type: 'EARN', description: 'Points earned from LDC', amount: 210, currency: 'BRAND_POINT', createdAt: daysAgo(18) },
]

/* ------------------------------------------------------------------ */
/* Public service functions (mirror documented backend endpoints)      */
/* ------------------------------------------------------------------ */

export async function loginWithPassword(
  phone: string,
  password: string,
): Promise<{ customerId: string; userName: string; phone: string }> {
  if (!phone.trim() || !password.trim()) {
    throw new Error('Enter your phone number and password to continue.')
  }
  const res = await apiFetch<{ accessToken: string; customerId: string; userName: string; phone: string }>(
    '/api/v1/customers/login/password',
    { method: 'POST', body: JSON.stringify({ phone, password }) },
  )
  if (res) {
    setAuthToken(res.accessToken)
    return { customerId: res.customerId, userName: res.userName, phone: res.phone }
  }
  throw new Error('Invalid phone number or password.')
}

export async function signupCustomer(payload: {
  name: string
  email: string
  phone: string
  password: string
}): Promise<void> {
  await apiFetch('/api/v1/customers/signup', { method: 'POST', body: JSON.stringify(payload) })
}

export async function fetchBrandOptions(): Promise<BrandOption[]> {
  const remote = await apiFetch<BrandOption[]>('/api/v1/brands')
  return withBrandLogos(remote?.length ? remote : DEMO_BRANDS)
}

export async function fetchEarnedRewardMapByBrand(
  customerId: string,
): Promise<Record<string, string>> {
  const remote = await apiFetch<Array<{ brandId: string; rewardId: string }>>(
    `/api/v1/rewards?customer_id=${encodeURIComponent(customerId)}&status=EARNED&limit=500`,
  )
  if (remote) {
    return Object.fromEntries(remote.map((r) => [r.brandId, r.rewardId]))
  }
  return Object.fromEntries(DEMO_POINTS_BY_BRAND.map((p, i) => [p.brandId, `rwd_${1000 + i}`]))
}

export async function fetchWalletTransactions(
  customerId: string,
  limit = 25,
): Promise<WalletTransactionItem[]> {
  const remote = await apiFetch<WalletTransactionItem[]>(
    `/api/v1/wallet/${encodeURIComponent(customerId)}/transactions?limit=${limit}`,
  )
  if (remote) return remote
  return DEMO_TRANSACTIONS.slice(0, limit)
}

export async function fetchCustomerDashboardById(customerId: string): Promise<DashboardData> {
  const remote = await apiFetch<DashboardData>(`/api/v1/customers/${encodeURIComponent(customerId)}/summary`)
  if (remote) {
    return {
      customer: remote.customer,
      pointsByBrand: withBrandLogos(remote.pointsByBrand),
    }
  }
  return {
    customer: DEMO_CUSTOMER,
    pointsByBrand: DEMO_POINTS_BY_BRAND,
  }
}

export async function fetchCustomerDashboard(phone: string): Promise<DashboardData> {
  const remote = await apiFetch<DashboardData>(
    `/api/v1/customers/lookup/summary?phone=${encodeURIComponent(phone)}`,
  )
  if (remote) {
    return {
      customer: remote.customer,
      pointsByBrand: withBrandLogos(remote.pointsByBrand),
    }
  }
  return {
    customer: { ...DEMO_CUSTOMER, phone },
    pointsByBrand: DEMO_POINTS_BY_BRAND,
  }
}
