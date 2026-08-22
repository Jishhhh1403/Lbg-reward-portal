import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Gift, PartyPopper } from 'lucide-react'

interface BonusRewardCardProps {
  title?: string
  subtitle?: string
  points?: number
  expiresIn?: string
  onClaim?: () => void
}

const CONFETTI_COLORS = ['#ddbe72', '#006a4d', '#7fc0a5', '#ecd9a8', '#4aa37f']

export default function BonusRewardCard({
  title = 'You earned bonus coins!',
  subtitle = 'A thank-you for staying active',
  points = 250,
  expiresIn = '2 hours',
  onClaim,
}: BonusRewardCardProps) {
  const [claimed, setClaimed] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const handleClaim = () => {
    setClaimed(true)
    if (onClaim) onClaim()
    setShowConfetti(true)
    window.setTimeout(() => setShowConfetti(false), 2500)
  }

  return (
    <div className="relative">
      <AnimatePresence>
        {showConfetti && (
          <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-2xl">
            {Array.from({ length: 18 }).map((_, i) => (
              <motion.span
                key={i}
                className="absolute h-1.5 w-1.5 rounded-full"
                style={{ left: `${(i * 37) % 100}%`, background: CONFETTI_COLORS[i % CONFETTI_COLORS.length] }}
                initial={{ y: -12, opacity: 1 }}
                animate={{ y: 220, opacity: 0, rotate: 540 }}
                transition={{ duration: 1.6 + (i % 4) * 0.2, delay: (i % 6) * 0.08 }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        whileTap={claimed ? undefined : { scale: 0.99 }}
        className={`relative overflow-hidden rounded-2xl border p-4 shadow-card ${
          claimed
            ? 'border-brand-200 bg-gradient-to-br from-brand-50 to-gold-50'
            : 'border-brand-200 bg-gradient-to-br from-brand-50 via-white to-violet-50'
        }`}
      >
        <div className="pointer-events-none absolute -right-10 -top-14 h-28 w-28 rounded-full bg-white/60 blur-xl" />

        <div className="relative flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-brand-100">
              {claimed ? (
                <PartyPopper size={16} className="text-gold-600" />
              ) : (
                <Gift size={16} className="text-brand-700" />
              )}
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">{title}</p>
              <p className="text-[11px] text-slate-400">{subtitle}</p>
            </div>
          </div>
          {!claimed && (
            <span className="shrink-0 whitespace-nowrap text-[10px] font-medium text-slate-400">
              Expires in {expiresIn}
            </span>
          )}
        </div>

        <div className="relative my-3 text-center">
          <motion.p
            key={String(claimed)}
            className="text-2xl font-black tracking-tight text-slate-900"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            +{points.toLocaleString()}
          </motion.p>
          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">LBG coins</p>
        </div>

        {!claimed ? (
          <motion.button
            onClick={handleClaim}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="relative w-full rounded-xl bg-brand-600 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700"
          >
            Claim Now
          </motion.button>
        ) : (
          <div className="relative py-1 text-center">
            <p className="text-sm font-bold text-brand-700">Claimed successfully</p>
          </div>
        )}
      </motion.div>
    </div>
  )
}
