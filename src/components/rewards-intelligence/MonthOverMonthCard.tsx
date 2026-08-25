import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'

interface MonthOverMonthCardProps {
  earned?: number
  prevEarned?: number
  redeemed?: number
  prevRedeemed?: number
  deltaLabel?: string
}

export default function MonthOverMonthCard({
  earned = 0,
  prevEarned = 0,
  redeemed = 0,
  prevRedeemed = 0,
  deltaLabel = '',
}: MonthOverMonthCardProps) {
  const data = [
    { name: 'Last month', Earned: prevEarned, Redeemed: prevRedeemed },
    { name: 'This month', Earned: earned, Redeemed: redeemed },
  ]
  const delta = earned - prevEarned
  const up = delta >= 0

  return (
    <div className="rounded-2xl border border-sky-100 bg-white p-4 shadow-card">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Earning vs Redeeming</h3>
        {deltaLabel ? (
          <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${up ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
            {up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {deltaLabel}
          </span>
        ) : null}
      </div>

      <div className="h-28">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(value, name) => [`${Number(value).toLocaleString()} pts`, String(name)]}
              contentStyle={{ borderRadius: 10, fontSize: 11, border: '1px solid #e2e8f0' }}
            />
            <Bar dataKey="Earned" fill="#006a4d" radius={[5, 5, 0, 0]} maxBarSize={26} />
            <Bar dataKey="Redeemed" fill="#7fc0a5" radius={[5, 5, 0, 0]} maxBarSize={26} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-1.5 flex justify-center gap-4 text-[10px] font-medium text-slate-400">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-brand-600" /> Earned</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-brand-300" /> Redeemed</span>
      </div>
    </div>
  )
}
