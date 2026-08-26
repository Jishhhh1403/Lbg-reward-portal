import { MapPin } from 'lucide-react'

interface LocalDeal {
  merchant?: string
  distanceKm?: number
  offer?: string
  points?: number
}

interface LocalDealsCardProps {
  city?: string
  deals?: LocalDeal[]
  onViewAll?: () => void
}

export default function LocalDealsCard({ city = 'Your area', deals = [], onViewAll }: LocalDealsCardProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card">
      <div className="mb-2.5 flex items-center gap-1.5">
        <MapPin size={15} className="text-brand-700" />
        <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">Deals near {city}</h3>
        <button onClick={onViewAll} className="shrink-0 text-[11px] font-semibold text-brand-700 hover:text-brand-600">
          View all
        </button>
      </div>

      <div className="space-y-1.5">
        {deals.map((deal, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-800">{deal.merchant}</p>
              <p className="truncate text-[10.5px] text-slate-500">
                {deal.offer} · {deal.distanceKm} km away
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[10.5px] font-bold text-emerald-700">
              {(deal.points ?? 0).toLocaleString()} pts
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
