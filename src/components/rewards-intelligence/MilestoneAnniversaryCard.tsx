import { Sparkles } from 'lucide-react'

interface MilestoneAnniversaryCardProps {
  headline?: string
  subline?: string
  lifetimePoints?: number
  memberSince?: string
}

export default function MilestoneAnniversaryCard({
  headline = '',
  subline = '',
  lifetimePoints = 0,
  memberSince = '',
}: MilestoneAnniversaryCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-amber-50 p-4 shadow-card">
      <Sparkles size={64} className="absolute -right-2 -top-2 text-violet-200" aria-hidden />
      <div className="relative">
        <h3 className="text-sm font-extrabold text-slate-900">{headline}</h3>
        {subline ? <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{subline}</p> : null}

        <div className="mt-2.5 flex items-center gap-4">
          <div className="rounded-xl bg-white px-3 py-1.5 shadow-sm">
            <p className="text-[9px] font-medium uppercase tracking-wide text-slate-400">Lifetime points</p>
            <p className="text-sm font-extrabold text-violet-700">{lifetimePoints.toLocaleString()}</p>
          </div>
          {memberSince ? (
            <div className="rounded-xl bg-white px-3 py-1.5 shadow-sm">
              <p className="text-[9px] font-medium uppercase tracking-wide text-slate-400">Member since</p>
              <p className="text-sm font-extrabold text-slate-800">{memberSince}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
