import { motion } from 'framer-motion'
import { Tag } from 'lucide-react'

interface RewardItem {
  name: string
  points: number
  category: string
  limited?: boolean
}

interface RewardCarouselProps {
  title?: string
  rewards?: RewardItem[]
  onSelect?: (reward: RewardItem) => void
}

export default function RewardCarousel({
  title = 'Featured Rewards',
  rewards = [],
  onSelect,
}: RewardCarouselProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <h3 className="mb-2.5 px-1 text-sm font-semibold text-slate-800">{title}</h3>
      <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
        {rewards.map((reward, i) => (
          <motion.div
            key={i}
            onClick={() => onSelect?.(reward)}
            className="w-36 shrink-0 cursor-pointer rounded-2xl border border-slate-100 bg-white p-3.5 shadow-card transition-all duration-200 hover:border-brand-200 hover:shadow-md"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.35 }}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-gold-50 ring-1 ring-brand-100">
              <Tag size={15} className="text-brand-700" />
            </div>
            <p className="mb-0.5 truncate text-xs font-semibold text-slate-900">{reward.name}</p>
            <p className="text-[11px] font-bold text-brand-700">{reward.points.toLocaleString()} pts</p>
            <div className="mt-2.5 flex items-center justify-between">
              <span className="truncate text-[10px] text-slate-400">{reward.category}</span>
              {reward.limited && (
                <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-600">
                  Limited
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
