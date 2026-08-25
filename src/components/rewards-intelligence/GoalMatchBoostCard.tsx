import { Clock3 } from 'lucide-react'

interface GoalMatchBoostCardProps {
  goalName?: string
  topUpPoints?: number
  bonusPoints?: number
  expiresIn?: string
}

export default function GoalMatchBoostCard({
  goalName = 'your goal',
  topUpPoints = 500,
  bonusPoints = 75,
  expiresIn = 'today',
}: GoalMatchBoostCardProps) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 shadow-card">
      <div className="mb-2 flex items-center gap-1.5">
        <Clock3 size={15} className="text-amber-600" />
        <h3 className="text-sm font-semibold text-slate-900">Match Boost — Today Only</h3>
      </div>

      <p className="text-xs leading-relaxed text-slate-600">
        Top up <span className="font-bold text-slate-800">{goalName}</span> with{' '}
        <span className="font-bold text-slate-800">{topUpPoints.toLocaleString()} pts</span> and we'll add a{' '}
        <span className="font-bold text-emerald-600">+{bonusPoints.toLocaleString()} pt</span> bonus on top.
      </p>

      <div className="mt-2 flex items-center justify-between rounded-xl bg-white px-2.5 py-1.5 shadow-sm">
        <span className="text-[10px] font-medium text-slate-400">Ends {expiresIn}</span>
        <span className="rounded-lg bg-brand-600 px-2.5 py-1 text-[11px] font-semibold text-white">Top up now</span>
      </div>
    </div>
  )
}
