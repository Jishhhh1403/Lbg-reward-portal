import { Plane } from 'lucide-react'

interface TravelFundCardProps {
  destination?: string
  fundPoints?: number
  targetPoints?: number
  partners?: string[]
}

export default function TravelFundCard({
  destination = 'Tokyo',
  fundPoints = 0,
  targetPoints = 1,
  partners = [],
}: TravelFundCardProps) {
  const pct = Math.min(Math.round((fundPoints / Math.max(targetPoints, 1)) * 100), 100)

  return (
    <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-4 shadow-card">
      <div className="mb-1.5 flex items-center gap-1.5">
        <Plane size={15} className="text-sky-600" />
        <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">{destination} Fund</h3>
        <span className="shrink-0 text-[11px] font-bold text-sky-700">{pct}%</span>
      </div>

      <p className="mb-1 text-[11px] text-slate-500">
        <span className="text-base font-extrabold text-slate-900">{fundPoints.toLocaleString()}</span> /{' '}
        {targetPoints.toLocaleString()} pts
      </p>

      <div className="mb-2 h-2 overflow-hidden rounded-full bg-sky-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-400 to-indigo-500 transition-all duration-700"
          style={{ width: `${Math.max(pct, 4)}%` }}
        />
      </div>

      {partners.length ? (
        <p className="truncate text-[10px] text-slate-400">Boost it with: {partners.join(' · ')}</p>
      ) : null}
    </div>
  )
}
