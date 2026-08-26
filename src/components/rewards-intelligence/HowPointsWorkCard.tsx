import { Route, ArrowRight } from 'lucide-react'

interface ExplainerStep {
  title?: string
  description?: string
}

interface HowPointsWorkCardProps {
  steps?: ExplainerStep[]
  ctaLabel?: string
  onAction?: () => void
}

const STEP_COLORS = ['bg-emerald-500', 'bg-sky-500', 'bg-violet-500', 'bg-amber-500']

export default function HowPointsWorkCard({
  steps = [],
  ctaLabel = 'Got it',
  onAction,
}: HowPointsWorkCardProps) {
  return (
    <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-card">
      <div className="mb-3 flex items-center gap-1.5">
        <Route size={15} className="text-indigo-600" />
        <h3 className="text-sm font-semibold text-slate-900">How points work</h3>
      </div>

      <div className="relative space-y-3 pl-1">
        {steps.map((step, i) => (
          <div key={i} className="relative flex gap-2.5">
            {i < steps.length - 1 && <span className="absolute left-[13px] top-7 h-[calc(100%-14px)] w-px bg-slate-200" aria-hidden />}
            <span
              className={`z-10 flex h-[27px] w-[27px] shrink-0 items-center justify-center rounded-full ${STEP_COLORS[i % STEP_COLORS.length]} text-[11px] font-bold text-white`}
            >
              {i + 1}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-xs font-semibold text-slate-800">{step.title}</p>
              <p className="text-[11px] leading-relaxed text-slate-500">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onAction}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-600 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-700"
      >
        {ctaLabel} <ArrowRight size={12} />
      </button>
    </div>
  )
}
