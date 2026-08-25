import { motion } from 'framer-motion'
import { Info } from 'lucide-react'

interface WhyThisUiCardProps {
  title?: string
  intro?: string
  reasons?: Array<{ label: string; detail: string }>
}

export default function WhyThisUiCard({
  title = 'Why you are seeing this',
  intro = 'This screen was put together for you based on your preferences.',
  reasons = [],
}: WhyThisUiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-card"
    >
      <div className="mb-1 flex items-center gap-1.5">
        <Info size={15} className="text-slate-500" />
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <p className="mb-3 text-[10px] leading-relaxed text-slate-500">{intro}</p>
      <ul className="space-y-2">
        {reasons.map((r, i) => (
          <li key={i} className="rounded-xl bg-white p-2.5 ring-1 ring-slate-100">
            <span className="block text-[11px] font-semibold text-slate-700">{r.label}</span>
            <span className="block text-[10px] leading-snug text-slate-500">{r.detail}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  )
}
