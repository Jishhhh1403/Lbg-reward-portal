import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Slider from '@mui/material/Slider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined'
import RewardsHeader from '../components/rewards/RewardsHeader'
import TransferSuccessBackdrop from '../components/rewards/TransferSuccessBackdrop'
import {
  ALPHAMEDICOL_TO_LBG_RATE,
  fetchLinkedCustomerSummaryByEmail,
  transferAlphaMedicolPointsToLbg,
} from '../services/lbgRewardsApi'
import type { ConvertRouteState, SuccessRouteState } from '../types'

interface ConvertPageState {
  email: string
  userName: string
  maxPoints: number
  hasLinkedAccount: boolean
}

type LoadStatus = 'loading' | 'ready' | 'error'

function readStoredEmail(): string {
  try {
    return localStorage.getItem('am_customer_email') ?? ''
  } catch {
    return ''
  }
}

function readStoredName(): string {
  try {
    return localStorage.getItem('am_customer_name') ?? 'there'
  } catch {
    return 'there'
  }
}

export default function LbgRewardsConvertPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const routeState = (location.state ?? {}) as ConvertRouteState

  const [status, setStatus] = useState<LoadStatus>('loading')
  const [page, setPage] = useState<ConvertPageState>({
    email: '',
    userName: 'there',
    maxPoints: 0,
    hasLinkedAccount: false,
  })
  const [points, setPoints] = useState(0)
  const [transferring, setTransferring] = useState(false)
  const [showOverlay, setShowOverlay] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Resolve identity + balances: route state first, lookup fallback second.
  useEffect(() => {
    let cancelled = false

    async function apply(next: ConvertPageState) {
      if (cancelled) return
      setPage(next)
      setPoints(next.maxPoints)
      setStatus('ready')
    }

    async function load() {
      try {
        if (
          typeof routeState.points === 'number' &&
          routeState.points > 0 &&
          routeState.email
        ) {
          await apply({
            email: routeState.email,
            userName: routeState.userName ?? 'there',
            maxPoints: routeState.points,
            hasLinkedAccount: routeState.hasLinkedAccount ?? true,
          })
          return
        }

        const email = routeState.email ?? readStoredEmail()
        if (!email) {
          navigate('/dashboard', { replace: true })
          return
        }
        const summary = await fetchLinkedCustomerSummaryByEmail(email)
        if (cancelled) return
        if (!summary.hasAccount || summary.alphamedicolPoints <= 0) {
          setStatus('error')
          setErrorMessage(
            'No convertible AlphaMedicol points were found for this account.',
          )
          return
        }
        await apply({
          email,
          userName: routeState.userName ?? readStoredName(),
          maxPoints: summary.alphamedicolPoints,
          hasLinkedAccount: summary.hasAccount,
        })
      } catch (error) {
        if (cancelled) return
        setStatus('error')
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to reach the LBG rewards service.',
        )
      }
    }

    void load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const lbgCoins = useMemo(() => points * ALPHAMEDICOL_TO_LBG_RATE, [points])
  const sliderMarks = useMemo(
    () => [
      { value: 0, label: '0' },
      { value: page.maxPoints, label: `${page.maxPoints}` },
    ],
    [page.maxPoints],
  )

  const handleConvert = async () => {
    if (points <= 0 || transferring || status !== 'ready') return
    setTransferring(true)
    setErrorMessage(null)
    try {
      await transferAlphaMedicolPointsToLbg({
        customerEmail: page.email,
        pointsToTransfer: points,
      })

      // Aesthetic confirmation before routing to the summary screen.
      setShowOverlay(true)
      await new Promise((resolve) => setTimeout(resolve, 2400))
      if (!mountedRef.current) return

      const successState: SuccessRouteState = {
        email: page.email,
        originalPoints: page.maxPoints,
        remainingPoints: page.maxPoints - points,
        lbgPoints: lbgCoins,
      }
      navigate('/lbg-rewards/success', { state: successState })
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Internal server error',
      )
    } finally {
      if (mountedRef.current) {
        setTransferring(false)
        setShowOverlay(false)
      }
    }
  }

  if (status === 'loading') {
    return (
      <Box sx={{ pt: '52vh', textAlign: 'center', px: 3 }}>
        <CircularProgress size={34} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
          Preparing your rewards…
        </Typography>
      </Box>
    )
  }

  if (status === 'error') {
    return (
      <Box sx={{ p: 3, pt: 5 }}>
        <RewardsHeader title="Rewards" />
        <Alert severity="error" variant="outlined" sx={{ mt: 4, borderRadius: 3 }}>
          {errorMessage}
        </Alert>
        <Button fullWidth variant="text" sx={{ mt: 2 }} onClick={() => navigate(-1)}>
          Go back
        </Button>
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100%', pb: 6 }}>
      <RewardsHeader title="Rewards" />

      <Box sx={{ px: 2.25, pt: 1.5 }}>
        <Chip
          className="am-rise"
          icon={<VerifiedUserOutlinedIcon />}
          label={
            page.hasLinkedAccount ? `Linked · ${page.email}` : 'LBG account not linked'
          }
          size="small"
          sx={{
            bgcolor: page.hasLinkedAccount ? '#e8f5e9' : '#fff3e0',
            color: page.hasLinkedAccount ? '#1b5e20' : '#b26a00',
            fontWeight: 600,
            fontSize: 11,
            maxWidth: '100%',
            '& .MuiChip-icon': { color: 'inherit', fontSize: 14 },
          }}
        />
      </Box>

      {/* Balance card */}
      <Box
        className="hero-banner am-rise am-rise-1"
        sx={{
          mx: 2.25,
          mt: 1.75,
          borderRadius: 5,
          p: 2.5,
        }}
      >
        <div
          className="hero-blob"
          style={{
            width: 110,
            height: 110,
            right: -30,
            top: -40,
            background: 'rgba(255,255,255,.14)',
          }}
        />
        <Typography fontSize={11} fontWeight={700} letterSpacing=".08em" color="rgba(255,255,255,.8)">
          ALPHA MEDICOL POINTS
        </Typography>
        <Typography variant="h4" fontWeight={800} color="#fff" lineHeight={1.15}>
          {page.maxPoints.toLocaleString()}{' '}
          <span style={{ fontSize: 14, fontWeight: 600 }}>pts</span>
        </Typography>
        <Typography
          fontSize={11.5}
          color="rgba(255,255,255,.85)"
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}
        >
          <PaymentsOutlinedIcon sx={{ fontSize: 13 }} />1 point = {ALPHAMEDICOL_TO_LBG_RATE} LBG Coins
        </Typography>
      </Box>

      {/* Convert card */}
      <Box
        className="am-rise am-rise-2"
        sx={{
          mx: 2.25,
          mt: 2.25,
          bgcolor: '#fff',
          borderRadius: 5,
          p: 2.75,
          boxShadow: '0 18px 45px -24px rgba(13,40,80,.4)',
        }}
      >
        <Typography variant="h6" fontWeight={800}>
          Convert Points
        </Typography>
        <Typography fontSize={12.5} color="text.secondary" mt={0.5}>
          Conversion rate: 1 AlphaMedicol Point = {ALPHAMEDICOL_TO_LBG_RATE} LBG Coins
        </Typography>

        <Box
          sx={{
            mt: 2.25,
            p: 1.75,
            borderRadius: 3.5,
            bgcolor: '#f2f7fd',
            border: '1px solid #dce8f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Typography fontSize={10.5} fontWeight={700} letterSpacing=".06em" color="text.secondary">
              POINTS TO CONVERT
            </Typography>
            <Typography variant="h5" fontWeight={800}>
              {points.toLocaleString()} pts
            </Typography>
          </Box>
          <Typography fontSize={11} color="text.secondary">
            Max {page.maxPoints} pts
          </Typography>
        </Box>

        <Slider
          value={points}
          min={0}
          max={page.maxPoints}
          step={1}
          marks={sliderMarks}
          valueLabelDisplay="on"
          valueLabelFormat={(value) => `${value} pts`}
          onChange={(_, value) => setPoints(value as number)}
          disabled={transferring}
          sx={{ mt: 2.5, mx: 'auto', width: 'calc(100% - 14px)' }}
        />

        <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 2 }}>
          {[25, 50, 100].map((percent) => (
            <Button
              key={percent}
              size="small"
              variant="outlined"
              disabled={transferring}
              onClick={() =>
                setPoints(Math.round((page.maxPoints * percent) / 100))
              }
              sx={{ minWidth: 56, py: 0.15, fontSize: 12, borderColor: '#dce8f6', color: 'primary.dark' }}
            >
              {percent === 100 ? 'Max' : `${percent}%`}
            </Button>
          ))}
        </Stack>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            p: 1.5,
            borderRadius: 3,
            bgcolor: '#e8f5e9',
          }}
        >
          <CurrencyExchangeIcon fontSize="small" sx={{ color: '#1b5e20' }} />
          <Typography fontSize={14.5} fontWeight={800} color="#1b5e20">
            You will receive {lbgCoins.toLocaleString()} LBG Coins
          </Typography>
        </Box>

        {errorMessage ? (
          <Typography
            role="alert"
            variant="body2"
            fontWeight={600}
            color="error"
            sx={{ mt: 1.75, textAlign: 'center' }}
          >
            {errorMessage}
          </Typography>
        ) : null}

        <Stack direction="row" spacing={1.5} sx={{ mt: 2.25 }}>
          <Button
            fullWidth
            variant="outlined"
            disabled={transferring}
            onClick={() => navigate('/dashboard')}
            sx={{ borderColor: '#dce8f6', color: 'text.primary' }}
          >
            Cancel
          </Button>
          <Button
            fullWidth
            variant="contained"
            disabled={transferring || points <= 0}
            onClick={() => void handleConvert()}
            startIcon={
              transferring ? (
                <CircularProgress size={16} sx={{ color: 'inherit' }} />
              ) : undefined
            }
          >
            {transferring ? 'Converting…' : 'Convert'}
          </Button>
        </Stack>
      </Box>

      {showOverlay ? <TransferSuccessBackdrop /> : null}
    </Box>
  )
}
