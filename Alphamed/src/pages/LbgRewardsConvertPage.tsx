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
      const result = await transferAlphaMedicolPointsToLbg({
        customerEmail: page.email,
        pointsToTransfer: points,
      })

      let updatedAlphamed = page.maxPoints - points
      let updatedLbg = lbgCoins
      try {
        const freshSummary = await fetchLinkedCustomerSummaryByEmail(page.email)
        if (freshSummary.hasAccount) {
          updatedAlphamed = freshSummary.alphamedicolPoints
          updatedLbg = freshSummary.totalLbgPoints
        }
      } catch {
        // Use computed values if re-fetch fails
      }

      setShowOverlay(true)
      await new Promise((resolve) => setTimeout(resolve, 2400))
      if (!mountedRef.current) return

      const successState: SuccessRouteState = {
        email: page.email,
        originalPoints: page.maxPoints,
        remainingPoints: updatedAlphamed,
        lbgPoints: result.lbgCoinsIssued,
        updatedLbgPoints: updatedLbg,
        transactionId: result.transactionId,
        completedAt: result.completedAt,
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
        <CircularProgress size={36} thickness={4} />
        <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mt: 2 }}>
          Preparing your rewards…
        </Typography>
      </Box>
    )
  }

  if (status === 'error') {
    return (
      <Box sx={{ px: 2.5, pt: 5 }}>
        <RewardsHeader title="Rewards" />
        <Alert
          severity="error"
          variant="outlined"
          sx={{ mt: 4, borderRadius: 3, fontSize: 13 }}
        >
          {errorMessage}
        </Alert>
        <Button
          fullWidth
          variant="outlined"
          sx={{ mt: 2.5, py: 1.25, fontWeight: 700, borderRadius: 3, borderColor: '#dce8f6' }}
          onClick={() => navigate(-1)}
        >
          Go back
        </Button>
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100%', pb: 8 }}>
      <RewardsHeader title="Rewards" />

      <Box sx={{ px: 2.5, pt: 1.5 }}>
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
          mx: 2.5,
          mt: 1.75,
          borderRadius: 5,
          p: 3,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          className="hero-blob"
          style={{
            width: 130,
            height: 130,
            right: -35,
            top: -45,
            background: 'rgba(255,255,255,.14)',
          }}
        />
        <div
          className="hero-blob"
          style={{
            width: 60,
            height: 60,
            right: 60,
            bottom: -24,
            background: 'rgba(255,255,255,.1)',
          }}
        />
        <Typography
          fontSize={11}
          fontWeight={700}
          letterSpacing=".08em"
          color="rgba(255,255,255,.75)"
        >
          ALPHA MEDICOL POINTS
        </Typography>
        <Typography
          variant="h3"
          fontWeight={800}
          color="#fff"
          lineHeight={1.15}
          sx={{ mt: 0.5 }}
        >
          {page.maxPoints.toLocaleString()}
        </Typography>
        <Typography
          fontSize={12}
          fontWeight={600}
          color="rgba(255,255,255,.85)"
          sx={{ mt: 0.25 }}
        >
          points available
        </Typography>
        <Box
          sx={{
            mt: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            bgcolor: 'rgba(255,255,255,.12)',
            borderRadius: 2.5,
            px: 1.75,
            py: 1,
            width: 'fit-content',
          }}
        >
          <PaymentsOutlinedIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,.9)' }} />
          <Typography fontSize={12} fontWeight={700} color="rgba(255,255,255,.95)">
            1 point = {ALPHAMEDICOL_TO_LBG_RATE} LBG Coins
          </Typography>
        </Box>
      </Box>

      {/* Convert card */}
      <Box
        className="am-rise am-rise-2"
        sx={{
          mx: 2.5,
          mt: 2.5,
          bgcolor: '#fff',
          borderRadius: 5,
          p: 3,
          boxShadow: '0 12px 40px -16px rgba(13,40,80,.25)',
        }}
      >
        <Typography variant="h6" fontWeight={800}>
          Convert Points
        </Typography>
        <Typography fontSize={12.5} color="text.secondary" sx={{ mt: 0.5 }}>
          Choose how many AlphaMedicol points to convert to LBG Coins.
        </Typography>

        {/* Points display */}
        <Box
          sx={{
            mt: 2.5,
            p: 2,
            borderRadius: 4,
            bgcolor: '#f2f7fd',
            border: '1px solid #dce8f6',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Typography
              fontSize={10.5}
              fontWeight={700}
              letterSpacing=".06em"
              color="text.secondary"
            >
              POINTS TO CONVERT
            </Typography>
            <Typography fontSize={11} fontWeight={600} color="text.secondary">
              Max {page.maxPoints.toLocaleString()} pts
            </Typography>
          </Box>
          <Typography variant="h4" fontWeight={800} sx={{ mt: 0.75 }}>
            {points.toLocaleString()}
            <Typography
              component="span"
              fontSize={14}
              fontWeight={600}
              color="text.secondary"
              sx={{ ml: 0.5 }}
            >
              pts
            </Typography>
          </Typography>
        </Box>

        {/* Slider */}
        <Slider
          value={points}
          min={0}
          max={page.maxPoints}
          step={1}
          marks={sliderMarks}
          valueLabelDisplay="on"
          valueLabelFormat={(value) => `${value.toLocaleString()} pts`}
          onChange={(_, value) => setPoints(value as number)}
          disabled={transferring}
          sx={{
            mt: 3,
            mx: 'auto',
            width: 'calc(100% - 14px)',
            color: 'primary.main',
            '& .MuiSlider-thumb': {
              width: 20,
              height: 20,
              boxShadow: '0 3px 10px -2px rgba(21,101,192,.5)',
            },
            '& .MuiSlider-track': { border: 'none' },
          }}
        />

        {/* Quick select buttons */}
        <Stack direction="row" spacing={1} sx={{ mt: 1, mb: 2.5 }}>
          {[25, 50, 100].map((percent) => (
            <Button
              key={percent}
              size="small"
              variant="outlined"
              fullWidth
              disabled={transferring}
              onClick={() =>
                setPoints(Math.round((page.maxPoints * percent) / 100))
              }
              sx={{
                py: 0.75,
                fontSize: 12.5,
                fontWeight: 700,
                borderRadius: 2.5,
                borderColor: '#dce8f6',
                color: 'primary.dark',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'primary.main',
                  color: '#fff',
                },
              }}
            >
              {percent === 100 ? 'Max' : `${percent}%`}
            </Button>
          ))}
        </Stack>

        {/* Conversion summary */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            p: 1.5,
            borderRadius: 3.5,
            bgcolor: '#e8f5e9',
            border: '1px solid #c8e6c9',
          }}
        >
          <CurrencyExchangeIcon fontSize="small" sx={{ color: '#2e7d32' }} />
          <Typography fontSize={14} fontWeight={800} color="#1b5e20">
            You'll receive{' '}
            <span style={{ textDecoration: 'underline' }}>
              {lbgCoins.toLocaleString()}
            </span>{' '}
            LBG Coins
          </Typography>
        </Box>

        {errorMessage ? (
          <Typography
            role="alert"
            variant="body2"
            fontWeight={600}
            color="error"
            sx={{ mt: 2, textAlign: 'center' }}
          >
            {errorMessage}
          </Typography>
        ) : null}

        {/* Action buttons */}
        <Stack direction="row" spacing={1.5} sx={{ mt: 2.5 }}>
          <Button
            fullWidth
            variant="outlined"
            disabled={transferring}
            onClick={() => navigate('/dashboard')}
            sx={{
              py: 1.25,
              fontSize: 14,
              fontWeight: 700,
              borderRadius: 3,
              borderColor: '#dce8f6',
              color: 'text.primary',
              '&:hover': { borderColor: '#b0c4de', bgcolor: '#f8fafc' },
            }}
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
                <CircularProgress size={18} sx={{ color: 'inherit' }} />
              ) : undefined
            }
            sx={{
              py: 1.25,
              fontSize: 14,
              fontWeight: 700,
              borderRadius: 3,
            }}
          >
            {transferring ? 'Converting…' : 'Convert Now'}
          </Button>
        </Stack>
      </Box>

      {showOverlay ? <TransferSuccessBackdrop /> : null}
    </Box>
  )
}
