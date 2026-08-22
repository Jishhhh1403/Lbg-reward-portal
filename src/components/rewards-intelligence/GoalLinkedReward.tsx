import { motion } from 'framer-motion'
import { Gift, Target, ArrowRight } from 'lucide-react'

interface GoalLinkedRewardItem {
  name: string
  points: number
  goalLinked?: boolean
}

interface GoalLinkedRewardProps {
  title?: string
  rewards?: GoalLinkedRewardItem[]
  goalName?: string
}

export default function GoalLinkedReward({
  title = 'Earn Toward Your Goal',
  rewards = [],
  goalName = 'Goal',
}: GoalLinkedRewardProps) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-card">
      <div className="mb-3 flex items-center gap-1.5">
        <Target size={15} className="text-emerald-600" />
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="space-y-2">
        {rewards.map((reward, i) => (
          <motion.div
            key={i}
            className="flex cursor-pointer items-center justify-between rounded-xl bg-slate-50 p-3 transition-colors hover:bg-emerald-50"
            whileHover={{ x: 3 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                <Gift size={14} className="text-emerald-700" />
              </span>
              <div>
                <p className="text-xs font-medium text-slate-900">{reward.name}</p>
                {reward.goalLinked && <p className="text-[10px] font-medium text-emerald-600">→ {goalName}</p>}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-emerald-700">+{reward.points.toLocaleString()} pts</span>
              <ArrowRight size={13} className="text-slate-300" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
