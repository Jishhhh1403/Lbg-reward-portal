import { motion } from 'framer-motion'
import { Target, ArrowRight } from 'lucide-react'

interface GoalProgressCardProps {
  goalName?: string
  current?: number
  target?: number
  percentage?: number
  remaining?: number
  motivationalMessage?: string
  onViewDetails?: () => void
}

export default function GoalProgressCard({
  goalName = 'Goal',
  current = 0,
  target = 100,
  percentage = 0,
  remaining = 0,
  motivationalMessage = '',
  onViewDetails,
}: GoalProgressCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex h-full flex-col rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 via-white to-brand-50/60 p-4 shadow-card"
    >
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-1.5">
          <Target size={14} className="mt-0.5 shrink-0 text-emerald-600" />
          <h3 className="break-words text-xs font-semibold leading-snug text-slate-900">{goalName}</h3>
        </div>
        <span className="shrink-0 whitespace-nowrap rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700">
          Active
        </span>
      </div>

      <div className="mb-1">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-white ring-1 ring-slate-100">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-emerald-400"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </div>
        <div className="mt-1.5 flex justify-between">
          <span className="text-[10px] font-medium tabular-nums text-slate-400">{current.toLocaleString()} pts</span>
          <span className="text-[10px] font-medium tabular-nums text-slate-400">{target.toLocaleString()} pts</span>
        </div>
      </div>

      <div className="mb-2.5 text-center">
        <motion.p
          className="text-xl font-black tracking-tight text-slate-900"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
        >
          {percentage}%
        </motion.p>
        <p className="text-[11px] font-medium text-emerald-700">{remaining.toLocaleString()} points to go</p>
      </div>

      {motivationalMessage && (
        <div className="mb-2 rounded-xl bg-emerald-50 p-2.5 text-center">
          <p className="text-[10px] leading-snug text-emerald-800">{motivationalMessage}</p>
        </div>
      )}

      <button
        onClick={onViewDetails}
        className="mt-auto flex items-center justify-center gap-1 pt-1.5 text-[11px] font-semibold text-brand-700 transition-colors hover:text-brand-500"
      >
        View Goal Details <ArrowRight size={12} />
      </button>
    </motion.div>
  )
}
