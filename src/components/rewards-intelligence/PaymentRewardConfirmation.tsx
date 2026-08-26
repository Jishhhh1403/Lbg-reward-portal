import { motion } from 'framer-motion'
import { BadgeCheck } from 'lucide-react'

interface PaymentRewardConfirmationProps {
  title?: string
  message?: string
  amount?: string
  reference?: string
  date?: string
}

export default function PaymentRewardConfirmation({
  title = 'Reward confirmed',
  message = 'Your payment-linked reward has been applied to your balance.',
  amount,
  reference,
  date,
}: PaymentRewardConfirmationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-white p-4 shadow-card"
    >
      <div className="mb-2 flex items-center gap-1.5">
        <BadgeCheck size={15} className="text-emerald-600" />
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <p className="mb-3 text-[11px] leading-relaxed text-slate-600">{message}</p>
      <div className="space-y-1.5 rounded-xl bg-white/80 p-2.5 ring-1 ring-emerald-100">
        {amount && (
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Amount</span>
            <span className="font-black text-emerald-700">{amount}</span>
          </div>
        )}
        {reference && (
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Reference</span>
            <span className="font-bold text-slate-700">{reference}</span>
          </div>
        )}
        {date && (
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Date</span>
            <span className="font-bold text-slate-700">{date}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
