import { motion } from 'framer-motion'
import { Lock, Unlock } from 'lucide-react'

interface LadderRung {
  percent?: number
  reward?: string
  unlocked?: boolean
}

interface MilestoneRewardLadderProps {
  goalName?: string
  rungs?: LadderRung[]
}

export default function MilestoneRewardLadder({
  goalName = 'Your Goal',
  rungs = [],
}: MilestoneRewardLadderProps) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-card">
      <div className="mb-3 flex items-center gap-1.5">
        <h3 className="text-sm font-semibold text-slate-900">{goalName} — Reward Ladder</h3>
      </div>

      <div className="relative space-y-2.5 pl-1">
        {rungs.map((rung, i) => (
          <div key={i} className="relative flex items-center gap-3">
            {i < rungs.length - 1 && (
              <span
                className={`absolute left-[17px] top-8 h-[calc(100%-18px)] w-0.5 rounded ${
                  rung.unlocked ? 'bg-emerald-300' : 'bg-slate-200'
                }`}
                aria-hidden
              />
            )}
            <motion.span
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.08 }}
              className={`z-10 flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-full text-[9px] font-bold leading-none ${
                rung.unlocked ? 'bg-emerald-500 text-white shadow-sm' : 'border-2 border-dashed border-slate-200 bg-white text-slate-400'
              }`}
            >
              {rung.unlocked ? <Unlock size={13} /> : <Lock size={12} />}
              <span className="mt-0.5">{rung.percent}%</span>
            </motion.span>
            <p className={`text-xs ${rung.unlocked ? 'font-semibold text-slate-800' : 'text-slate-500'}`}>
              {rung.reward}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
