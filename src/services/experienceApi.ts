import type { PersonaOption, SduiGenerateResponse } from '../types/sdui'

const INTELLIGENCE_BASE_URL: string =
  import.meta.env.VITE_INTELLIGENCE_API_URL ?? 'http://localhost:8001'
const MIDDLEWARE_BASE_URL: string =
  import.meta.env.VITE_MIDDLEWARE_API_URL ?? 'http://localhost:8002'

export interface WalletSnapshot {
  totalPoints: number
  lbgCoins: number
  brandsConnected: number
  topBrands: Array<{ name: string; points: number }>
  lastSyncedAt: string
}

/**
 * Persona roster from the intelligence layer — used for the demo persona login.
 */
export async function fetchPersonaOptions(): Promise<PersonaOption[] | null> {
  try {
    const res = await fetch(`${INTELLIGENCE_BASE_URL}/intelligence/customers`, {
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`)
    const data = (await res.json()) as
      | Array<{ id: string; name: string; tier: string; points: number }>
      | { customers?: Array<{ id: string; name: string; tier: string; points: number }> }
    const customers = Array.isArray(data) ? data : (data.customers ?? [])
    if (!customers.length) return null
    return customers.map((c) => ({
      id: c.id,
      name: c.name,
      tier: c.tier,
      points: c.points,
    }))
  } catch (error) {
    console.warn('[experienceApi] Intelligence layer unavailable for personas:', error)
    return null
  }
}

/**
 * Generates the personalized SDUI experience for a customer via the QUEST-UI
 * middleware committee. `wallet` carries the live frontend session state so the
 * agents can populate props with real balances.
 */
export async function generateExperience(
  customerId: string,
  wallet: WalletSnapshot,
): Promise<SduiGenerateResponse> {
  const correlationId = crypto.randomUUID().slice(0, 8)
  const res = await fetch(`${MIDDLEWARE_BASE_URL}/sdui/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requestId: `req-${customerId}-${correlationId}`,
      correlationId,
      customerReference: customerId,
      journey: 'rewards-overview',
      channel: 'mobile',
      locale: 'en-GB',
      jurisdiction: 'UK',
      currentSessionContext: { wallet },
      permittedCustomerSignals: ['points_balance', 'tier', 'brands_connected', 'recent_activity'],
      declaredPreferences: {},
      accessibilityPreferences: {},
      consentEnvelope: { valid: true, scope: ['rewards-personalization'] },
      purposeOfUse: 'rewards-personalization',
      latencyBudgetMs: 45000,
    }),
  })
  if (!res.ok) throw new Error(`SDUI generation failed with status ${res.status}`)
  return (await res.json()) as SduiGenerateResponse
}
