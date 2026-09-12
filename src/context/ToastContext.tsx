import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, XCircle } from 'lucide-react'
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

type ToastKind = 'success' | 'error'
interface ToastItem {
  id: number
  message: string
  kind: ToastKind
}

interface ToastState {
  toast: (message: string, kind?: ToastKind) => void
}

const Ctx = createContext<ToastState | null>(null)

const AUTO_DISMISS_MS = 3200

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(0)

  const toast = useCallback((message: string, kind: ToastKind = 'success') => {
    const id = nextId.current++
    setItems((prev) => [...prev, { id, message, kind }])
    setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), AUTO_DISMISS_MS)
  }, [])

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      {/* Bottom-center on mobile (clear of the tab bar), bottom-right on
          desktop — a fixed stack outside document flow, so it never
          affects page layout. */}
      <div className="fixed z-50 bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 md:left-auto md:right-6 md:translate-x-0 flex flex-col items-center md:items-end gap-2 pointer-events-none px-4 md:px-0">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              className="pointer-events-auto flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium shadow-lg"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            >
              {item.kind === 'success' ? (
                <CheckCircle2 size={16} style={{ color: 'var(--income)' }} />
              ) : (
                <XCircle size={16} style={{ color: 'var(--expense)' }} />
              )}
              {item.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx.toast
}
