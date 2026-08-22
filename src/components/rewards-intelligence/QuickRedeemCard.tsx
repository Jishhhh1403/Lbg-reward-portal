import { motion } from 'framer-motion'
import { Coffee, UtensilsCrossed, Film, ArrowRight, type LucideIcon } from 'lucide-react'

interface QuickRedeemItem {
  name: string
  points: number
  icon: string
}

interface QuickRedeemCardProps {
  title?: string
  description?: string
  rewards?: QuickRedeemItem[]
  onViewAll?: () => void
}

const iconMap: Record<string, LucideIcon> = {
  coffee: Coffee,
  utensils: UtensilsCrossed,
  film: Film,
}

export default function QuickRedeemCard({
  title = 'Quick Redeem',
  description = 'Use your points right now',
  rewards = [],
  onViewAll,
}: QuickRedeemCardProps) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-card">
      <h3 className="mb-0.5 text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mb-3 text-[11px] text-slate-400">{description}</p>
      <div className="flex gap-2">
        {rewards.map((reward, i) => {
          const Icon = iconMap[reward.icon] ?? Coffee
          const tints = ['text-gold-600', 'text-amber-600', 'text-violet-600']
          return (
            <motion.div
              key={i}
              className="flex-1 cursor-pointer rounded-xl bg-slate-50 p-2.5 text-center transition-colors hover:bg-brand-50"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="mx-auto mb-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-100">
                <Icon size={16} className={tints[i % tints.length]} />
              </span>
              <p className="truncate text-[10px] font-medium text-slate-700">{reward.name}</p>
              <p className="mt-0.5 text-[10px] font-bold text-brand-700">{reward.points.toLocaleString()} pts</p>
            </motion.div>
          )
        })}
      </div>
      <button
        onClick={onViewAll}
        className="mt-3 flex w-full items-center justify-center gap-1 text-xs font-semibold text-brand-700 transition-colors hover:text-brand-500"
      >
        View all rewards <ArrowRight size={12} />
      </button>
    </div>
  )
}
