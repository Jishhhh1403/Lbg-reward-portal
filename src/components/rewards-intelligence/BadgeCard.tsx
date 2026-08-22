import { motion } from 'framer-motion'
import { Award, Flame, Trophy, Star, Brain, Crown, type LucideIcon } from 'lucide-react'

interface Badge {
  name: string
  icon: string
  earned: boolean
}

interface BadgeCardProps {
  title?: string
  badges?: Badge[]
  totalEarned?: number
  totalAvailable?: number
}

const iconMap: Record<string, LucideIcon> = {
  flame: Flame,
  trophy: Trophy,
  star: Star,
  brain: Brain,
  crown: Crown,
}

export default function BadgeCard({
  title = 'Your Badges',
  badges = [],
  totalEarned = 0,
  totalAvailable = 0,
}: BadgeCardProps) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Award size={15} className="text-gold-600" />
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        </div>
        <span className="text-[11px] font-semibold tabular-nums text-slate-400">
          {totalEarned}/{totalAvailable}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {badges.map((badge, i) => {
          const Icon = iconMap[badge.icon] ?? Award
          return (
            <motion.div
              key={i}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: badge.earned ? 1 : 0.45 }}
              transition={{ delay: i * 0.08 }}
              className={`flex flex-col items-center rounded-xl p-2.5 ${
                badge.earned ? 'bg-gold-50 ring-1 ring-gold-200' : 'bg-slate-50 ring-1 ring-slate-100'
              }`}
            >
              <div
                className={`mb-1.5 flex h-9 w-9 items-center justify-center rounded-full ${
                  badge.earned ? 'bg-gold-400/25 text-gold-600' : 'text-slate-300'
                }`}
              >
                <Icon size={16} />
              </div>
              <p className={`text-center text-[10px] leading-tight ${badge.earned ? 'font-semibold text-slate-900' : 'text-slate-400'}`}>
                {badge.name}
              </p>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
