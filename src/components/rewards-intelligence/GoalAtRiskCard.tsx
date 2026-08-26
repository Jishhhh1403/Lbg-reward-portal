import { AlertTriangle } from 'lucide-react'

interface RecoveryOption {
  label?: string
  effect?: string
}

interface GoalAtRiskCardProps {
  goalName?: string
  missedContributions?: number
  recoveryOptions?: RecoveryOption[]
}

export default function GoalAtRiskCard({
  goalName = 'Your goal',
  missedContributions = 0,
  recoveryOptions = [],
}: GoalAtRiskCardProps) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 shadow-card">
      <div className="mb-2 flex items-center gap-1.5">
        <AlertTriangle size={15} className="text-amber-600" />
        <h3 className="text-sm font-semibold text-slate-900">{goalName} is behind pace</h3>
      </div>

      <p className="mb-2.5 text-xs leading-relaxed text-slate-600">
        You're <span className="font-bold text-amber-700">{missedContributions} contribution{missedContributions === 1 ? '' : 's'}</span> behind.
        No stress — here's how to catch up:
      </p>

      <div className="flex flex-wrap gap-1.5">
        {recoveryOptions.map((option, i) => (
          <button
            key={i}
            className="rounded-full border border-amber-200 bg-white px-2.5 py-1 text-left transition hover:border-amber-300 hover:bg-amber-50"
          >
            <span className="block text-[10px] font-semibold text-slate-800">{option.label}</span>
            {option.effect ? <span className="block text-[9px] text-emerald-600">{option.effect}</span> : null}
          </button>
        ))}
      </div>
    </div>
  )
}
