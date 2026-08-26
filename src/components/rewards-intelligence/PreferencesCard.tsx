import { useState } from 'react'
import { SlidersHorizontal, Check } from 'lucide-react'

interface PreferenceCategory {
  label?: string
  enabled?: boolean
}

interface PreferencesCardProps {
  categories?: PreferenceCategory[]
  onSaveLabel?: string
}

export default function PreferencesCard({
  categories = [],
  onSaveLabel = 'Save preferences',
}: PreferencesCardProps) {
  const [enabled, setEnabled] = useState<boolean[]>(categories.map((c) => c.enabled ?? false))
  const [saved, setSaved] = useState(false)

  const toggle = (i: number) => {
    setEnabled((prev) => prev.map((v, idx) => (idx === i ? !v : v)))
    setSaved(false)
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card">
      <div className="mb-2.5 flex items-center gap-1.5">
        <SlidersHorizontal size={15} className="text-brand-700" />
        <h3 className="text-sm font-semibold text-slate-900">Tune Your Rewards</h3>
      </div>

      <p className="mb-2.5 text-[11px] leading-relaxed text-slate-500">
        Choose what we personalise for you — offers follow your picks.
      </p>

      <div className="flex flex-wrap gap-1.5">
        {categories.map((category, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            aria-pressed={enabled[i]}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
              enabled[i]
                ? 'bg-brand-600 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-500 hover:border-brand-300'
            }`}
          >
            {enabled[i] ? <Check size={11} /> : null}
            {category.label}
          </button>
        ))}
      </div>

      <button
        onClick={() => setSaved(true)}
        className={`mt-3 w-full rounded-xl py-2 text-xs font-semibold transition ${
          saved ? 'bg-emerald-50 text-emerald-700' : 'bg-brand-600 text-white hover:bg-brand-700'
        }`}
      >
        {saved ? 'Preferences saved ✓' : onSaveLabel}
      </button>
    </div>
  )
}
