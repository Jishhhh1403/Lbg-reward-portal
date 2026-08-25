import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface EarnSegment {
  label?: string
  points?: number
  colorToken?: string
}

interface EarnBreakdownCardProps {
  period?: string
  segments?: EarnSegment[]
}

const TOKEN_COLORS: Record<string, string> = {
  brand: '#006a4d',
  goal_progress: '#059669',
  achievement: '#f59e0b',
  insight: '#6366f1',
  community: '#0ea5e9',
  urgency: '#ef4444',
}

export default function EarnBreakdownCard({ period = 'this month', segments = [] }: EarnBreakdownCardProps) {
  const total = segments.reduce((sum, s) => sum + (s.points ?? 0), 0)

  return (
    <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-card">
      <div className="mb-1 flex items-center gap-1.5">
        <h3 className="text-sm font-semibold text-slate-900">Where Your Points Come From</h3>
        <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">{period}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative h-32 w-32 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={segments}
                dataKey="points"
                nameKey="label"
                innerRadius={34}
                outerRadius={56}
                paddingAngle={2}
                strokeWidth={0}
              >
                {segments.map((segment, i) => (
                  <Cell key={i} fill={TOKEN_COLORS[segment.colorToken ?? ''] ?? '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [`${Number(value).toLocaleString()} pts`, String(name)]}
                contentStyle={{ borderRadius: 10, fontSize: 11, border: '1px solid #e2e8f0' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[9px] font-medium uppercase tracking-wide text-slate-400">Total</span>
            <span className="text-xs font-extrabold text-slate-800">{total.toLocaleString()}</span>
          </div>
        </div>

        <ul className="min-w-0 flex-1 space-y-1.5">
          {segments.map((segment, i) => (
            <li key={i} className="flex items-center gap-2 text-[11px]">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: TOKEN_COLORS[segment.colorToken ?? ''] ?? '#94a3b8' }}
              />
              <span className="min-w-0 flex-1 truncate text-slate-600">{segment.label}</span>
              <span className="shrink-0 font-semibold text-slate-800">{(segment.points ?? 0).toLocaleString()}</span>
              <span className="w-8 shrink-0 text-right text-[10px] text-slate-400">
                {total ? Math.round(((segment.points ?? 0) / total) * 100) : 0}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
