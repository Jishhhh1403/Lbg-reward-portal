/// <reference types="vite/client" />

import axios from 'axios'

/**
 * LBG Unified Rewards API layer.
 *
 * In this demo the backend is not running, so every call first attempts the
 * real endpoint via axios and falls back to a deterministic local simulation
 * on network failure. Set `localStorage.am_simulate_error = '1'` to force
 * error paths (e.g. to see the red error state on the convert screen).
 */

const API_BASE_URL =
  import.meta.env.VITE_LBG_API_BASE_URL ?? 'http://localhost:8000'

/** Conversion rate: 1 AlphaMedicol Point = 5 LBG Coins. */
export const ALPHAMEDICOL_TO_LBG_RATE = 5

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 2500,
})

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function toNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function simulateError(): boolean {
  try {
    return localStorage.getItem('am_simulate_error') === '1'
  } catch {
    return false
  }
}

function storedPhone(): string | null {
  try {
    return localStorage.getItem('am_customer_phone')
  } catch {
    return null
  }
}

export interface LbgLinkedCustomerSummary {
  hasAccount: boolean
  alphamedicolPoints: number
  totalLbgPoints: number
  phone?: string
}

export interface TransferPayload {
  customerEmail: string
  pointsToTransfer: number
  idempotencyKey?: string
}

export interface TransferResult {
  transactionId: string
  pointsTransferred: number
  lbgCoinsIssued: number
  completedAt: string
}

/**
 * GET /api/v1/customers/lookup/summary
 * Returns true when a unified account exists for the email; false on 404.
 */
export async function checkLbgUnifiedAccountByEmail(
  email: string,
): Promise<boolean> {
  try {
    const res = await api.get('/api/v1/customers/lookup/summary', {
      params: { email },
    })
    const summary = res.data as Record<string, unknown> | undefined
    if (typeof summary?.hasAccount === 'boolean') return summary.hasAccount
    return Boolean(summary?.customerId ?? summary?.id)
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return false
    }
    // Network unreachable (demo mode): assume linked so journeys can proceed.
    await delay(400)
    return !simulateError()
  }
}

/**
 * GET /api/v1/customers/lookup/summary
 * Returns normalized balances; zeroed values on 404.
 */
export async function fetchLinkedCustomerSummaryByEmail(
  email: string,
): Promise<LbgLinkedCustomerSummary> {
  try {
    const res = await api.get('/api/v1/customers/lookup/summary', {
      params: { email },
    })
    const data = res.data as Record<string, unknown>
    return {
      hasAccount: true,
      alphamedicolPoints: toNumber(
        data.alphamedicolPoints ?? data.alphamedicol_points,
      ),
      totalLbgPoints: toNumber(data.totalLbgPoints ?? data.total_lbg_points),
      phone:
        typeof (data.phone as string | undefined) === 'string'
          ? (data.phone as string)
          : undefined,
    }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return { hasAccount: false, alphamedicolPoints: 0, totalLbgPoints: 0 }
    }
    // Demo fallback: simulated linked account so the rewards journey works.
    await delay(650)
    if (simulateError()) {
      throw new Error('Unable to reach the LBG rewards service.')
    }
    return {
      hasAccount: true,
      alphamedicolPoints: 138,
      totalLbgPoints: 12480,
      phone: storedPhone() ?? '07700900123',
    }
  }
}

/**
 * POST /api/v1/customers/transfer/alphamedicol
 * Sends snake_case fields expected by the backend contract and returns a
 * normalized transfer summary.
 */
export async function transferAlphaMedicolPointsToLbg(
  payload: TransferPayload,
): Promise<TransferResult> {
  try {
    const res = await api.post('/api/v1/customers/transfer/alphamedicol', {
      customer_email: payload.customerEmail,
      points_to_transfer: payload.pointsToTransfer,
      idempotency_key: payload.idempotencyKey ?? `amx-${Date.now()}`,
    })
    const data = res.data as Record<string, unknown>
    return normalizeTransfer(data)
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const detail = (error.response.data as Record<string, unknown> | undefined)
        ?.detail
      throw new Error(
        typeof detail === 'string' ? detail : 'Transfer failed. Please retry.',
      )
    }
    // Demo fallback: simulate a processing round-trip.
    await delay(1400)
    if (simulateError()) {
      throw new Error('Internal server error')
    }
    return normalizeTransfer({
      transactionId: `AMX-${Date.now().toString(36).toUpperCase()}`,
      pointsTransferred: payload.pointsToTransfer,
      lbgCoinsIssued: payload.pointsToTransfer * ALPHAMEDICOL_TO_LBG_RATE,
      completedAt: new Date().toISOString(),
    })
  }
}

function normalizeTransfer(data: Record<string, unknown>): TransferResult {
  const points = toNumber(data.pointsTransferred ?? data.points_transferred, 0)
  return {
    transactionId:
      typeof data.transactionId === 'string'
        ? data.transactionId
        : String(data.transaction_id ?? ''),
    pointsTransferred: points,
    lbgCoinsIssued: toNumber(
      data.lbgCoinsIssued ?? data.lbg_coins_issued,
      points * ALPHAMEDICOL_TO_LBG_RATE,
    ),
    completedAt:
      typeof data.completedAt === 'string'
        ? data.completedAt
        : new Date().toISOString(),
  }
}
