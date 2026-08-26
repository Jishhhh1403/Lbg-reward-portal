import { motion } from 'framer-motion'
import { GraduationCap } from 'lucide-react'

interface ConfidenceProgressCardProps {
  title?: string
  topic?: string
  confidencePercent?: number
  levelLabel?: string
  nextMilestone?: string
}

export default function ConfidenceProgressCard({
  title = 'Your confidence progress',
  topic = 'Money basics',
  confidencePercent = 0,
  levelLabel,
  nextMilestone,
}: ConfidenceProgressCardProps) {
  const pct = Math.min(100, Math.max(0, confidencePercent))
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full rounded-2xl border border-brand-200/70 bg-gradient-to-br from-brand-50 via-white to-white p-4 shadow-card"
    >
      <div className="mb-1 flex items-center gap-1.5">
        <GraduationCap size={15} className="text-brand-700" />
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <p className="mb-3 text-[10px] font-medium text-slate-400">{topic}</p>
      <div className="mb-1.5 flex items-end justify-between">
        <span className="text-2xl font-black tracking-tight text-slate-900">{pct}%</span>
        {levelLabel && (
          <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700">
            {levelLabel}
          </span>
        )}
      </div>
      <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-gold-400"
          style={{ width: `${pct}%` }}
        />
      </div>
      {nextMilestone && (
        <p className="text-[10px] leading-snug text-slate-500">Next: {nextMilestone}</p>
      )}
    </motion.div>
  )
}
