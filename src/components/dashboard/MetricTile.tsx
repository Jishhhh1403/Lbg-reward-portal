import { motion } from 'framer-motion'
import { Info } from 'lucide-react'

interface MetricTileProps {
  label: string
  value: string
  tone?: 'white' | 'brand'
  unit?: string
  infoText?: string
  delay?: number
}

export default function MetricTile({ label, value, tone = 'white', unit, infoText, delay = 0 }: MetricTileProps) {
  const styles =
    tone === 'brand'
      ? 'bg-brand-600 text-white'
      : 'bg-white text-slate-900'

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -2 }}
      className={`group relative rounded-2xl p-3 shadow-card ${styles}`}
    >
      <div className="flex items-center gap-1">
        <p className={`text-[11px] font-medium ${tone === 'brand' ? 'text-brand-100' : 'text-slate-500'}`}>
          {label}
        </p>
        {infoText && (
          <>
            <Info size={11} className="cursor-help text-slate-300 transition group-hover:text-slate-500" />
            <span className="pointer-events-none absolute -top-1 left-1/2 z-20 w-40 -translate-x-1/2 -translate-y-full rounded-lg bg-slate-900 px-2.5 py-1.5 text-[10px] leading-snug text-white opacity-0 shadow-lg transition group-hover:opacity-100">
              {infoText}
            </span>
          </>
        )}
      </div>
      <p className="mt-1 text-base font-bold tracking-tight">
        {value}
        {unit && <span className="ml-0.5 text-xs font-medium opacity-70">{unit}</span>}
      </p>
    </motion.div>
  )
}
