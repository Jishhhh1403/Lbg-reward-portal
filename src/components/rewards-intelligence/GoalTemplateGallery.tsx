import { motion } from 'framer-motion'
import { Plane, Laptop, ShieldCheck, Heart, Home, Car, Plus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface GoalTemplate {
  name?: string
  icon?: string
  targetPoints?: number
  monthlySuggestion?: number
}

interface GoalTemplateGalleryProps {
  templates?: GoalTemplate[]
  onCreate?: () => void
}

const ICONS: Record<string, LucideIcon> = {
  plane: Plane,
  laptop: Laptop,
  shield: ShieldCheck,
  heart: Heart,
  home: Home,
  car: Car,
}

const TINTS = ['bg-sky-50 text-sky-600', 'bg-violet-50 text-violet-600', 'bg-emerald-50 text-emerald-600', 'bg-rose-50 text-rose-600', 'bg-amber-50 text-amber-600', 'bg-indigo-50 text-indigo-600']

export default function GoalTemplateGallery({ templates = [], onCreate }: GoalTemplateGalleryProps) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-card">
      <div className="mb-2.5 flex items-center gap-1.5">
        <Plus size={15} className="text-emerald-600" />
        <h3 className="text-sm font-semibold text-slate-900">Start a Goal in One Tap</h3>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {templates.map((template, i) => {
          const Icon = ICONS[template.icon ?? ''] ?? Plus
          return (
            <motion.button
              key={i}
              whileTap={{ scale: 0.97 }}
              onClick={onCreate}
              className={`rounded-xl border border-slate-100 p-2.5 text-left transition hover:border-emerald-300 hover:bg-emerald-50/40 ${TINTS[i % TINTS.length].split(' ')[0]}`}
            >
              <span className={`mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg ${TINTS[i % TINTS.length]}`}>
                <Icon size={14} />
              </span>
              <p className="text-[11px] font-bold leading-tight text-slate-800">{template.name}</p>
              <p className="mt-0.5 text-[9.5px] leading-tight text-slate-400">
                {(template.targetPoints ?? 0).toLocaleString()} pts · ~{(template.monthlySuggestion ?? 0).toLocaleString()}/mo
              </p>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
