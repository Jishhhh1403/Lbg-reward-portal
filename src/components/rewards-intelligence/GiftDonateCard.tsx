import { Heart, Users, Gift } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface GiftOption {
  recipient?: string
  minPoints?: number
  icon?: string
}

interface GiftDonateCardProps {
  options?: GiftOption[]
  ctaLabel?: string
  onAction?: () => void
}

const ICONS: Record<string, LucideIcon> = {
  heart: Heart,
  users: Users,
  gift: Gift,
}

export default function GiftDonateCard({ options = [], ctaLabel = 'Send', onAction }: GiftDonateCardProps) {
  return (
    <div className="rounded-2xl border border-rose-100 bg-white p-4 shadow-card">
      <div className="mb-2.5 flex items-center gap-1.5">
        <Gift size={15} className="text-rose-500" />
        <h3 className="text-sm font-semibold text-slate-900">Share Your Points</h3>
      </div>

      <div className="space-y-1.5">
        {options.map((option, i) => {
          const Icon = ICONS[option.icon ?? ''] ?? Gift
          return (
            <button
              key={i}
              onClick={onAction}
              className="flex w-full items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2 text-left transition hover:bg-rose-50"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
                <Icon size={14} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold text-slate-800">{option.recipient}</span>
                <span className="block text-[10px] text-slate-400">from {(option.minPoints ?? 0).toLocaleString()} pts</span>
              </span>
              <span className="shrink-0 text-[11px] font-semibold text-brand-700">{ctaLabel} →</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
