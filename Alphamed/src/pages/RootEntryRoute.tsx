import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { DashboardRouteState } from '../types'

function readParam(name: string): string | null {
  const value = new URLSearchParams(window.location.search).get(name)?.trim()
  return value ? value : null
}

/**
 * Deep-link entry route (used when the Unified Rewards portal opens
 * AlphaMedicol for the AlphaMedical partner).
 *
 * - `customerEmail` -> route state `email` + localStorage am_customer_email
 * - `customerName`  -> route state `userName` + localStorage am_customer_name
 * - `customerPhone` -> normalized to 10 digits + localStorage am_customer_phone
 *
 * Falls back to stored identity; otherwise sends the visitor to /login.
 */
export default function RootEntryRoute() {
  const navigate = useNavigate()

  useEffect(() => {
    const customerName = readParam('customerName')
    const customerEmail = readParam('customerEmail')
    const rawPhone = readParam('customerPhone')

    try {
      if (customerName) {
        localStorage.setItem('am_customer_name', decodeURIComponent(customerName))
      }
      if (customerEmail) {
        localStorage.setItem(
          'am_customer_email',
          decodeURIComponent(customerEmail),
        )
      }
      if (rawPhone) {
        const digits = decodeURIComponent(rawPhone).replace(/\D/g, '').slice(-10)
        if (digits.length === 10) {
          localStorage.setItem('am_customer_phone', digits)
        }
      }
    } catch {
      /* storage unavailable — continue with in-memory identity */
    }

    let storedName: string | null = null
    let storedEmail: string | null = null
    try {
      storedName = localStorage.getItem('am_customer_name')
      storedEmail = localStorage.getItem('am_customer_email')
    } catch {
      /* ignore */
    }

    // The Unified Rewards portal deep-links with name + phone only (no email on
    // its customer summary). Fall back to the seeded demo customer so the
    // AlphaMedicol transfer flow still resolves a linked account.
    const DEMO_EMAIL = 'alex.morgan@demo.com'
    const resolvedEmail = customerEmail ?? storedEmail ?? (customerName ? DEMO_EMAIL : undefined)

    if (resolvedEmail) {
      try {
        localStorage.setItem('am_customer_email', decodeURIComponent(resolvedEmail))
      } catch {
        /* ignore */
      }
    }

    const state: DashboardRouteState = {
      email: resolvedEmail,
      userName: customerName ?? storedName ?? undefined,
    }

    if (!state.userName && !state.email) {
      navigate('/login', { replace: true })
      return
    }
    navigate('/dashboard', { replace: true, state })
  }, [navigate])

  return null
}
