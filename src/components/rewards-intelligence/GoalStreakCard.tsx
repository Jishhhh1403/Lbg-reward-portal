import { Flame } from 'lucide-react'
interface GoalStreakCardProps {
  weeks?: number
  bestWeeks?: number
  nextMilestone?: string
}

export default function GoalStreakCard({
  weeks = 0,
  bestWeeks = 0,
  nextMilestone = '',
}: GoalStreakCardProps) {
  const isRecord = weeks >= bestWeeks

  return (
    <div className="rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-4 shadow-card">
      <div className="mb-2 flex items-center gap-1.5">
        <Flame size={15} className="text-orange-500" />
        <h3 className="text-sm font-semibold text-slate-900">Goal Streak</h3>
      </div>

      <div className="mb-2 flex items-end gap-1">
        <span className="text-3xl font-extrabold leading-none text-orange-500">{weeks}</span>
        <span className="pb-0.5 text-xs font-medium text-slate-500">weeks contributing</span>
      </div>

      <p className="text-[11px] text-slate-500">
        {isRecord ? (
          <span className="font-semibold text-orange-600">Personal best! 🔥</span>
        ) : (
          <>Best streak: <span className="font-semibold text-slate-700">{bestWeeks} weeks</span></>
        )}
      </p>
      {nextMilestone ? <p className="mt-1 text-[11px] text-slate-500">Next: {nextMilestone}</p> : null}
    </div>
  )
}
