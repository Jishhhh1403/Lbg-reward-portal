import { motion } from 'framer-motion'
import { Wallet } from 'lucide-react'

interface ConsolidatedRewardWalletProps {
  title?: string
  subtitle?: string
  programmes?: Array<{ name: string; points: number; value: string; status?: string }>
  totalValue?: string
}

export default function ConsolidatedRewardWallet({
  title = 'All your rewards in one place',
  subtitle = 'Everything you have earned, across every programme.',
  programmes = [],
  totalValue,
}: ConsolidatedRewardWalletProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full rounded-2xl border border-brand-200/70 bg-gradient-to-br from-brand-50 via-white to-gold-50/60 p-4 shadow-card"
    >
      <div className="mb-1 flex items-center gap-1.5">
        <Wallet size={15} className="text-brand-700" />
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <p className="mb-3 text-[10px] font-medium text-slate-400">{subtitle}</p>
      <div className="space-y-2">
        {programmes.map((p, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-xl border border-slate-100 bg-white/80 px-3 py-2"
          >
            <span className="text-[11px] font-semibold text-slate-700">
              {p.name}
              {p.status && (
                <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                  {p.status}
                </span>
              )}
            </span>
            <span className="text-right">
              <span className="block text-[11px] font-black text-brand-700">{p.value}</span>
              <span className="block text-[9px] text-slate-400">{p.points.toLocaleString()} pts</span>
            </span>
          </div>
        ))}
      </div>
      {totalValue && (
        <div className="mt-2.5 flex items-center justify-between rounded-xl bg-brand-600 px-3 py-2 text-white">
          <span className="text-[11px] font-semibold">Combined value</span>
          <span className="text-sm font-black">{totalValue}</span>
        </div>
      )}
    </motion.div>
  )
}
