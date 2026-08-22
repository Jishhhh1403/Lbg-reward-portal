import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'

interface AddGoalCardProps {
  title?: string
  subtitle?: string
  onAdd?: () => void
}

export default function AddGoalCard({
  title = 'Add a New Goal',
  subtitle = 'Save toward what matters to you',
  onAdd,
}: AddGoalCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onAdd}
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -2 }}
      className="flex h-full min-h-[148px] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-300/70 bg-white p-4 text-center shadow-sm transition-shadow hover:border-brand-400 hover:shadow-card"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 shadow-sm">
        <Plus size={16} className="text-white" />
      </span>
      <span className="text-xs font-semibold text-slate-900">{title}</span>
      {subtitle && <span className="text-[10px] leading-snug text-slate-400">{subtitle}</span>}
    </motion.button>
  )
}
