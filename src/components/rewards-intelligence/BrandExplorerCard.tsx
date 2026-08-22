import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import {
  Landmark,
  Shield,
  Car,
  ShoppingBag,
  ShoppingBasket,
  Plane,
  Coffee,
  UtensilsCrossed,
  HeartPulse,
  Film,
  Dumbbell,
  Zap,
  ChevronRight,
  LayoutGrid,
} from 'lucide-react'

interface BrandCategory {
  label: string
  count: number
  icon: string
}

interface BrandExplorerCardProps {
  title?: string
  actionLabel?: string
  categories?: BrandCategory[]
  onExplore?: (category?: string) => void
}

const iconMap: Record<string, ReactNode> = {
  landmark: <Landmark size={17} className="text-brand-700" />,
  shield: <Shield size={17} className="text-brand-700" />,
  car: <Car size={17} className="text-brand-700" />,
  'shopping-bag': <ShoppingBag size={17} className="text-brand-700" />,
  basket: <ShoppingBasket size={17} className="text-brand-700" />,
  plane: <Plane size={17} className="text-brand-700" />,
  coffee: <Coffee size={17} className="text-brand-700" />,
  utensils: <UtensilsCrossed size={17} className="text-brand-700" />,
  heart: <HeartPulse size={17} className="text-brand-700" />,
  film: <Film size={17} className="text-brand-700" />,
  dumbbell: <Dumbbell size={17} className="text-brand-700" />,
  zap: <Zap size={17} className="text-brand-700" />,
}

export default function BrandExplorerCard({
  title = 'Explore Eligible Brands',
  actionLabel = 'View all',
  categories = [],
  onExplore,
}: BrandExplorerCardProps) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <LayoutGrid size={15} className="text-brand-700" />
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        </div>
        <button
          onClick={() => onExplore?.()}
          className="flex items-center text-xs font-semibold text-brand-700 transition-colors hover:text-brand-500"
        >
          {actionLabel} <ChevronRight size={13} />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {categories.map((category) => (
          <motion.button
            key={category.label}
            onClick={() => onExplore?.(category.label)}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 p-2.5 transition-colors hover:bg-brand-50"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
              {iconMap[category.icon] ?? <LayoutGrid size={17} className="text-brand-700" />}
            </span>
            <p className="max-w-full truncate text-[11px] font-medium text-slate-800">{category.label}</p>
            <p className="text-[10px] text-slate-400">{category.count} brands</p>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
