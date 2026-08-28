import { motion } from 'framer-motion'
import { Flame, Trophy } from 'lucide-react'

interface StreakMilestone {
  days: number
  reward: string
  achieved: boolean
}

interface StreakCardProps {
  streakDays?: number
  message?: string
  nextReward?: string
  milestones?: StreakMilestone[]
}

export default function StreakCard({
  streakDays = 0,
  message = '',
  nextReward = '',
  milestones = [],
}: StreakCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex h-full flex-col rounded-2xl border border-gold-200/80 bg-gradient-to-br from-gold-50 to-brand-50 p-4 shadow-card"
    >
      <div className="mb-3 flex items-center gap-1.5">
        <Flame size={15} className="text-gold-600" />
        <h3 className="text-sm font-semibold text-slate-900">Streak</h3>
      </div>
      <div className="mb-3 text-center">
        <motion.div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-brand-500 shadow-lg"
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="text-xl font-black text-white drop-shadow-sm">{streakDays}</span>
        </motion.div>
        <p className="mt-1.5 text-xs font-semibold text-gold-600">Day Streak</p>
        {message && <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{message}</p>}
      </div>
      {nextReward && (
        <div className="mb-3 rounded-xl bg-gold-400/20 p-2.5 text-center">
          <p className="text-[11px] font-medium text-gold-700">Next reward: {nextReward}</p>
        </div>
      )}
      <div className="mt-auto space-y-1.5">
        {milestones.map((milestone, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.08 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-1.5">
              {milestone.achieved ? (
                <Trophy size={12} className="text-gold-600" />
              ) : (
                <span className="h-3 w-3 rounded-full border border-slate-200 bg-white" />
              )}
              <span className={`text-[11px] ${milestone.achieved ? 'font-medium text-slate-900' : 'text-slate-400'}`}>
                {milestone.days} days
              </span>
            </div>
            <span className={`text-[11px] ${milestone.achieved ? 'font-semibold text-gold-600' : 'text-slate-400'}`}>
              {milestone.reward}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
