import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown } from 'lucide-react'
import type { BrandOption } from '../../types/rewards'

interface BrandDropdownProps {
  label: string
  placeholder: string
  options: BrandOption[]
  selectedId: string | null
  onChange: (brand: BrandOption) => void
}

export default function BrandDropdown({ label, placeholder, options, selectedId, onChange }: BrandDropdownProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const selected = options.find((o) => o.id === selectedId) ?? null

  useEffect(() => {
    if (!open) return
    const handleClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center gap-3 rounded-xl border bg-white px-3.5 py-3 text-left shadow-sm transition ${
          open ? 'border-brand-600 ring-2 ring-brand-600/25' : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        {selected ? (
          <>
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
              style={{ backgroundColor: selected.color }}
            >
              {selected.logoText}
            </span>
            <span className="flex-1">
              <span className="block text-sm font-semibold text-slate-900">{selected.name}</span>
              <span className="block text-xs text-slate-500">{selected.category}</span>
            </span>
          </>
        ) : (
          <span className="flex-1 text-sm text-slate-400">{placeholder}</span>
        )}
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={18} className="text-slate-500" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="absolute z-20 mt-2 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-card"
          >
            {options.length === 0 && (
              <li className="px-3 py-2.5 text-sm text-slate-400">No brands found</li>
            )}
            {options.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option)
                    setOpen(false)
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition hover:bg-brand-50"
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white"
                    style={{ backgroundColor: option.color }}
                  >
                    {option.logoText}
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-medium text-slate-900">{option.name}</span>
                    <span className="block text-xs text-slate-500">{option.category}</span>
                  </span>
                  {selectedId === option.id && <Check size={16} className="text-brand-600" />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
