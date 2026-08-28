import { motion } from 'framer-motion'
import { Zap, Timer } from 'lucide-react'

interface FlashRewardBannerProps {
  title?: string
  subtitle?: string
  originalPoints?: number
  discountedPoints?: number
  timer?: string
}

export default function FlashRewardBanner({
  title = 'Flash Sale',
  subtitle = 'Limited time offer',
  originalPoints = 400,
  discountedPoints = 200,
  timer = '04:32:11',
}: FlashRewardBannerProps) {
  const discount = Math.round((1 - discountedPoints / Math.max(originalPoints, 1)) * 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 via-gold-50/60 to-white shadow-card"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-white/50 to-transparent pointer-events-none" />
      <div className="relative p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <motion.span
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Zap size={15} className="text-amber-600" />
            </motion.span>
            <span className="text-sm font-bold text-amber-700">{title}</span>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-amber-100/80 px-2.5 py-1">
            <Timer size={11} className="text-amber-700" />
            <span className="font-mono text-[10px] font-bold tabular-nums text-amber-700">{timer}</span>
          </div>
        </div>
        <p className="mb-2.5 text-xs leading-relaxed text-slate-500">{subtitle}</p>
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-medium text-slate-400 line-through">
            {originalPoints.toLocaleString()} pts
          </span>
          <motion.span
            className="text-xl font-black tracking-tight text-brand-800"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
          >
            {discountedPoints.toLocaleString()} pts
          </motion.span>
          <span className="rounded-full bg-gold-400 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-brand-900">
            {discount}% off
          </span>
        </div>
      </div>
    </motion.div>
  )
}
