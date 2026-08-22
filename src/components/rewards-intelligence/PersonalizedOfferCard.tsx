import { motion } from 'framer-motion'
import { Gift, Clock, ArrowRight } from 'lucide-react'

interface PersonalizedOfferCardProps {
  title?: string
  subtitle?: string
  offer?: string
  validUntil?: string
  message?: string
  onClaim?: () => void
}

export default function PersonalizedOfferCard({
  title = 'Special Offer',
  subtitle = '',
  offer = '',
  validUntil = '7 days',
  message = '',
  onClaim,
}: PersonalizedOfferCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-brand-50 p-4 shadow-card"
    >
      <div className="mb-2 flex items-center gap-1.5">
        <Gift size={15} className="text-violet-600" />
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      {subtitle && <p className="mb-2.5 text-[11px] text-slate-400">{subtitle}</p>}
      <div className="mb-2.5 rounded-xl bg-white/80 p-3 text-center shadow-sm">
        <p className="text-base font-black text-violet-700">{offer}</p>
        <div className="mt-1 flex items-center justify-center gap-1">
          <Clock size={10} className="text-violet-400" />
          <span className="text-[10px] font-medium text-violet-400">Valid for {validUntil}</span>
        </div>
      </div>
      {message && <p className="mb-2.5 text-[11px] leading-snug text-slate-500">{message}</p>}
      <motion.button
        onClick={onClaim}
        whileTap={{ scale: 0.98 }}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
      >
        Claim Offer <ArrowRight size={14} />
      </motion.button>
    </motion.div>
  )
}
