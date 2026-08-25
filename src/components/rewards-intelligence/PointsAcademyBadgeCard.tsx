import { Award, BookMarked } from 'lucide-react'

interface PointsAcademyBadgeCardProps {
  level?: string
  nextLevel?: string
  lessonsToNext?: number
}

const LEVEL_ORDER = ['Bronze', 'Silver', 'Gold', 'Platinum']

export default function PointsAcademyBadgeCard({
  level = 'Bronze',
  nextLevel = 'Silver',
  lessonsToNext = 2,
}: PointsAcademyBadgeCardProps) {
  const levelIndex = Math.max(
    LEVEL_ORDER.indexOf(level.split(' ')[0]),
    0,
  )

  return (
    <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-card">
      <div className="mb-3 flex items-center gap-1.5">
        <BookMarked size={15} className="text-indigo-600" />
        <h3 className="text-sm font-semibold text-slate-900">Points Academy</h3>
      </div>

      <div className="mb-3 flex items-center justify-between">
        {LEVEL_ORDER.map((lvl, i) => {
          const reached = i <= levelIndex
          return (
            <div key={lvl} className="flex flex-1 flex-col items-center">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm ${
                  reached ? 'border-indigo-600 bg-indigo-600' : 'border-slate-200 bg-slate-50'
                }`}
              >
                <Award size={15} className={reached ? 'text-white' : 'text-slate-300'} />
              </span>
              <span className={`mt-1 text-[9px] font-semibold ${reached ? 'text-indigo-700' : 'text-slate-400'}`}>
                {lvl}
              </span>
              {i < LEVEL_ORDER.length - 1 && (
                <span className={`absolute ${i < levelIndex ? 'text-indigo-300' : 'text-slate-200'}`} aria-hidden />
              )}
            </div>
          )
        })}
      </div>

      <p className="rounded-xl bg-indigo-50 px-3 py-2 text-[11px] leading-relaxed text-indigo-800">
        Complete <span className="font-bold">{lessonsToNext}</span> more{' '}
        {lessonsToNext === 1 ? 'lesson' : 'lessons'} to unlock your{' '}
        <span className="font-bold">{nextLevel}</span> learner badge.
      </p>
    </div>
  )
}
