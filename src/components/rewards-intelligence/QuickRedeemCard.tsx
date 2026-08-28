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
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="rounded-2xl border border-brand-100 bg-white p-4 shadow-card"
    >
      <h3 className="mb-0.5 text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mb-3 text-[11px] text-slate-400">{description}</p>
      <div className="grid grid-cols-3 gap-2">
        {rewards.map((reward, i) => {
          const Icon = iconMap[reward.icon] ?? Coffee
          const tints = ['text-gold-600', 'text-amber-600', 'text-violet-600']
          return (
            <motion.div
              key={i}
              className="min-w-0 cursor-pointer rounded-xl bg-slate-50 p-2.5 text-center transition-colors hover:bg-brand-50"
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-100">
                <Icon size={15} className={tints[i % tints.length]} />
              </span>
              <p className="truncate text-[10px] font-medium text-slate-700" title={reward.name}>{reward.name}</p>
              <p className="mt-0.5 truncate text-[10px] font-bold text-brand-700">{reward.points.toLocaleString()} pts</p>
            </motion.div>
          )
        })}
      </div>
      <motion.button
        onClick={onViewAll}
        whileHover={{ x: 2 }}
        className="mt-3 flex w-full items-center justify-center gap-1 text-xs font-semibold text-brand-700 transition-colors hover:text-brand-500"
      >
        View all rewards <ArrowRight size={12} />
      </motion.button>
    </motion.div>
  )
}
