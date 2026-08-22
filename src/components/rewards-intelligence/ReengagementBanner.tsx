import { motion } from 'framer-motion'
import { HeartHandshake, ArrowRight } from 'lucide-react'

interface ReengagementBannerProps {
  title?: string
  message?: string
  ctaText?: string
  onCta?: () => void
}

export default function ReengagementBanner({
  title = 'Welcome Back!',
  message = '',
  ctaText = 'Start Exploring',
  onCta,
}: ReengagementBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-brand-200/70 bg-gradient-to-br from-brand-50 via-white to-brand-50 p-4 shadow-card"
    >
      <div className="mb-2 flex items-center gap-1.5">
        <HeartHandshake size={15} className="text-brand-700" />
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <p className="mb-3 text-xs leading-relaxed text-slate-500">{message}</p>
      <motion.button
        onClick={onCta}
        whileTap={{ scale: 0.98 }}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
      >
        {ctaText} <ArrowRight size={14} />
      </motion.button>
    </motion.div>
  )
}
