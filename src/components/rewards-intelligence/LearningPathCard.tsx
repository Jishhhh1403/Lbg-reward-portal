import { GraduationCap, Play, Star } from 'lucide-react'

interface LearningPathCardProps {
  courseName?: string
  currentLesson?: number
  totalLessons?: number
  lessonPoints?: number
  onContinue?: () => void
}

export default function LearningPathCard({
  courseName = 'Rewards Academy',
  currentLesson = 1,
  totalLessons = 5,
  lessonPoints = 50,
  onContinue,
}: LearningPathCardProps) {
  const safeTotal = Math.max(totalLessons, 1)
  const progress = Math.min(Math.round((currentLesson / safeTotal) * 100), 100)

  return (
    <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-4 shadow-card">
      <div className="mb-2.5 flex items-center gap-1.5">
        <GraduationCap size={15} className="text-indigo-600" />
        <h3 className="text-sm font-semibold text-slate-900">{courseName}</h3>
        <span className="ml-auto flex items-center gap-0.5 text-[10px] font-semibold text-amber-600">
          <Star size={10} className="fill-amber-500 text-amber-500" /> +{lessonPoints} pts/lesson
        </span>
      </div>

      <div className="mb-2 flex items-center gap-1">
        {Array.from({ length: safeTotal }).map((_, i) => {
          const done = i < currentLesson
          return done ? (
            <span key={i} className="flex h-5 flex-1 items-center justify-center rounded-md bg-indigo-600 text-[9px] font-bold text-white">
              ✓
            </span>
          ) : (
            <span
              key={i}
              className={`h-5 flex-1 rounded-md border ${
                i === currentLesson ? 'border-indigo-400 bg-white' : 'border-slate-200 bg-slate-100'
              }`}
            />
          )
        })}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[11px] text-slate-500">
          Lesson {Math.min(currentLesson, safeTotal)} of {safeTotal} · {progress}% complete
        </p>
        <button
          onClick={onContinue}
          className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-indigo-500"
        >
          <Play size={11} /> Continue
        </button>
      </div>
    </div>
  )
}
