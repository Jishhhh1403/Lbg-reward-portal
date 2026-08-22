import { motion } from 'framer-motion'
import { Target, Calendar } from 'lucide-react'

interface LongTermGoalCardProps {
  goalName?: string
  current?: number
  target?: number
  percentage?: number
  estimatedCompletion?: string
  message?: string
}

export default function LongTermGoalCard({
  goalName = 'Goal',
  current = 0,
  target = 100,
  percentage = 0,
  estimatedCompletion = '2030',
  message = '',
}: LongTermGoalCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex h-full flex-col rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50/80 via-white to-brand-50/60 p-4 shadow-card"
    >
      <div className="mb-2.5">
        <div className="flex min-w-0 items-start gap-1.5">
          <Target size={14} className="mt-0.5 shrink-0 text-sky-600" />
          <h3 className="break-words text-xs font-semibold leading-snug text-slate-900">{goalName}</h3>
        </div>
        <div className="ml-5 mt-1 flex items-center gap-1 text-[10px] font-medium text-sky-700">
          <Calendar size={10} />
          <span>Est. {estimatedCompletion}</span>
        </div>
      </div>

      <div className="mb-1">
        <div className="h-2 w-full overflow-hidden rounded-full bg-white ring-1 ring-slate-100">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-sky-500 to-brand-500"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </div>
        <div className="mt-1.5 flex justify-between">
          <span className="text-[10px] font-medium tabular-nums text-slate-400">{current.toLocaleString()} pts</span>
          <span className="text-[10px] font-medium tabular-nums text-slate-400">{target.toLocaleString()} pts</span>
        </div>
      </div>

      <div className="mb-2.5 text-center">
        <p className="text-xl font-black tracking-tight text-slate-900">{percentage}%</p>
        <p className="text-[11px] font-medium text-sky-700">{(target - current).toLocaleString()} points remaining</p>
      </div>

      {message && (
        <div className="mt-auto rounded-xl bg-sky-50 p-2.5 text-center">
          <p className="text-[10px] leading-snug text-sky-800">{message}</p>
        </div>
      )}
    </motion.div>
  )
}
