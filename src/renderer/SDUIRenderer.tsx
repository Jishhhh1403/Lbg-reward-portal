import type { ComponentType } from 'react'
import { motion } from 'framer-motion'
import type { NarrativeAct, SDUIComponent } from '../types/sdui'
import MetricTile from '../components/dashboard/MetricTile'
import {
  AddGoalCard,
  AutoRulesCard,
  BadgeCard,
  BestValueRedeemCard,
  BirthdayRewardCard,
  BonusRewardCard,
  BrandExplorerCard,
  ChallengeCard,
   CoachTipCard,
   CommunityChallengeCard,
   ComprehensionFeedbackCard,
   ConfidenceProgressCard,
   ConsolidatedRewardWallet,
   CountdownCard,
  DailyMoneyTipCard,
  EarnBreakdownCard,
  EducationalInsightCard,
  ExpiringPointsAlert,
  FlashRewardBanner,
  FutureMilestoneCard,
  FutureValueCard,
  GoalAtRiskCard,
  GoalCompleteCelebration,
  GoalLinkedReward,
  GoalMatchBoostCard,
  GoalMilestoneCard,
  GoalProgressCard,
  GoalStreakCard,
  GoalTemplateGallery,
  GiftDonateCard,
  HowPointsWorkCard,
  Leaderboard,
  LearningPathCard,
  LearningMissionCard,
  LocalDealsCard,
  LongTermGoalCard,
  MilestoneAnniversaryCard,
  MilestoneCard,
  MilestoneRewardLadder,
  MonthOverMonthCard,
  MythOrFactCard,
  NewBrandSpotlightCard,
  PartnerTransferCard,
  PartnerValueComparison,
  PaymentRewardCard,
  PaymentRewardConfirmation,
  PeerInsightCard,
  PersonalizedOfferCard,
  PointsAcademyBadgeCard,
  PointsHealthScoreCard,
  PreferencesCard,
  ProgrammeConnectionCard,
  ProjectionChart,
  QuizCard,
  QuickRedeemCard,
  QuickWinCard,
  RecommendedActions,
  ReengagementBanner,
  ReferralCard,
  RewardAllocationControl,
  RewardCarousel,
  RewardChoicePanel,
  RewardProvenanceCard,
  RewardsInsightCard,
  WhyThisUiCard,
  SavingsCalculatorCard,
  SavingsTransferCard,
  SharedGoalCard,
  StreakCard,
  SyncStatusCard,
  TangibleValueCard,
  TravelFundCard,
} from '../components/rewards-intelligence'
import { componentSpan, actionTarget } from './componentRegistry'
import type { SduiRendererProps } from './componentRegistry'

/**
 * Registry of every component type the middleware may emit, mapped onto the
 * real ILRP-app cards in src/components/rewards-intelligence. Mirrors the
 * backend catalog (middleware/catalog/component_catalog.py).
 */
const REGISTRY: Record<string, ComponentType<Record<string, unknown>>> = {
  INSTANT_REWARD_POPUP: BonusRewardCard as ComponentType<Record<string, unknown>>,
  FLASH_REWARD_BANNER: FlashRewardBanner as ComponentType<Record<string, unknown>>,
  QUICK_REDEEM_CARD: QuickRedeemCard as ComponentType<Record<string, unknown>>,
  TANGIBLE_VALUE_CARD: TangibleValueCard as ComponentType<Record<string, unknown>>,
  REWARD_CAROUSEL: RewardCarousel as ComponentType<Record<string, unknown>>,
  GOAL_PROGRESS_CARD: GoalProgressCard as ComponentType<Record<string, unknown>>,
  ADD_GOAL_CARD: AddGoalCard as ComponentType<Record<string, unknown>>,
  GOAL_MILESTONE_CARD: GoalMilestoneCard as ComponentType<Record<string, unknown>>,
  GOAL_LINKED_REWARD: GoalLinkedReward as ComponentType<Record<string, unknown>>,
  RECOMMENDED_ACTIONS: RecommendedActions as ComponentType<Record<string, unknown>>,
  FUTURE_VALUE_CARD: FutureValueCard as ComponentType<Record<string, unknown>>,
  PROJECTION_CHART: ProjectionChart as ComponentType<Record<string, unknown>>,
  LONG_TERM_GOAL_CARD: LongTermGoalCard as ComponentType<Record<string, unknown>>,
  EDUCATIONAL_INSIGHT_CARD: EducationalInsightCard as ComponentType<Record<string, unknown>>,
  FUTURE_MILESTONE_CARD: FutureMilestoneCard as ComponentType<Record<string, unknown>>,
  EXPIRING_POINTS_ALERT: ExpiringPointsAlert as ComponentType<Record<string, unknown>>,
  COUNTDOWN_CARD: CountdownCard as ComponentType<Record<string, unknown>>,
  QUICK_WIN_CARD: QuickWinCard as ComponentType<Record<string, unknown>>,
  PERSONALIZED_OFFER_CARD: PersonalizedOfferCard as ComponentType<Record<string, unknown>>,
  REENGAGEMENT_BANNER: ReengagementBanner as ComponentType<Record<string, unknown>>,
  STREAK_CARD: StreakCard as ComponentType<Record<string, unknown>>,
  CHALLENGE_CARD: ChallengeCard as ComponentType<Record<string, unknown>>,
  LEADERBOARD: Leaderboard as ComponentType<Record<string, unknown>>,
  QUIZ_CARD: QuizCard as ComponentType<Record<string, unknown>>,
  BADGE_CARD: BadgeCard as ComponentType<Record<string, unknown>>,
  MILESTONE_CARD: MilestoneCard as ComponentType<Record<string, unknown>>,
  BRAND_EXPLORER_CARD: BrandExplorerCard as ComponentType<Record<string, unknown>>,
  SYNC_STATUS_CARD: SyncStatusCard as ComponentType<Record<string, unknown>>,
  REWARDS_INSIGHT_CARD: RewardsInsightCard as ComponentType<Record<string, unknown>>,
  // Educational & financial literacy
  LEARNING_PATH_CARD: LearningPathCard as ComponentType<Record<string, unknown>>,
  DAILY_MONEY_TIP_CARD: DailyMoneyTipCard as ComponentType<Record<string, unknown>>,
  POINTS_ACADEMY_BADGE_CARD: PointsAcademyBadgeCard as ComponentType<Record<string, unknown>>,
  MYTH_OR_FACT_CARD: MythOrFactCard as ComponentType<Record<string, unknown>>,
  SAVINGS_CALCULATOR_CARD: SavingsCalculatorCard as ComponentType<Record<string, unknown>>,
  COACH_TIP_CARD: CoachTipCard as ComponentType<Record<string, unknown>>,
  HOW_POINTS_WORK_CARD: HowPointsWorkCard as ComponentType<Record<string, unknown>>,
  // Goal-related rewards & automation
  GOAL_TEMPLATE_GALLERY: GoalTemplateGallery as ComponentType<Record<string, unknown>>,
  MILESTONE_REWARD_LADDER: MilestoneRewardLadder as ComponentType<Record<string, unknown>>,
  GOAL_STREAK_CARD: GoalStreakCard as ComponentType<Record<string, unknown>>,
  GOAL_MATCH_BOOST_CARD: GoalMatchBoostCard as ComponentType<Record<string, unknown>>,
  SHARED_GOAL_CARD: SharedGoalCard as ComponentType<Record<string, unknown>>,
  GOAL_AT_RISK_CARD: GoalAtRiskCard as ComponentType<Record<string, unknown>>,
  AUTO_RULES_CARD: AutoRulesCard as ComponentType<Record<string, unknown>>,
  GOAL_COMPLETE_CELEBRATION: GoalCompleteCelebration as ComponentType<Record<string, unknown>>,
  // Money-smart
  BEST_VALUE_REDEEM_CARD: BestValueRedeemCard as ComponentType<Record<string, unknown>>,
  SAVINGS_TRANSFER_CARD: SavingsTransferCard as ComponentType<Record<string, unknown>>,
  TRAVEL_FUND_CARD: TravelFundCard as ComponentType<Record<string, unknown>>,
  // Analytics
  EARN_BREAKDOWN_CARD: EarnBreakdownCard as ComponentType<Record<string, unknown>>,
  MONTH_OVER_MONTH_CARD: MonthOverMonthCard as ComponentType<Record<string, unknown>>,
  POINTS_HEALTH_SCORE: PointsHealthScoreCard as ComponentType<Record<string, unknown>>,
  // Social proof & community
  PEER_INSIGHT_CARD: PeerInsightCard as ComponentType<Record<string, unknown>>,
  COMMUNITY_CHALLENGE_CARD: CommunityChallengeCard as ComponentType<Record<string, unknown>>,
  // Lifecycle & milestones
  MILESTONE_ANNIVERSARY_CARD: MilestoneAnniversaryCard as ComponentType<Record<string, unknown>>,
  BIRTHDAY_REWARD_CARD: BirthdayRewardCard as ComponentType<Record<string, unknown>>,
  // Discovery
  NEW_BRAND_SPOTLIGHT_CARD: NewBrandSpotlightCard as ComponentType<Record<string, unknown>>,
  LOCAL_DEALS_CARD: LocalDealsCard as ComponentType<Record<string, unknown>>,
  // Control & giving
  PREFERENCES_CARD: PreferencesCard as ComponentType<Record<string, unknown>>,
  GIFT_DONATE_CARD: GiftDonateCard as ComponentType<Record<string, unknown>>,
  REFERRAL_CARD: ReferralCard as ComponentType<Record<string, unknown>>,
  // Value certainty & transparency
  REWARD_CHOICE_PANEL: RewardChoicePanel as ComponentType<Record<string, unknown>>,
  PARTNER_VALUE_COMPARISON: PartnerValueComparison as ComponentType<Record<string, unknown>>,
  WHY_THIS_UI_CARD: WhyThisUiCard as ComponentType<Record<string, unknown>>,
  // Payment utility
  PAYMENT_REWARD_CARD: PaymentRewardCard as ComponentType<Record<string, unknown>>,
  REWARD_ALLOCATION_CONTROL: RewardAllocationControl as ComponentType<Record<string, unknown>>,
  PAYMENT_REWARD_CONFIRMATION: PaymentRewardConfirmation as ComponentType<Record<string, unknown>>,
  // Educational competence
  LEARNING_MISSION_CARD: LearningMissionCard as ComponentType<Record<string, unknown>>,
  COMPREHENSION_FEEDBACK_CARD: ComprehensionFeedbackCard as ComponentType<Record<string, unknown>>,
  CONFIDENCE_PROGRESS_CARD: ConfidenceProgressCard as ComponentType<Record<string, unknown>>,
  // Interoperability & portability
  CONSOLIDATED_REWARD_WALLET: ConsolidatedRewardWallet as ComponentType<Record<string, unknown>>,
  PARTNER_TRANSFER_CARD: PartnerTransferCard as ComponentType<Record<string, unknown>>,
  REWARD_PROVENANCE_CARD: RewardProvenanceCard as ComponentType<Record<string, unknown>>,
  PROGRAMME_CONNECTION_CARD: ProgrammeConnectionCard as ComponentType<Record<string, unknown>>,
}

/** Anchored types rendered by the fixed app header — never rendered in the body stream. */
const ANCHORED_TYPES = new Set(['POINTS_BALANCE', 'HEADER'])

/** Known CTA prop names across the card library — wired so agent actions open real modals. */
const CTA_PROPS = [
  'onAction',
  'onClaim',
  'onUsePoints',
  'onViewAll',
  'onExplore',
  'onContinue',
  'onAdd',
  'onLearnMore',
] as const

function renderComponent(
  component: SDUIComponent,
  handlers: Pick<SduiRendererProps, 'onLocatePoints' | 'onRedeemPoints'>,
): React.ReactNode {
  if (ANCHORED_TYPES.has(component.type)) return null

  if (component.type === 'METRIC_TILE') {
    const props = component.props as { label?: string; value?: string }
    return <MetricTile key={component.id} label={props.label ?? ''} value={props.value ?? ''} {...component.props} />
  }

  const Card = REGISTRY[component.type]
  if (!Card) {
    console.warn(`[SDUIRenderer] Unknown component type "${component.type}" skipped`)
    return null
  }

  try {
    const { layout: _layout, accentToken: _accentToken, narrative: _narrative, ...cardProps } = component.props ?? {}
    void _layout
    void _accentToken
    void _narrative

    const ARRAY_PROP_NAMES = [
      'options', 'items', 'milestones', 'steps', 'goals', 'programmes',
      'rewards', 'breakdown', 'actions', 'reasons', 'segments', 'badges',
      'deals', 'rungs', 'templates', 'statements', 'partners', 'metrics',
      'entries', 'periods', 'rules', 'categories', 'members', 'presets',
      'units', 'history', 'allocation', 'features', 'recoveryOptions',
    ]
    for (const key of ARRAY_PROP_NAMES) {
      if (key in cardProps && cardProps[key] != null && !Array.isArray(cardProps[key])) {
        const v = cardProps[key]
        if (typeof v === 'object') {
          const keys = Object.keys(v)
          const isDictArray = keys.length > 0 && keys.every((k) => /^\d+$/.test(k))
          cardProps[key] = isDictArray ? Object.values(v) : [v]
        } else {
          cardProps[key] = [v]
        }
      }
    }

    const primaryAction = component.actions?.[0]
    const target = primaryAction ? actionTarget(primaryAction.type) : null
    if (target) {
      const handler = target === 'locate' ? handlers.onLocatePoints : handlers.onRedeemPoints
      for (const prop of CTA_PROPS) {
        if (!(prop in cardProps)) cardProps[prop] = handler
      }
    }

    return <Card key={component.id} {...cardProps} />
  } catch (err) {
    console.warn(`[SDUIRenderer] Component ${component.type} (${component.id}) crashed, skipped:`, err)
    return null
  }
}

/** Section header rendered between narrative acts — the storytelling glue. */
function ActHeader({ act, index }: { act: NarrativeAct; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex items-center gap-2.5 px-1 pt-3 pb-1"
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-700">{act.label}</h2>
        {act.role ? <p className="text-[11px] leading-tight text-slate-400">{act.role}</p> : null}
      </div>
      <div className="h-px w-12 bg-gradient-to-r from-slate-200 to-transparent" />
    </motion.div>
  )
}

/** Wraps each card row with a subtle staggered entrance animation. */
function AnimatedRow({ children, index }: { children: React.ReactNode; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  )
}

export default function SDUIRenderer({
  components,
  onLocatePoints,
  onRedeemPoints,
  narrative,
}: SduiRendererProps) {
  const handlers = { onLocatePoints, onRedeemPoints }

  /*
   * Grid rule: consecutive half-span cards pair two per row; a lone half-span
   * card expands to the full row width instead of leaving an empty column.
   * When narrative act metadata is present the stream is split into story
   * sections, each introduced by an act header.
   */
  const byId = new Map(components.map((c) => [c.id, c]))
  const sections: Array<{ act: NarrativeAct | null; items: SDUIComponent[] }> = []

  if (narrative?.acts?.length) {
    const claimed = new Set<string>()
    for (const act of narrative.acts) {
      const items = (act.componentIds ?? [])
        .map((id) => byId.get(id))
        .filter((c): c is SDUIComponent => Boolean(c))
      items.forEach((c) => claimed.add(c.id))
      if (items.length) sections.push({ act, items })
    }
    const unclaimed = components.filter((c) => !claimed.has(c.id))
    if (unclaimed.length) sections.push({ act: null, items: unclaimed })
  } else {
    sections.push({ act: null, items: components })
  }

  const buildRows = (items: SDUIComponent[]) => {
    const rows: Array<{ kind: 'single'; component: SDUIComponent } | { kind: 'pair'; items: SDUIComponent[] }> = []
    let halfBuffer: SDUIComponent[] = []
    const flushHalf = () => {
      if (!halfBuffer.length) return
      if (halfBuffer.length === 2) rows.push({ kind: 'pair', items: halfBuffer })
      else rows.push({ kind: 'single', component: halfBuffer[0] })
      halfBuffer = []
    }
    for (const component of items) {
      if (ANCHORED_TYPES.has(component.type)) continue
      if (componentSpan(component) === 'half') {
        halfBuffer.push(component)
        if (halfBuffer.length === 2) flushHalf()
      } else {
        flushHalf()
        rows.push({ kind: 'single', component })
      }
    }
    flushHalf()
    return rows
  }

  return (
    <div className="space-y-3 px-0.5">
      {sections.map((section, sIndex) => (
        <div key={section.act?.id ?? `stream-${sIndex}`} className="space-y-3">
          {section.act ? <ActHeader act={section.act} index={sIndex} /> : null}
          {buildRows(section.items).map((row, i) =>
            row.kind === 'single' ? (
              <AnimatedRow key={row.component.id ?? i} index={i}>
                {renderComponent(row.component, handlers)}
              </AnimatedRow>
            ) : (
              <AnimatedRow key={(row.items.map((c) => c.id).join('-') || String(i)) + '-row'} index={i}>
                <div className="grid grid-cols-2 gap-3">
                  {row.items.map((component) => (
                    <div key={component.id}>{renderComponent(component, handlers)}</div>
                  ))}
                </div>
              </AnimatedRow>
            ),
          )}
        </div>
      ))}
    </div>
  )
}
