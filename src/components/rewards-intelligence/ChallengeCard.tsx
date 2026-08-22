import { motion } from 'framer-motion'
import { Target, Users, Clock, ArrowRight } from 'lucide-react'

interface ChallengeCardProps {
  title?: string
  description?: string
  progress?: number
  reward?: string
  daysLeft?: number
  participants?: number
  onContinue?: () => void
}

export default function ChallengeCard({
  title = 'Active Challenge',
  description = '',
  progress = 0,
  reward = '',
  daysLeft = 0,
  participants = 0,
  onContinue,
}: ChallengeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-brand-100 bg-white p-4 shadow-card"
    >
      <div className="mb-2.5 flex items-center gap-1.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50">
          <Target size={14} className="text-amber-600" />
        </span>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <div className="ml-auto flex items-center gap-1 text-[11px] font-medium text-amber-600">
          <Clock size={11} />
          <span>{daysLeft}d left</span>
        </div>
      </div>
      {description && <p className="mb-3 text-xs leading-snug text-slate-500">{description}</p>}
      <div className="mb-3">
        <div className="mb-1 flex justify-between text-[11px]">
          <span className="text-slate-400">Progress</span>
          <span className="font-semibold text-brand-700">{progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-gold-400"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Users size={11} />
          <span>{participants.toLocaleString()} in</span>
        </div>
        <span className="text-[11px] font-bold text-emerald-700">Reward: {reward}</span>
      </div>
      <motion.button
        onClick={onContinue}
        whileTap={{ scale: 0.98 }}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
      >
        Continue <ArrowRight size={14} />
      </motion.button>
    </motion.div>
  )
}
