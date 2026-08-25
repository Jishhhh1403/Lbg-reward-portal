import { BadgePercent } from 'lucide-react'

interface RedeemOption {
  name?: string
  points?: number
  cashValue?: string
  valuePerPoint?: number
  best?: boolean
}

interface BestValueRedeemCardProps {
  options?: RedeemOption[]
  note?: string
}

export default function BestValueRedeemCard({
  options = [],
  note = '',
}: BestValueRedeemCardProps) {
  const sorted = [...options].sort((a, b) => (b.valuePerPoint ?? 0) - (a.valuePerPoint ?? 0))

  return (
    <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-card">
      <div className="mb-2.5 flex items-center gap-1.5">
        <BadgePercent size={15} className="text-emerald-600" />
        <h3 className="text-sm font-semibold text-slate-900">Best Value Redemptions</h3>
        <span className="ml-auto text-[10px] font-medium text-slate-400">ranked by £ per point</span>
      </div>

      <div className="space-y-1.5">
        {sorted.map((option, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
              option.best ? 'border border-emerald-300 bg-emerald-50/70' : 'bg-slate-50'
            }`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                option.best ? 'bg-emerald-500 text-white' : 'bg-white text-slate-500 shadow-sm'
              }`}
            >
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-800">
                {option.name}
                {option.best ? (
                  <span className="ml-1.5 rounded-full bg-emerald-500 px-1.5 py-px text-[9px] font-bold uppercase text-white">
                    Best deal
                  </span>
                ) : null}
              </p>
              <p className="text-[10.5px] text-slate-500">{option.points?.toLocaleString()} pts</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs font-bold text-slate-900">{option.cashValue}</p>
              <p className="text-[10px] font-medium text-emerald-600">{option.valuePerPoint}p per point</p>
            </div>
          </div>
        ))}
      </div>

      {note ? <p className="mt-2 text-center text-[10px] text-slate-400">{note}</p> : null}
    </div>
  )
}
