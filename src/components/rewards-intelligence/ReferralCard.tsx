import { UserPlus } from 'lucide-react'

interface ReferralCardProps {
  referralCode?: string
  friendBonus?: string
  myBonus?: string
  invitesAccepted?: number
  onRefer?: () => void
}

export default function ReferralCard({
  referralCode = '',
  friendBonus = '',
  myBonus = '',
  invitesAccepted = 0,
  onRefer,
}: ReferralCardProps) {
  return (
    <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-4 shadow-card">
      <div className="mb-2 flex items-center gap-1.5">
        <UserPlus size={15} className="text-violet-600" />
        <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">Invite & Both Earn</h3>
        {invitesAccepted > 0 ? (
          <span className="shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
            {invitesAccepted} joined
          </span>
        ) : null}
      </div>

      <p className="text-[11px] leading-relaxed text-slate-500">
        Friends get <span className="font-bold text-slate-800">{friendBonus}</span>, you get{' '}
        <span className="font-bold text-violet-700">{myBonus}</span> when they join.
      </p>

      {referralCode ? (
        <div className="mt-2 flex items-center gap-2 rounded-xl border border-dashed border-violet-300 bg-white px-3 py-2">
          <span className="min-w-0 flex-1 truncate font-mono text-sm font-extrabold tracking-wider text-slate-800">
            {referralCode}
          </span>
          <button
            onClick={onRefer}
            className="shrink-0 rounded-lg bg-brand-600 px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-brand-700"
          >
            Share code
          </button>
        </div>
      ) : null}
    </div>
  )
}
