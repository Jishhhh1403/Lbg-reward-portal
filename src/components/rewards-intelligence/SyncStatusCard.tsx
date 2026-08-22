import { motion } from 'framer-motion'
import { CheckCircle2, RefreshCw, AlertCircle, Loader2, ChevronRight } from 'lucide-react'

interface SyncStatusCardProps {
  status?: 'synced' | 'syncing' | 'error'
  title?: string
  lastSyncedAt?: string
  message?: string
  ctaText?: string
  onRefresh?: () => void
}

const statusConfig = {
  synced: {
    icon: CheckCircle2,
    iconClass: 'text-brand-600',
    badgeClass: 'bg-brand-50',
    titleClass: 'text-brand-800',
    spin: false,
  },
  syncing: {
    icon: Loader2,
    iconClass: 'text-brand-600',
    badgeClass: 'bg-brand-50',
    titleClass: 'text-brand-800',
    spin: true,
  },
  error: {
    icon: AlertCircle,
    iconClass: 'text-red-500',
    badgeClass: 'bg-red-50',
    titleClass: 'text-red-600',
    spin: false,
  },
} as const

export default function SyncStatusCard({
  status = 'synced',
  title = 'All your points are up to date',
  lastSyncedAt = '',
  message = 'All brand points have been successfully updated.',
  ctaText = 'Refresh',
  onRefresh,
}: SyncStatusCardProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-brand-100 bg-white p-4 shadow-card"
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${config.badgeClass}`}
        >
          <Icon size={16} className={`${config.iconClass} ${config.spin ? 'animate-spin' : ''}`} />
        </span>
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-semibold ${config.titleClass}`}>{title}</p>
          {lastSyncedAt && <p className="mt-0.5 text-[11px] text-slate-400">Last synced, {lastSyncedAt}</p>}
          {message && <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{message}</p>}
        </div>
      </div>
      <button
        onClick={onRefresh}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50"
      >
        <RefreshCw size={13} />
        {ctaText} <ChevronRight size={13} />
      </button>
    </motion.div>
  )
}
