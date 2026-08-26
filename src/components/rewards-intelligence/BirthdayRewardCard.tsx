import { Gift } from 'lucide-react'

interface BirthdayRewardCardProps {
  gift?: string
  expiresInDays?: number
  claimed?: boolean
  message?: string
  onClaim?: () => void
}

export default function BirthdayRewardCard({
  gift = 'A birthday surprise',
  expiresInDays = 7,
  claimed = false,
  message = '',
  onClaim,
}: BirthdayRewardCardProps) {
  return (
    <div className="rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50 to-white p-4 shadow-card">
      <div className="mb-2 flex items-center gap-1.5">
        <Gift size={15} className="text-rose-500" />
        <h3 className="text-sm font-semibold text-slate-900">Happy Birthday! 🎂</h3>
        {!claimed ? (
          <span className="ml-auto rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-600">
            {expiresInDays}d left
          </span>
        ) : null}
      </div>

      <p className="text-xs leading-relaxed text-slate-600">
        Your gift: <span className="font-bold text-slate-800">{gift}</span>
      </p>
      {message ? <p className="mt-1 text-[11px] text-slate-500">{message}</p> : null}

      <button
        onClick={onClaim}
        disabled={claimed}
        className={`mt-2.5 w-full rounded-xl py-2 text-xs font-semibold transition ${
          claimed
            ? 'cursor-default bg-emerald-50 text-emerald-700'
            : 'bg-rose-500 text-white hover:bg-rose-400'
        }`}
      >
        {claimed ? 'Claimed ✓' : 'Claim your gift'}
      </button>
    </div>
  )
}
