import { PiggyBank } from 'lucide-react'

interface SavingsTransferCardProps {
  potName?: string
  suggestedPoints?: number
  gbpValue?: string
  apyNote?: string
  onTransfer?: () => void
}

export default function SavingsTransferCard({
  potName = 'Savings Pot',
  suggestedPoints = 1000,
  gbpValue = '£10.00',
  apyNote = '',
  onTransfer,
}: SavingsTransferCardProps) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-4 shadow-card">
      <div className="mb-2 flex items-center gap-1.5">
        <PiggyBank size={15} className="text-brand-700" />
        <h3 className="text-sm font-semibold text-slate-900">Points → {potName}</h3>
      </div>

      <div className="mb-2 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Suggested transfer</p>
          <p className="text-lg font-extrabold leading-tight text-slate-900">{suggestedPoints.toLocaleString()} pts</p>
        </div>
        <p className="pb-1 text-base font-extrabold text-brand-700">{gbpValue}</p>
      </div>

      {apyNote ? <p className="mb-2 text-[11px] leading-relaxed text-slate-500">{apyNote}</p> : null}

      <button
        onClick={onTransfer}
        className="w-full rounded-xl bg-brand-600 py-2 text-xs font-semibold text-white transition hover:bg-brand-700"
      >
        Move to pot
      </button>
    </div>
  )
}
