import { Component, useEffect, useMemo, useState } from 'react'
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
  Gem,
  Gift,
  Home,
  Link2,
  Loader2,
  Medal,
  RefreshCw,
  Sparkles,
  TrendingUp,
  UserRound,
} from 'lucide-react'
import type {
  BrandOption,
  CustomerSummary,
  DashboardTab,
  PointsProvider,
  WalletTransactionItem,
} from '../types/rewards'
import type { SduiGenerateResponse } from '../types/sdui'
import { fetchWalletTransactions } from '../services/rewardsApi'
import { generateExperience } from '../services/experienceApi'
import LocatePointsModal from '../components/dashboard/LocatePointsModal'
import RedeemPointsModal from '../components/dashboard/RedeemPointsModal'
import MetricTile from '../components/dashboard/MetricTile'
import SDUIRenderer from '../renderer/SDUIRenderer'
import {
  SyncStatusCard,
  FlashRewardBanner,
  BonusRewardCard,
  StreakCard,
  QuickWinCard,
  ChallengeCard,
  GoalProgressCard,
  AddGoalCard,
  Leaderboard,
  BadgeCard,
  RewardCarousel,
  QuickRedeemCard,
  TangibleValueCard,
  PersonalizedOfferCard,
  RecommendedActions,
  ExpiringPointsAlert,
  CountdownCard,
  MilestoneCard,
  GoalMilestoneCard,
  QuizCard,
  ProjectionChart,
  FutureValueCard,
  LongTermGoalCard,
  EducationalInsightCard,
  FutureMilestoneCard,
  GoalLinkedReward,
  ReengagementBanner,
  BrandExplorerCard,
  RewardsInsightCard,
} from '../components/rewards-intelligence'
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
  earnedRewardMap: Record<string, string>
  onBackToHome: () => void
  onRefresh: () => Promise<void>
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

/* Points scheduled to expire at the next partner reset
   TODO: source from the customer summary endpoint once available */
const EXPIRING_POINTS = 1250

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

/* ------------------------------------------------------------------ */
/* Error Boundary — catches crashes in personalized SDUI rendering     */
/* ------------------------------------------------------------------ */

interface EBProps { fallback: React.ReactNode; children: React.ReactNode }
interface EBState { hasError: boolean }

class SDUIErrorBoundary extends Component<EBProps, EBState> {
  state: EBState = { hasError: false }
  static getDerivedStateFromError(): EBState { return { hasError: true } }
  componentDidCatch(err: Error) { console.warn('[SDUIErrorBoundary] personalized render crashed, falling back:', err) }
  render() { return this.state.hasError ? this.props.fallback : this.props.children }
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function RewardsDashboardPage({
  customer,
  pointsByBrand,
  brands,
  earnedRewardMap,
  onBackToHome,
  onRefresh,
}: RewardsDashboardPageProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('home')
  const [locateOpen, setLocateOpen] = useState(false)
  const [redeemOpen, setRedeemOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const [transactions, setTransactions] = useState<WalletTransactionItem[]>([])
  const [txLoading, setTxLoading] = useState(false)
  const [txError, setTxError] = useState('')

  /* ---------------- personalized experience (QUEST-UI middleware) -------- */
  const [experience, setExperience] = useState<SduiGenerateResponse | null>(null)
  const [experienceStatus, setExperienceStatus] = useState<'loading' | 'personalized' | 'fallback'>('loading')
  const [experienceNonce, setExperienceNonce] = useState(0)

  useEffect(() => {
    let cancelled = false
    setExperienceStatus('loading')
    const topBrands = [...pointsByBrand]
      .sort((a, b) => b.points - a.points)
      .slice(0, 5)
      .map((p) => ({ name: p.brandName, points: p.points }))
    generateExperience(customer.customerId, {
      totalPoints: customer.totalBrandPoints,
      lbgCoins: customer.totalLbgCoins,
      brandsConnected: customer.brandsConnected,
      topBrands,
      lastSyncedAt: customer.lastSyncedAt,
    })
      .then((res) => {
        if (cancelled) return
        setExperience(res)
        const hasComponents =
          res.status === 'PERSONALIZED' && Array.isArray(res.sdui?.components) && res.sdui.components.length > 0
        setExperienceStatus((prev) => {
          if (hasComponents) return 'personalized'
          if (prev === 'personalized') return 'personalized'
          return 'fallback'
        })
      })
      .catch((error) => {
        if (cancelled) return
        console.warn('[RewardsDashboard] Personalization unavailable, using static layout:', error)
        setExperience(null)
        setExperienceStatus('fallback')
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer.customerId, experienceNonce])

  const tier = useTier(customer.totalLbgCoins + customer.totalBrandPoints / 2, customer.tier)

  /* Journey-scale progress for the hero slider: LBG coins earned out of the
     final (Platinum) threshold of 25,000. */
  const journeyProgress = Math.min(
    100,
    Math.round((customer.totalLbgCoins / TIERS[TIERS.length - 1].min) * 100),
  )

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

  const brandCategories = useMemo(() => {
    const categoryIcons: Record<string, string> = {
      Travel: 'plane',
      Shopping: 'shopping-bag',
      Dining: 'utensils',
      Groceries: 'basket',
      Health: 'heart',
    }
    const map = new Map<string, number>()
    brands.forEach((b) => map.set(b.category, (map.get(b.category) ?? 0) + 1))
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, count]) => ({ label, count, icon: categoryIcons[label] ?? 'zap' }))
  }, [brands])

  const topBrand = useMemo(
    () => [...pointsByBrand].sort((a, b) => b.points - a.points)[0] ?? null,
    [pointsByBrand],
  )

  const walletValue = customer.totalLbgCoins + Math.floor(totalPoints / 2)

  const projectionData = useMemo(() => {
    const years = ['2026', '2027', '2028', '2029', '2030']
    let value = Math.max(totalPoints, 500)
    return years.map((year) => {
      const point = { year, value: Math.round(value) }
      value *= 1.12
      return point
    })
  }, [totalPoints])

  const leaderboardEntries = useMemo(() => {
    const base: Array<{ rank: number; name: string; points: number; avatar: string; isCurrentUser?: boolean }> = [
      { rank: 1, name: 'Amelia R.', points: 24800, avatar: 'AR' },
      { rank: 2, name: 'Daniel K.', points: 21350, avatar: 'DK' },
      { rank: 3, name: 'Priya S.', points: 19720, avatar: 'PS' },
    ]
    const mine = {
      name: `${customer.userName.split(' ')[0]}.`,
      points: walletValue,
      avatar: getInitials(customer.userName),
      isCurrentUser: true,
    }
    return [...base, mine]
      .sort((a, b) => b.points - a.points)
      .map((entry, i) => ({ ...entry, rank: i + 1 }))
      .filter((e) => e.isCurrentUser || e.rank <= 4)
  }, [customer.userName, customer.totalLbgCoins, walletValue])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await onRefresh()
      setExperienceNonce((n) => n + 1)
    } finally {
      setRefreshing(false)
    }
  }

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
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
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
              {/* Coins hero */}
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
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      marginTop: '14px',
                      paddingTop: '-5px'
                    }}
                  >
                    {/* Card-holder name with a punched-in letterpress finish */}
                    <Box
                      sx={{
                        fontSize: 14,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.22em',
                        color: 'rgba(30,41,59,0.72)',
                        textShadow:
                          '0 1px 0 rgba(255,255,255,0.95), 0 -1px 1px rgba(15,23,42,0.30), 0 2px 3px rgba(15,23,42,0.12)',
                      }}
                    >
                      {customer.userName}
                    </Box>
                    <Box
                      sx={{
                        fontSize: 12,
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.14em',
                      }}
                    >
                      Your LBG Coins
                    </Box>
                    <MotionBox
                      key={customer.totalLbgCoins}
                      initial={{ scale: 0.94, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                      sx={{ fontSize: 34, fontWeight: 900, letterSpacing: '-0.025em' , mt: -1}}
                    >
                      {formatPoints(customer.totalLbgCoins)}
                    </MotionBox>
                    {/* Current-tier tag */}
                    <Box
                      sx={{
                        alignSelf: 'flex-start',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        borderRadius: '999px',
                        border: '1px solid rgba(30,41,59,0.35)',
                        bgcolor: 'rgba(255,255,255,0.5)',
                        paddingX: '10px',
                        paddingTop: '3px',
                        paddingBottom: '3px',
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: '#334155',
                      }}
                    >
                      <tier.current.icon size={12} /> {tier.current.name}
                    </Box>
                  </Box>
                  <MotionImg
                    src={lbgCoinImg}
                    alt="LBG Coin"
                    initial={{ rotateY: 0 }}
                    animate={{ rotateY: 360 }}
                    transition={{ duration: 1.5, ease: 'easeInOut' }}
                    style={{ width: 'auto', objectFit: 'contain' }}
                  />
                  {/* <Box
                    sx={{
                      borderRadius: '999px',
                      bgcolor: 'rgba(221,190,114,0.9)',
                      paddingX: '10px',
                      paddingTop: '2px',
                      paddingBottom: '2px',
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#073a2d',
                    }}
                  >
                    {tier.current.name.toUpperCase()}
                  </Box> */}
                </Box>
                <Typography
                  sx={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: 12 }}
                >
                  <TrendingUp size={13} color="#059669" /> +850 vs last month{' '}
                  <span style={{ opacity: 0.55 }}>|</span>{' '}
                  {formatLastSyncedAt(customer.lastSyncedAt)}
                </Typography>

                {/* Tier progress */}
                <Box sx={{ marginTop: 2,  }}>
                  <Box
                    sx={{
                      position: 'relative',
                      marginBottom: '6px',
                      height: 16,
                    }}
                  >
                    {TIERS.map((t, i) => {
                      /* Anchor each label at its true position on the 0–25k journey scale */
                      const pos = (t.min / TIERS[TIERS.length - 1].min) * 100
                      const anchor =
                        i === 0
                          ? { left: 0 }
                          : i === TIERS.length - 1
                            ? { right: 0 }
                            : { left: `${pos}%`, transform: 'translateX(-50%)' }
                      return (
                        <Box
                          key={t.name}
                          sx={{
                            position: 'absolute',
                            top: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: 11,
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                            color: '#585d64',
                            ...(tier.current.name === t.name && { color: '#585d64', fontWeight: 700 }),
                            ...anchor,
                          }}
                        >
                          <t.icon size={11} /> {t.name}
                        </Box>
                      )
                    })}
                  </Box>
                  <Box
                    sx={{
                      position: 'relative',
                      height: 8,
                      overflow: 'hidden',
                      borderRadius: '999px',
                      bgcolor: '#e5e7eb',
                    }}
                  >
                    <MotionBox
                      initial={{ width: 0 }}
                      animate={{ width: `${journeyProgress}%` }}
                      transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
                      sx={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: 0,
                        borderRadius: '999px',
                        background: '#006a4d',
                      }}
                    />
                  </Box>
                  <Box
                    sx={{
                      marginTop: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Typography sx={{ fontSize: 11 }}>
                      {tier.next
                        ? `${formatPoints(Math.max(0, tier.next.min - customer.totalLbgCoins))} pts to ${tier.next.name}`
                        : 'Top tier reached — enjoy your Platinum perks'}
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#006a4d',
                      }}
                    >
                      Know more <ChevronRight size={13} />
                    </Box>
                  </Box>
                </Box>
              </MotionBox>

              {/* Action buttons */}
              <Box sx={{ marginTop: 2, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', paddingBottom: '4px' }}>
                <MotionButton
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setLocateOpen(true)}
                  disableRipple
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    borderRadius: '12px',
                    bgcolor: 'rgba(255,255,255,0.15)',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: 'inherit',
                    color: 'inherit',
                    backdropFilter: 'blur(4px)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                  }}
                >
                  <Link2 size={16} /> Locate Points
                </MotionButton>
                <MotionButton
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setRedeemOpen(true)}
                  disableRipple
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    borderRadius: '12px',
                    bgcolor: '#ddbe72',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: 'inherit',
                    color: '#073a2d',
                    boxShadow: shadows.card,
                    '&:hover': { bgcolor: '#ecd9a8' },
                  }}
                >
                  <Gift size={16} /> Redeem Coins
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
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
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
              sx={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '20px', paddingBottom: '96px',  }}
            >
              {experienceStatus === 'loading' && (
                <div aria-busy="true" aria-label="Personalizing your rewards">
                  <div className="grid grid-cols-3 gap-2.5">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/70" />
                    ))}
                  </div>
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="mt-3 h-28 animate-pulse rounded-2xl bg-white/70"
                      style={{ animationDelay: `${i * 120}ms` }}
                    />
                  ))}
                  <p className="mt-4 text-center text-xs text-slate-400">Personalizing your rewards…</p>
                </div>
              )}

              {experienceStatus === 'personalized' && experience && (
                <SDUIErrorBoundary
                  fallback={
                    <p className="rounded-xl border border-gold-200 bg-gold-50 px-3 py-2 text-xs text-gold-700">
                      Personalized rendering hit an unexpected issue — showing the standard rewards layout.
                    </p>
                  }
                >
                  <div className="flex items-center justify-between rounded-full bg-white px-3.5 py-2 shadow-card">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-brand-700">
                      <Sparkles size={13} /> Personalized for you
                    </span>
                    {(() => {
                      const persona = experience.intelligence?.persona ?? experience.sdui?.persona ?? ''
                      return persona ? (
                        <span className="text-[11px] uppercase tracking-wide text-slate-400">
                          {persona.replace(/_/g, ' ').toLowerCase()}
                        </span>
                      ) : null
                    })()}
                  </div>
                  <SDUIRenderer
                    components={experience.sdui?.components ?? []}
                    narrative={experience.sdui?.narrative}
                    onLocatePoints={() => setLocateOpen(true)}
                    onRedeemPoints={() => setRedeemOpen(true)}
                  />
                </SDUIErrorBoundary>
              )}

              {experienceStatus === 'fallback' && (
                <>
                  {experience === null ? (
                    <p className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                      Personalization service unreachable — showing the standard rewards layout.
                    </p>
                  ) : (
                    <p className="rounded-xl border border-gold-200 bg-gold-50 px-3 py-2 text-xs text-gold-700">
                      Personalization is temporarily unavailable — showing the standard rewards layout.
                    </p>
                  )}
                </>
              )}

              {/* Metrics */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px' }}>
                <MetricTile
                  label="Total points"
                  value={formatPoints(customer.totalLbgCoins)}
                  tone="white"
                  valueColor="#006a4d"
                  infoText="Sum of points held across all connected partner brands."
                />
                <MetricTile
                  label="Brands linked"
                  value={String(customer.brandsConnected)}
                  tone="white"
                  valueColor="#0284c7"
                  infoText="Partner loyalty programmes connected to this wallet."
                />
                <MetricTile
                  label="Expiring soon"
                  value={formatPoints(EXPIRING_POINTS)}
                  tone="white"
                  valueColor="#ef4444"
                  infoText="Points that will expire at the next partner reset."
                />
              </Box>

              {/* Smart rewards */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', paddingX: '4px' }}>
                  <Sparkles size={14} color="#045a42" />
                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>Smart rewards</Typography>
                </Box>

                <SyncStatusCard
                  status="synced"
                  lastSyncedAt={formatLastSyncedAt(customer.lastSyncedAt)}
                  onRefresh={handleRefresh}
                />

                <FlashRewardBanner
                  title="Flash Conversion Bonus"
                  subtitle="Double coins on every conversion this weekend."
                  originalPoints={400}
                  discountedPoints={200}
                  timer="04:32:11"
                />

                <BonusRewardCard points={250} expiresIn="2 hours" />

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    alignItems: 'stretch',
                    gap: '12px',
                    '& > *': { height: '100%' },
                  }}
                >
                  <StreakCard
                    streakDays={6}
                    message="You're on a roll this month."
                    nextReward="250 bonus coins"
                    milestones={[
                      { days: 3, reward: '50 pts', achieved: true },
                      { days: 5, reward: '100 pts', achieved: true },
                      { days: 7, reward: '250 coins', achieved: false },
                    ]}
                  />
                  <QuickWinCard
                    rewards={[...pointsByBrand]
                      .sort((a, b) => a.points - b.points)
                      .slice(0, 3)
                      .map((p) => ({ name: p.brandName, points: p.points }))}
                  />
                </Box>

                <ChallengeCard
                  title="Autumn Points Sprint"
                  description="Earn across 3 linked brands before Sunday to unlock the group bonus."
                  progress={68}
                  reward="500 coins"
                  daysLeft={5}
                  participants={2418}
                />

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    alignItems: 'stretch',
                    gap: '12px',
                    '& > *': { height: '100%' },
                  }}
                >
                  <GoalProgressCard
                    goalName={`${tier.next ? tier.next.name : tier.current.name} tier status`}
                    current={walletValue}
                    target={tier.next?.min ?? TIERS[TIERS.length - 1].min}
                    percentage={tier.progress}
                    remaining={Math.max(0, (tier.next?.min ?? TIERS[TIERS.length - 1].min) - walletValue)}
                    motivationalMessage={
                      tier.next
                        ? `${formatPoints(Math.max(0, tier.next.min - walletValue))} more points unlocks premium conversion rates.`
                        : 'You have reached the top of the programme.'
                    }
                  />
                  <AddGoalCard subtitle="e.g. Flights, gadgets, treats" />
                </Box>

                <Leaderboard entries={leaderboardEntries} period="weekly" />

                <BadgeCard
                  badges={[
                    { name: 'First Link', icon: 'trophy', earned: true },
                    { name: '7-Day Streak', icon: 'flame', earned: true },
                    { name: 'Quiz Master', icon: 'brain', earned: true },
                    { name: 'Top Earner', icon: 'crown', earned: false },
                    { name: 'Goal Getter', icon: 'star', earned: false },
                    { name: 'Big Saver', icon: 'star', earned: false },
                  ]}
                  totalEarned={3}
                  totalAvailable={6}
                />

                <RewardCarousel
                  rewards={[
                    { name: '£5 Coffee Voucher', points: 500, category: 'Dining' },
                    { name: 'Cinema Night', points: 1200, category: 'Film', limited: true },
                    { name: '£10 Shopping Off', points: 1000, category: 'Shopping' },
                    { name: 'Lounge Pass', points: 4500, category: 'Travel', limited: true },
                  ]}
                />

                <QuickRedeemCard
                  rewards={[
                    { name: 'Barista coffee', points: 300, icon: 'coffee' },
                    { name: 'Lunch deal', points: 750, icon: 'utensils' },
                    { name: 'Movie night', points: 1200, icon: 'film' },
                  ]}
                  onViewAll={() => setRedeemOpen(true)}
                />

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    alignItems: 'stretch',
                    gap: '12px',
                    '& > *': { height: '100%' },
                  }}
                >
                  <TangibleValueCard
                    cashValue={`£${(totalPoints * 0.005).toFixed(2)}`}
                    pointsEquivalent={totalPoints}
                    breakdown={[
                      { label: 'Brand points', value: formatPoints(totalPoints) },
                      { label: 'LBG coins', value: formatPoints(customer.totalLbgCoins) },
                    ]}
                  />
                  <PersonalizedOfferCard
                    title="Coins Multiplier"
                    subtitle="Picked for your activity"
                    offer="2× Coins Weekend"
                    validUntil="48 hours"
                    message="Convert any brand points and earn double LBG coins."
                    onClaim={() => setRedeemOpen(true)}
                  />
                </Box>

                <RecommendedActions
                  actions={[
                    { label: 'Link a new brand', points: 200, icon: 'shopping-bag' },
                    { label: 'Convert idle points', points: 850, icon: 'target' },
                    { label: 'Invite a friend', points: 500, icon: 'users' },
                  ]}
                />

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    alignItems: 'stretch',
                    gap: '12px',
                    '& > *': { height: '100%' },
                  }}
                >
                  <ExpiringPointsAlert
                    expiringPoints={1250}
                    daysLeft={21}
                    message="Nando's balance has been idle for 60 days."
                    onUsePoints={() => setRedeemOpen(true)}
                  />
                  <CountdownCard
                    title="Offer Ends In"
                    days={0}
                    hours={4}
                    minutes={32}
                    message="Flash pricing on featured rewards"
                  />
                </Box>

                <MilestoneCard
                  milestones={[
                    { label: 'Linked first brand', achieved: customer.brandsConnected > 0 },
                    { label: 'Earned 10k brand points', achieved: totalPoints >= 10000 },
                    { label: 'Converted to LBG coins', achieved: customer.totalLbgCoins > 0 },
                  ]}
                />

                <GoalMilestoneCard
                  goalName={`${tier.current.name} tier`}
                  milestones={[
                    { label: 'Account opened & verified', reached: true },
                    { label: 'Gold tier unlocked', reached: walletValue >= TIERS[1].min },
                    { label: '6k combined balance — Platinum', reached: walletValue >= TIERS[2].min },
                    { label: '12k combined balance — Diamond', reached: walletValue >= TIERS[TIERS.length - 1].min },
                  ]}
                />

                <QuizCard
                  question="Which habit grows your coin balance fastest?"
                  options={['Redeeming weekly', 'Converting monthly', 'Letting points sit']}
                  reward="+100 LBG coins"
                />

                <ProjectionChart data={projectionData} growthLabel="Projected growth at 12% annually" />

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    alignItems: 'stretch',
                    gap: '12px',
                    '& > *': { height: '100%' },
                  }}
                >
                  <FutureValueCard
                    currentValue={totalPoints}
                    projectedValue={projectionData[projectionData.length - 1]?.value ?? totalPoints}
                    timeframe="to 2030"
                    growthRate="12% annually"
                    message="Regular conversions protect you from point devaluation."
                  />
                  <LongTermGoalCard
                    goalName="Diamond Status"
                    current={walletValue}
                    target={TIERS[TIERS.length - 1].min}
                    percentage={tier.progress}
                    estimatedCompletion="2028"
                  />
                </Box>

                <EducationalInsightCard
                  insight="Points lose an average of 8% of their redemption value for every year they sit unused. Converting early locks in today's rates."
                  source="LBG Rewards Lab, 2026"
                />

                <FutureMilestoneCard
                  milestones={[
                    { label: 'Gold tier perks unlock', date: 'Q4 2026', achieved: walletValue >= TIERS[1].min },
                    { label: 'Lounge pass voucher', date: 'Jan 2027', achieved: false },
                    { label: 'Concierge access', date: '2028', achieved: false },
                  ]}
                />

                <GoalLinkedReward
                  goalName="Platinum Status"
                  rewards={[
                    { name: 'Weekly shop bonus', points: 150, goalLinked: true },
                    { name: 'Direct debit cashback', points: 300, goalLinked: true },
                    { name: 'Contactless promo', points: 100, goalLinked: false },
                  ]}
                />

                <ReengagementBanner
                  title="Welcome back!"
                  message="Two of your brands have fresh offers waiting. Link another partner to boost every conversion."
                  ctaText="Explore brands"
                  onCta={() => setLocateOpen(true)}
                />
              </Box>

              {/* Your points by brand */}
              <Box>
                <Typography sx={{ marginBottom: '10px', paddingX: '4px', fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                  Your points by brand
                </Typography>
                <Box
                  className="no-scrollbar"
                  sx={{
                    marginX: '-20px',
                    display: 'flex',
                    gap: '12px',
                    overflowX: 'auto',
                    scrollSnapType: 'x mandatory',
                    paddingX: '20px',
                    paddingBottom: '4px',
                  }}
                >
                  {pointsByBrand.map((provider, i) => (
                    <MotionBox
                      key={provider.brandId}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * i }}
                      whileTap={{ scale: 0.97 }}
                      sx={{
                        width: 144,
                        flexShrink: 0,
                        scrollSnapAlign: 'start',
                        borderRadius: '16px',
                        bgcolor: '#ffffff',
                        padding: '14px',
                        boxShadow: shadows.card,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <Box
                          sx={{
                            display: 'flex',
                            height: 36,
                            width: 36,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '12px',
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#ffffff',
                            backgroundColor: provider.color,
                          }}
                        >
                          {provider.logoText}
                        </Box>
                        {earnedRewardMap[provider.brandId] && (
                          <Box
                            sx={{
                              borderRadius: '999px',
                              bgcolor: '#eef7f3',
                              paddingX: '6px',
                              paddingTop: '2px',
                              paddingBottom: '2px',
                              fontSize: 9,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              color: '#045a42',
                            }}
                          >
                            Convert
                          </Box>
                        )}
                      </Box>
                      <Typography
                        sx={{
                          marginTop: '8px',
                          fontSize: 12,
                          fontWeight: 500,
                          color: '#64748b',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {provider.brandName}
                      </Typography>
                      <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                        {formatPoints(provider.points)}
                      </Typography>
                      <Typography sx={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>
                        points
                      </Typography>
                    </MotionBox>
                  ))}
                </Box>
              </Box>

              {/* Eligible brands by category */}
              <Box>
                <BrandExplorerCard
                  categories={brandCategories}
                  actionLabel="View all"
                  onExplore={() => setLocateOpen(true)}
                />
              </Box>

              {/* Insights */}
              <Box>
                <RewardsInsightCard
                  title="Your Rewards Insight"
                  topBrandName={topBrand?.brandName}
                  topBrandPoints={topBrand?.points ?? 0}
                  growthTip={
                    tier.next
                      ? `${formatPoints(Math.max(0, tier.next.min - walletValue))} points to ${tier.next.name} — converting your largest idle balance gets you there fastest.`
                      : `You are at the top tier. Enjoy your ${tier.current.name} perks.`
                  }
                  expiringPoints={1250}
                  expiryDate="12 Sep"
                  ctaText="Redeem smarter"
                  onCta={() => setRedeemOpen(true)}
                />
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
                          : { bgcolor: '#fdf9ef', color: '#a98a41' }
                    const Icon =
                      tx.type === 'EARN' ? ArrowDownCircle : tx.type === 'CONVERT' ? RefreshCw : Gift
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
      />
      <RedeemPointsModal
        isOpen={redeemOpen}
        customerName={customer.userName}
        totalPoints={totalPoints}
        pointsData={pointsByBrand}
        onClose={() => setRedeemOpen(false)}
      />
    </Box>
  )
}
