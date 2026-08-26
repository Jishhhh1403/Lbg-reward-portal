import { motion } from 'framer-motion'
import { MessageSquareQuote } from 'lucide-react'

interface ComprehensionFeedbackCardProps {
  title?: string
  question?: string
  yourAnswer?: string
  correctAnswer?: string
  feedback?: string
}

export default function ComprehensionFeedbackCard({
  title = 'How did you do?',
  question = '',
  yourAnswer = '',
  correctAnswer = '',
  feedback = '',
}: ComprehensionFeedbackCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full rounded-2xl border border-brand-200/70 bg-white p-4 shadow-card"
    >
      <div className="mb-1 flex items-center gap-1.5">
        <MessageSquareQuote size={15} className="text-brand-700" />
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      {question && <p className="mb-2.5 text-[11px] font-semibold leading-snug text-slate-700">{question}</p>}
      <div className="space-y-1.5">
        {yourAnswer && (
          <div className="rounded-xl bg-slate-50 p-2.5 ring-1 ring-slate-100">
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Your answer</span>
            <span className="block text-[11px] text-slate-700">{yourAnswer}</span>
          </div>
        )}
        {correctAnswer && (
          <div className="rounded-xl bg-emerald-50/80 p-2.5 ring-1 ring-emerald-100">
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-emerald-500">Key point</span>
            <span className="block text-[11px] text-slate-700">{correctAnswer}</span>
          </div>
        )}
      </div>
      {feedback && <p className="mt-2.5 text-[10px] leading-relaxed text-slate-500">{feedback}</p>}
    </motion.div>
  )
}
