import { motion } from 'framer-motion'
import { TrendingUp, ArrowUpRight } from 'lucide-react'

interface FutureValueCardProps {
  title?: string
  currentValue?: number
  projectedValue?: number
  timeframe?: string
  growthRate?: string
  message?: string
}

export default function FutureValueCard({
  title = 'Your Rewards, Growing',
  currentValue = 0,
  projectedValue = 0,
  timeframe = '10 years',
  growthRate = '12% annually',
  message = '',
}: FutureValueCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50/80 via-white to-brand-50/60 p-4 shadow-card"
    >
      <div className="mb-3 flex items-center gap-1.5">
        <TrendingUp size={15} className="text-sky-600" />
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3">
        <div>
          <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">Current value</p>
          <p className="text-base font-black tabular-nums text-slate-900">{currentValue.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400">points</p>
        </div>
        <div className="text-right">
          <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">
            Projected ({timeframe})
          </p>
          <div className="flex items-center justify-end gap-1">
            <ArrowUpRight size={14} className="text-sky-600" />
            <p className="text-base font-black tabular-nums text-sky-700">{projectedValue.toLocaleString()}</p>
          </div>
          <p className="text-[10px] font-medium text-sky-600/80">{growthRate}</p>
        </div>
      </div>

      {message && (
        <div className="rounded-xl bg-sky-50 p-2.5">
          <p className="text-[11px] leading-snug text-sky-800">{message}</p>
        </div>
      )}
    </motion.div>
  )
}
