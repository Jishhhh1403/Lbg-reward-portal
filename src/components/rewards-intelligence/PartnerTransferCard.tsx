import { motion } from 'framer-motion'
import { ArrowLeftRight } from 'lucide-react'

interface PartnerTransferCardProps {
  title?: string
  fromProgramme?: string
  toPartner?: string
  points?: number
  estimatedValue?: string
  status?: string
}

export default function PartnerTransferCard({
  title = 'Move points to a partner',
  fromProgramme = 'LBG Rewards',
  toPartner = '',
  points = 0,
  estimatedValue,
  status = 'Ready when you are',
}: PartnerTransferCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full rounded-2xl border border-brand-200/70 bg-white p-4 shadow-card"
    >
      <div className="mb-2.5 flex items-center gap-1.5">
        <ArrowLeftRight size={15} className="text-brand-700" />
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 rounded-xl bg-slate-50 p-2.5 text-center ring-1 ring-slate-100">
          <span className="block text-[9px] font-bold uppercase tracking-wide text-slate-400">From</span>
          <span className="block text-[11px] font-semibold text-slate-700">{fromProgramme}</span>
        </div>
        <ArrowLeftRight size={13} className="shrink-0 text-brand-500" />
        <div className="flex-1 rounded-xl bg-brand-50 p-2.5 text-center ring-1 ring-brand-100">
          <span className="block text-[9px] font-bold uppercase tracking-wide text-brand-400">To</span>
          <span className="block text-[11px] font-semibold text-brand-700">{toPartner || 'Choose partner'}</span>
        </div>
      </div>
      <div className="mt-2.5 space-y-1.5 rounded-xl bg-slate-50/70 p-2.5 ring-1 ring-slate-100">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-500">Points to move</span>
          <span className="font-bold text-slate-700">{points.toLocaleString()}</span>
        </div>
        {estimatedValue && (
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Estimated value on arrival</span>
            <span className="font-black text-brand-700">{estimatedValue}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-500">Status</span>
          <span className="font-semibold text-emerald-600">{status}</span>
        </div>
      </div>
    </motion.div>
  )
}
