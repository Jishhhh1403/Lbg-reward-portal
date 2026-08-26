import { motion } from 'framer-motion'
import { CreditCard } from 'lucide-react'

interface PaymentRewardCardProps {
  title?: string
  paymentMethod?: string
  rewardRate?: string
  monthlyCap?: string
  description?: string
}

export default function PaymentRewardCard({
  title = 'Rewards on everyday payments',
  paymentMethod = 'Linked debit card',
  rewardRate = '0.5% back in points',
  monthlyCap,
  description = 'Earn points automatically on the payments you already make — no extra spending needed.',
}: PaymentRewardCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full rounded-2xl border border-brand-200/70 bg-gradient-to-br from-brand-50 via-white to-white p-4 shadow-card"
    >
      <div className="mb-1 flex items-center gap-1.5">
        <CreditCard size={15} className="text-brand-700" />
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <p className="mb-3 text-[10px] leading-relaxed text-slate-500">{description}</p>
      <div className="space-y-1.5 rounded-xl bg-white/70 p-2.5 ring-1 ring-slate-100">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-500">{paymentMethod}</span>
          <span className="font-bold text-brand-700">{rewardRate}</span>
        </div>
        {monthlyCap && (
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Monthly cap</span>
            <span className="font-bold text-slate-700">{monthlyCap}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
