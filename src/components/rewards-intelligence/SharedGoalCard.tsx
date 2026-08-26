import { Users } from 'lucide-react'

interface SharedGoalMember {
  name?: string
  contributed?: number
}

interface SharedGoalCardProps {
  goalName?: string
  targetPoints?: number
  members?: SharedGoalMember[]
  combinedTotal?: number
}

const AVATAR_COLORS = ['bg-emerald-500', 'bg-sky-500', 'bg-violet-500', 'bg-amber-500']

export default function SharedGoalCard({
  goalName = 'Family Goal',
  targetPoints = 1,
  members = [],
  combinedTotal = 0,
}: SharedGoalCardProps) {
  const pct = Math.min(Math.round((combinedTotal / Math.max(targetPoints, 1)) * 100), 100)

  return (
    <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-card">
      <div className="mb-1 flex items-center gap-1.5">
        <Users size={15} className="text-emerald-600" />
        <h3 className="text-sm font-semibold text-slate-900">{goalName}</h3>
        <span className="ml-auto rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
          Shared goal
        </span>
      </div>

      <div className="mb-1.5 flex items-end justify-between">
        <p className="text-xs text-slate-500">
          <span className="text-base font-extrabold text-slate-900">{combinedTotal.toLocaleString()}</span> /{' '}
          {targetPoints.toLocaleString()} pts
        </p>
        <p className="text-[11px] font-bold text-emerald-600">{pct}%</p>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${Math.max(pct, 4)}%` }} />
      </div>

      <div className="mt-2.5 flex items-center gap-3">
        {members.map((member, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full ${AVATAR_COLORS[i % AVATAR_COLORS.length]} text-[9px] font-bold text-white`}
            >
              {member.name?.split(' ').map((w) => w[0]).slice(0, 2).join('')}
            </span>
            <span className="text-[10px] text-slate-500">
              {member.name}: <span className="font-semibold text-slate-700">{(member.contributed ?? 0).toLocaleString()}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
