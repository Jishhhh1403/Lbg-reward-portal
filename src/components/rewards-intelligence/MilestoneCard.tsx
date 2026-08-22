import { motion } from 'framer-motion'
import { Check, Circle, Flag } from 'lucide-react'

interface Milestone {
  label: string
  achieved: boolean
}

interface MilestoneCardProps {
  title?: string
  milestones?: Milestone[]
}

export default function MilestoneCard({
  title = 'Milestones',
  milestones = [],
}: MilestoneCardProps) {
  return (
    <div className="h-full rounded-2xl border border-brand-100 bg-white p-4 shadow-card">
      <div className="mb-3 flex items-center gap-1.5">
        <Flag size={15} className="text-gold-600" />
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="space-y-2.5">
        {milestones.map((milestone, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex items-center gap-2.5"
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                milestone.achieved ? 'bg-brand-600/10 text-brand-700' : 'bg-slate-100 text-slate-300'
              }`}
            >
              {milestone.achieved ? <Check size={11} /> : <Circle size={11} />}
            </span>
            <span className={`text-xs ${milestone.achieved ? 'font-medium text-slate-900' : 'text-slate-400'}`}>
              {milestone.label}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
