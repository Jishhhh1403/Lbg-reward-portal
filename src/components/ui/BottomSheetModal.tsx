import { type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

interface BottomSheetModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export default function BottomSheetModal({ isOpen, onClose, title, children }: BottomSheetModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="absolute inset-0 z-50 flex flex-col justify-end"
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <motion.button
            aria-label="Close modal"
            className="absolute inset-0 bg-slate-950/45"
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            className="relative flex max-h-[88%] flex-col overflow-hidden rounded-t-3xl bg-white shadow-sheet"
            variants={{
              hidden: { y: '100%' },
              visible: { y: 0 },
            }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose()
            }}
          >
            <div className="flex cursor-grab items-center justify-center pt-3 active:cursor-grabbing">
              <div className="h-1.5 w-10 rounded-full bg-slate-300" />
            </div>
            {title && (
              <div className="flex items-center justify-between px-5 pt-3 pb-1">
                <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                >
                  <X size={18} />
                </button>
              </div>
            )}
            <div className="no-scrollbar overflow-y-auto px-5 pb-8">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
