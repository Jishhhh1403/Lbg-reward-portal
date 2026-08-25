import { useState } from 'react'
import { motion } from 'framer-motion'
import { HelpCircle, Check, Sparkles } from 'lucide-react'

interface MythStatement {
  myth?: string
  fact?: string
  rewardPoints?: number
}

interface MythOrFactCardProps {
  statements?: MythStatement[]
}

export default function MythOrFactCard({ statements = [] }: MythOrFactCardProps) {
  const [revealed, setRevealed] = useState<number[]>([])

  const reveal = (i: number) => {
    if (!revealed.includes(i)) setRevealed((prev) => [...prev, i])
  }

  return (
    <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-card">
      <div className="mb-2.5 flex items-center gap-1.5">
        <HelpCircle size={15} className="text-indigo-600" />
        <h3 className="text-sm font-semibold text-slate-900">Myth or Fact?</h3>
        <span className="ml-auto flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600">
          <Sparkles size={10} /> Tap to earn
        </span>
      </div>

      <div className="space-y-2">
        {statements.map((statement, i) => {
          const isRevealed = revealed.includes(i)
          return isRevealed ? (
            <motion.div
              key={`fact-${i}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3"
            >
              <p className="flex items-start gap-1.5 text-xs leading-relaxed text-slate-700">
                <Check size={13} className="mt-0.5 shrink-0 text-emerald-600" />
                <span>
                  <span className="font-semibold">Fact:</span> {statement.fact}
                </span>
              </p>
              {statement.rewardPoints ? (
                <p className="mt-1 pl-5 text-[10px] font-semibold text-emerald-600">+{statement.rewardPoints} pts earned</p>
              ) : null}
            </motion.div>
          ) : (
            <button
              key={`myth-${i}`}
              onClick={() => reveal(i)}
              className="w-full rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 text-left transition hover:border-indigo-200 hover:bg-indigo-50"
            >
              <p className="flex items-start gap-1.5 text-xs leading-relaxed text-slate-600">
                <HelpCircle size={13} className="mt-0.5 shrink-0 text-indigo-500" />
                <span>
                  <span className="font-semibold text-slate-800">Myth:</span> {statement.myth}
                </span>
              </p>
              <p className="mt-1 pl-5 text-[10px] font-medium text-indigo-500">Tap to reveal the fact →</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
