import { useState } from 'react'
import { motion } from 'framer-motion'
import { Brain, Clock, CheckCircle2, XCircle } from 'lucide-react'

interface QuizCardProps {
  title?: string
  question?: string
  options?: string[]
  reward?: string
  timeLimit?: number
}

export default function QuizCard({
  title = 'Daily Quiz',
  question = '',
  options = [],
  reward = '+100 LBG coins',
  timeLimit = 30,
}: QuizCardProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const correctIndex = 1

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-gold-200/80 bg-gradient-to-br from-gold-50 via-white to-brand-50 p-4 shadow-card"
    >
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Brain size={15} className="text-gold-600" />
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-medium text-gold-700">
          <Clock size={11} />
          <span>{timeLimit}s</span>
        </div>
      </div>
      <p className="mb-3 text-xs font-medium leading-snug text-slate-700">{question}</p>
      <div className="mb-3 space-y-1.5">
        {options.map((option, i) => (
          <motion.button
            key={i}
            onClick={() => !submitted && setSelected(i)}
            className={`flex w-full items-center gap-2.5 rounded-xl p-2.5 text-left text-xs transition-all ${
              submitted
                ? i === correctIndex
                  ? 'bg-brand-50 font-medium text-brand-800 ring-1 ring-brand-300'
                  : i === selected
                    ? 'bg-red-50 text-red-600 ring-1 ring-red-200'
                    : 'bg-white text-slate-400'
                : selected === i
                  ? 'bg-brand-50 font-medium text-brand-800 ring-1 ring-brand-300'
                  : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50'
            }`}
            whileHover={!submitted ? { scale: 1.01 } : {}}
            whileTap={!submitted ? { scale: 0.99 } : {}}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                selected === i && !submitted ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {String.fromCharCode(65 + i)}
            </span>
            <span className="flex-1">{option}</span>
            {submitted && i === correctIndex && <CheckCircle2 size={14} className="shrink-0 text-brand-600" />}
            {submitted && i === selected && i !== correctIndex && (
              <XCircle size={14} className="shrink-0 text-red-500" />
            )}
          </motion.button>
        ))}
      </div>
      {!submitted ? (
        <motion.button
          onClick={() => selected !== null && setSubmitted(true)}
          disabled={selected === null}
          className={`w-full rounded-xl py-2.5 text-sm font-semibold transition ${
            selected !== null
              ? 'bg-brand-600 text-white shadow-sm hover:bg-brand-700'
              : 'cursor-not-allowed bg-slate-100 text-slate-400'
          }`}
          whileHover={selected !== null ? { scale: 1.01 } : {}}
          whileTap={selected !== null ? { scale: 0.98 } : {}}
        >
          Submit Answer
        </motion.button>
      ) : (
        <div className="py-1.5 text-center">
          <p className={`text-xs font-bold ${selected === correctIndex ? 'text-brand-700' : 'text-red-500'}`}>
            {selected === correctIndex ? `Correct! You earned ${reward}` : 'Not quite right — try again tomorrow'}
          </p>
        </div>
      )}
    </motion.div>
  )
}
