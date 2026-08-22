import { motion } from 'framer-motion'
import { PoundSterling, TrendingUp } from 'lucide-react'

interface TangibleValueCardProps {
  title?: string
  cashValue?: string
  pointsEquivalent?: number
  breakdown?: Array<{ label: string; value: string }>
}

export default function TangibleValueCard({
  title = 'Your Points Are Worth',
  cashValue = '£0.00',
  pointsEquivalent = 0,
  breakdown = [],
}: TangibleValueCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full rounded-2xl border border-brand-200/70 bg-gradient-to-br from-brand-50 via-white to-gold-50/70 p-4 shadow-card"
    >
      <div className="mb-2 flex items-center gap-1.5">
        <TrendingUp size={15} className="text-brand-700" />
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="mb-2.5 text-center">
        <div className="flex items-center justify-center gap-1">
          <PoundSterling size={20} className="text-brand-700" />
          <span className="text-2xl font-black tracking-tight text-slate-900">{cashValue}</span>
        </div>
        <p className="mt-0.5 text-[10px] font-medium text-slate-400">
          from {pointsEquivalent.toLocaleString()} points
        </p>
      </div>
      {breakdown.length > 0 && (
        <div className="space-y-1.5 rounded-xl bg-white/70 p-2.5 ring-1 ring-slate-100">
          {breakdown.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500">{item.label}</span>
              <span className="font-bold text-brand-700">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
