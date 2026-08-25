import { motion } from 'framer-motion'
import { Compass } from 'lucide-react'

interface LearningMissionCardProps {
  title?: string
  missionName?: string
  description?: string
  modulesDone?: number
  modulesTotal?: number
  pointsOnCompletion?: number
}

export default function LearningMissionCard({
  title = 'Your learning mission',
  missionName = '',
  description = '',
  modulesDone = 0,
  modulesTotal = 0,
  pointsOnCompletion,
}: LearningMissionCardProps) {
  const pct = modulesTotal > 0 ? Math.round((modulesDone / modulesTotal) * 100) : 0
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full rounded-2xl border border-brand-200/70 bg-gradient-to-br from-white via-white to-brand-50/60 p-4 shadow-card"
    >
      <div className="mb-1 flex items-center gap-1.5">
        <Compass size={15} className="text-brand-700" />
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      {missionName && <p className="text-[13px] font-bold text-slate-800">{missionName}</p>}
      {description && <p className="mt-1 mb-2.5 text-[10px] leading-relaxed text-slate-500">{description}</p>}
      {modulesTotal > 0 && (
        <>
          <div className="mb-1 flex items-center justify-between text-[11px]">
            <span className="font-semibold text-slate-600">
              {modulesDone} of {modulesTotal} steps complete
            </span>
            {typeof pointsOnCompletion === 'number' && (
              <span className="font-bold text-brand-700">+{pointsOnCompletion.toLocaleString()} pts</span>
            )}
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-gold-400"
              style={{ width: `${pct}%` }}
            />
          </div>
        </>
      )}
    </motion.div>
  )
}
