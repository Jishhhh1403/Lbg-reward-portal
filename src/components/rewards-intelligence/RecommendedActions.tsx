import { motion } from 'framer-motion'
import { Target, Users, ShoppingBag, ArrowRight, type LucideIcon } from 'lucide-react'

interface RecommendedAction {
  label: string
  points: number
  icon: string
}

interface RecommendedActionsProps {
  title?: string
  actions?: RecommendedAction[]
  onAction?: (action: RecommendedAction) => void
}

const iconMap: Record<string, LucideIcon> = {
  target: Target,
  users: Users,
  'shopping-bag': ShoppingBag,
}

export default function RecommendedActions({
  title = 'Recommended Actions',
  actions = [],
  onAction,
}: RecommendedActionsProps) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-card">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">{title}</h3>
      <div className="space-y-2">
        {actions.map((action, i) => {
          const Icon = iconMap[action.icon] ?? Target
          return (
            <motion.div
              key={i}
              onClick={() => onAction?.(action)}
              className="flex cursor-pointer items-center justify-between rounded-xl bg-slate-50 p-3 transition-colors hover:bg-brand-50"
              whileHover={{ x: 3 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600/10">
                  <Icon size={15} className="text-brand-700" />
                </span>
                <span className="text-xs font-medium text-slate-900">{action.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-emerald-700">+{action.points.toLocaleString()} pts</span>
                <ArrowRight size={13} className="text-slate-300" />
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
