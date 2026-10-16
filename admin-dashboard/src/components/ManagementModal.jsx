import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

export default function ManagementModal({ open, title, eyebrow, onClose, children, wide = false }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-100 flex items-center justify-center bg-primary-950/55 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose()
          }}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="management-modal-title"
            dir="rtl"
            className={`max-h-[92vh] w-full overflow-hidden rounded-2xl border border-white/70 bg-white shadow-[0_28px_90px_rgba(12,37,31,0.28)] ${wide ? 'max-w-3xl' : 'max-w-lg'}`}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-7">
              <div>
                {eyebrow && <p className="mb-1 text-xs font-bold text-forest">{eyebrow}</p>}
                <h2 id="management-modal-title" className="text-xl font-bold text-ink">{title}</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="إغلاق النافذة"
                className="grid size-9 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-canvas hover:text-ink"
              >
                <X size={19} />
              </button>
            </div>
            <div className="max-h-[calc(92vh-76px)] overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
              {children}
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )
}