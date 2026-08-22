import { Check, Circle, Clock } from 'lucide-react'

interface FutureMilestone {
  label: string
  date: string
  achieved: boolean
}

interface FutureMilestoneCardProps {
  title?: string
  milestones?: FutureMilestone[]
}

export default function FutureMilestoneCard({
  title = 'Upcoming Milestones',
  milestones = [],
}: FutureMilestoneCardProps) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-card">
      <div className="mb-3 flex items-center gap-1.5">
        <Clock size={15} className="text-sky-600" />
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="space-y-2.5">
        {milestones.map((milestone, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full ${
                  milestone.achieved ? 'bg-brand-600/10 text-brand-700' : 'bg-slate-100 text-slate-300'
                }`}
              >
                {milestone.achieved ? <Check size={11} /> : <Circle size={11} />}
              </span>
              <span className={`text-xs ${milestone.achieved ? 'font-medium text-slate-900' : 'text-slate-400'}`}>
                {milestone.label}
              </span>
            </div>
            <span className="text-[10px] font-medium tabular-nums text-slate-400">{milestone.date}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
