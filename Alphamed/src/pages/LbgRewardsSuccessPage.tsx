import { useLocation, useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import HomeIcon from '@mui/icons-material/Home'
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import RewardsHeader from '../components/rewards/RewardsHeader'
import { ALPHAMEDICOL_TO_LBG_RATE } from '../services/lbgRewardsApi'
import type { SuccessRouteState } from '../types'

const UNIFIED_REWARDS_URL =
  import.meta.env.VITE_UNIFIED_REWARDS_URL ?? 'http://localhost:5173'

export default function LbgRewardsSuccessPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const routeState = (location.state ?? {}) as SuccessRouteState

  const converted = routeState.originalPoints ?? 138
  const remaining = routeState.remainingPoints ?? Math.max(0, converted - 138)
  const lbgCoins = routeState.lbgPoints ?? converted * ALPHAMEDICOL_TO_LBG_RATE

  return (
    <Box sx={{ minHeight: '100%', pb: 6 }}>
      <RewardsHeader title="Transfer Complete" />

      <Box sx={{ px: 2.75, pt: 3, textAlign: 'center' }}>
        {/* Animated check */}
        <Box className="am-pop" sx={{ position: 'relative', width: 108, height: 108, mx: 'auto' }}>
          <Box
            sx={{
              position: 'absolute',
              inset: -14,
              borderRadius: '50%',
              background:
                'radial-gradient(closest-side, rgba(46,125,50,.18), transparent)',
            }}
          />
          <svg viewBox="0 0 52 52" width={108} height={108} aria-hidden>
            <circle
              className="success-ring"
              cx="26"
              cy="26"
              r="25"
              fill="none"
              stroke="#2e7d32"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <path
              className="success-check"
              d="M15 27.5l7.5 7.5L37.5 20"
              fill="none"
              stroke="#2e7d32"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Box>

        <Typography variant="h5" fontWeight={800} mt={2}>
          Transfer Successful!
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          Your AlphaMedicol points are now LBG Coins.
        </Typography>

        {/* Summary card */}
        <Box
          className="am-rise am-rise-2"
          sx={{
            mt: 3,
            bgcolor: '#fff',
            borderRadius: 5,
            p: 2.5,
            boxShadow: '0 18px 45px -24px rgba(13,40,80,.4)',
            textAlign: 'left',
          }}
        >
          <SummaryRow
            label="Converted"
            value={`${converted.toLocaleString()} pts`}
            icon="🩺"
          />
          <SummaryRow
            label="You received"
            value={`${lbgCoins.toLocaleString()} LBG Coins`}
            highlight
            icon="🪙"
          />
          <SummaryRow
            label="Remaining balance"
            value={`${remaining.toLocaleString()} pts`}
            icon="💼"
          />
          <Typography fontSize={11} color="text.secondary" mt={1.75} textAlign="center">
            Rate applied: 1 AlphaMedicol Point = {ALPHAMEDICOL_TO_LBG_RATE} LBG Coins
          </Typography>
        </Box>

        <Stack spacing={1.5} sx={{ mt: 3 }} className="am-rise am-rise-3">
          <Button
            fullWidth
            size="large"
            variant="contained"
            startIcon={<HomeIcon />}
            onClick={() => navigate('/dashboard', { replace: true })}
          >
            Back to Home
          </Button>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<CurrencyExchangeIcon />}
            onClick={() =>
              navigate('/lbg-rewards/convert', {
                state: {
                  email: routeState.email,
                  points: remaining,
                  hasLinkedAccount: true,
                },
              })
            }
            disabled={remaining <= 0}
            sx={{ borderColor: '#dce8f6', color: 'text.primary' }}
          >
            Convert more points
          </Button>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<OpenInNewIcon />}
            onClick={() => {
              try {
                const phone = localStorage.getItem('am_customer_phone')
                const url = new URL(UNIFIED_REWARDS_URL)
                url.searchParams.set('demo', '1')
                if (phone && phone.length === 10) {
                  url.searchParams.set('mobile', phone)
                }
                window.location.assign(url.toString())
              } catch {
                window.location.assign(UNIFIED_REWARDS_URL)
              }
            }}
            sx={{ borderColor: '#dce8f6', color: 'primary.dark', fontWeight: 700 }}
          >
            View My LBG Coins
          </Button>
        </Stack>
      </Box>
    </Box>
  )
}

function SummaryRow(props: {
  label: string
  value: string
  highlight?: boolean
  icon: string
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 1.25,
        borderBottom: '1px dashed #e6edf5',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
        <Box component="span" aria-hidden sx={{ fontSize: 18 }}>
          {props.icon}
        </Box>
        <Typography fontSize={13} color="text.secondary">
          {props.label}
        </Typography>
      </Box>
      <Typography
        fontSize={14}
        fontWeight={props.highlight ? 800 : 700}
        color={props.highlight ? '#1b5e20' : 'text.primary'}
      >
        {props.highlight ? '+' : ''}
        {props.value}
      </Typography>
    </Box>
  )
}
