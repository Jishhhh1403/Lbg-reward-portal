import { useState } from 'react'
import { Wand2 } from 'lucide-react'

interface AutoRule {
  trigger?: string
  action?: string
  enabled?: boolean
}

interface AutoRulesCardProps {
  rules?: AutoRule[]
  toggleLabel?: string
}

export default function AutoRulesCard({ rules = [], toggleLabel = '' }: AutoRulesCardProps) {
  const [enabled, setEnabled] = useState<boolean[]>(rules.map((r) => r.enabled ?? false))

  const toggle = (i: number) =>
    setEnabled((prev) => prev.map((v, idx) => (idx === i ? !v : v)))

  return (
    <div className="rounded-2xl border border-teal-100 bg-white p-4 shadow-card">
      <div className="mb-2.5 flex items-center gap-1.5">
        <Wand2 size={15} className="text-teal-600" />
        <h3 className="text-sm font-semibold text-slate-900">Auto-Earn Rules</h3>
        {toggleLabel ? (
          <span className="ml-auto rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
            {toggleLabel}
          </span>
        ) : null}
      </div>

      <div className="space-y-2">
        {rules.map((rule, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-800">{rule.trigger}</p>
              <p className="truncate text-[11px] text-slate-500">→ {rule.action}</p>
            </div>
            <button
              role="switch"
              aria-checked={enabled[i]}
              onClick={() => toggle(i)}
              className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                enabled[i] ? 'bg-teal-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
                  enabled[i] ? 'left-[18px]' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <p className="mt-2 text-center text-[10px] text-slate-400">Toggle a rule to turn hands-free earning on or off</p>
    </div>
  )
}
