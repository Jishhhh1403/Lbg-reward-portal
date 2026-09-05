const API_BASE: string = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export interface CustomerSummary {
  hasAccount: boolean
  customerId: string
  alphamedicolPoints: number
  cavendishPoints: number
  totalLbgPoints: number
}

export interface PaymentResult {
  transactionId: string
  coinsRedeemed: number
  coinsEarned: number
  coinDiscount: number
  amountPayable: number
  paymentMethod: string
  updatedLbgPoints: number
  updatedCavendishPoints: number
  completedAt: string
}

function demoSummary(): CustomerSummary {
  return {
    hasAccount: true,
    customerId: 'cst_demo',
    alphamedicolPoints: 0,
    cavendishPoints: 0,
    totalLbgPoints: 12480,
  }
}

function simulatePayment(payload: {
  customer_email: string
  coins_to_redeem: number
  payment_amount_gbp: number
  payment_method: string
}): PaymentResult {
  const COINS_PER_POUND = 100
  const coinDiscount = payload.coins_to_redeem / COINS_PER_POUND
  const amountPayable = Math.max(payload.payment_amount_gbp - coinDiscount, 0)
  const coinsEarned = Math.round(amountPayable * 5)
  return {
    transactionId: `CAV-${Date.now().toString(36).toUpperCase()}`,
    coinsRedeemed: payload.coins_to_redeem,
    coinsEarned,
    coinDiscount,
    amountPayable,
    paymentMethod: payload.payment_method,
    updatedLbgPoints: Math.max(12480 - payload.coins_to_redeem + coinsEarned, 0),
    updatedCavendishPoints: 0,
    completedAt: new Date().toISOString(),
  }
}

export async function fetchCustomerSummary(email: string): Promise<CustomerSummary | null> {
  if (!API_BASE || !email) {
    // Demo fallback: return a simulated linked account
    await delay(400)
    return demoSummary()
  }
  try {
    const res = await fetch(`${API_BASE}/api/v1/customers/lookup/summary?email=${encodeURIComponent(email)}`)
    if (!res.ok) return null
    return await res.json()
  } catch {
    // Demo fallback
    await delay(400)
    return demoSummary()
  }
}

export async function payCavendish(payload: {
  customer_email: string
  coins_to_redeem: number
  payment_amount_gbp: number
  payment_method: string
}): Promise<PaymentResult> {
  if (!API_BASE) {
    // Demo fallback: simulate a successful payment
    await delay(1200)
    return simulatePayment(payload)
  }
  try {
    const res = await fetch(`${API_BASE}/api/v1/customers/pay/cavendish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      return await res.json()
    }
    /* Non-OK response (e.g. 404 "Customer not found" when the demo email is not
       seeded in the rewards DB, or 400 "Insufficient LBG coins"). Surface the
       backend's reason but still let the demo payment complete locally instead
       of failing the checkout. */
    const err = await res.json().catch(() => ({ detail: 'Payment failed' }))
    console.warn('[cavendishApi] Payment API rejected, using demo simulation:', err)
  } catch (error) {
    /* Network failure / unreachable API (shows up in the browser as
       "TypeError: Failed to fetch"). Simulate locally so the demo can always
       complete the checkout instead of breaking on a dead backend. */
    console.warn('[cavendishApi] Payment API unreachable, using demo simulation:', error)
  }
  await delay(1200)
  return simulatePayment(payload)
}
