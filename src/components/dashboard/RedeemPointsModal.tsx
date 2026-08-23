import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Coins, ExternalLink, Search, X } from 'lucide-react'
import type { PointsProvider } from '../../types/rewards'
import BottomSheetModal from '../ui/BottomSheetModal'

interface RedeemPointsModalProps {
  isOpen: boolean
  totalPoints: number
  pointsData: PointsProvider[]
  customerName: string
  onClose: () => void
}

interface CatalogItem {
  id: string
  name: string
  category: string
  logoText: string
  color: string
  yourPoints: number
  logoUrl?: string
}

export default function RedeemPointsModal({
  isOpen,
  totalPoints,
  pointsData,
  customerName,
  onClose,
}: RedeemPointsModalProps) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [redirectTarget, setRedirectTarget] = useState<CatalogItem | null>(null)

  const catalog = useMemo<CatalogItem[]>(
    () =>
      pointsData.map((p) => ({
        id: p.brandId,
        name: p.brandName,
        category: p.category,
        logoText: p.logoText,
        color: p.color,
        yourPoints: p.points,
        logoUrl: p.logoUrl,
      })),
    [pointsData],
  )

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(catalog.map((c) => c.category)))],
    [catalog],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return catalog.filter(
      (c) =>
        (category === 'All' || c.category === category) &&
        (!q || c.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)),
    )
  }, [catalog, category, query])

  return (
    <BottomSheetModal isOpen={isOpen} onClose={onClose} title="Redeem coins">
      <p className="mb-4 text-sm leading-relaxed text-slate-500">
        Hi {customerName.split(/\s+/)[0]}, browse partner brands and jump over to redeem. You have{' '}
        <span className="font-bold text-brand-700">{totalPoints.toLocaleString('en-GB')}</span> brand points and LBG
        coins combined.
      </p>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search brands…"
          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-9 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/25"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Category filters */}
      <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
              category === c
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Brand list */}
      <AnimatePresence mode="popLayout">
        {filtered.length === 0 ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-10 text-center text-sm text-slate-400"
          >
            No brands match &ldquo;{query}&rdquo;.
          </motion.p>
        ) : (
          <ul className="mt-3 space-y-2.5">
            {filtered.map((item, i) => (
              <motion.li
                key={item.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ delay: Math.min(i * 0.03, 0.25) }}
              >
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setRedirectTarget(item)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 text-left shadow-card transition hover:border-brand-300"
                >
                  {item.logoUrl ? (
                    <img
                      src={item.logoUrl}
                      alt={item.name}
                      className="h-11 w-11 shrink-0 rounded-xl border border-slate-200 bg-white object-contain p-1"
                    />
                  ) : (
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                      style={{ backgroundColor: item.color }}
                    >
                      {item.logoText}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-900">{item.name}</span>
                    <span className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                      <Coins size={12} className="text-gold-500" />
                      {item.yourPoints.toLocaleString('en-GB')} pts available · min redeem{' '}
                      {(item.yourPoints >= 500 ? 500 : item.yourPoints).toLocaleString('en-GB')}
                    </span>
                  </span>
                  <ArrowRight size={16} className="shrink-0 text-slate-300" />
                </motion.button>
              </motion.li>
            ))}
          </ul>
        )}
      </AnimatePresence>

      {/* Redirect confirmation dialog */}
      <AnimatePresence>
        {redirectTarget && (
          <motion.div
            className="absolute inset-0 z-30 flex items-end justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button aria-label="Cancel" className="absolute inset-0 bg-slate-950/45" onClick={() => setRedirectTarget(null)} />
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 360, damping: 32 }}
              className="relative w-full rounded-t-3xl bg-white p-6 pb-8 shadow-sheet"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <ExternalLink size={24} />
              </div>
              <h3 className="text-center text-lg font-bold text-slate-900">Leave for {redirectTarget.name}?</h3>
              <p className="mx-auto mt-1.5 max-w-xs text-center text-sm leading-relaxed text-slate-500">
                You&apos;ll continue the redemption in the partner app or website, then your coins update automatically
                when you return.
              </p>
              <div className="mt-5 space-y-2">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() =>
                    window.location.assign(`https://www.${redirectTarget.name.toLowerCase().replace(/[^a-z]/g, '')}.com`)
                  }
                  className="w-full rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white shadow-card transition hover:bg-brand-700"
                >
                  Continue to {redirectTarget.name}
                </motion.button>
                <button
                  onClick={() => setRedirectTarget(null)}
                  className="w-full rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Stay here
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </BottomSheetModal>
  )
}
