import { motion } from 'framer-motion'
import { AlertTriangle, Clock, ArrowRight } from 'lucide-react'

interface ExpiringPointsAlertProps {
  title?: string
  expiringPoints?: number
  daysLeft?: number
  message?: string
  onUsePoints?: () => void
}

export default function ExpiringPointsAlert({
  title = 'Points Expiring',
  expiringPoints = 0,
  daysLeft = 0,
  message = '',
  onUsePoints,
}: ExpiringPointsAlertProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0, scale: [1, 1.008, 1] }}
      transition={{
        opacity: { duration: 0.3 },
        y: { duration: 0.3 },
        scale: { duration: 2.4, repeat: Infinity },
      }}
      className="rounded-2xl border border-amber-200/80 bg-white p-4 shadow-card"
    >
      <div className="mb-2.5 flex items-center gap-1.5">
        <AlertTriangle size={15} className="text-amber-600" />
        <h3 className="text-sm font-semibold text-amber-700">{title}</h3>
      </div>
      <div className="mb-3 text-center">
        <p className="text-2xl font-black tracking-tight text-slate-900">{expiringPoints.toLocaleString()}</p>
        <p className="mt-0.5 text-xs font-medium text-amber-600">points at risk</p>
      </div>
      <div className="mb-3 flex items-center justify-center gap-1.5 rounded-xl bg-amber-50 p-2.5">
        <Clock size={13} className="text-amber-600" />
        <span className="text-xs font-semibold text-amber-700">{daysLeft} days remaining</span>
      </div>
      {message && <p className="mb-3 text-center text-[11px] leading-snug text-slate-500">{message}</p>}
      <motion.button
        onClick={onUsePoints}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
      >
        Use Points Now <ArrowRight size={14} />
      </motion.button>
    </motion.div>
  )
}
