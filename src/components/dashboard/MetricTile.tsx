import { motion } from 'framer-motion'
import { Info } from 'lucide-react'

interface MetricTileProps {
  label: string
  value: string
  tone?: 'white' | 'brand'
  unit?: string
  infoText?: string
  delay?: number
  valueColor?: string
  icon?: string
}

export default function MetricTile({
  label,
  value,
  tone = 'white',
  unit,
  infoText,
  delay = 0,
  valueColor,
  icon,
}: MetricTileProps) {
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
      className={`group relative rounded-2xl p-3 text-center shadow-card ${styles}`}
    >
      <div className="flex items-center justify-center gap-1">
        <p className={`whitespace-nowrap text-[11px] font-medium ${tone === 'brand' ? 'text-brand-100' : 'text-slate-700'}`}>
          {label}
        </p>
        {infoText && (
          <>
            <Info size={11} className="shrink-0 cursor-help text-slate-300 transition group-hover:text-slate-500" />
            <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-1.5 w-40 -translate-x-1/2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[10px] leading-snug text-slate-800 opacity-0 shadow-lg transition group-hover:opacity-100">
              {infoText}
            </span>
          </>
        )}
      </div>
      <div className="mt-1 flex items-center justify-center gap-1.5">
        {icon && <img src={icon} alt="" className="h-5 w-5 object-contain" />}
        <p
          className="text-base font-bold tracking-tight"
          style={valueColor ? { color: valueColor } : undefined}
        >
          {value}
          {unit && <span className="ml-0.5 text-xs font-medium opacity-70">{unit}</span>}
        </p>
      </div>
    </motion.div>
  )
}
