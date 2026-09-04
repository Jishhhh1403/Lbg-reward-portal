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

const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? ''
const LATENCY_MS = 650

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

/* ------------------------------------------------------------------ */
/* Cross-app event persistence (localStorage on the Rewards origin)    */
/* ------------------------------------------------------------------ */

const CROSS_APP_KEY = 'rewards_cross_app_events'

export interface CrossAppEvent {
  id: string
  type: 'EARN' | 'CONVERT' | 'REDEEM' | 'TRANSFER' | 'EXPIRE'
  description: string
  amount: number
  currency: 'LBG_COIN' | 'BRAND_POINT'
  createdAt: string
  source: string
}

export function getCrossAppEvents(): CrossAppEvent[] {
  try {
    const raw = localStorage.getItem(CROSS_APP_KEY)
    if (!raw) return []
    return JSON.parse(raw) as CrossAppEvent[]
  } catch {
    return []
  }
}

export function addCrossAppEvent(event: Omit<CrossAppEvent, 'id'>): void {
  const events = getCrossAppEvents()
  const newEvent: CrossAppEvent = {
    ...event,
    id: `cross_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  }
  events.unshift(newEvent)
  localStorage.setItem(CROSS_APP_KEY, JSON.stringify(events))
}

export function consumeCrossAppEventsFromUrl(): CrossAppEvent[] {
  const params = new URLSearchParams(window.location.search)
  const events: CrossAppEvent[] = []
  const raw = params.get('cross_app_events')
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as CrossAppEvent[]
      if (Array.isArray(parsed)) {
        for (const evt of parsed) {
          addCrossAppEvent(evt)
          events.push(evt)
        }
      }
    } catch {
      // ignore malformed events
    }
  }
  // Clean URL
  if (raw) {
    const url = new URL(window.location.href)
    url.searchParams.delete('cross_app_events')
    window.history.replaceState({}, '', url.toString())
  }
  return events
}

/**
 * Recompute the LBG coin balance from the base value plus all stored
 * cross-app events.  Positive event amounts (CONVERT, EARN, TRANSFER)
 * increase the balance; negative amounts (REDEEM, EXPIRE) decrease it.
 * Only LBG_COIN-currency events affect the coin total.
 */
export function computeAdjustedLbgBalance(base: number): number {
  const events = getCrossAppEvents()
  const delta = events.reduce((sum, e) => {
    if (e.currency !== 'LBG_COIN') return sum
    return sum + e.amount
  }, 0)
  return Math.max(base + delta, 0)
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function tryFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  if (!API_BASE_URL) return null
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: authHeaders(),
      ...init,
    })
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`)
    return (await res.json()) as T
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
  email: 'alex.morgan@example.com',
  totalLbgCoins: 12480,
  totalBrandPoints: 38250,
  brandsConnected: 6,
  tier: 'Gold',
  lastSyncedAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
}

export const DEMO_BRANDS: BrandOption[] = [
  
  { id: 'brd_alphamedicol', name: 'AlphaMedicol', category: 'Health', logoText: 'AM', color: '#0e7490', minRedeem: 600, logoUrl: alphaMedicolLogo, redirectUrl: 'http://localhost:5174', brandType: 'external' },
  { id: 'brd_rinkoff', name: 'Rinkoff Bakery', category: 'Dining', logoText: 'RB', color: '#b45309', minRedeem: 500, logoUrl: rinkoffBakeryLogo, brandType: 'external' },
  { id: 'brd_broadway', name: 'Broadway Market', category: 'Shopping', logoText: 'BM', color: '#4d7c0f', minRedeem: 500, logoUrl: broadwayMarketLogo, brandType: 'external' },
  { id: 'brd_bankofscotland', name: 'Bank of Scotland', category: 'Banking', logoText: 'BS', color: '#1e40af', minRedeem: 500, logoUrl: bankOfScotlandLogo, brandType: 'internal' },
  { id: 'brd_amc', name: 'AMC', category: 'Banking', logoText: 'AM', color: '#0369a1', minRedeem: 500, logoUrl: amcLogo, brandType: 'internal' },
  { id: 'brd_blackhorse', name: 'Black Horse', category: 'Banking', logoText: 'BH', color: '#065f46', minRedeem: 500, logoUrl: blackHorseLogo, brandType: 'internal' },
  { id: 'brd_birmingham', name: 'Birmingham', category: 'Banking', logoText: 'BI', color: '#7c2d12', minRedeem: 500, logoUrl: birminghamLogo, brandType: 'internal' },
  { id: 'brd_cavendish', name: 'Cavendish Online', category: 'Banking', logoText: 'CO', color: '#4338ca', minRedeem: 500, logoUrl: cavendishOnlineLogo, redirectUrl: 'http://localhost:5175', brandType: 'internal' },
  { id: 'brd_embark', name: 'Embark', category: 'Insurance', logoText: 'EM', color: '#9d174d', minRedeem: 500, logoUrl: embarkLogo, brandType: 'internal' },
  { id: 'brd_hgp', name: 'HGP', category: 'Insurance', logoText: 'HG', color: '#a16207', minRedeem: 500, logoUrl: hgpLogo, brandType: 'internal' },
  { id: 'brd_ldc', name: 'LDC', category: 'Insurance', logoText: 'LD', color: '#155e75', minRedeem: 500, logoUrl: ldcLogo, brandType: 'internal' },
  { id: 'brd_lexautolease', name: 'Lex Autolease', category: 'Insurance', logoText: 'LA', color: '#374151', minRedeem: 500, logoUrl: lexAutoleaseLogo, brandType: 'internal' },
  { id: 'brd_lloydswealth', name: 'Lloyds Wealth', category: 'Banking', logoText: 'LW', color: '#006a4d', minRedeem: 500, logoUrl: lloydsWealthLogo, brandType: 'internal' },
  { id: 'brd_lloydsliving', name: 'Lloyds Living', category: 'Insurance', logoText: 'LL', color: '#045a42', minRedeem: 500, logoUrl: lloydsLivingLogo, brandType: 'internal' },
  { id: 'brd_scottishwidows', name: 'Scottish Widows', category: 'Insurance', logoText: 'SW', color: '#701a75', minRedeem: 500, logoUrl: scottishWidowsLogo, brandType: 'internal' },
  { id: 'brd_mbna', name: 'MBNA', category: 'Banking', logoText: 'MB', color: '#1d4ed8', minRedeem: 500, logoUrl: mbnaLogo, brandType: 'internal' },
]

export const DEMO_POINTS_BY_BRAND: PointsProvider[] = [
  { brandId: 'brd_alphamedicol', brandName: 'AlphaMedicol', category: 'Health', points: 2100, color: '#0e7490', logoText: 'AM', logoUrl: alphaMedicolLogo },
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
  { id: 'tx_01', type: 'EARN', description: 'Points earned at AlphaMedicol', amount: 320, currency: 'BRAND_POINT', createdAt: daysAgo(0, 9) },
  { id: 'tx_02', type: 'CONVERT', description: 'Converted AlphaMedicol points to LBG coins', amount: 850, currency: 'LBG_COIN', createdAt: daysAgo(0, 13) },
  { id: 'tx_03', type: 'REDEEM', description: 'LBG Coins redeemed at Cavendish Online', amount: -1800, currency: 'LBG_COIN', createdAt: daysAgo(1, 10) },
  { id: 'tx_04', type: 'EARN', description: 'Points earned at Cavendish Online', amount: 540, currency: 'BRAND_POINT', createdAt: daysAgo(2, 15) },
  { id: 'tx_05', type: 'CONVERT', description: 'Converted Cavendish Online points to LBG coins', amount: 600, currency: 'LBG_COIN', createdAt: daysAgo(3, 11) },
  { id: 'tx_06', type: 'EARN', description: 'Points earned at AlphaMedicol', amount: 1250, currency: 'BRAND_POINT', createdAt: daysAgo(5, 14) },
  { id: 'tx_07', type: 'REDEEM', description: 'LBG Coins redeemed at AlphaMedicol', amount: -450, currency: 'LBG_COIN', createdAt: daysAgo(8, 16) },
  { id: 'tx_08', type: 'EARN', description: 'Points earned at Cavendish Online', amount: 210, currency: 'BRAND_POINT', createdAt: daysAgo(11, 12) },
  { id: 'tx_09', type: 'CONVERT', description: 'Converted AlphaMedicol points to LBG coins', amount: 900, currency: 'LBG_COIN', createdAt: daysAgo(14, 17) },
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
  const res = await tryFetch<{ accessToken: string; customerId: string; userName: string; phone: string }>(
    '/api/v1/customers/login/password',
    { method: 'POST', body: JSON.stringify({ phone, password }) },
  )
  if (res) {
    setAuthToken(res.accessToken)
    return { customerId: res.customerId, userName: res.userName, phone: res.phone }
  }
  await delay(LATENCY_MS)
  const customer = DEMO_CUSTOMER
  return { customerId: customer.customerId, userName: customer.userName, phone }
}

export async function signupCustomer(payload: {
  name: string
  email: string
  phone: string
  password: string
}): Promise<void> {
  await tryFetch('/api/v1/customers/signup', { method: 'POST', body: JSON.stringify(payload) })
  await delay(LATENCY_MS)
}

export async function fetchBrandOptions(): Promise<BrandOption[]> {
  const remote = await tryFetch<BrandOption[]>('/api/v1/brands')
  if (remote?.length) return remote
  await delay(250)
  return DEMO_BRANDS
}

export async function fetchEarnedRewardMapByBrand(
  customerId: string,
): Promise<Record<string, string>> {
  const remote = await tryFetch<Array<{ brandId: string; rewardId: string }>>(
    `/api/v1/rewards?customer_id=${encodeURIComponent(customerId)}&status=EARNED&limit=500`,
  )
  if (remote) {
    return Object.fromEntries(remote.map((r) => [r.brandId, r.rewardId]))
  }
  await delay(200)
  return Object.fromEntries(DEMO_POINTS_BY_BRAND.map((p, i) => [p.brandId, `rwd_${1000 + i}`]))
}

export async function fetchWalletTransactions(
  customerId: string,
  limit = 25,
): Promise<WalletTransactionItem[]> {
  const remote = await tryFetch<WalletTransactionItem[]>(
    `/api/v1/wallet/${encodeURIComponent(customerId)}/transactions?limit=${limit}`,
  )
  let base: WalletTransactionItem[]
  if (remote) {
    base = remote
  } else {
    await delay(350)
    base = DEMO_TRANSACTIONS.slice(0, limit)
  }
  // Merge cross-app events
  const crossEvents = getCrossAppEvents().map((e) => ({
    id: e.id,
    type: e.type,
    description: e.description,
    amount: e.amount,
    currency: e.currency as 'LBG_COIN' | 'BRAND_POINT',
    createdAt: e.createdAt,
  }))
  const merged = [...crossEvents, ...base]
  merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return merged.slice(0, limit)
}

export async function fetchCustomerDashboardById(customerId: string): Promise<DashboardData> {
  const remote = await tryFetch<DashboardData>(`/api/v1/customers/${encodeURIComponent(customerId)}/summary`)
  if (remote) {
    return { ...remote, customer: { ...remote.customer, totalLbgCoins: computeAdjustedLbgBalance(remote.customer.totalLbgCoins) } }
  }
  await delay(300)
  return {
    customer: { ...DEMO_CUSTOMER, totalLbgCoins: computeAdjustedLbgBalance(DEMO_CUSTOMER.totalLbgCoins) },
    pointsByBrand: DEMO_POINTS_BY_BRAND,
  }
}

export async function fetchCustomerDashboard(phone: string): Promise<DashboardData> {
  const remote = await tryFetch<DashboardData>(
    `/api/v1/customers/lookup/summary?phone=${encodeURIComponent(phone)}`,
  )
  if (remote) {
    return { ...remote, customer: { ...remote.customer, totalLbgCoins: computeAdjustedLbgBalance(remote.customer.totalLbgCoins) } }
  }
  await delay(300)
  return {
    customer: { ...DEMO_CUSTOMER, phone, totalLbgCoins: computeAdjustedLbgBalance(DEMO_CUSTOMER.totalLbgCoins) },
    pointsByBrand: DEMO_POINTS_BY_BRAND,
  }
}
