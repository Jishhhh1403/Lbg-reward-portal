import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Avatar from '@mui/material/Avatar'
import ButtonBase from '@mui/material/ButtonBase'
import {
  Activity,
  ArrowLeft,
  ArrowDownCircle,
  Bell,
  ChevronRight,
  Crown,
  CreditCard,
  Gem,
  Gift,
  Home,
  Link2,
  Loader2,
  Medal,
  RefreshCw,
  Send,
  Target,
  TrendingUp,
  UserRound,
  Wand2,
} from 'lucide-react'
import type {
  BrandOption,
  CustomerSummary,
  DashboardTab,
  PointsProvider,
  WalletTransactionItem,
} from '../types/rewards'
import { fetchWalletTransactions } from '../services/rewardsApi'
import LocatePointsModal from '../components/dashboard/LocatePointsModal'
import RedeemPointsModal from '../components/dashboard/RedeemPointsModal'
import ObjectiveWorkspace from '../components/objective/ObjectiveWorkspace'
import {
  formatLastSyncedAt,
  formatPoints,
  formatTransactionDate,
  getInitials,
  normalizeTransactionDescription,
} from '../utils/format'
import { shadows } from '../theme'
import silverCardImg from '../assets/silvercard-cropped.webp'
import lbgCoinImg from '../assets/lbg-coin.webp'

interface RewardsDashboardPageProps {
  customer: CustomerSummary
  pointsByBrand: PointsProvider[]
  brands: BrandOption[]
  onBackToHome: () => void
  onRefresh: () => Promise<void>
  customerEmail?: string
  customerPhone?: string
}

const MotionBox = motion.create(Box)
const MotionButton = motion.create(ButtonBase)
const MotionImg = motion.create('img')

/* ------------------------------------------------------------------ */
/* Tier logic                                                          */
/* ------------------------------------------------------------------ */

const TIERS = [
  { name: 'Silver', min: 0, icon: Medal },
  { name: 'Gold', min: 15000, icon: Crown },
  { name: 'Platinum', min: 25000, icon: Gem },
] as const

function useTier(totalPoints: number, declaredTier?: string) {
  return useMemo(() => {
    const byPoints = [...TIERS].reverse().find((t) => totalPoints >= t.min) ?? TIERS[0]
    const current = TIERS.find((t) => t.name === declaredTier) ?? byPoints
    const idx = TIERS.indexOf(current)
    const next = TIERS[idx + 1] ?? null
    if (!next) return { current, next: null, progress: 100, pointsToNext: 0 }
    const span = next.min - current.min
    const raw = ((totalPoints - current.min) / span) * 100
    return {
      current,
      next,
      progress: Math.max(3, Math.min(100, Math.round(raw))),
      pointsToNext: Math.max(0, next.min - totalPoints),
    }
  }, [totalPoints, declaredTier])
}

type TierName = (typeof TIERS)[number]['name']

/* Embossed metal-card gradient themes — used for Gold/Platinum tiers where
   no dedicated card image is available.  Silver uses the silvercard image. */
const TIER_CARD_THEMES: Record<TierName, { card: string; labelText: string; nameText: string; metaText: string; metaIcon: string; tierPill: string; tickIdle: string; tickActive: string; track: string; barFill: string; noteText: string; coinIcon: string }> = {
  Silver: {
    card: '',
    labelText: '',
    nameText: '',
    metaText: '',
    metaIcon: '',
    tierPill: '',
    tickIdle: '',
    tickActive: '',
    track: '',
    barFill: '',
    noteText: '',
    coinIcon: '',
  },
  Gold: {
    card:
      'border-yellow-100/60 bg-[linear-gradient(130deg,#6b4e12_0%,#b08a26_14%,#e8c96a_32%,#f7e7a8_45%,#e3c163_58%,#a67f1f_80%,#59400c_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.65),inset_0_-18px_30px_rgba(88,58,4,0.35),0_22px_45px_-22px_rgba(88,58,4,0.75)]',
    coinIcon: 'text-amber-900',
    tierPill: 'bg-amber-950/10 text-amber-950 ring-1 ring-amber-800/30',
    labelText: 'text-amber-950/80',
    nameText: 'text-amber-950 [text-shadow:0_1px_0_rgba(255,255,255,0.55),0_-1px_1px_rgba(15,23,42,0.35)]',
    metaText: 'text-amber-950/80',
    metaIcon: 'text-emerald-800',
    tickIdle: 'text-amber-950/55',
    tickActive: 'text-amber-950 font-bold',
    track: 'bg-amber-950/20',
    barFill: 'from-amber-600 via-amber-300 to-yellow-100',
    noteText: 'text-amber-950/85',
  },
  Platinum: {
    card:
      'border-white/70 bg-[linear-gradient(130deg,#7c8693_0%,#b9c3cd_14%,#eef2f6_32%,#ffffff_46%,#e6ecf1_58%,#aeb9c4_80%,#6b7683_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-18px_30px_rgba(51,60,72,0.25),0_22px_45px_-22px_rgba(51,60,72,0.65)]',
    coinIcon: 'text-slate-600',
    tierPill: 'bg-slate-700/10 text-slate-700 ring-1 ring-slate-500/25',
    labelText: 'text-slate-600/85',
    nameText: 'text-slate-800 [text-shadow:0_1px_0_rgba(255,255,255,0.55),0_-1px_1px_rgba(15,23,42,0.35)]',
    metaText: 'text-slate-700/80',
    metaIcon: 'text-emerald-700',
    tickIdle: 'text-slate-600/55',
    tickActive: 'text-slate-800 font-bold',
    track: 'bg-slate-700/15',
    barFill: 'from-slate-400 via-sky-200 to-white',
    noteText: 'text-slate-700/85',
  },
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function RewardsDashboardPage({
  customer,
  pointsByBrand,
  brands,
  onBackToHome,
  onRefresh,
  customerEmail,
  customerPhone,
}: RewardsDashboardPageProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('home')
  const [locateOpen, setLocateOpen] = useState(false)
  const [redeemOpen, setRedeemOpen] = useState(false)
  const [goalOpen, setGoalOpen] = useState(false)
  const [goalResume, setGoalResume] = useState<import('../types/objective').WorkspaceResume | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const [transactions, setTransactions] = useState<WalletTransactionItem[]>([])
  const [txLoading, setTxLoading] = useState(false)
  const [txError, setTxError] = useState('')

  const tier = useTier(customer.totalLbgCoins + customer.totalBrandPoints / 2, customer.tier)

  /* Simple, hard-coded tier progress: the green fill points to the tier that
     matches the member's badge (Silver / Gold / Platinum). */
  const tierPosByTier: Record<TierName, number> = {
    Silver: 0,
    Gold: (15000 / 25000) * 100,
    Platinum: 100,
  }
  const memberTierPosPct = tierPosByTier[customer.tier as TierName] ?? 0
  const lastTierMax = TIERS[TIERS.length - 1].min

  useEffect(() => {
    let cancelled = false
    setTxLoading(true)
    setTxError('')
    fetchWalletTransactions(customer.customerId, 25)
      .then((tx) => {
        if (!cancelled) setTransactions(tx)
      })
      .catch(() => {
        if (!cancelled) setTxError('Could not load transactions. Pull down to retry.')
      })
      .finally(() => {
        if (!cancelled) setTxLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [customer.customerId])

  const totalPoints = customer.totalBrandPoints

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setRefreshing(false)
    }
  }

  const handlePartnerHandoff = (
    _partner: string,
    url: string,
    resume: import('../types/objective').WorkspaceResume,
  ) => {
    const customerEmailVal = customerEmail ?? ''
    const customerPhoneVal = customerPhone ?? ''
    const customerNameVal = customer.userName
    const baseUrl = new URL(url)
    baseUrl.searchParams.set('customerEmail', customerEmailVal)
    baseUrl.searchParams.set('customerName', encodeURIComponent(customerNameVal))
    baseUrl.searchParams.set('customerPhone', customerPhoneVal)

    const returnUrl = new URL(window.location.origin + window.location.pathname)
    returnUrl.searchParams.set('ws_resume', JSON.stringify(resume))
    baseUrl.searchParams.set('returnTo', returnUrl.toString())

    /* Keep the dashboard data needed to re-open the workspace on the way back. */
    try {
      localStorage.setItem(
        'rewards_session_snapshot',
        JSON.stringify({
          customerId: customer.customerId,
          customer,
          pointsByBrand,
          customerEmail: customer.email ?? customerEmailVal,
          customerPhone: customer.phone ?? customerPhoneVal,
        }),
      )
    } catch {
      /* ignore storage errors */
    }

    window.location.assign(baseUrl.toString())
  }

  /* Re-open the workspace where the user left after a partner portal returns. */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const raw = params.get('ws_resume')
    if (!raw) return
    try {
      const resumed = JSON.parse(raw) as import('../types/objective').WorkspaceResume
      setGoalResume(resumed)
      setGoalOpen(true)
      const clean = new URL(window.location.href)
      clean.searchParams.delete('ws_resume')
      window.history.replaceState({}, '', clean.toString())
    } catch {
      /* ignore malformed resume payloads */
    }
  }, [])

  const handleGoalClose = useCallback(() => {
    setGoalOpen(false)
    setGoalResume(null)
  }, [])

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        bgcolor: '#f1f5f9',
        
      }}
    >
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(to bottom right, #064836, #045a42, #006a4d)',
          padding: '20px 20px 0',
          color: '#ffffff',
          
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '28px' }}>
          <ButtonBase
            onClick={onBackToHome}
            disableRipple
            sx={{
              marginLeft: '-4px',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              borderRadius: '8px',
              padding: '6px',
              fontSize: 16,
              fontWeight: 500,
              fontFamily: 'inherit',
              color: 'inherit',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.10)' },
            }}
          >
            <ArrowLeft size={17} /> <span>Home</span> 
          </ButtonBase>
          <Typography
            sx={{
              flex: 1,
              minWidth: 0,
              textAlign: 'center',
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: '0.02em',
            }}
          >
            Rewards
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
            <MotionButton
              whileTap={{ rotate: -180 }}
              onClick={handleRefresh}
              aria-label="Refresh"
              disableRipple
              sx={{
                color: 'inherit',
                borderRadius: '999px',
                padding: '8px',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.10)' },
              }}
            >
              {/* <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /> */}
            </MotionButton>
            <IconButton
              aria-label="Notifications"
              sx={{
                color: 'inherit',
                borderRadius: '999px',
                padding: '8px',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.10)' },
              }}
            >
              <Bell size={16} />
            </IconButton>
          </Box>
        </Box>

        <AnimatePresence mode="wait">
          {activeTab !== 'activity' && (
            <MotionBox key="hero" exit={{ opacity: 0, y: -8 }} sx={{ paddingBottom: 4 }}>
              {/* Coins hero — Silver uses card image; Gold/Platinum use embossed gradient */}
              {tier.current.name === 'Silver' ? (
                <MotionBox
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  sx={{
                    marginTop: '12px',
                    borderRadius: '24px',
                    color: '#0f172a',
                    backgroundImage: `url(${silverCardImg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    padding: '20px',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'stretch', justifyContent: 'space-between', marginTop: '-8px' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '14px' }}>
                      <Box sx={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.22em', color: 'rgba(30,41,59,0.72)', textShadow: '0 1px 0 rgba(255,255,255,0.95), 0 -1px 1px rgba(15,23,42,0.30)' }}>
                        {customer.userName}
                      </Box>
                      <Box sx={{ fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.14em' }}>Your LBG Coins</Box>
                      <MotionBox key={customer.totalLbgCoins} initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 18 }} sx={{ fontSize: 34, fontWeight: 900, letterSpacing: '-0.025em', mt: -1 }}>
                        {formatPoints(customer.totalLbgCoins)}
                      </MotionBox>
                      <Box sx={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '4px', borderRadius: '999px', border: '1px solid rgba(30,41,59,0.35)', bgcolor: 'rgba(255,255,255,0.5)', paddingX: '10px', paddingTop: '3px', paddingBottom: '3px', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#334155' }}>
                        <tier.current.icon size={12} /> {tier.current.name}
                      </Box>
                    </Box>
                    <MotionImg src={lbgCoinImg} alt="LBG Coin" initial={{ rotateY: 0 }} animate={{ rotateY: 360 }} transition={{ duration: 1.5, ease: 'easeInOut' }} style={{ width: 'auto', height: '100px', objectFit: 'contain', filter: 'drop-shadow(0 0 14px rgba(255,215,0,0.65)) drop-shadow(0 0 6px rgba(255,215,0,0.4))' }} />
                  </Box>
                  <Typography sx={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: 12 }}>
                    <TrendingUp size={13} color="#059669" /> +850 vs last month <span style={{ opacity: 0.55 }}>|</span> {formatLastSyncedAt(customer.lastSyncedAt)}
                  </Typography>
                  {/* Tier progress */}
                  <Box sx={{ marginTop: 2 }}>
                    <Box sx={{ position: 'relative', marginBottom: '6px', height: 16 }}>
                      {TIERS.map((t, i) => {
                        const pos = (t.min / lastTierMax) * 100
                        const anchor = i === 0 ? { left: 0 } : i === TIERS.length - 1 ? { right: 0 } : { left: `${pos}%`, transform: 'translateX(-50%)' }
                        return (
                          <Box key={t.name} sx={{ position: 'absolute', top: 0, display: 'flex', alignItems: 'center', gap: '4px', fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap', color: '#585d64', ...(tier.current.name === t.name && { color: '#585d64', fontWeight: 700 }), ...anchor }}>
                            <t.icon size={11} /> {t.name}
                          </Box>
                        )
                      })}
                    </Box>
                    <Box sx={{ position: 'relative', height: 8, overflow: 'visible', borderRadius: '999px', bgcolor: '#e5e7eb' }}>
                      <MotionBox
                        initial={{ width: 0 }}
                        animate={{ width: `${memberTierPosPct}%` }}
                        transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
                        sx={{ position: 'absolute', top: 0, bottom: 0, left: 0, borderRadius: '999px', background: '#006a4d' }}
                      />
                      <MotionBox
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        sx={{ position: 'absolute', top: '50%', left: `${memberTierPosPct}%`, transform: 'translate(-50%, -50%)', display: 'flex', alignItems: 'center' }}
                      >
                        <ChevronRight size={14} style={{ transform: 'rotate(90deg)' }} color="#006a4d" />
                      </MotionBox>
                    </Box>
                    <Box sx={{ marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography sx={{ fontSize: 11 }}>
                        {tier.next ? `${formatPoints(Math.max(0, tier.next.min - customer.totalLbgCoins))} pts to ${tier.next.name}` : 'Top tier reached — enjoy your Platinum perks'}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: 11, fontWeight: 600, color: '#006a4d' }}>
                        Know more <ChevronRight size={13} />
                      </Box>
                    </Box>
                  </Box>
                </MotionBox>
              ) : (
                /* Gold / Platinum embossed metal card */
                <MotionBox
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className={`relative overflow-hidden border p-5 ${TIER_CARD_THEMES[tier.current.name]?.card ?? ''}`}
                  sx={{ marginTop: '12px', borderRadius: '24px' }}
                >
                  <div className="pointer-events-none absolute -right-20 -top-28 h-60 w-80 rotate-12 bg-gradient-to-b from-white/25 via-white/8 to-transparent blur-xl" />
                  <div className="pointer-events-none absolute -bottom-24 -left-12 h-48 w-72 -rotate-6 bg-gradient-to-t from-black/20 to-transparent blur-lg" />
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                  <div className="relative">
                    <div className="flex items-center justify-between">
                      <div className={`flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] ${TIER_CARD_THEMES[tier.current.name]?.labelText ?? ''}`}>
                        <Gift size={15} className={TIER_CARD_THEMES[tier.current.name]?.coinIcon ?? ''} /> LBG Coins
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <motion.p key={customer.totalLbgCoins} initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 18 }} className={`text-4xl font-black tracking-tight text-slate-900 ${TIER_CARD_THEMES[tier.current.name]?.nameText ?? ''}`}>
                        {formatPoints(customer.totalLbgCoins)}
                      </motion.p>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${TIER_CARD_THEMES[tier.current.name]?.tierPill ?? ''}`}>
                        {tier.current.name}
                      </span>
                      <motion.img src={lbgCoinImg} alt="LBG Coin" initial={{ rotateY: 0 }} animate={{ rotateY: 360 }} transition={{ duration: 1.5, ease: 'easeInOut' }} className="ml-auto h-24 w-auto object-contain" style={{ filter: 'drop-shadow(0 0 14px rgba(255,215,0,0.65)) drop-shadow(0 0 6px rgba(255,215,0,0.4))' }} />
                    </div>
                    <p className={`mt-1.5 text-[13px] font-semibold uppercase tracking-[0.18em] ${TIER_CARD_THEMES[tier.current.name]?.nameText ?? ''}`}>
                      {customer.userName}
                    </p>
                    <p className={`mt-1 flex items-center gap-1 text-xs ${TIER_CARD_THEMES[tier.current.name]?.metaText ?? ''}`}>
                      <TrendingUp size={13} className={TIER_CARD_THEMES[tier.current.name]?.metaIcon ?? ''} /> +850 this month · {formatLastSyncedAt(customer.lastSyncedAt)}
                    </p>
                    <div className="mt-4">
                      <div className="relative mb-1.5 h-4 text-[11px] font-medium">
                        {TIERS.map((t, i) => {
                          const pos = (t.min / lastTierMax) * 100
                          const anchor = i === 0 ? { left: 0 } : i === TIERS.length - 1 ? { right: 0 } : { left: `${pos}%`, transform: 'translateX(-50%)' }
                          return (
                            <span key={t.name} className={`absolute top-0 flex items-center gap-1 ${tier.current.name === t.name ? (TIER_CARD_THEMES[tier.current.name]?.tickActive ?? '') : (TIER_CARD_THEMES[tier.current.name]?.tickIdle ?? '')}`} style={{ ...anchor, whiteSpace: 'nowrap' }}>
                              <t.icon size={11} /> {t.name}
                            </span>
                          )
                        })}
                      </div>
                      <div className={`relative h-2 overflow-visible rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.35)] ${TIER_CARD_THEMES[tier.current.name]?.track ?? ''}`}>
                        <motion.div className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] ${TIER_CARD_THEMES[tier.current.name]?.barFill ?? ''}`} style={{ width: `${memberTierPosPct}%` }} initial={{ width: 0 }} animate={{ width: `${memberTierPosPct}%` }} transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }} />
                        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center" style={{ left: `${memberTierPosPct}%` }}>
                          {/* <ChevronRight size={14} style={{ transform: 'rotate(90deg)' }} color="#006a4d" /> */}
                        </motion.span>
                      </div>
                      <p className={`mt-1.5 text-[11px] ${TIER_CARD_THEMES[tier.current.name]?.noteText ?? ''}`}>
                        {tier.next
                          ? tier.pointsToNext > 0
                            ? `${formatPoints(tier.pointsToNext)} pts to ${tier.next.name}`
                            : `${tier.next.name} status unlocks on your next conversion`
                          : `Top tier reached — enjoy your ${tier.current.name} perks`}
                      </p>
                    </div>
                  </div>
                </MotionBox>
              )}

              {/* Action buttons */}
              <Box
                sx={{
                  marginTop: 2,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: '10px',
                  padding: '0px',
                  // bgcolor: 'rgba(255,255,255,0.10)',
                  borderRadius: '16px',
                  backdropFilter: 'blur(8px)',
                  paddingBottom: '4px',
                }}
              >
                <MotionButton
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setLocateOpen(true)}
                  disableRipple
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    borderRadius: '12px',
                    bgcolor: 'rgba(255,255,255,0.12)',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    fontFamily: 'inherit',
                    color: 'inherit',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' },
                  }}
                >
                  <Link2 size={18} strokeWidth={1.75} />
                  <span style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.2 }}>Locate Points</span>
                </MotionButton>
                <MotionButton
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setRedeemOpen(true)}
                  disableRipple
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    borderRadius: '12px',
                    bgcolor: '#ddbe72',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    fontFamily: 'inherit',
                    color: '#073a2d',
                    boxShadow: shadows.card,
                    '&:hover': { bgcolor: '#ecd9a8' },
                  }}
                >
                  <Gift size={18} strokeWidth={1.75} />
                  <span style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.2 }}>Redeem Coins</span>
                </MotionButton>
                <MotionButton
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setGoalOpen(false)}
                  disableRipple
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    borderRadius: '12px',
                    bgcolor: '#ffffff',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    fontFamily: 'inherit',
                    color: '#006a4d',
                    boxShadow: shadows.card,
                    '&:hover': { bgcolor: '#f0fdf4' },
                  }}
                >
                  <Target size={18} strokeWidth={1.75} />
                  <span style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.2 }}>Set a Goal</span>
                </MotionButton>
              </Box>


            </MotionBox>
          )}
        </AnimatePresence>
      </Box>

      {/* Scrollable body */}
      <Box
        className="no-scrollbar"
        sx={{
          position: 'relative',
          marginTop: '-12px',
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          bgcolor: '#f1f5f9',
        }}
      >
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <MotionBox
              key="tab-home"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.22 }}
              sx={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '20px', paddingBottom: '96px', }}
            >
              {/* Personalise LBG Coin experience */}
              <MotionButton
                whileTap={{ scale: 0.97 }}
                onClick={() => setGoalOpen(true)}
                disableRipple
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '8px',
                  borderRadius: '16px',
                  padding: '16px 24px',
                  fontFamily: 'inherit',
                  color: '#334155',
                  bgcolor: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  '&:hover': { bgcolor: '#f8fafc' },
                }}
              >
                <Wand2 size={24} strokeWidth={1.5} />
                <Typography sx={{ fontSize: 12, fontWeight: 500, color: '#475569', textAlign: 'center' }}>
                  Personalise your LBG Coin experience
                </Typography>
              </MotionButton>

              {/* Recent activity — top 3 transactions */}
              <Box
                sx={{
                  borderRadius: '16px',
                  bgcolor: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  overflow: 'hidden',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', paddingX: '16px', paddingTop: '14px', paddingBottom: '8px' }}>
                  <Activity size={15} color="#006a4d" />
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                    Recent activity
                  </Typography>
                </Box>

                {txLoading && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px', fontSize: 13, color: '#64748b' }}>
                    <Loader2 size={14} className="animate-spin" /> Loading recent activity…
                  </Box>
                )}

                {!txLoading && (txError || transactions.length === 0) && (
                  <Typography sx={{ padding: '16px', fontSize: 13, color: '#94a3b8' }}>
                    {txError ? 'Could not load recent activity.' : 'No recent activity yet.'}
                  </Typography>
                )}

                {!txLoading && !txError && transactions.length > 0 && (
                  <Box>
                    {transactions.slice(0, 3).map((tx, i) => {
                      const positive = tx.amount >= 0
                      const tint =
                        tx.type === 'EARN'
                          ? { bgcolor: '#eef7f3', color: '#045a42' }
                          : tx.type === 'CONVERT'
                            ? { bgcolor: '#f0f9ff', color: '#0284c7' }
                            : tx.type === 'REDEEM'
                              ? { bgcolor: '#fdf9ef', color: '#a98a41' }
                              : tx.type === 'TRANSFER'
                                ? { bgcolor: '#f5f3ff', color: '#7c3aed' }
                                : tx.type === 'EXPIRE'
                                  ? { bgcolor: '#fef2f2', color: '#b91c1c' }
                                  : { bgcolor: '#f8fafc', color: '#64748b' }
                      const Icon =
                        tx.type === 'EARN'
                          ? ArrowDownCircle
                          : tx.type === 'CONVERT'
                            ? RefreshCw
                            : tx.type === 'REDEEM'
                              ? Gift
                              : tx.type === 'TRANSFER'
                                ? Send
                                : tx.type === 'EXPIRE'
                                  ? CreditCard
                                  : Gift
                      return (
                        <Box
                          key={tx.id}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            paddingX: '16px',
                            paddingTop: '10px',
                            paddingBottom: '10px',
                            ...(i > 0 && { borderTop: '1px solid #eef2f7' }),
                          }}
                        >
                          <Box sx={{ display: 'flex', height: 32, width: 32, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: '999px', ...tint }}>
                            <Icon size={15} />
                          </Box>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography sx={{ fontSize: 13, fontWeight: 500, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {normalizeTransactionDescription(tx.description)}
                            </Typography>
                            <Typography sx={{ fontSize: 11.5, color: '#94a3b8' }}>
                              {formatTransactionDate(tx.createdAt)}
                            </Typography>
                          </Box>
                          <Typography sx={{ flexShrink: 0, fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: positive ? '#059669' : '#0f172a' }}>
                            {positive ? '+' : ''}
                            {formatPoints(tx.amount)}
                          </Typography>
                        </Box>
                      )
                    })}
                  </Box>
                )}
              </Box>

            </MotionBox>
          )}

          {activeTab === 'activity' && (
            <MotionBox
              key="tab-activity"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.22 }}
              sx={{ padding: '20px', paddingBottom: '96px' }}
            >
              <Typography sx={{ marginBottom: '12px', paddingX: '4px', fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                Wallet transactions
              </Typography>
              {txLoading && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    borderRadius: '16px',
                    bgcolor: '#ffffff',
                    padding: '32px',
                    fontSize: 14,
                    color: '#64748b',
                    boxShadow: shadows.card,
                  }}
                >
                  <Loader2 size={16} className="animate-spin" /> Loading transactions…
                </Box>
              )}
              {!txLoading && txError && (
                <Box
                  sx={{
                    borderRadius: '16px',
                    border: '1px solid #fecaca',
                    bgcolor: '#fef2f2',
                    padding: 2,
                    fontSize: 14,
                    color: '#b91c1c',
                  }}
                >
                  {txError}
                </Box>
              )}
              {!txLoading && !txError && transactions.length === 0 && (
                <Box
                  sx={{
                    borderRadius: '16px',
                    bgcolor: '#ffffff',
                    padding: '32px',
                    textAlign: 'center',
                    fontSize: 14,
                    color: '#94a3b8',
                    boxShadow: shadows.card,
                  }}
                >
                  No transactions yet.
                </Box>
              )}
              {!txLoading && !txError && transactions.length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {transactions.map((tx, i) => {
                    const positive = tx.amount >= 0
                    const tint =
                      tx.type === 'EARN'
                        ? { bgcolor: '#eef7f3', color: '#045a42' }
                        : tx.type === 'CONVERT'
                          ? { bgcolor: '#f0f9ff', color: '#0284c7' }
                          : tx.type === 'REDEEM'
                            ? { bgcolor: '#fdf9ef', color: '#a98a41' }
                            : tx.type === 'TRANSFER'
                              ? { bgcolor: '#f5f3ff', color: '#7c3aed' }
                              : tx.type === 'EXPIRE'
                                ? { bgcolor: '#fef2f2', color: '#b91c1c' }
                                : { bgcolor: '#f8fafc', color: '#64748b' }
                    const Icon =
                      tx.type === 'EARN'
                        ? ArrowDownCircle
                        : tx.type === 'CONVERT'
                          ? RefreshCw
                          : tx.type === 'REDEEM'
                            ? Gift
                            : tx.type === 'TRANSFER'
                              ? Send
                              : tx.type === 'EXPIRE'
                                ? CreditCard
                                : Gift
                    return (
                      <MotionBox
                        key={tx.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.04, 0.4) }}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          borderRadius: '16px',
                          bgcolor: '#ffffff',
                          padding: '14px',
                          boxShadow: shadows.card,
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            height: 40,
                            width: 40,
                            flexShrink: 0,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '999px',
                            ...tint,
                          }}
                        >
                          <Icon size={17} />
                        </Box>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            sx={{
                              fontSize: 14,
                              fontWeight: 500,
                              color: '#0f172a',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {normalizeTransactionDescription(tx.description)}
                          </Typography>
                          <Typography sx={{ fontSize: 12, textTransform: 'capitalize', color: '#94a3b8' }}>
                            {tx.type.toLowerCase()} · {formatTransactionDate(tx.createdAt)}
                          </Typography>
                        </Box>
                        <Typography
                          sx={{
                            flexShrink: 0,
                            fontSize: 14,
                            fontWeight: 700,
                            fontVariantNumeric: 'tabular-nums',
                            color: positive ? '#059669' : '#0f172a',
                          }}
                        >
                          {positive ? '+' : ''}
                          {formatPoints(tx.amount)}
                        </Typography>
                      </MotionBox>
                    )
                  })}
                </Box>
              )}
            </MotionBox>
          )}

          {activeTab === 'profile' && (
            <MotionBox
              key="tab-profile"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.22 }}
              sx={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '20px', paddingBottom: '96px' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px', borderRadius: '16px', bgcolor: '#ffffff', padding: '20px', boxShadow: shadows.card }}>
                <Avatar
                  sx={{
                    height: 56,
                    width: 56,
                    bgcolor: '#006a4d',
                    fontSize: 18,
                    fontWeight: 700,
                  }}
                >
                  {getInitials(customer.userName)}
                </Avatar>
                <Box>
                  <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{customer.userName}</Typography>
                  <Typography sx={{ fontSize: 14, color: '#64748b' }}>
                    {customer.phone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}
                  </Typography>
                  <Box
                    sx={{
                      marginTop: '4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      borderRadius: '999px',
                      bgcolor: '#fdf9ef',
                      paddingX: '8px',
                      paddingTop: '2px',
                      paddingBottom: '2px',
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#a98a41',
                    }}
                  >
                    <Crown size={11} /> {tier.current.name} member
                  </Box>
                </Box>
              </Box>

              <Box
                sx={{
                  overflow: 'hidden',
                  borderRadius: '16px',
                  bgcolor: '#ffffff',
                  boxShadow: shadows.card,
                }}
              >
                {[
                  ['Linked accounts', `${customer.brandsConnected} brands connected`],
                  ['Security & PIN', 'Face ID, password'],
                  ['Notifications', 'Offers and conversions'],
                  ['Help centre', 'FAQs and support'],
                ].map(([title, sub], i) => (
                  <ButtonBase
                    key={title}
                    disableRipple
                    sx={{
                      display: 'flex',
                      width: '100%',
                      alignItems: 'center',
                      gap: '12px',
                      paddingX: '16px',
                      paddingTop: '14px',
                      paddingBottom: '14px',
                      textAlign: 'left',
                      ...(i > 0 && { borderTop: '1px solid #e2e8f0' }),
                      '&:hover': { bgcolor: '#f8fafc' },
                    }}
                  >
                    <UserRound size={16} color="#94a3b8" />
                    <Box sx={{ flex: 1 }}>
                      <Typography component="span" sx={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#0f172a' }}>
                        {title}
                      </Typography>
                      <Typography component="span" sx={{ display: 'block', fontSize: 12, color: '#94a3b8' }}>
                        {sub}
                      </Typography>
                    </Box>
                    <ChevronRight size={15} color="#cbd5e1" />
                  </ButtonBase>
                ))}
              </Box>
            </MotionBox>
          )}
        </AnimatePresence>
      </Box>

      {/* Bottom nav */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 20,
          display: 'flex',
          alignItems: 'stretch',
          justifyContent: 'space-around',
          borderTop: '1px solid #e2e8f0',
          bgcolor: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(8px)',
          paddingX: '8px',
          paddingTop: '8px',
          paddingBottom: '20px',
        }}
      >
        {(
          [
            { id: 'home', label: 'Home', icon: Home },
            { id: 'activity', label: 'Activity', icon: Activity },
            { id: 'profile', label: 'Profile', icon: UserRound },
          ] as const
        ).map(({ id, label, icon: Icon }) => {
          const active = activeTab === id
          return (
            <ButtonBase
              key={id}
              onClick={() => setActiveTab(id)}
              disableRipple
              sx={{
                position: 'relative',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                paddingTop: '4px',
                paddingBottom: '4px',
                borderRadius: 0,
              }}
            >
              <MotionBox animate={active ? { scale: 1.08, y: -1 } : { scale: 1, y: 0 }}>
                <Icon size={19} color={active ? '#045a42' : '#94a3b8'} />
              </MotionBox>
              <Typography sx={{ fontSize: 11, fontWeight: 500, color: active ? '#045a42' : '#94a3b8' }}>
                {label}
              </Typography>
              {active && (
                <MotionBox
                  layoutId="nav-pill"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  sx={{
                    position: 'absolute',
                    top: -9,
                    height: 4,
                    width: 32,
                    borderRadius: '999px',
                    bgcolor: '#006a4d',
                  }}
                />
              )}
            </ButtonBase>
          )
        })}
      </Box>

      {/* Modals */}
      <LocatePointsModal
        isOpen={locateOpen}
        brandOptions={brands}
        onClose={() => setLocateOpen(false)}
        onVerified={() => {
          /* hook for backend linking call */
        }}
        customerName={customer.userName}
        customerEmail={customerEmail}
        customerPhone={customerPhone}
      />
      <RedeemPointsModal
        isOpen={redeemOpen}
        customerName={customer.userName}
        totalPoints={totalPoints}
        pointsData={pointsByBrand}
        allBrands={brands}
        customerEmail={customerEmail}
        customerPhone={customerPhone}
        onClose={() => setRedeemOpen(false)}
      />
      <ObjectiveWorkspace
        isOpen={goalOpen}
        onClose={handleGoalClose}
        userName={customer.userName}
        customerId={customer.customerId}
        totalPoints={totalPoints}
        lbgCoins={customer.totalLbgCoins}
        tier={customer.tier ?? tier.current.name}
        pointsByBrand={pointsByBrand}
        onPartnerHandoff={handlePartnerHandoff}
        resume={goalResume}
      />
    </Box>
  )
}
