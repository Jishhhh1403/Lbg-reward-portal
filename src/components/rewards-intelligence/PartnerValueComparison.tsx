import { motion } from 'framer-motion'
import { Scale } from 'lucide-react'

interface PartnerValueComparisonProps {
  title?: string
  subtitle?: string
  partners?: Array<{ name: string; points: number; value: string; perk?: string }>
}

export default function PartnerValueComparison({
  title = 'Compare partner values',
  subtitle = 'What your points are worth with each partner right now.',
  partners = [],
}: PartnerValueComparisonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full rounded-2xl border border-brand-200/70 bg-gradient-to-br from-white via-white to-gold-50/60 p-4 shadow-card"
    >
      <div className="mb-1 flex items-center gap-1.5">
        <Scale size={15} className="text-brand-700" />
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <p className="mb-3 text-[10px] font-medium text-slate-400">{subtitle}</p>
      <div className="space-y-2">
        {partners.map((p, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-xl border border-slate-100 bg-white/80 px-3 py-2.5"
          >
            <div>
              <span className="block text-xs font-semibold text-slate-800">{p.name}</span>
              {p.perk && <span className="block text-[10px] text-slate-500">{p.perk}</span>}
            </div>
            <div className="text-right">
              <span className="block text-xs font-black text-brand-700">{p.value}</span>
              <span className="block text-[10px] text-slate-400">
                {p.points.toLocaleString()} pts
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
