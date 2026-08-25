import { Bot, ArrowRight } from 'lucide-react'

interface CoachTipCardProps {
  coachName?: string
  headline?: string
  body?: string
  relatedBrand?: string
  onLearnMore?: () => void
}

export default function CoachTipCard({
  coachName = 'Ava · Rewards Coach',
  headline = '',
  body = '',
  relatedBrand = '',
  onLearnMore,
}: CoachTipCardProps) {
  const initials = coachName
    .split(/[\s·]+/)
    .filter((p) => /^[A-Z]/.test(p))
    .map((p) => p[0])
    .slice(0, 2)
    .join('')

  return (
    <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/60 p-4 shadow-card">
      <div className="mb-2 flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white shadow-sm">
          {initials || <Bot size={15} />}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-slate-900">{headline}</h3>
          <p className="text-[10px] font-medium text-indigo-500">{coachName}</p>
        </div>
      </div>

      <p className="mb-2 text-xs leading-relaxed text-slate-600">{body}</p>

      {relatedBrand ? (
        <span className="mb-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
          Related: {relatedBrand}
        </span>
      ) : null}

      <button
        onClick={onLearnMore}
        className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 transition-colors hover:text-indigo-500"
      >
        Show me how <ArrowRight size={12} />
      </button>
    </div>
  )
}
