import { motion } from 'framer-motion'
import { Sparkles, TrendingUp, Store, Timer, ArrowRight } from 'lucide-react'

interface RewardsInsightCardProps {
  title?: string
  topBrandName?: string
  topBrandPoints?: number
  growthTip?: string
  expiringPoints?: number
  expiryDate?: string
  ctaText?: string
  onCta?: () => void
}

export default function RewardsInsightCard({
  title = 'Your Rewards Insight',
  topBrandName = '',
  topBrandPoints = 0,
  growthTip = '',
  expiringPoints = 0,
  expiryDate = '',
  ctaText = 'Redeem smarter',
  onCta,
}: RewardsInsightCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-brand-100 bg-white p-4 shadow-card"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 shadow-sm">
          <Sparkles size={13} className="text-white" />
        </span>
        <h3 className="text-sm font-bold text-brand-800">{title}</h3>
      </div>

      <div className="space-y-2">
        {topBrandName && (
          <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 p-3">
            <Store size={15} className="shrink-0 text-gold-600" />
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-slate-900">Top brand: {topBrandName}</p>
              <p className="text-[11px] text-slate-400">{topBrandPoints.toLocaleString()} points earned together</p>
            </div>
          </div>
        )}

        {growthTip && (
          <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 p-3">
            <TrendingUp size={15} className="shrink-0 text-emerald-600" />
            <p className="text-xs leading-relaxed text-slate-600">{growthTip}</p>
          </div>
        )}

        {expiringPoints > 0 && expiryDate && (
          <div className="flex items-center gap-2.5 rounded-xl border border-amber-200/70 bg-amber-50 p-3">
            <Timer size={15} className="shrink-0 text-amber-600" />
            <p className="text-xs leading-relaxed text-amber-700">
              {expiringPoints.toLocaleString()} points expire on {expiryDate}. Redeem soon!
            </p>
          </div>
        )}
      </div>

      <motion.button
        onClick={onCta}
        whileTap={{ scale: 0.99 }}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50"
      >
        {ctaText} <ArrowRight size={13} />
      </motion.button>
    </motion.div>
  )
}
