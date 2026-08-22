import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'

interface CategoryTileProps {
  label: string
  count: number
  icon: React.ReactNode
  delay?: number
}

export default function CategoryTile({ label, count, icon, delay = 0 }: CategoryTileProps) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      className="flex flex-col items-start rounded-2xl bg-white p-3 text-left shadow-card"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">{icon}</span>
      <span className="mt-2 block text-xs font-semibold capitalize text-slate-900">{label}</span>
      <span className="mt-0.5 flex w-full items-center justify-between text-[11px] text-slate-400">
        {count} brands
        <ChevronRight size={12} />
      </span>
    </motion.button>
  )
}
