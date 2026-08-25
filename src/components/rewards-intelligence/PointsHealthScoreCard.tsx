import { Activity } from 'lucide-react'
import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts'

interface PointsHealthScoreProps {
  score?: number
  delta?: number
  tip?: string
}

export default function PointsHealthScoreCard({ score = 0, delta = 0, tip = '' }: PointsHealthScoreProps) {
  const clamped = Math.max(0, Math.min(100, score))
  const color = clamped >= 75 ? '#059669' : clamped >= 50 ? '#f59e0b' : '#ef4444'
  const data = [{ name: 'score', value: clamped, fill: color }]

  return (
    <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-card">
      <div className="mb-1 flex items-center gap-1.5">
        <Activity size={15} className="text-indigo-600" />
        <h3 className="text-sm font-semibold text-slate-900">Points Health</h3>
        {delta !== 0 ? (
          <span className={`ml-auto text-[10px] font-bold ${delta > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
            {delta > 0 ? '+' : ''}
            {delta} vs last month
          </span>
        ) : null}
      </div>

      <div className="relative mx-auto h-28 w-28">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart data={data} innerRadius="72%" outerRadius="100%" startAngle={220} endAngle={-40}>
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar background={{ fill: '#f1f5f9' }} dataKey="value" cornerRadius={12} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-extrabold" style={{ color }}>
            {clamped}
          </span>
          <span className="text-[9px] font-medium uppercase tracking-wide text-slate-400">of 100</span>
        </div>
      </div>

      {tip ? <p className="mt-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-center text-[10.5px] leading-relaxed text-slate-500">{tip}</p> : null}
    </div>
  )
}
