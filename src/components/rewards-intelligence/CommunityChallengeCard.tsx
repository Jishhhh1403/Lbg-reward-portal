import { Globe2 } from 'lucide-react'

interface CommunityChallengeCardProps {
  title?: string
  communityTotal?: number
  target?: number
  myContribution?: number
  endsOn?: string
}

export default function CommunityChallengeCard({
  title = 'Community Challenge',
  communityTotal = 0,
  target = 1,
  myContribution = 0,
  endsOn = '',
}: CommunityChallengeCardProps) {
  const pct = Math.min(Math.round((communityTotal / Math.max(target, 1)) * 100), 100)

  return (
    <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-4 shadow-card">
      <div className="mb-1.5 flex items-center gap-1.5">
        <Globe2 size={15} className="text-sky-600" />
        <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">{title}</h3>
        {endsOn ? (
          <span className="shrink-0 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-700">Ends {endsOn}</span>
        ) : null}
      </div>

      <p className="mb-1 text-[11px] text-slate-500">
        Community total:{' '}
        <span className="font-bold text-slate-800">{communityTotal.toLocaleString()}</span> /{' '}
        {target.toLocaleString()} pts
      </p>

      <div className="relative mb-1.5 h-3 overflow-hidden rounded-full bg-sky-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-600 transition-all duration-700"
          style={{ width: `${Math.max(pct, 4)}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[10.5px]">
        <span className="font-bold text-sky-700">{pct}% there</span>
        <span className="text-slate-500">
          Your contribution: <span className="font-semibold text-slate-800">+{myContribution.toLocaleString()} pts</span>
        </span>
      </div>
    </div>
  )
}
