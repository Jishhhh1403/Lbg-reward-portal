import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  ArrowLeft,
  ArrowDownCircle,
  Bell,
  ChevronRight,
  Coins,
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
import { fetchWalletTransactions } from '../services/rewardsApi'
import LocatePointsModal from '../components/dashboard/LocatePointsModal'
import RedeemPointsModal from '../components/dashboard/RedeemPointsModal'
import MetricTile from '../components/dashboard/MetricTile'
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

interface RewardsDashboardPageProps {
  customer: CustomerSummary
  pointsByBrand: PointsProvider[]
  brands: BrandOption[]
  earnedRewardMap: Record<string, string>
  onBackToHome: () => void
  onRefresh: () => Promise<void>
}

/* ------------------------------------------------------------------ */
/* Tier logic                                                          */
/* ------------------------------------------------------------------ */

const TIERS = [
  { name: 'Silver', min: 0, icon: Medal },
  { name: 'Gold', min: 5000, icon: Crown },
  { name: 'Platinum', min: 15000, icon: Gem },
] as const

function useTier(totalPoints: number) {
  return useMemo(() => {
    const current = [...TIERS].reverse().find((t) => totalPoints >= t.min) ?? TIERS[0]
    const idx = TIERS.indexOf(current)
    const next = TIERS[idx + 1] ?? null
    const span = next ? next.min - current.min : 1
    const progress = next ? Math.min(100, Math.round(((totalPoints - current.min) / span) * 100)) : 100
    return { current, next, progress }
  }, [totalPoints])
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

  const tier = useTier(customer.totalLbgCoins + customer.totalBrandPoints / 2)

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
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-800 via-brand-700 to-brand-600 px-5 pt-5 text-white">
        <div className="flex items-center justify-between">
          <button
            onClick={onBackToHome}
            className="-ml-1 flex items-center gap-1 rounded-lg p-1.5 text-sm font-medium transition hover:bg-white/10"
          >
            <ArrowLeft size={17} /> Home
          </button>
          <p className="text-sm font-semibold tracking-wide">Rewards</p>
          <div className="flex items-center gap-0.5">
            <motion.button
              whileTap={{ rotate: -180 }}
              onClick={handleRefresh}
              className="rounded-full p-2 transition hover:bg-white/10"
              aria-label="Refresh"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </motion.button>
            <button className="rounded-full p-2 transition hover:bg-white/10" aria-label="Notifications">
              <Bell size={16} />
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab !== 'activity' && (
            <motion.div key="hero" exit={{ opacity: 0, y: -8 }} className="pb-4">
              {/* Coins hero */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="mt-3 rounded-3xl bg-white/12 p-5 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-brand-100">
                    <Coins size={15} className="text-gold-300" /> LBG Coins
                  </div>
                  <span className="rounded-full bg-gold-400/90 px-2.5 py-0.5 text-[11px] font-bold text-brand-900">
                    {tier.current.name.toUpperCase()}
                  </span>
                </div>
                <motion.p
                  key={customer.totalLbgCoins}
                  initial={{ scale: 0.94, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                  className="mt-2 text-4xl font-black tracking-tight"
                >
                  {formatPoints(customer.totalLbgCoins)}
                </motion.p>
                <p className="mt-1 flex items-center gap-1 text-xs text-brand-100">
                  <TrendingUp size={13} className="text-emerald-300" /> +850 this month ·{' '}
                  {formatLastSyncedAt(customer.lastSyncedAt)}
                </p>

                {/* Tier progress */}
                <div className="mt-4">
                  <div className="mb-1.5 flex justify-between text-[11px] font-medium text-brand-100">
                    {TIERS.map((t) => (
                      <span
                        key={t.name}
                        className={`flex items-center gap-1 ${
                          tier.current.name === t.name ? 'text-gold-300' : ''
                        }`}
                      >
                        <t.icon size={11} /> {t.name}
                      </span>
                    ))}
                  </div>
                  <div className="relative h-2 overflow-hidden rounded-full bg-white/20">
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand-300 to-gold-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${tier.progress}%` }}
                      transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-brand-100">
                    {tier.next
                      ? `${formatPoints(Math.max(0, tier.next.min - (customer.totalLbgCoins + Math.floor(totalPoints / 2))))} pts to ${tier.next.name}`
                      : 'Top tier reached — enjoy your Platinum perks'}
                  </p>
                </div>
              </motion.div>

              {/* Action buttons */}
              <div className="mt-4 grid grid-cols-2 gap-2.5 pb-1">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setLocateOpen(true)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-white/15 py-3 text-sm font-semibold backdrop-blur-sm transition hover:bg-white/25"
                >
                  <Link2 size={16} /> Locate Points
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setRedeemOpen(true)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gold-400 py-3 text-sm font-bold text-brand-900 shadow-card transition hover:bg-gold-300"
                >
                  <Gift size={16} /> Redeem Coins
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Scrollable body */}
      <div className="no-scrollbar relative -mt-3 flex-1 overflow-y-auto rounded-t-3xl bg-slate-100" style={{border: '1px solid red'}}>
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="tab-home"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.22 }}
              className="space-y-6 p-5 pb-24"
            >
              {/* Metrics */}
              <section className="grid grid-cols-3 gap-2.5">
                <MetricTile
                  label="Total points"
                  value={formatPoints(totalPoints)}
                  tone="white"
                  infoText="Sum of points held across all connected partner brands."
                />
                <MetricTile
                  label="Brands linked"
                  value={String(customer.brandsConnected)}
                  tone="white"
                  infoText="Partner loyalty programmes connected to this wallet."
                />
                <MetricTile
                  label="Coins earned"
                  value={formatPoints(customer.totalLbgCoins)}
                  tone="brand"
                  infoText="LBG coins minted after converting brand points."
                />
              </section>

              {/* Smart rewards */}
              <section className="space-y-3">
                <div className="flex items-center gap-1.5 px-1">
                  <Sparkles size={14} className="text-brand-700" />
                  <h2 className="text-sm font-semibold text-slate-800">Smart rewards</h2>
                </div>

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

                <div className="grid grid-cols-2 items-stretch gap-3 [&>*]:h-full">
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
                </div>

                <ChallengeCard
                  title="Autumn Points Sprint"
                  description="Earn across 3 linked brands before Sunday to unlock the group bonus."
                  progress={68}
                  reward="500 coins"
                  daysLeft={5}
                  participants={2418}
                />

                <div className="grid grid-cols-2 items-stretch gap-3 [&>*]:h-full">
                  <GoalProgressCard
                    goalName={`${tier.next ? tier.next.name : 'Platinum'} tier status`}
                    current={walletValue}
                    target={tier.next?.min ?? 15000}
                    percentage={tier.progress}
                    remaining={Math.max(0, (tier.next?.min ?? 15000) - walletValue)}
                    motivationalMessage={
                      tier.next
                        ? `${formatPoints(Math.max(0, tier.next.min - walletValue))} more points unlocks premium conversion rates.`
                        : 'You have reached the top of the programme.'
                    }
                  />
                  <AddGoalCard subtitle="e.g. Flights, gadgets, treats" />
                </div>

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

                <div className="grid grid-cols-2 items-stretch gap-3 [&>*]:h-full">
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
                </div>

                <RecommendedActions
                  actions={[
                    { label: 'Link a new brand', points: 200, icon: 'shopping-bag' },
                    { label: 'Convert idle points', points: 850, icon: 'target' },
                    { label: 'Invite a friend', points: 500, icon: 'users' },
                  ]}
                />

                <div className="grid grid-cols-2 items-stretch gap-3 [&>*]:h-full">
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
                </div>

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
                    { label: '15k combined balance', reached: walletValue >= TIERS[2].min },
                  ]}
                />

                <QuizCard
                  question="Which habit grows your coin balance fastest?"
                  options={['Redeeming weekly', 'Converting monthly', 'Letting points sit']}
                  reward="+100 LBG coins"
                />

                <ProjectionChart data={projectionData} growthLabel="Projected growth at 12% annually" />

                <div className="grid grid-cols-2 items-stretch gap-3 [&>*]:h-full">
                  <FutureValueCard
                    currentValue={totalPoints}
                    projectedValue={projectionData[projectionData.length - 1]?.value ?? totalPoints}
                    timeframe="to 2030"
                    growthRate="12% annually"
                    message="Regular conversions protect you from point devaluation."
                  />
                  <LongTermGoalCard
                    goalName="Platinum Status"
                    current={walletValue}
                    target={TIERS[2].min}
                    percentage={tier.progress}
                    estimatedCompletion="2028"
                  />
                </div>

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
              </section>

              {/* Your points by brand */}
              <section>
                <h2 className="mb-2.5 px-1 text-sm font-semibold text-slate-800">Your points by brand</h2>
                <div className="no-scrollbar -mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-1">
                  {pointsByBrand.map((provider, i) => (
                    <motion.div
                      key={provider.brandId}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * i }}
                      whileTap={{ scale: 0.97 }}
                      className="w-36 shrink-0 snap-start rounded-2xl bg-white p-3.5 shadow-card"
                    >
                      <span className="flex items-start justify-between">
                        <span
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold text-white"
                          style={{ backgroundColor: provider.color }}
                        >
                          {provider.logoText}
                        </span>
                        {earnedRewardMap[provider.brandId] && (
                          <span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-brand-700">
                            Convert
                          </span>
                        )}
                      </span>
                      <p className="mt-2 truncate text-xs font-medium text-slate-500">{provider.brandName}</p>
                      <p className="text-base font-bold text-slate-900">{formatPoints(provider.points)}</p>
                      <p className="text-[10px] uppercase tracking-wide text-slate-400">points</p>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* Eligible brands by category */}
              <section>
                <BrandExplorerCard
                  categories={brandCategories}
                  actionLabel="View all"
                  onExplore={() => setLocateOpen(true)}
                />
              </section>

              {/* Insights */}
              <section>
                <RewardsInsightCard
                  title="Your Rewards Insight"
                  topBrandName={topBrand?.brandName}
                  topBrandPoints={topBrand?.points ?? 0}
                  growthTip={
                    tier.next
                      ? `${formatPoints(Math.max(0, tier.next.min - walletValue))} points to ${tier.next.name} — converting your largest idle balance gets you there fastest.`
                      : 'You are at the top tier. Enjoy your Platinum perks.'
                  }
                  expiringPoints={1250}
                  expiryDate="12 Sep"
                  ctaText="Redeem smarter"
                  onCta={() => setRedeemOpen(true)}
                />
              </section>
            </motion.div>
          )}

          {activeTab === 'activity' && (
            <motion.div
              key="tab-activity"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.22 }}
              className="p-5 pb-24"
            >
              <h2 className="mb-3 px-1 text-sm font-semibold text-slate-800">Wallet transactions</h2>
              {txLoading && (
                <div className="flex items-center justify-center gap-2 rounded-2xl bg-white p-8 text-sm text-slate-500 shadow-card">
                  <Loader2 size={16} className="animate-spin" /> Loading transactions…
                </div>
              )}
              {!txLoading && txError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{txError}</div>
              )}
              {!txLoading && !txError && transactions.length === 0 && (
                <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-400 shadow-card">
                  No transactions yet.
                </div>
              )}
              {!txLoading && !txError && transactions.length > 0 && (
                <ol className="space-y-2.5">
                  {transactions.map((tx, i) => {
                    const positive = tx.amount >= 0
                    const tint =
                      tx.type === 'EARN'
                        ? 'bg-brand-50 text-brand-700'
                        : tx.type === 'CONVERT'
                          ? 'bg-sky-50 text-sky-600'
                          : 'bg-gold-50 text-gold-600'
                    const Icon =
                      tx.type === 'EARN' ? ArrowDownCircle : tx.type === 'CONVERT' ? RefreshCw : Gift
                    return (
                      <motion.li
                        key={tx.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.04, 0.4) }}
                      >
                        <div className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-card">
                          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tint}`}>
                            <Icon size={17} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-900">
                              {normalizeTransactionDescription(tx.description)}
                            </p>
                            <p className="text-xs capitalize text-slate-400">
                              {tx.type.toLowerCase()} · {formatTransactionDate(tx.createdAt)}
                            </p>
                          </div>
                          <p
                            className={`shrink-0 text-sm font-bold tabular-nums ${
                              positive ? 'text-emerald-600' : 'text-slate-900'
                            }`}
                          >
                            {positive ? '+' : ''}
                            {formatPoints(tx.amount)}
                          </p>
                        </div>
                      </motion.li>
                    )
                  })}
                </ol>
              )}
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              key="tab-profile"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.22 }}
              className="space-y-4 p-5 pb-24"
            >
              <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-card">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-white">
                  {getInitials(customer.userName)}
                </span>
                <div>
                  <p className="text-base font-bold text-slate-900">{customer.userName}</p>
                  <p className="text-sm text-slate-500">
                    {customer.phone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}
                  </p>
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-gold-50 px-2 py-0.5 text-[11px] font-bold text-gold-600">
                    <Crown size={11} /> {tier.current.name} member
                  </span>
                </div>
              </div>

              <div className="divide-y divide-slate-200 overflow-hidden rounded-2xl bg-white shadow-card">
                {[
                  ['Linked accounts', `${customer.brandsConnected} brands connected`],
                  ['Security & PIN', 'Face ID, password'],
                  ['Notifications', 'Offers and conversions'],
                  ['Help centre', 'FAQs and support'],
                ].map(([title, sub]) => (
                  <button key={title} className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50">
                    <UserRound size={16} className="text-slate-400" />
                    <span className="flex-1">
                      <span className="block text-sm font-medium text-slate-900">{title}</span>
                      <span className="block text-xs text-slate-400">{sub}</span>
                    </span>
                    <ChevronRight size={15} className="text-slate-300" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom nav */}
      <nav className="relative z-20 flex items-stretch justify-around border-t border-slate-200 bg-white/95 px-2 pb-5 pt-2 backdrop-blur">
        {(
          [
            { id: 'home', label: 'Home', icon: Home },
            { id: 'activity', label: 'Activity', icon: Activity },
            { id: 'profile', label: 'Profile', icon: UserRound },
          ] as const
        ).map(({ id, label, icon: Icon }) => {
          const active = activeTab === id
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="relative flex flex-1 flex-col items-center gap-0.5 py-1"
            >
              <motion.span animate={active ? { scale: 1.08, y: -1 } : { scale: 1, y: 0 }}>
                <Icon size={19} className={active ? 'text-brand-700' : 'text-slate-400'} />
              </motion.span>
              <span className={`text-[11px] font-medium ${active ? 'text-brand-700' : 'text-slate-400'}`}>
                {label}
              </span>
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute -top-[9px] h-1 w-8 rounded-full bg-brand-600"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              )}
            </button>
          )
        })}
      </nav>

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
    </div>
  )
}
