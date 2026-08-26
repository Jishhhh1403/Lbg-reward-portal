import { useState } from 'react'
import { Calculator, Coins } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface SavingsPreset {
  monthly?: number
  yearEnd?: number
  bonusPoints?: number
}

interface SavingsCalculatorCardProps {
  title?: string
  presets?: SavingsPreset[]
  note?: string
}

/** Builds a smooth 12-month accumulation curve that ends exactly at yearEnd. */
function curveFor(yearEnd: number): Array<{ month: string; value: number }> {
  return Array.from({ length: 12 }).map((_, i) => ({
    month: `M${i + 1}`,
    value: Math.round((yearEnd * (i + 1) * (i + 12)) / (12 * 23)),
  }))
}

export default function SavingsCalculatorCard({
  title = 'Savings Simulator',
  presets = [],
  note = '',
}: SavingsCalculatorCardProps) {
  const safePresets = presets.length
    ? presets
    : [
        { monthly: 50, yearEnd: 615, bonusPoints: 100 },
        { monthly: 100, yearEnd: 1230, bonusPoints: 250 },
        { monthly: 200, yearEnd: 2460, bonusPoints: 500 },
      ]
  const [selected, setSelected] = useState(Math.min(1, safePresets.length - 1))
  const preset = safePresets[selected]

  return (
    <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-card">
      <div className="mb-2 flex items-center gap-1.5">
        <Calculator size={15} className="text-indigo-600" />
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-1.5">
        {safePresets.map((p, i) => (
          <button
            key={i}
            onClick={() => setSelected(i)}
            className={`rounded-xl border px-2 py-1.5 text-center transition ${
              i === selected
                ? 'border-indigo-500 bg-indigo-600 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200'
            }`}
          >
            <span className="block text-[10px] font-medium opacity-80">£{p.monthly}/mo</span>
            <span className="block text-xs font-bold">£{(p.yearEnd ?? 0).toLocaleString()}</span>
          </button>
        ))}
      </div>

      <div className="h-28">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={curveFor(preset?.yearEnd ?? 0)} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
            <defs>
              <linearGradient id="savingsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#94a3b8' }} interval={2} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={44} />
            <Tooltip
              formatter={(value) => [`£${Number(value).toLocaleString()}`, 'Balance']}
              contentStyle={{ borderRadius: 10, fontSize: 11, border: '1px solid #e2e8f0' }}
            />
            <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={2} fill="url(#savingsFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <p className="text-[10px] leading-relaxed text-slate-400">{note}</p>
        {preset?.bonusPoints ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
            <Coins size={10} /> +{preset.bonusPoints} pts bonus
          </span>
        ) : null}
      </div>
    </div>
  )
}
