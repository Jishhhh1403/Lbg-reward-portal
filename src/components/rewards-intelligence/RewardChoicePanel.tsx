import { motion } from 'framer-motion'
import { GitBranch } from 'lucide-react'

interface RewardChoicePanelProps {
  title?: string
  subtitle?: string
  options?: Array<{ id: string; label: string; description?: string; points?: number }>
}

export default function RewardChoicePanel({
  title = 'What would you like to do?',
  subtitle = 'Your points, your choice — no pressure either way.',
  options = [],
}: RewardChoicePanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full rounded-2xl border border-brand-200/70 bg-white p-4 shadow-card"
    >
      <div className="mb-1 flex items-center gap-1.5">
        <GitBranch size={15} className="text-brand-700" />
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <p className="mb-3 text-[10px] font-medium text-slate-400">{subtitle}</p>
      <div className="space-y-2">
        {options.map((opt) => (
          <button
            key={opt.id}
            className="flex w-full items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5 text-left transition hover:border-brand-300 hover:bg-brand-50/60"
          >
            <span>
              <span className="block text-xs font-semibold text-slate-800">{opt.label}</span>
              {opt.description && (
                <span className="block text-[10px] text-slate-500">{opt.description}</span>
              )}
            </span>
            {typeof opt.points === 'number' && (
              <span className="ml-2 shrink-0 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                {opt.points.toLocaleString()} pts
              </span>
            )}
          </button>
        ))}
      </div>
    </motion.div>
  )
}
