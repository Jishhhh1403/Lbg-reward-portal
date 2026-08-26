import { Star } from 'lucide-react'

interface NewBrandSpotlightCardProps {
  brandName?: string
  logoText?: string
  color?: string
  bonusPoints?: number
  matchScore?: number
  whyThisBrand?: string
  onAction?: () => void
}

export default function NewBrandSpotlightCard({
  brandName = 'New Partner',
  logoText = 'NB',
  color = '#006a4d',
  bonusPoints = 0,
  matchScore = 0,
  whyThisBrand = '',
  onAction,
}: NewBrandSpotlightCardProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card">
      <div className="mb-2 flex items-center gap-2.5">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold text-white"
          style={{ backgroundColor: color }}
        >
          {logoText}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-slate-900">{brandName}</h3>
          {bonusPoints > 0 ? (
            <p className="text-[11px] font-semibold text-emerald-600">+{bonusPoints.toLocaleString()} welcome bonus</p>
          ) : null}
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-600">
          <Star size={11} className="fill-amber-500 text-amber-500" />
          {matchScore}% match
        </span>
      </div>

      {whyThisBrand ? <p className="mb-2 text-[11px] leading-relaxed text-slate-500">{whyThisBrand}</p> : null}

      <button
        onClick={onAction}
        className="w-full rounded-xl border border-brand-600 py-2 text-xs font-semibold text-brand-700 transition hover:bg-brand-50"
      >
        Link {brandName}
      </button>
    </div>
  )
}
