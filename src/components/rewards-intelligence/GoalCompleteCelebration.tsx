import { motion } from 'framer-motion'
import { PartyPopper } from 'lucide-react'

interface GoalCompleteCelebrationProps {
  goalName?: string
  achievedPoints?: number
  rewardUnlocked?: string
  nextGoalSuggestion?: string
  celebration?: boolean
}

const CONFETTI = [
  { left: '8%', delay: 0, color: '#10b981' },
  { left: '20%', delay: 0.4, color: '#f59e0b' },
  { left: '34%', delay: 0.9, color: '#6366f1' },
  { left: '52%', delay: 0.2, color: '#ef4444' },
  { left: '68%', delay: 0.7, color: '#0ea5e9' },
  { left: '82%', delay: 1.1, color: '#a855f7' },
  { left: '93%', delay: 0.5, color: '#10b981' },
]

export default function GoalCompleteCelebration({
  goalName = 'Your Goal',
  achievedPoints = 0,
  rewardUnlocked = '',
  nextGoalSuggestion = '',
}: GoalCompleteCelebrationProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-4 shadow-card">
      {/* confetti */}
      {CONFETTI.map((c, i) => (
        <motion.span
          key={i}
          initial={{ y: -24, opacity: 0, rotate: 0 }}
          animate={{ y: [0, 90], opacity: [0, 1, 0.9, 0], rotate: 220 }}
          transition={{ duration: 2.2 + (i % 3) * 0.5, repeat: Infinity, delay: c.delay }}
          className="absolute top-0 h-2 w-1.5 rounded-sm"
          style={{ left: c.left, backgroundColor: c.color }}
        />
      ))}

      <div className="relative">
        <div className="mb-2 flex items-center gap-1.5">
          <PartyPopper size={15} className="text-emerald-600" />
          <h3 className="text-sm font-semibold text-slate-900">Goal Complete!</h3>
        </div>

        <p className="text-lg font-extrabold leading-tight text-slate-900">🎉 {goalName} — 100%</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">
          You saved <span className="font-bold text-emerald-700">{achievedPoints.toLocaleString()} points</span>
          {rewardUnlocked ? (
            <>
              {' '}and unlocked your reward: <span className="font-semibold text-slate-800">{rewardUnlocked}</span>.
            </>
          ) : (
            '. Incredible discipline.'
          )}
        </p>

        {nextGoalSuggestion ? (
          <div className="mt-2.5 flex items-center justify-between rounded-xl bg-white px-3 py-2 shadow-sm">
            <p className="text-[11px] text-slate-500">
              Next idea: <span className="font-semibold text-slate-800">{nextGoalSuggestion}</span>
            </p>
            <span className="shrink-0 rounded-lg bg-brand-600 px-2.5 py-1 text-[11px] font-semibold text-white">Start it</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}
