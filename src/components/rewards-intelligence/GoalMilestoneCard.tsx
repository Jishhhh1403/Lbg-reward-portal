import { Check, Circle } from 'lucide-react'

interface GoalMilestone {
  label: string
  reached: boolean
}

interface GoalMilestoneCardProps {
  goalName?: string
  milestones?: GoalMilestone[]
}

export default function GoalMilestoneCard({
  goalName = 'Goal',
  milestones = [],
}: GoalMilestoneCardProps) {
  return (
    <div className="h-full rounded-2xl border border-emerald-100 bg-white p-4 shadow-card">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600">{goalName}</p>
      <h3 className="mb-3 text-sm font-semibold text-slate-900">Milestones</h3>
      <div className="space-y-2.5">
        {milestones.map((milestone, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                milestone.reached ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-300'
              }`}
            >
              {milestone.reached ? <Check size={11} /> : <Circle size={11} />}
            </span>
            <span className={`text-xs ${milestone.reached ? 'font-medium text-slate-900' : 'text-slate-400'}`}>
              {milestone.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
