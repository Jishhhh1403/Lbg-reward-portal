import { BookOpen, ArrowRight } from 'lucide-react'

interface EducationalInsightCardProps {
  title?: string
  insight?: string
  source?: string
  actionLabel?: string
  onLearnMore?: () => void
}

export default function EducationalInsightCard({
  title = 'Did You Know?',
  insight = '',
  source = '',
  actionLabel = 'Learn more',
  onLearnMore,
}: EducationalInsightCardProps) {
  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-card">
      <div className="mb-2 flex items-center gap-1.5">
        <BookOpen size={15} className="text-violet-600" />
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <p className="mb-2 text-xs leading-relaxed text-slate-600">{insight}</p>
      {source && <p className="mb-2 text-[10px] italic text-slate-400">Source: {source}</p>}
      <button
        onClick={onLearnMore}
        className="flex items-center gap-1 text-[11px] font-semibold text-violet-600 transition-colors hover:text-violet-500"
      >
        {actionLabel} <ArrowRight size={12} />
      </button>
    </div>
  )
}
