import { motion } from 'framer-motion'
import { History } from 'lucide-react'

interface RewardProvenanceCardProps {
  title?: string
  subtitle?: string
  history?: Array<{ source: string; date: string; points: number }>
}

export default function RewardProvenanceCard({
  title = 'Where your points came from',
  subtitle = 'A clear record of every reward you have earned.',
  history = [],
}: RewardProvenanceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full rounded-2xl border border-slate-200 bg-slate-50/70 p-4 shadow-card"
    >
      <div className="mb-1 flex items-center gap-1.5">
        <History size={15} className="text-slate-500" />
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <p className="mb-3 text-[10px] font-medium text-slate-400">{subtitle}</p>
      <div className="relative space-y-2.5 pl-3">
        <span className="absolute bottom-1 left-0 top-1 w-px bg-slate-200" aria-hidden="true" />
        {history.map((h, i) => (
          <div key={i} className="relative">
            <span className="absolute -left-3 top-1.5 h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden="true" />
            <div className="flex items-center justify-between pr-1">
              <span>
                <span className="block text-[11px] font-semibold text-slate-700">{h.source}</span>
                <span className="block text-[9px] text-slate-400">{h.date}</span>
              </span>
              <span className="text-[11px] font-bold text-brand-700">+{h.points.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
