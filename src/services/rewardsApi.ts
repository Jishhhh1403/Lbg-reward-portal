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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function tryFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  if (!API_BASE_URL) return null
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
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
  totalLbgCoins: 12480,
  totalBrandPoints: 38250,
  brandsConnected: 6,
  tier: 'Gold',
  lastSyncedAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
}

export const DEMO_BRANDS: BrandOption[] = [
  { id: 'brd_avios', name: 'Avios', category: 'Travel', logoText: 'AV', color: '#cc0000', minRedeem: 1000 },
  { id: 'brd_ba', name: 'British Airways', category: 'Travel', logoText: 'BA', color: '#1d4ed8', minRedeem: 2000 },
  { id: 'brd_tesco', name: 'Tesco Clubcard', category: 'Groceries', logoText: 'TC', color: '#00539f', minRedeem: 500 },
  { id: 'brd_sainsburys', name: "Sainsbury's", category: 'Groceries', logoText: "S'", color: '#f06c00', minRedeem: 500 },
  { id: 'brd_nandos', name: "Nando's", category: 'Dining', logoText: 'N', color: '#dc2626', minRedeem: 750 },
  { id: 'brd_costa', name: 'Costa Coffee', category: 'Dining', logoText: 'CC', color: '#8b1d1d', minRedeem: 400 },
  { id: 'brd_amazon', name: 'Amazon', category: 'Shopping', logoText: 'AZ', color: '#ff9900', minRedeem: 1500 },
  { id: 'brd_asos', name: 'ASOS', category: 'Shopping', logoText: 'AS', color: '#111827', minRedeem: 1200 },
  { id: 'brd_boots', name: 'Boots', category: 'Health', logoText: 'BO', color: '#0e7490', minRedeem: 600 },
  { id: 'brd_alphamedical', name: 'AlphaMedical', category: 'Health', logoText: 'AM', color: '#0f766e', minRedeem: 650 },
  { id: 'brd_holland', name: 'Holland & Barrett', category: 'Health', logoText: 'HB', color: '#15803d', minRedeem: 800 },
  { id: 'brd_cineworld', name: 'Cineworld', category: 'Entertainment', logoText: 'CW', color: '#7c3aed', minRedeem: 900 },
  { id: 'brd_spotify', name: 'Spotify', category: 'Entertainment', logoText: 'SP', color: '#16a34a', minRedeem: 700 },
  { id: 'brd_uber', name: 'Uber', category: 'Travel', logoText: 'UB', color: '#0f172a', minRedeem: 500 },
  { id: 'brd_alphamedicol', name: 'AlphaMedicol', category: 'Health', logoText: 'AM', color: '#0e7490', minRedeem: 600, logoUrl: alphaMedicolLogo },
  { id: 'brd_rinkoff', name: 'Rinkoff Bakery', category: 'Dining', logoText: 'RB', color: '#b45309', minRedeem: 500, logoUrl: rinkoffBakeryLogo },
  { id: 'brd_broadway', name: 'Broadway Market', category: 'Shopping', logoText: 'BM', color: '#4d7c0f', minRedeem: 500, logoUrl: broadwayMarketLogo },
  { id: 'brd_bankofscotland', name: 'Bank of Scotland', category: 'Banking', logoText: 'BS', color: '#1e40af', minRedeem: 500, logoUrl: bankOfScotlandLogo },
  { id: 'brd_amc', name: 'AMC', category: 'Banking', logoText: 'AM', color: '#0369a1', minRedeem: 500, logoUrl: amcLogo },
  { id: 'brd_blackhorse', name: 'Black Horse', category: 'Banking', logoText: 'BH', color: '#065f46', minRedeem: 500, logoUrl: blackHorseLogo },
  { id: 'brd_birmingham', name: 'Birmingham', category: 'Banking', logoText: 'BI', color: '#7c2d12', minRedeem: 500, logoUrl: birminghamLogo },
  { id: 'brd_cavendish', name: 'Cavendish Online', category: 'Banking', logoText: 'CO', color: '#4338ca', minRedeem: 500, logoUrl: cavendishOnlineLogo, redirectUrl: 'http://localhost:5174' },
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
  { brandId: 'brd_avios', brandName: 'Avios', category: 'Travel', points: 9400, color: '#cc0000', logoText: 'AV' },
  { brandId: 'brd_tesco', brandName: 'Tesco Clubcard', category: 'Groceries', points: 8150, color: '#00539f', logoText: 'TC' },
  { brandId: 'brd_amazon', brandName: 'Amazon', category: 'Shopping', points: 6300, color: '#ff9900', logoText: 'AZ' },
  { brandId: 'brd_nandos', brandName: "Nando's", category: 'Dining', points: 4750, color: '#dc2626', logoText: 'N' },
  { brandId: 'brd_boots', brandName: 'Boots', category: 'Health', points: 5250, color: '#0e7490', logoText: 'BO' },
  { brandId: 'brd_cineworld', brandName: 'Cineworld', category: 'Entertainment', points: 4400, color: '#7c3aed', logoText: 'CW' },
  { brandId: 'brd_alphamedicol', brandName: 'AlphaMedicol', category: 'Health', points: 2100, color: '#0e7490', logoText: 'AM', logoUrl: alphaMedicolLogo },
  { brandId: 'brd_rinkoff', brandName: 'Rinkoff Bakery', category: 'Dining', points: 1750, color: '#b45309', logoText: 'RB', logoUrl: rinkoffBakeryLogo },
  { brandId: 'brd_broadway', brandName: 'Broadway Market', category: 'Shopping', points: 1300, color: '#4d7c0f', logoText: 'BM', logoUrl: broadwayMarketLogo },
  { brandId: 'brd_bankofscotland', brandName: 'Bank of Scotland', category: 'Banking', points: 2600, color: '#1e40af', logoText: 'BS', logoUrl: bankOfScotlandLogo },
  { brandId: 'brd_amc', brandName: 'AMC', category: 'Banking', points: 1450, color: '#0369a1', logoText: 'AM', logoUrl: amcLogo },
  { brandId: 'brd_blackhorse', brandName: 'Black Horse', category: 'Banking', points: 1900, color: '#065f46', logoText: 'BH', logoUrl: blackHorseLogo },
  { brandId: 'brd_birmingham', brandName: 'Birmingham', category: 'Banking', points: 900, color: '#7c2d12', logoText: 'BI', logoUrl: birminghamLogo },
  { brandId: 'brd_cavendish', brandName: 'Cavendish Online', category: 'Banking', points: 1150, color: '#4338ca', logoText: 'CO', logoUrl: cavendishOnlineLogo, redirectUrl: 'http://localhost:5174' },
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
  { id: 'tx_01', type: 'EARN', description: 'Points earned at Nando\u2019s', amount: 320, currency: 'BRAND_POINT', createdAt: daysAgo(0, 13) },
  { id: 'tx_02', type: 'CONVERT', description: 'Converted Tesco Clubcard points to LBG coins', amount: 850, currency: 'LBG_COIN', createdAt: daysAgo(1) },
  { id: 'tx_03', type: 'REDEEM', description: 'Redeemed coins at Costa Coffee', amount: -450, currency: 'LBG_COIN', createdAt: daysAgo(3) },
  { id: 'tx_04', type: 'EARN', description: 'Points earned at Tesco Clubcard', amount: 540, currency: 'BRAND_POINT', createdAt: daysAgo(5) },
  { id: 'tx_05', type: 'EARN', description: 'Points earned at Avios', amount: 1250, currency: 'BRAND_POINT', createdAt: daysAgo(8) },
  { id: 'tx_06', type: 'CONVERT', description: 'Converted Amazon points to LBG coins', amount: 600, currency: 'LBG_COIN', createdAt: daysAgo(11) },
  { id: 'tx_07', type: 'REDEEM', description: 'Redeemed coins at Cineworld', amount: -900, currency: 'LBG_COIN', createdAt: daysAgo(14) },
  { id: 'tx_08', type: 'EARN', description: 'Points earned at Boots', amount: 210, currency: 'BRAND_POINT', createdAt: daysAgo(18) },
]

/* ------------------------------------------------------------------ */
/* Public service functions (mirror documented backend endpoints)      */
/* ------------------------------------------------------------------ */

export async function loginWithPassword(
  phone: string,
  password: string,
): Promise<{ customerId: string; userName: string; phone: string }> {
  await tryFetch('/api/v1/customers/login/password', {
    method: 'POST',
    body: JSON.stringify({ phone, password }),
  })
  await delay(LATENCY_MS)
  if (!phone.trim() || !password.trim()) {
    throw new Error('Enter your phone number and password to continue.')
  }
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
  if (remote) return remote
  await delay(350)
  return DEMO_TRANSACTIONS.slice(0, limit)
}

export async function fetchCustomerDashboardById(customerId: string): Promise<DashboardData> {
  const remote = await tryFetch<DashboardData>(`/api/v1/customers/${encodeURIComponent(customerId)}/summary`)
  if (remote) return remote
  await delay(300)
  return {
    customer: DEMO_CUSTOMER,
    pointsByBrand: DEMO_POINTS_BY_BRAND,
  }
}

export async function fetchCustomerDashboard(phone: string): Promise<DashboardData> {
  const remote = await tryFetch<DashboardData>(
    `/api/v1/customers/lookup/summary?phone=${encodeURIComponent(phone)}`,
  )
  if (remote) return remote
  await delay(300)
  return {
    customer: { ...DEMO_CUSTOMER, phone },
    pointsByBrand: DEMO_POINTS_BY_BRAND,
  }
}
