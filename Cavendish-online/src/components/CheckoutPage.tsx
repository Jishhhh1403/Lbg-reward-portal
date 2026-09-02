import { useEffect, useRef, useState } from 'react'
import { Box, Stack, Typography } from '@mui/material'
import { fontFamily as FONT } from '../theme'
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  ChevronRight,
  CreditCard,
  FileText,
  Gift,
  Headphones,
  Landmark,
  Lock,
  ShieldCheck,
  X,
  Zap,
} from 'lucide-react'
import { fetchCustomerSummary, payCavendish } from '../services/cavendishApi'

const C = {
  primary: '#D10A74',
  primaryDark: '#B4005E',
  tint: '#f8f7f9',
  green: '#1FA967',
  warning: '#F4B400',
  textPrimary: '#2D2F4A',
  textSecondary: '#6B6F86',
  border: '#ECECF4',
}

// FONT comes from the shared theme so the whole app renders one font family

const ANNUAL_PREMIUM = 60
const COINS_PER_POUND = 100
const DEFAULT_COIN_CAP = Math.round(ANNUAL_PREMIUM * 0.8 * COINS_PER_POUND)

const METHODS = [
  { id: 'card', title: 'Card Payment', subtitle: 'Visa, Mastercard, Amex', icon: <CreditCard size={22} color={C.primary} /> },
  { id: 'dd', title: 'Direct Debit', subtitle: 'Debited on the 1st of each month', icon: <FileText size={22} color={C.primary} /> },
  { id: 'bank', title: 'Pay by Bank', subtitle: 'Instant bank transfer via open banking', icon: <Landmark size={22} color={C.primary} /> },
  { id: 'apple', title: 'Apple Pay', subtitle: 'Pay with Touch ID or Face ID', icon: <AppleLogo /> },
]

function AppleLogo() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill={C.primary} aria-hidden>
      <path d="M17.05 12.54c-.03-2.89 2.36-4.27 2.47-4.34-1.35-1.97-3.44-2.24-4.18-2.27-1.78-.18-3.47 1.05-4.37 1.05-.9 0-2.29-1.02-3.77-1-1.94.03-3.72 1.13-4.72 2.86-2.01 3.49-.51 8.66 1.45 11.5.96 1.39 2.1 2.95 3.6 2.9 1.45-.06 1.99-.93 3.74-.93s2.24.93 3.77.9c1.56-.03 2.55-1.41 3.5-2.81 1.1-1.61 1.56-3.17 1.58-3.25-.04-.02-3.03-1.16-3.07-4.61zM14.16 4.06c.79-.96 1.33-2.29 1.18-3.62-1.14.05-2.53.76-3.35 1.72-.73.85-1.38 2.21-1.21 3.51 1.28.1 2.58-.65 3.38-1.61z" />
    </svg>
  )
}

const formatCardNumber = (v: string) =>
  v.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ')

const formatExpiry = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 4)
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
}

interface CardData {
  number: string
  expiry: string
  cvv: string
}

function luhnValid(digits: string) {
  let sum = 0
  let alt = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i])
    if (alt) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
    alt = !alt
  }
  return digits.length > 0 && sum % 10 === 0
}

function isCardComplete(c: CardData) {
  const digits = c.number.replace(/\D/g, '')
  const m = /^(\d{2})\/(\d{2})$/.exec(c.expiry)
  const expOk =
    !!m && Number(m[1]) >= 1 && Number(m[1]) <= 12 && Number(`20${m[2]}`) >= 2026
  return (
    digits.length === 16 &&
    luhnValid(digits) &&
    expOk &&
    /^\d{3,4}$/.test(c.cvv)
  )
}

function CardDetailsModal({
  open,
  onClose,
  saved,
  onSave,
}: {
  open: boolean
  onClose: () => void
  saved?: CardData | null
  onSave: (c: CardData) => void
}) {
  const [number, setNumber] = useState('4242 4242 4242 4242')
  const [expiry, setExpiry] = useState('12/36')
  const [cvv, setCvv] = useState('654')

  useEffect(() => {
    if (open) {
      setNumber(saved?.number ?? '4242 4242 4242 4242')
      setExpiry(saved?.expiry ?? '12/36')
      setCvv(saved?.cvv ?? '654')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const fieldSx = {
    width: '100%',
    height: 56,
    borderRadius: '12px',
    border: `1px solid #E8EAF2`,
    bgcolor: '#fff',
    px: '16px',
    fontFamily: FONT,
    fontSize: 15,
    color: C.textPrimary,
    outline: 'none',
    '&::placeholder': { color: '#A0A4B8' },
    '&:focus': { borderColor: '#77B8FF', boxShadow: 'inset 0 0 0 1px #77B8FF' },
    '&:focus-visible': { outline: 'none' },
  }

  const labelSx = {
    display: 'block',
    fontFamily: FONT,
    fontSize: 16,
    fontWeight: 500,
    color: C.textPrimary,
    mb: '8px',
  }

  return (
    <Box
      role="dialog"
      aria-modal="true"
      aria-labelledby="card-modal-title"
      onClick={onClose}
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        bgcolor: 'rgba(0,0,0,0.35)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: '20px',
      }}
    >
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          position: 'relative',
          width: '88%',
          maxWidth: 400,
          maxHeight: '90vh',
          overflowY: 'auto',
          bgcolor: '#fff',
          borderRadius: '20px',
          p: '24px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
        }}
      >
        <Box
          component="button"
          aria-label="Close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 18,
            right: 18,
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'transparent',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            color: '#7A7D91',
            '&:hover': { bgcolor: '#F3F4F9' },
            '&:focus-visible': { outline: `2px solid ${C.primary}`, outlineOffset: 2 },
          }}
        >
          <X size={24} />
        </Box>

        <Typography
          id="card-modal-title"
          sx={{ fontFamily: FONT, fontSize: 24, fontWeight: 700, color: C.textPrimary, pr: '36px', mb: '8px' }}
        >
          Enter card details
        </Typography>

        <Box component="form" onSubmit={(e) => e.preventDefault()} noValidate>
          <Box sx={{ mb: '16px' }}>
            <Typography component="label" htmlFor="cc-number" sx={labelSx}>
              Card number
            </Typography>
            <Box
              component="input"
              id="cc-number"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={number}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNumber(formatCardNumber(e.target.value))}
              placeholder="1234 5678 9012 3456"
              sx={fieldSx}
            />
          </Box>

          <Stack direction="row" spacing="16px" sx={{ mb: '24px' }}>
            <Box sx={{ flex: 1 }}>
              <Typography component="label" htmlFor="cc-exp" sx={labelSx}>
                Expiry
              </Typography>
              <Box
                component="input"
                id="cc-exp"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={expiry}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExpiry(formatExpiry(e.target.value))}
                placeholder="MM/YY"
                sx={fieldSx}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography component="label" htmlFor="cc-cvv" sx={labelSx}>
                CVV
              </Typography>
              <Box
                component="input"
                id="cc-cvv"
                type="password"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={cvv}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="123"
                sx={fieldSx}
              />
            </Box>
          </Stack>

          <Box
            component="button"
            type="submit"
            onClick={() => {
              onSave({ number, expiry, cvv })
              onClose()
            }}
            sx={{
              width: '100%',
              height: 56,
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              bgcolor: C.primary,
              color: '#fff',
              fontFamily: FONT,
              fontSize: 18,
              fontWeight: 700,
              transition: 'background .15s ease',
              '&:hover': { bgcolor: C.primaryDark },
              '&:focus-visible': { outline: '2px solid #77B8FF', outlineOffset: 2 },
            }}
          >
            Use this card
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ bgcolor: '#fff', border: `1px solid ${C.border}`, borderRadius: '16px', p: '20px' }}>{children}</Box>
  )
}

function StepCircle({
  state,
  label,
  index,
}: {
  state: 'done' | 'active' | 'todo'
  label: string
  index: number
}) {
  return (
    <Stack spacing="6px" component="li" sx={{ flex: 1, m: 0, alignItems: 'center', position: 'relative' }}>
      <Box
        aria-current={state === 'active' ? 'step' : undefined}
        sx={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          fontWeight: 700,
          fontFamily: FONT,
          ...(state === 'done' && { bgcolor: C.primary, color: '#fff' }),
          ...(state === 'active' && { bgcolor: C.primary, color: '#fff', outline: '3px solid #dcd8df' }),
          ...(state === 'todo' && { bgcolor: C.border, color: C.textSecondary }),
        }}
      >
        {state === 'done' ? <Check size={15} strokeWidth={3.5} /> : index}
      </Box>
      <Typography
        sx={{
          fontFamily: FONT,
          fontSize: 11.5,
          fontWeight: state === 'todo' ? 500 : 700,
          color: state === 'todo' ? C.textSecondary : C.textPrimary,
        }}
      >
        {label}
      </Typography>
    </Stack>
  )
}


function PaymentFailedModal({ open, onClose, message }: { open: boolean; onClose: () => void; message?: string }) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'Tab' && rootRef.current) {
        const focusables = Array.from(
          rootRef.current.querySelectorAll<HTMLElement>('button, [href], input, [tabindex]:not([tabindex="-1"])'),
        ).filter((el) => !el.hasAttribute('disabled'))
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    const t = setTimeout(() => {
      const btn = rootRef.current?.querySelector<HTMLElement>('button')
      btn?.focus()
    }, 30)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      clearTimeout(t)
    }
  }, [open, onClose])

  if (!open) return null

  const REASSURANCE = [
    'No funds have been debited from your bank account.',
    'No LBG Coins have been deducted from your balance.',
  ]

  return (
    <Box
      ref={rootRef}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="fail-modal-title"
      aria-describedby="fail-modal-msg"
      onClick={onClose}
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 210,
        bgcolor: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: '20px',
      }}
    >
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          position: 'relative',
          width: '85%',
          maxWidth: 380,
          maxHeight: '90vh',
          overflowY: 'auto',
          bgcolor: '#fff',
          borderRadius: '16px',
          p: '28px 24px 24px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
          textAlign: 'center',
        }}
      >
        <Box
          component="button"
          aria-label="Close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'transparent',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            color: '#8F95A8',
            '&:hover': { bgcolor: '#F3F4F9' },
            '&:focus-visible': { outline: `2px solid ${C.primary}`, outlineOffset: 2 },
          }}
        >
          <X size={20} />
        </Box>

        <Box
          aria-hidden
          sx={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            bgcolor: '#FDECEA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: '16px',
          }}
        >
          <X size={26} color="#C62828" strokeWidth={2.5} />
        </Box>

        <Typography
          id="fail-modal-title"
          sx={{ fontFamily: FONT, fontSize: 21, fontWeight: 700, color: C.textPrimary, pr: '8px', mb: '8px', lineHeight: 1.25 }}
        >
          Transaction Unsuccessful
        </Typography>

        <Typography
          id="fail-modal-msg"
          sx={{ fontFamily: FONT, fontSize: 14.5, color: C.textSecondary, lineHeight: 1.55, mb: '22px' }}
        >
          {message || 'We were unable to verify the card details provided. Please check your information and try again.'}
        </Typography>

        <Stack spacing="10px" sx={{ mb: '24px', textAlign: 'left' }}>
          {REASSURANCE.map((r) => (
            <Stack key={r} direction="row" spacing="10px" sx={{ alignItems: 'center' }}>
              <Box
                sx={{
                  flexShrink: 0,
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  bgcolor: C.green,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Check size={13} strokeWidth={3.5} color="#fff" />
              </Box>
              <Typography sx={{ fontFamily: FONT, fontSize: 14, fontWeight: 500, color: C.textPrimary, lineHeight: 1.4 }}>
                {r}
              </Typography>
            </Stack>
          ))}
        </Stack>

        <Box
          component="button"
          onClick={onClose}
          sx={{
            width: '100%',
            minHeight: 48,
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            bgcolor: C.primary,
            color: '#fff',
            fontFamily: FONT,
            fontSize: 15,
            fontWeight: 700,
            transition: 'background .15s ease',
            '&:hover': { bgcolor: C.primaryDark },
            '&:focus-visible': { outline: `3px solid ${C.primaryDark}`, outlineOffset: 2 },
          }}
        >
          Try Again
        </Box>
      </Box>
    </Box>
  )
}

const PROCESS_STEPS = [
  'Contacting your bank',
  'Verifying payment',
  'Activating your policy',
]

function PaymentProcessingModal({ open }: { open: boolean }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const timers = [
      setTimeout(() => setStep(1), 900),
      setTimeout(() => setStep(2), 1800),
      setTimeout(() => {
        window.location.hash = '#/success'
      }, 2900),
    ]
    return () => {
      timers.forEach(clearTimeout)
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    <Box
      role="alertdialog"
      aria-modal="true"
      aria-label="Processing payment"
      aria-busy="true"
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 220,
        bgcolor: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: '20px',
      }}
    >
      <Box
        sx={{
          width: '85%',
          maxWidth: 380,
          bgcolor: '#fff',
          borderRadius: '20px',
          p: '28px 24px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
          textAlign: 'center',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: 72,
            height: 72,
            mx: 'auto',
            mb: '22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: `4px solid ${C.tint}`,
              borderTopColor: C.primary,
              animation: 'cav-spin 0.9s linear infinite',
            },
            '@keyframes cav-spin': {
              to: { transform: 'rotate(360deg)' },
            },
          }}
        >
          <Lock size={26} color={C.primary} />
        </Box>

        <Typography sx={{ fontFamily: FONT, fontSize: 21, fontWeight: 700, color: C.textPrimary, mb: '6px' }}>
          Processing payment…
        </Typography>
        <Typography sx={{ fontFamily: FONT, fontSize: 14, color: C.textSecondary, lineHeight: 1.5, mb: '22px' }}>
          Please don’t close this window while we complete your purchase.
        </Typography>

        <Stack spacing="12px" role="list" aria-label="Payment progress">
          {PROCESS_STEPS.map((label, i) => {
            const state = i < step ? 'done' : i === step ? 'active' : 'todo'
            return (
              <Stack
                key={label}
                direction="row"
                spacing="12px"
                sx={{ alignItems: 'center', minHeight: 32, opacity: state === 'todo' ? 0.55 : 1 }}
              >
                <Box
                  sx={{
                    flexShrink: 0,
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    ...(state === 'done' && { bgcolor: C.green }),
                    ...(state === 'active' && {
                      bgcolor: C.tint,
                      '&::before': {
                        content: '""',
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: C.primary,
                        animation: 'cav-pulse 0.9s ease-in-out infinite alternate',
                      },
                      '@keyframes cav-pulse': {
                        from: { transform: 'scale(0.7)', opacity: 0.5 },
                        to: { transform: 'scale(1.15)', opacity: 1 },
                      },
                    }),
                    ...(state === 'todo' && { bgcolor: C.border }),
                  }}
                >
                  {state === 'done' && <Check size={15} strokeWidth={3.5} color="#fff" />}
                </Box>
                <Typography
                  sx={{
                    fontFamily: FONT,
                    fontSize: 15,
                    fontWeight: state === 'todo' ? 500 : 700,
                    color: state === 'done' ? C.green : state === 'active' ? C.textPrimary : C.textSecondary,
                  }}
                >
                  {label}
                  {state === 'done' && ' ✓'}
                </Typography>
              </Stack>
            )
          })}
        </Stack>
      </Box>
    </Box>
  )
}

export default function CheckoutPage() {
  const [coins, setCoins] = useState(600)
  const [appliedCoins, setAppliedCoins] = useState(0)
  const [method, setMethod] = useState('card')
  const [cardModalOpen, setCardModalOpen] = useState(false)
  const [card, setCard] = useState<CardData | null>(null)
  const [failOpen, setFailOpen] = useState(false)
  const [failMessage, setFailMessage] = useState('')
  const [processing, setProcessing] = useState(false)

  const [coinBalance, setCoinBalance] = useState(0)
  const [customerEmail, setCustomerEmail] = useState('')
  const [_customerId, setCustomerId] = useState('')
  const [balanceLoading, setBalanceLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')

  const coinCap = Math.min(DEFAULT_COIN_CAP, coinBalance)

  const discount = appliedCoins / COINS_PER_POUND
  const payable = Math.max(ANNUAL_PREMIUM - discount, 0)
  const rewardCoins = Math.round(payable * 5)
  const fillPct = coinCap > 0 ? (coins / coinCap) * 100 : 0

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const email = params.get('customerEmail') ?? params.get('email') ?? localStorage.getItem('am_customer_email') ?? ''
    if (email) {
      setCustomerEmail(email)
      localStorage.setItem('am_customer_email', email)
      setBalanceLoading(true)
      fetchCustomerSummary(email)
        .then((data) => {
          if (data) {
            setCoinBalance(data.totalLbgPoints ?? 0)
            setCustomerId(data.customerId ?? '')
          } else {
            setCoinBalance(0)
          }
        })
        .catch(() => {
          setCoinBalance(0)
        })
        .finally(() => setBalanceLoading(false))
    } else {
      setCoinBalance(0)
      setBalanceLoading(false)
    }
  }, [])

  useEffect(() => {
    if (coinBalance > 0 && coins > coinCap) {
      setCoins(coinCap)
    }
  }, [coinBalance, coinCap, coins])

  const onPay = () => {
    if (method === 'card' && (!card || !isCardComplete(card))) {
      setFailOpen(true)
      setFailMessage('We were unable to verify the card details provided. Please check your information and try again.')
      return
    }
    if (appliedCoins > 0 && !customerEmail) {
      setFailOpen(true)
      setFailMessage('No customer account found. Please sign in to the LBG Rewards app first, then return to Cavendish to pay.')
      return
    }
    if (!customerEmail) {
      setFailOpen(true)
      setFailMessage('Please sign in to the LBG Rewards app first to use your coins.')
      return
    }
    setPayError('')
    setPaying(true)

    payCavendish({
      customer_email: customerEmail,
      coins_to_redeem: appliedCoins,
      payment_amount_gbp: payable,
      payment_method: method,
    })
      .then((result) => {
        const checkoutData = {
          subtotal: ANNUAL_PREMIUM,
          coinsApplied: appliedCoins,
          coinDiscount: result.coinDiscount,
          coinsEarned: result.coinsEarned,
          finalPaid: result.amountPayable,
          transactionId: result.transactionId,
          updatedLbgPoints: result.updatedLbgPoints,
          paymentMethod: method,
        }
        sessionStorage.setItem('cavendish_checkout', JSON.stringify(checkoutData))
        setCoinBalance(result.updatedLbgPoints)
        setProcessing(true)
      })
      .catch((err) => {
        setPayError(err.message || 'Payment failed. Please try again.')
        setPaying(false)
      })
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f6f5f8', display: 'flex', flexDirection: 'column' }}>
      <header>
        <Box
          sx={{
            bgcolor: '#840544',
            width: '100%',
            position: 'relative',
          }}
        >
          <Stack
            direction="row"
            sx={{
              maxWidth: 430,
              mx: 'auto',
              width: '100%',
              px: '20px',
              height: 128,
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <Stack direction="row" spacing="12px" sx={{ alignItems: 'center' ,marginTop: '9px'}}>
              <Box
                component="a"
                href="#/policy"
                aria-label="Back to policy"
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
                  '&:focus-visible': { outline: '2px solid #fff', outlineOffset: 2 },
                }}
              >
                <ArrowLeft size={17} />
              </Box>
              <Box
                component="img"
                src="/images/logo-white.svg"
                alt="Cavendish Online"
                sx={{ width: 124, height: 'auto', display: 'block', mt: '4px' }}
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
              zIndex: 1,
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
          pb: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <Box
          component="ol"
          sx={{
            listStyle: 'none',
            display: 'flex',
            m: 0,
            p: '44px 8px 6px',
            '& > li:not(:first-of-type)::before': {
              content: '""',
              position: 'absolute',
              top: 15,
              left: 'calc(-50% + 26px)',
              right: 'calc(50% + 26px)',
              height: '2px',
              borderRadius: 2,
              bgcolor: C.border,
            },
          }}
        >
          <StepCircle state="done" label="Your plan" index={1} />
          <StepCircle state="active" label="Payment" index={2} />
          <StepCircle state="todo" label="Confirmed" index={3} />
        </Box>

        <Card>
          <Stack direction="row" sx={{ mb: '10px', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontFamily: FONT, fontSize: 15, fontWeight: 700, color: C.textPrimary }}>LBG Coins</Typography>
            <BadgeCheck size={18} color={C.primary} />
          </Stack>

          <Typography sx={{ fontFamily: FONT, fontSize: 18, fontWeight: 800, color: C.primary, lineHeight: 1.1 }}>
            {balanceLoading ? (
              'Loading…'
            ) : (
              <>
                {coinBalance.toLocaleString('en-GB')}{' '}
                <span style={{ fontSize: 18, fontWeight: 600, color: C.textSecondary }}>
                  coins ≈ £{(coinBalance / COINS_PER_POUND).toFixed(2)}
                </span>
              </>
            )}
          </Typography>

          <Box
            component="input"
            type="range"
            min={0}
            max={coinCap}
            step={50}
            value={coins}
            aria-label="Select coins to redeem"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCoins(Number(e.target.value))}
            disabled={balanceLoading}
            sx={{
              width: '100%',
              mt: '18px',
              mb: '4px',
              appearance: 'none',
              height: '6px',
              borderRadius: '6px',
              background: `linear-gradient(to right, ${C.primary} ${fillPct}%, ${C.tint} ${fillPct}%)`,
              outline: 'none',
              cursor: 'pointer',
              '&::-webkit-slider-thumb': {
                appearance: 'none',
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#fff',
                border: `3px solid ${C.primary}`,
                boxShadow: '0 1px 4px rgba(45,47,74,.25)',
              },
              '&::-moz-range-thumb': {
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#fff',
                border: `3px solid ${C.primary}`,
                boxShadow: '0 1px 4px rgba(45,47,74,.25)',
              },
              '&:focus-visible': { outline: `2px solid ${C.primaryDark}`, outlineOffset: 4 },
            }}
          />

          <Stack direction="row" sx={{ mt: '10px', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontFamily: FONT, fontSize: 10, lineHeight: '17px', color: C.textSecondary, flex: '1 1 auto', minWidth: 0 }}>
              Balance <strong style={{ color: C.textPrimary }}>{coinBalance.toLocaleString('en-GB')}</strong> | Cap{' '}
              <strong style={{ color: C.textPrimary }}>{coinCap.toLocaleString('en-GB')}</strong> | {COINS_PER_POUND} coins = £1
            </Typography>
            <Box
              component="button"
              onClick={() => setAppliedCoins(appliedCoins === coins ? 0 : coins)}
              disabled={balanceLoading || coinBalance === 0}
              sx={{
                flexShrink: 0,
                cursor: 'pointer',
                minHeight: 44,
                px: '20px',
                borderRadius: '12px',
                border: `1.5px solid ${C.primary}`,
                background: appliedCoins === coins ? C.tint : 'transparent',
                color: appliedCoins === coins ? C.primaryDark : C.primary,
                fontFamily: FONT,
                fontSize: 13.5,
                fontWeight: 700,
                transition: 'background .15s ease',
                '&:hover': { background: C.tint },
                '&:focus-visible': { outline: `2px solid ${C.primaryDark}`, outlineOffset: 2 },
                '&:disabled': { opacity: 0.5, cursor: 'not-allowed' },
              }}
            >
              {appliedCoins === coins ? 'Applied ✓' : 'Apply'}
            </Box>
          </Stack>
        </Card>

        <Card>
          <Typography sx={{ fontFamily: FONT, fontSize: 15, fontWeight: 700, color: C.textPrimary, mb: '14px' }}>
            Payment summary
          </Typography>
          {[
            { label: 'Annual Premium', value: `£${ANNUAL_PREMIUM.toFixed(2)}`, strong: false },
            { label: `Coin Discount${appliedCoins ? ` (${appliedCoins.toLocaleString('en-GB')} coins)` : ''}`, value: discount ? `- £${discount.toFixed(2)}` : '- £0.00', strong: false, green: !!discount },
            { label: 'Amount Payable', value: `£${payable.toFixed(2)}`, strong: true },
          ].map((r, i) => (
            <Stack
              key={r.label}
              direction="row"
              sx={{
                py: r.strong ? '16px' : '12px',
                mt: r.strong ? '2px' : 0,
                justifyContent: 'space-between',
                alignItems: 'baseline',
                borderTop: i === 0 ? 'none' : r.strong ? `1px solid ${C.border}` : `1px solid ${C.border}`,
              }}
            >
              <Typography sx={{ fontFamily: FONT, fontSize: 13.5, fontWeight: r.strong ? 700 : 500, color: r.strong ? C.textPrimary : C.textSecondary }}>
                {r.label}
              </Typography>
              <Typography
                sx={{
                  fontFamily: FONT,
                  fontSize: r.strong ? 19 : 14,
                  lineHeight: 1.1,
                  fontWeight: r.strong ? 800 : 700,
                  color: r.green ? C.green : r.strong ? C.textPrimary : C.textPrimary,
                }}
              >
                {r.value}
              </Typography>
            </Stack>
          ))}
        </Card>

        <Card>
          <Typography sx={{ fontFamily: FONT, fontSize: 15, fontWeight: 700, color: C.textPrimary, mb: '6px' }}>
            Payment method
          </Typography>
          <Box role="radiogroup" aria-label="Payment method">
            {METHODS.map((m) => {
              const selected = method === m.id
              return (
                <Box
                  key={m.id}
                  role="radio"
                  aria-checked={selected}
                  tabIndex={0}
                  onClick={() => {
                    setMethod(m.id)
                    if (m.id === 'card') setCardModalOpen(true)
                  }}
                  onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setMethod(m.id)
                      if (m.id === 'card') setCardModalOpen(true)
                    }
                  }}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    minHeight: 72,
                    px: '14px',
                    my: '8px',
                    borderRadius: '14px',
                    border: `1px solid ${selected ? C.primary : C.border}`,
                    boxShadow: selected ? `inset 0 0 0 1px ${C.primary}` : 'none',
                    bgcolor: selected ? C.tint : '#fff',
                    cursor: 'pointer',
                    transition: 'all .15s ease',
                    '&:hover': { borderColor: C.primary },
                    '&:focus-visible': { outline: `2px solid ${C.primaryDark}`, outlineOffset: 2 },
                  }}
                >
                  {m.icon}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontFamily: FONT, fontSize: 14.5, fontWeight: 700, color: C.textPrimary }}>
                      {m.title}
                    </Typography>
                    <Typography sx={{ fontFamily: FONT, fontSize: 12, color: C.textSecondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {m.subtitle}
                    </Typography>
                  </Box>
                  {selected ? (
                    <Box sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={13} strokeWidth={3.5} color="#fff" />
                    </Box>
                  ) : (
                    <ChevronRight size={18} color={C.textSecondary} />
                  )}
                </Box>
              )
            })}
          </Box>
        </Card>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            bgcolor: C.tint,
            borderRadius: '14px',
            p: '16px 18px',
          }}
        >
          <Box
            sx={{
              flexShrink: 0,
              width: 42,
              height: 42,
              borderRadius: '50%',
              bgcolor: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Gift size={22} color={C.primary} />
          </Box>
          <Typography sx={{ fontFamily: FONT, fontSize: 13.5, lineHeight: '20px', color: C.textPrimary }}>
            After payment – You will earn{' '}
            <strong style={{ color: C.primary, fontSize: 15 }}>{rewardCoins.toLocaleString('en-GB')} LBG Coins</strong>{' '}
            to spend on your next renewal.
          </Typography>
        </Box>

        <Stack direction="row" spacing="8px" sx={{ py: '2px' }}>
          {[
            { icon: <ShieldCheck size={18} color={C.primary} />, caption: 'SSL secure payment' },
             { icon: <Zap size={18} color={C.primary} />, caption: 'Instant confirmation' },
           { icon: <Lock size={18} color={C.primary} />, caption: 'Data protection' },
           { icon: <Headphones size={18} color={C.primary} />, caption: 'Help & support' },
          ].map((t) => (
            <Stack key={t.caption} spacing="6px" sx={{ flex: 1, textAlign: 'center', alignItems: 'center', minWidth: 0 }}>
              {t.icon}
              <Typography sx={{ fontFamily: FONT, fontSize: 11, lineHeight: '14px', fontWeight: 600, color: C.textSecondary }}>
                {t.caption}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Box>

      <footer>
        <Box
          sx={{
            position: 'sticky',
            bottom: 0,
            bgcolor: '#fff',
            borderTop: `1px solid ${C.border}`,
            px: '20px',
            pt: '14px',
            pb: '12px',
            boxShadow: '0 -8px 24px rgba(45,47,74,.08)',
          }}
        >
          <Box sx={{ maxWidth: 430, mx: 'auto', width: '100%' }}>
            {payError && (
              <Typography sx={{ fontFamily: FONT, fontSize: 13, color: '#C62828', mb: '8px', textAlign: 'center' }}>
                {payError}
              </Typography>
            )}
            <Box
              component="button"
              onClick={onPay}
              disabled={paying || processing}
              aria-label={`Pay £${payable.toFixed(2)} now`}
              sx={{
                width: '100%',
                height: 54,
                borderRadius: '14px',
                bgcolor: C.primary,
                color: '#fff',
                border: 'none',
                cursor: paying || processing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                fontFamily: FONT,
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: '.2px',
                transition: 'background .15s ease',
                opacity: paying || processing ? 0.7 : 1,
                '&:hover': { bgcolor: C.primaryDark },
                '&:focus-visible': { outline: `3px solid ${C.primaryDark}`, outlineOffset: 2 },
              }}
            >
              <Lock size={16} />
              {paying ? 'Processing…' : `Pay £${payable.toFixed(2)}`}
            </Box>
            <Typography sx={{ fontFamily: FONT, fontSize: 11.5, textAlign: 'center', mt: '9px', color: C.textSecondary, lineHeight: '17px' }}>
              By tapping Pay, you agree to our{' '}
              <Box component="a" href="#/" sx={{ color: C.primary, fontWeight: 600 }}>Terms &amp; Conditions</Box> and{' '}
              <Box component="a" href="#/" sx={{ color: C.primary, fontWeight: 600 }}>Privacy Policy</Box>.
            </Typography>
          </Box>
        </Box>
      </footer>

      <CardDetailsModal
        open={cardModalOpen}
        saved={card}
        onClose={() => setCardModalOpen(false)}
        onSave={(c) => setCard(c)}
      />
      <PaymentFailedModal open={failOpen} onClose={() => setFailOpen(false)} message={failMessage} />
      <PaymentProcessingModal open={processing} />
    </Box>
  )
}
