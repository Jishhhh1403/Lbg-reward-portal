import { Box, Stack, Typography } from '@mui/material'
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  CreditCard,
  FileText,
  ShieldCheck,
} from 'lucide-react'
import { Shell } from './ui'

const POLICY = {
  holder: 'Alex Morgan',
  firstName: 'Alex',
  number: 'CVL-2026-084721',
  type: 'Term Life Insurance',
  cover: '£150,000',
  term: '20 years (12 August 2046)',
  start: '12 August 2025',
  premium: '£60.00',
  dueDate: '20 September 2026',
  dueAmount: '£60.00',
  insurer: 'BrightLife Assurance',
  directDebit: '•••• 4421',
  status: 'Payment due',
}

const HISTORY = [
  { date: '1 August 2026', amount: '£60.00', status: 'Paid' },
  { date: '1 July 2026', amount: '£60.00', status: 'Paid' },
  { date: '1 June 2026', amount: '£60.00', status: 'Paid' },
]

const CARD = {
  bgcolor: '#fff',
  border: '1px solid #eae7eb',
  borderRadius: '12px',
}

function goCheckout() {
  window.location.hash = '#/checkout'
}

const FIELDS: { label: string; value: React.ReactNode }[] = [
  { label: 'Policyholder', value: POLICY.holder },
  { label: 'Policy number', value: POLICY.number },
  { label: 'Cover type', value: POLICY.type },
  { label: 'Cover amount', value: POLICY.cover },
  { label: 'Policy term', value: POLICY.term },
  { label: 'Policy start', value: POLICY.start },
  { label: 'Premium', value: POLICY.premium },
  { label: 'Payment method', value: `Direct Debit ${POLICY.directDebit}` },
]

export default function PolicyPage() {
  const paid = false

  return (
    <Box sx={{ bgcolor: '#f8f7f9', pb: '64px' }}>
      <Shell sx={{ pt: '28px' }}>
        <Box
          component="a"
          href="#/"
          aria-label="Back to home"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: '#670539',
            fontSize: 13.5,
            fontWeight: 700,
            textDecoration: 'none',
            mb: '14px',
            '&:hover': { color: '#aa8094' },
          }}
        >
          <ArrowLeft size={16} strokeWidth={3} />
          Back
        </Box>

        <Stack
          direction="row"
          sx={{ mb: '18px', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}
        >
          <Box>
            <Typography sx={{ color: '#706f6f', fontSize: 12.5, fontWeight: 700, letterSpacing: '.24px', textTransform: 'uppercase', mb: '4px' }}>
              Your account
            </Typography>
            <Typography component="h1" sx={{ color: '#191919', fontSize: { xs: 26, md: 32 }, fontWeight: 700, letterSpacing: '.3px', lineHeight: 1.15 }}>
              Hello, {POLICY.firstName}
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              bgcolor: 'rgba(226,99,82,.1)',
              border: '1px solid #e26352',
              borderRadius: '150px',
              px: '14px',
              py: '6px',
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '.3px',
              color: '#b3402f',
            }}
          >
            <Calendar size={14} strokeWidth={3} />
            {POLICY.status}
          </Box>
        </Stack>

        {!paid && (
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            sx={{
              alignItems: { xs: 'stretch', sm: 'center' },
              justifyContent: 'space-between',
              gap: '14px',
              bgcolor: '#fff',
              border: '1px solid #eccfbe',
              borderLeft: '4px solid #e26352',
              borderRadius: '10px',
              p: '16px 20px',
              mb: '20px',
            }}
          >
            <Box>
              <Typography sx={{ color: '#191919', fontSize: 15.5, fontWeight: 700 }}>
                Your premium payment is due
              </Typography>
              <Typography sx={{ color: '#706f6f', fontSize: 14, mt: '2px' }}>
                {POLICY.dueAmount} payable by <strong style={{ color: '#670539' }}>{POLICY.dueDate}</strong> to keep your cover active.
              </Typography>
            </Box>
            <PillPayButton onClick={goCheckout} />
          </Stack>
        )}

        {paid && (
          <Stack
            direction="row"
            sx={{
              alignItems: 'center',
              gap: '10px',
              bgcolor: '#fff',
              border: '1px solid #d8e6c8',
              borderLeft: '4px solid #82b450',
              borderRadius: '10px',
              p: '16px 20px',
              mb: '20px',
            }}
          >
            <CheckCircle2 size={22} color="#82b450" />
            <Typography sx={{ color: '#191919', fontSize: 14.5, fontWeight: 700 }}>
              Thank you{` — your payment of ${POLICY.dueAmount} was received.`} Your cover continues as normal.
            </Typography>
          </Stack>
        )}

        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} sx={{ alignItems: 'flex-start' }}>
          <Box sx={{ ...CARD, flex: 2, width: '100%', p: '22px 24px' }}>
            <Stack
              direction="row"
              spacing="10px"
              sx={{ mb: '6px', pb: '12px', borderBottom: '1px solid #f0edf1', alignItems: 'center' }}
            >
              <ShieldCheck size={21} color="#840544" />
              <Typography component="h2" sx={{ color: '#191919', fontSize: 18, fontWeight: 700 }}>
                Policy details
              </Typography>
            </Stack>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                columnGap: '28px',
              }}
            >
              {FIELDS.map((f) => (
                <Stack
                  key={f.label}
                  direction="row"
                  sx={{
                    py: '11px',
                    borderBottom: '1px solid #f0edf1',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    gap: '12px',
                  }}
                >
                  <Typography sx={{ color: '#706f6f', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {f.label}
                  </Typography>
                  <Typography sx={{ color: '#191919', fontSize: 14, fontWeight: 600, textAlign: 'right' }}>
                    {f.value}
                  </Typography>
                </Stack>
              ))}
              <Stack
                direction="row"
                sx={{
                  gridColumn: { sm: '1 / -1' },
                  py: '11px',
                  borderBottom: '1px solid #f0edf1',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  gap: '12px',
                }}
              >
                <Typography sx={{ color: '#706f6f', fontSize: 13, fontWeight: 500 }}>
                  Insurer
                </Typography>
                <Stack direction="row" spacing="6px" sx={{ alignItems: 'center' }}>
                  <Building2 size={15} color="#706f6f" />
                  <Typography sx={{ color: '#191919', fontSize: 14, fontWeight: 600 }}>
                    {POLICY.insurer}
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          </Box>

          <Stack spacing={2} sx={{ flex: 1, width: '100%' }}>
            <Box sx={{ ...CARD, p: '22px', textAlign: 'center' }}>
              <CreditCard size={22} color="#840544" style={{ marginBottom: 8 }} />
              <Typography sx={{ color: '#706f6f', fontSize: 12.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.24px', mb: '4px' }}>
                Amount due
              </Typography>
              <Typography sx={{ color: '#191919', fontSize: 36, fontWeight: 700, lineHeight: 1.05 }}>
                {POLICY.dueAmount}
              </Typography>
              <Typography sx={{ color: '#706f6f', fontSize: 13.5, mt: '2px', mb: '14px' }}>
                by {POLICY.dueDate}
              </Typography>
              {!paid ? (
                <PillPayButton onClick={goCheckout} fullWidthLabel />
              ) : (
                <Typography sx={{ color: '#82b450', fontSize: 14.5, fontWeight: 700 }}>Paid — thank you</Typography>
              )}
            </Box>

            <Box sx={{ ...CARD, p: '22px 24px 12px' }}>
              <Stack direction="row" spacing="9px" sx={{ mb: '4px', alignItems: 'center' }}>
                <FileText size={18} color="#840544" />
                <Typography component="h3" sx={{ color: '#191919', fontSize: 16, fontWeight: 700 }}>
                  Recent payments
                </Typography>
              </Stack>
              {HISTORY.map((h) => (
                <Stack
                  key={h.date}
                  direction="row"
                  sx={{ py: '10px', borderBottom: '1px solid #f0edf1', justifyContent: 'space-between', alignItems: 'baseline' }}
                >
                  <Typography sx={{ color: '#706f6f', fontSize: 13.5 }}>{h.date}</Typography>
                  <Typography sx={{ color: '#191919', fontSize: 13.5, fontWeight: 700 }}>
                    {h.amount}
                    <span style={{ color: '#82b450', marginLeft: 7, fontWeight: 500, fontSize: 12.5 }}>{h.status}</span>
                  </Typography>
                </Stack>
              ))}
            </Box>
          </Stack>
        </Stack>

      </Shell>
    </Box>
  )
}

function PillPayButton({ onClick, fullWidthLabel = false }: { onClick: () => void; fullWidthLabel?: boolean }) {
  return (
    <Box
      component="button"
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        ...(fullWidthLabel ? { width: '100%' } : { alignSelf: { xs: 'stretch', sm: 'auto' } }),
        bgcolor: '#840544',
        color: '#fff',
        border: '1px solid #670539',
        borderRadius: '150px',
        padding: '13px 36px',
        fontFamily: 'inherit',
        fontSize: 13.5,
        fontWeight: 700,
        lineHeight: '16px',
        textTransform: 'uppercase',
        transition: 'all .15s ease',
        whiteSpace: 'nowrap',
        '&:hover': { bgcolor: '#670539' },
        '&:focus-visible': { outline: '2px solid #670539', outlineOffset: 2 },
      }}
    >
      Pay now
    </Box>
  )
}
