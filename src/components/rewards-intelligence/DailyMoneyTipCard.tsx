import { useState } from 'react'
import { Lightbulb, ChevronDown } from 'lucide-react'

interface DailyMoneyTipCardProps {
  tipTitle?: string
  tipBody?: string
  category?: string
  readTimeMin?: number
}

export default function DailyMoneyTipCard({
  tipTitle = 'Money Tip of the Day',
  tipBody = '',
  category = 'Wellbeing',
  readTimeMin = 2,
}: DailyMoneyTipCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-card">
      <div className="mb-2 flex items-center gap-1.5">
        <Lightbulb size={15} className="text-indigo-600" />
        <h3 className="truncate text-sm font-semibold text-slate-900">{tipTitle}</h3>
      </div>

      <p className={`text-xs leading-relaxed text-slate-600 ${expanded ? '' : 'line-clamp-2'}`}>{tipBody}</p>

      <button
        onClick={() => setExpanded((v) => !v)}
        className="mt-2 flex w-full items-center justify-between text-[10px] font-medium text-slate-400"
      >
        <span>
          {category} · {readTimeMin} min read
        </span>
        <span className="flex items-center gap-0.5 font-semibold text-indigo-600">
          {expanded ? 'Show less' : 'Read more'}
          <ChevronDown size={11} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </span>
      </button>
    </div>
  )
}
