import { motion } from 'framer-motion'
import { SlidersHorizontal } from 'lucide-react'

interface RewardAllocationControlProps {
  title?: string
  subtitle?: string
  allocation?: Array<{ label: string; percent: number }>
}

export default function RewardAllocationControl({
  title = 'How your points are allocated',
  subtitle = 'You stay in control — adjust how earned points are used at any time.',
  allocation = [],
}: RewardAllocationControlProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full rounded-2xl border border-brand-200/70 bg-white p-4 shadow-card"
    >
      <div className="mb-1 flex items-center gap-1.5">
        <SlidersHorizontal size={15} className="text-brand-700" />
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <p className="mb-3 text-[10px] font-medium text-slate-400">{subtitle}</p>
      <div className="space-y-3">
        {allocation.map((a, i) => (
          <div key={i}>
            <div className="mb-1 flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-700">{a.label}</span>
              <span className="font-bold text-brand-700">{a.percent}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-gold-400"
                style={{ width: `${Math.min(100, Math.max(0, a.percent))}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
