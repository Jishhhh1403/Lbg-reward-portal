import { motion } from 'framer-motion'
import { Link2, CheckCircle2, Circle } from 'lucide-react'

interface ProgrammeConnectionCardProps {
  title?: string
  subtitle?: string
  programmes?: Array<{ name: string; status?: string; connected?: boolean }>
}

export default function ProgrammeConnectionCard({
  title = 'Connect your reward programmes',
  subtitle = 'Link other loyalty programmes to see everything together.',
  programmes = [],
}: ProgrammeConnectionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full rounded-2xl border border-brand-200/70 bg-white p-4 shadow-card"
    >
      <div className="mb-1 flex items-center gap-1.5">
        <Link2 size={15} className="text-brand-700" />
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <p className="mb-3 text-[10px] font-medium text-slate-400">{subtitle}</p>
      <div className="space-y-2">
        {programmes.map((p, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2"
          >
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
              {p.connected ? (
                <CheckCircle2 size={13} className="text-emerald-500" />
              ) : (
                <Circle size={13} className="text-slate-300" />
              )}
              {p.name}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                p.connected ? 'bg-emerald-100 text-emerald-600' : 'bg-brand-100 text-brand-700'
              }`}
            >
              {p.status ?? (p.connected ? 'Connected' : 'Connect')}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
