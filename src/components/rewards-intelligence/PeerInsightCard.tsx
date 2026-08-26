import { Users } from 'lucide-react'

interface PeerMetric {
  label?: string
  you?: number
  peers?: number
  unit?: string
}

interface PeerInsightCardProps {
  cohortLabel?: string
  metrics?: PeerMetric[]
}

export default function PeerInsightCard({ cohortLabel = 'Members like you', metrics = [] }: PeerInsightCardProps) {
  return (
    <div className="rounded-2xl border border-sky-100 bg-white p-4 shadow-card">
      <div className="mb-2.5 flex items-center gap-1.5">
        <Users size={15} className="text-sky-600" />
        <h3 className="text-sm font-semibold text-slate-900">You vs {cohortLabel}</h3>
      </div>

      <div className="space-y-2.5">
        {metrics.map((metric, i) => {
          const max = Math.max(metric.you ?? 0, metric.peers ?? 0, 1)
          return (
            <div key={i}>
              <div className="mb-1 flex items-baseline justify-between text-[11px]">
                <span className="font-medium text-slate-600">{metric.label}</span>
                <span className="text-slate-400">
                  You <span className="font-bold text-slate-800">{(metric.you ?? 0).toLocaleString()}</span> · Peers{' '}
                  {(metric.peers ?? 0).toLocaleString()}
                  {metric.unit ?? ''}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-6 text-right text-[9px] font-bold text-brand-700">YOU</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-brand-600 transition-all duration-700"
                      style={{ width: `${Math.max(((metric.you ?? 0) / max) * 100, 4)}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-6 text-right text-[9px] font-medium text-sky-600">AVG</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-sky-400 transition-all duration-700"
                      style={{ width: `${Math.max(((metric.peers ?? 0) / max) * 100, 4)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
