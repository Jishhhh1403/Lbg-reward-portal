import { useEffect, useState } from 'react'
import { Box, Stack, Typography } from '@mui/material'
import { ArrowLeft, Check, Download, Gift, Lock, ShieldCheck } from 'lucide-react'
import { fontFamily as FONT } from '../theme'

const C = {
  primary: '#840544',
  primaryDark: '#670539',
  successGreen: '#43C27A',
  successLight: '#EAF8EF',
  textPrimary: '#2D2F4A',
  textSecondary: '#6B6F86',
  border: '#ECECF4',
  white: '#FFFFFF',
}

const GREEN_TEXT = '#15803D'

const REWARDS_APP_URL = import.meta.env.VITE_REWARDS_APP_URL ?? 'http://localhost:5173'

interface CheckoutData {
  subtotal: number
  coinsApplied: number
  coinDiscount: number
  coinsEarned: number
  finalPaid: number
  transactionId: string
  updatedLbgPoints: number
  paymentMethod: string
}

const DEFAULT_DATA: CheckoutData = {
  subtotal: 100,
  coinsApplied: 0,
  coinDiscount: 0,
  coinsEarned: 70,
  finalPaid: 100,
  transactionId: '',
  updatedLbgPoints: 0,
  paymentMethod: 'card',
}

function generateOrderRef(): string {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const time = now.toTimeString().slice(0, 8).replace(/:/g, '')
  const hex = Math.random().toString(16).slice(2, 10).toUpperCase()
  return `ORD-${date}${time}-${hex}`
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const ORDER_NOW = new Date()
const ORDER_DATE = formatDate(ORDER_NOW)

const STEPS = [
  { title: 'Review', subtitle: 'Your policy' },
  { title: 'Payment', subtitle: 'Secure payment' },
  { title: 'Confirmation', subtitle: 'Policy activated' },
]

function SuccessIcon() {
  return (
    <Box
      aria-hidden
      sx={{
        position: 'relative',
        width: 96,
        height: 96,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Ring burst 1 */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: `3px solid ${C.successGreen}`,
          animation: 'ringBurst 1.4s ease-out 0.3s 1 both',
          '@keyframes ringBurst': {
            '0%': { transform: 'scale(0.5)', opacity: 0.8 },
            '100%': { transform: 'scale(1.6)', opacity: 0 },
          },
        }}
      />
      {/* Ring burst 2 */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: `2px solid ${C.successGreen}`,
          animation: 'ringBurst2 1.4s ease-out 0.55s 1 both',
          '@keyframes ringBurst2': {
            '0%': { transform: 'scale(0.5)', opacity: 0.5 },
            '100%': { transform: 'scale(1.9)', opacity: 0 },
          },
        }}
      />

      {/* Sparkle dots */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i * 60) - 90
        const rad = (angle * Math.PI) / 180
        const dist = 52
        return (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: i % 2 === 0 ? C.successGreen : '#A7F3D0',
              top: `calc(50% + ${Math.sin(rad) * dist}px - 4px)`,
              left: `calc(50% + ${Math.cos(rad) * dist}px - 4px)`,
              animation: `sparklePop 0.8s ease-out ${0.35 + i * 0.07}s 1 both`,
              '@keyframes sparklePop': {
                '0%': { transform: 'scale(0)', opacity: 0 },
                '60%': { transform: 'scale(1.4)', opacity: 1 },
                '100%': { transform: 'scale(0)', opacity: 0 },
              },
            }}
          />
        )
      })}

      {/* Main circle */}
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          bgcolor: C.successGreen,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 6px 24px rgba(67,194,122,0.4)',
          animation: 'circleBounce 0.6s cubic-bezier(0.34,1.56,0.64,1) 0s 1 both',
          '@keyframes circleBounce': {
            '0%': { transform: 'scale(0)' },
            '100%': { transform: 'scale(1)' },
          },
        }}
      >
        {/* Check mark */}
        <Box
          sx={{
            animation: 'checkPop 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.25s 1 both',
            '@keyframes checkPop': {
              '0%': { transform: 'scale(0) rotate(-20deg)', opacity: 0 },
              '100%': { transform: 'scale(1) rotate(0deg)', opacity: 1 },
            },
            display: 'flex',
            lineHeight: 0,
          }}
        >
          <Check size={40} strokeWidth={3.5} color="#fff" />
        </Box>
      </Box>
    </Box>
  )
}

function CompletedStep({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <Stack component="li" spacing="8px" sx={{ flex: 1, alignItems: 'center', position: 'relative' }}>
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          bgcolor: C.primary,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Check size={17} strokeWidth={3.5} />
      </Box>
      <Box sx={{ textAlign: 'center' }}>
        <Typography sx={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: C.textPrimary }}>
          {title}
        </Typography>
        <Typography sx={{ fontFamily: FONT, fontSize: 12, color: C.textSecondary, lineHeight: '16px' }}>
          {subtitle}
        </Typography>
      </Box>
    </Stack>
  )
}

function DetailRow({
  label,
  value,
  caption,
}: {
  label: string
  value: React.ReactNode
  caption?: React.ReactNode
}) {
  return (
    <Box>
      <Stack direction="row" spacing="12px" sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Typography component="dt" sx={{ fontFamily: FONT, fontSize: 14, fontWeight: 500, color: C.textSecondary }}>
          {label}
        </Typography>
        <Typography component="dd" sx={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: C.textPrimary, textAlign: 'right', m: 0 }}>
          {value}
        </Typography>
      </Stack>
      {caption}
    </Box>
  )
}

export default function PaymentSuccessPage() {
  const [checkoutData, setCheckoutData] = useState<CheckoutData>(DEFAULT_DATA)

  /* Query params survive the `#/success` hash transition (CheckoutPage only
     rewrites the hash), so the parent app's return URL is read here. */
  const returnUrl =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('returnTo')
      : null

  /* When returning to the parent rewards app, carry the redeemed coins back via
     `cross_app_events` (negative REDEEM amount) so the workspace LBG balance is
     debited immediately. */
  const returnToWithRedeemEvent = (): string | null => {
    if (!returnUrl) return returnUrl
    try {
      const url = new URL(returnUrl, window.location.origin)
      const crossAppEvents = JSON.stringify([{
        id: `evt_${Date.now()}`,
        type: 'REDEEM',
        description: `Redeemed ${COINS_APPLIED} LBG coins at Cavendish Online`,
        amount: -COINS_APPLIED,
        currency: 'LBG_COIN',
        createdAt: new Date().toISOString(),
        source: 'Cavendish Online',
      }])
      url.searchParams.set('cross_app_events', crossAppEvents)
      return url.toString()
    } catch {
      return returnUrl
    }
  }

  useEffect(() => {
    const raw = sessionStorage.getItem('cavendish_checkout')
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as CheckoutData
        setCheckoutData(parsed)
        sessionStorage.removeItem('cavendish_checkout')
      } catch {
        // keep defaults
      }
    }
  }, [])

  /* Automatically hand the user back to their workspace after payment. Waits at
     least 10 seconds so the user can review their confirmation before returning. */
  useEffect(() => {
    if (!returnUrl) return
    const t = window.setTimeout(() => {
      window.location.assign(returnToWithRedeemEvent() ?? returnUrl)
    }, 10000)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [returnUrl])

  const SUBTOTAL = checkoutData.subtotal
  const COINS_APPLIED = checkoutData.coinsApplied
  const COIN_DISCOUNT = checkoutData.coinDiscount
  const FINAL_PAID = checkoutData.finalPaid
  const ORDER_REFERENCE = checkoutData.transactionId || generateOrderRef()

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f6f5f8', display: 'flex', flexDirection: 'column' }}>
      <header>
        <Box sx={{ bgcolor: C.primary, width: '100%', position: 'relative', height: 140 }}>
          <Stack
            direction="row"
            sx={{
              maxWidth: 430,
              mx: 'auto',
              width: '100%',
              px: '20px',
              height: 106,
              alignItems: 'center',
              pt: '32px',
              justifyContent: 'space-between',
            }}
          >
            <Stack direction="row" spacing="12px" sx={{ alignItems: 'center' }}>
              <Box
                component="a"
                href={returnToWithRedeemEvent() ?? REWARDS_APP_URL}
                onClick={(e: React.MouseEvent) => {
                  if (returnUrl) {
                    e.preventDefault()
                    window.location.assign(returnToWithRedeemEvent() ?? returnUrl)
                  }
                }}
                aria-label="Back to LBG Rewards Portal"
                sx={{
                  width: 36,
                  height: 36,
                  flexShrink: 0,
                  borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  textDecoration: 'none',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' },
                  '&:focus-visible': { outline: '2px solid #fff', outlineOffset: 2 },
                }}
              >
                <ArrowLeft size={17} />
              </Box>
              <Box
                component="img"
                src="/images/logo-white.svg"
                alt="Cavendish Online"
                sx={{ width: 124, height: 'auto', display: 'block', mt: 4 }}
              />
            </Stack>

            <Stack direction="row" spacing="6px" sx={{ alignItems: 'center', color: '#fff' }}>
              <Lock size={13} />
              <Typography sx={{ color: '#fff', fontSize: 12.5, fontWeight: 600, fontFamily: FONT }}>
                Secure checkout
              </Typography>
            </Stack>
          </Stack>

          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: '-20px',
              height: 60,
              backgroundImage: 'url(/images/nav.svg)',
              backgroundRepeat: 'repeat-x',
              backgroundSize: 'auto 100%',
              pointerEvents: 'none',
            }}
          />
        </Box>
      </header>

      <Box
        component="main"
        sx={{
          maxWidth: 430,
          mx: 'auto',
          width: '100%',
          px: '20px',
          flex: 1,
          pb: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        <Stack spacing="18px" sx={{ alignItems: 'center', pt: '40px', textAlign: 'center' }}>
          <SuccessIcon />
          <Typography
            variant="h1"
            sx={{ fontFamily: FONT, fontSize: 28, fontWeight: 700, color: C.textPrimary, m: 0 }}
          >
            Payment Successful!
          </Typography>
          <Typography sx={{ fontFamily: FONT, fontSize: 16, color: C.textSecondary, maxWidth: 300, lineHeight: 1.55 }}>
            A copy of your order confirmation has been sent to your registered email address.
          </Typography>
        </Stack>

        <Box
          component="ol"
          aria-label="Purchase progress: all steps completed"
          sx={{
            listStyle: 'none',
            display: 'flex',
            m: 0,
            p: '8px',
            '& > li:not(:first-of-type)::before': {
              content: '""',
              position: 'absolute',
              top: 17,
              right: 'calc(50% + 26px)',
              width: '52px',
              height: '2px',
              borderRadius: 2,
              bgcolor: C.primary,
            },
          }}
        >
          {STEPS.map((s) => (
            <CompletedStep key={s.title} title={s.title} subtitle={s.subtitle} />
          ))}
        </Box>

        <Box sx={{ bgcolor: C.white, border: `1px solid ${C.border}`, borderRadius: '20px', p: '24px' }}>
          <Typography
            component="h2"
            sx={{ fontFamily: FONT, fontSize: 22, fontWeight: 700, color: C.textPrimary, m: 0, mb: '18px' }}
          >
            Order Details
          </Typography>

          <Box component="dl" sx={{ m: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <DetailRow label="Order Reference" value={ORDER_REFERENCE} />
            <DetailRow label="Date" value={ORDER_DATE} />
          </Box>

          <Box sx={{ borderTop: `1px solid ${C.border}`, my: '24px' }} role="presentation" />

          <Typography
            component="h2"
            sx={{ fontFamily: FONT, fontSize: 22, fontWeight: 700, color: C.textPrimary, m: 0, mb: '18px' }}
          >
            Payment Details
          </Typography>

          <Box component="dl" sx={{ m: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <DetailRow label="Subtotal" value={`£${SUBTOTAL.toFixed(2)}`} />

            <Box>
              <Stack direction="row" spacing="12px" sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Typography component="dt" sx={{ fontFamily: FONT, fontSize: 14, fontWeight: 500, color: C.textSecondary }}>
                  Savings using LBG Coins
                </Typography>
                <Typography component="dd" sx={{ fontFamily: FONT, fontSize: 15, fontWeight: 700, color: GREEN_TEXT, m: 0 }}>
                  -£{COIN_DISCOUNT.toFixed(2)}
                </Typography>
              </Stack>
              <Stack direction="row" spacing="8px" sx={{ justifyContent: 'space-between', alignItems: 'center', mt: '6px' }}>
                <Typography sx={{ fontFamily: FONT, fontSize: 13, color: C.textSecondary }}>
                  {COINS_APPLIED.toLocaleString('en-GB')} Coins applied
                </Typography>
                {/* <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    bgcolor: C.successLight,
                    color: GREEN_TEXT,
                    borderRadius: '999px',
                    px: '10px',
                    py: '3px',
                    fontFamily: FONT,
                    fontSize: 12.5,
                    fontWeight: 700,
                  }}
                >
                  +{COINS_EARNED} Coins earned
                </Box> */}
              </Stack>
            </Box>
          </Box>

          <Box sx={{ borderTop: `1px solid ${C.border}`, my: '20px' }} role="presentation" />

          <Stack direction="row" spacing="12px" sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Typography sx={{ fontFamily: FONT, fontSize: 16, fontWeight: 700, color: C.textPrimary }}>
              Final Amount Paid
            </Typography>
            <Typography sx={{ fontFamily: FONT, fontSize: 26, fontWeight: 700, color: C.textPrimary }}>
              £{FINAL_PAID.toFixed(2)}
            </Typography>
          </Stack>
        </Box>

        <Stack spacing="12px">
          <Box
            component="button"
            onClick={() => window.print()}
            sx={{
              width: '100%',
              minHeight: 56,
              borderRadius: '16px',
              border: 'none',
              cursor: 'pointer',
              bgcolor: C.primary,
              color: '#fff',
              fontFamily: FONT,
              fontSize: 16,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'background .15s ease',
              '&:hover': { bgcolor: C.primaryDark },
              '&:focus-visible': { outline: `3px solid ${C.primaryDark}`, outlineOffset: 2 },
            }}
          >
            <Download size={18} />
            Download Policy Document
          </Box>
          <Box
            component="button"
            onClick={() => {
              if (returnUrl) {
                window.location.assign(returnToWithRedeemEvent() ?? returnUrl)
                return
              }
              try {
                const url = new URL(REWARDS_APP_URL)
                const crossAppEvents = JSON.stringify([{
                  id: `evt_${Date.now()}`,
                  type: 'REDEEM',
                  description: `Redeemed ${COINS_APPLIED.toLocaleString('en-GB')} LBG coins at Cavendish Online`,
                  amount: -COINS_APPLIED,
                  currency: 'LBG_COIN',
                  createdAt: new Date().toISOString(),
                  source: 'Cavendish Online',
                }])
                url.searchParams.set('cross_app_events', crossAppEvents)
                window.location.href = url.toString()
              } catch {
                window.location.href = REWARDS_APP_URL
              }
            }}
            sx={{
              width: '100%',
              minHeight: 56,
              borderRadius: '16px',
              border: `2px solid ${C.primary}`,
              cursor: 'pointer',
              bgcolor: 'transparent',
              color: C.primary,
              fontFamily: FONT,
              fontSize: 16,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'background .15s ease, color .15s ease',
              '&:hover': { bgcolor: C.primary, color: '#fff' },
              '&:focus-visible': { outline: `3px solid ${C.primaryDark}`, outlineOffset: 2 },
            }}
          >
            <Gift size={18} />
              {returnUrl ? 'Return to workspace' : 'LBG Rewards App'}
          </Box>
          {returnUrl ? (
            <Typography sx={{ fontFamily: FONT, fontSize: 12.5, color: C.textSecondary, textAlign: 'center' }}>
              Returning to your workspace automatically in a few seconds…
            </Typography>
          ) : null}
        </Stack>

        <Stack
          direction="row"
          spacing="10px"
          sx={{
            alignItems: 'center',
            bgcolor: C.successLight,
            borderRadius: '16px',
            p: '14px 16px',
          }}
        >
          <ShieldCheck size={22} color={GREEN_TEXT} style={{ flexShrink: 0 }} />
          <Typography sx={{ fontFamily: FONT, fontSize: 13, lineHeight: '19px', color: C.textPrimary }}>
            Your policy is active from today. Your documents are also available anytime in your account.
          </Typography>
        </Stack>
      </Box>
    </Box>
  )
}
