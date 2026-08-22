import { motion } from 'framer-motion'
import { Zap, ArrowRight } from 'lucide-react'

interface QuickWinReward {
  name: string
  points: number
}

interface QuickWinCardProps {
  title?: string
  subtitle?: string
  rewards?: QuickWinReward[]
  onRedeem?: (reward: QuickWinReward) => void
}

export default function QuickWinCard({
  title = 'Quick Win Rewards',
  subtitle = 'Redeem these before your points expire',
  rewards = [],
  onRedeem,
}: QuickWinCardProps) {
  return (
    <div className="h-full rounded-2xl border border-brand-100 bg-white p-4 shadow-card">
      <div className="mb-0.5 flex items-center gap-1.5">
        <Zap size={15} className="text-emerald-600" />
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <p className="mb-3 text-[11px] text-slate-400">{subtitle}</p>
      <div className="space-y-2">
        {rewards.map((reward, i) => (
          <motion.div
            key={i}
            onClick={() => onRedeem?.(reward)}
            className="flex cursor-pointer items-center justify-between rounded-xl border border-brand-100/80 bg-brand-50/60 p-2.5 transition-colors hover:bg-brand-50"
            whileHover={{ x: 3 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-slate-900">{reward.name}</p>
              <p className="text-[10px] font-semibold text-emerald-700">{reward.points.toLocaleString()} pts</p>
            </div>
            <div className="ml-2 flex shrink-0 items-center gap-1.5">
              <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-brand-700">
                Quick
              </span>
              <ArrowRight size={13} className="text-slate-300" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
