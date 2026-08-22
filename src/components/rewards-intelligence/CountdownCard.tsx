import { motion } from 'framer-motion'
import { Clock, AlertTriangle } from 'lucide-react'

interface CountdownCardProps {
  title?: string
  days?: number
  hours?: number
  minutes?: number
  message?: string
}

export default function CountdownCard({
  title = 'Time Remaining',
  days = 0,
  hours = 0,
  minutes = 0,
  message = '',
}: CountdownCardProps) {
  const units = [
    { label: 'Days', value: days },
    { label: 'Hrs', value: hours },
    { label: 'Min', value: minutes },
  ]

  return (
    <div className="h-full rounded-2xl border border-brand-100 bg-white p-4 shadow-card">
      <div className="mb-3 flex items-center gap-1.5">
        <Clock size={15} className="text-brand-700" />
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="mb-3 flex justify-center gap-2.5">
        {units.map((unit, i) => (
          <div key={i} className="text-center">
            <motion.div
              className="mb-1.5 flex h-14 w-14 items-center justify-center rounded-xl bg-slate-50 shadow-inner"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.25 }}
            >
              <span className="text-lg font-black tabular-nums text-slate-900">{unit.value}</span>
            </motion.div>
            <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{unit.label}</span>
          </div>
        ))}
      </div>
      {message && (
        <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500">
          <AlertTriangle size={11} className="text-amber-500" />
          <span>{message}</span>
        </div>
      )}
    </div>
  )
}
