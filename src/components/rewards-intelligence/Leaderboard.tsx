import { useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Crown, Medal } from 'lucide-react'

interface LeaderboardEntry {
  rank: number
  name: string
  points: number
  avatar: string
  isCurrentUser?: boolean
}

interface LeaderboardProps {
  title?: string
  entries?: LeaderboardEntry[]
  period?: 'weekly' | 'monthly' | 'allTime'
}

const rankIcon = (rank: number) => {
  if (rank === 1) return <Crown size={14} className="text-gold-500" />
  if (rank === 2) return <Medal size={14} className="text-slate-400" />
  if (rank === 3) return <Medal size={14} className="text-amber-600" />
  return <span className="text-xs font-semibold text-slate-400">{rank}</span>
}

export default function Leaderboard({
  title = 'Leaderboard',
  entries = [],
  period = 'weekly',
}: LeaderboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly' | 'allTime'>(period)
  const periods: Array<{ id: typeof period; label: string }> = [
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'allTime', label: 'All Time' },
  ]

  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-card">
      <div className="mb-3 flex items-center gap-1.5">
        <Trophy size={15} className="text-sky-600" />
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="mb-3 flex gap-1.5">
        {periods.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedPeriod(p.id)}
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
              selectedPeriod === p.id
                ? 'bg-brand-600/10 text-brand-700'
                : 'bg-slate-50 text-slate-400 hover:text-slate-600'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="space-y-1.5">
        {entries.map((entry, i) => (
          <motion.div
            key={`${entry.rank}-${entry.name}`}
            className={`flex items-center gap-2.5 rounded-xl p-2.5 transition-colors ${
              entry.isCurrentUser ? 'border border-brand-200 bg-brand-50' : 'bg-slate-50'
            }`}
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <div className="w-6 text-center">{rankIcon(entry.rank)}</div>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-[10px] font-bold text-white">
              {entry.avatar}
            </div>
            <p className={`flex-1 truncate text-xs font-medium ${entry.isCurrentUser ? 'text-brand-800' : 'text-slate-900'}`}>
              {entry.name} {entry.isCurrentUser && '(You)'}
            </p>
            <span className="text-xs font-bold tabular-nums text-slate-600">
              {entry.points.toLocaleString()}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
