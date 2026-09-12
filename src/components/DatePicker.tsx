import { AnimatePresence, motion } from 'framer-motion'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'

const WEEKDAY_KEYS = ['date.mon', 'date.tue', 'date.wed', 'date.thu', 'date.fri', 'date.sat', 'date.sun'] as const

function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function daysInMonthGrid(viewMonth: Date): (Date | null)[] {
  const year = viewMonth.getFullYear()
  const month = viewMonth.getMonth()
  const first = new Date(year, month, 1)
  // Monday-first grid: JS getDay() is 0=Sun..6=Sat, shift so Monday=0.
  const leadingBlanks = (first.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (Date | null)[] = Array(leadingBlanks).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  return cells
}

export function DatePicker({ value, onChange, label }: { value: string; onChange: (value: string) => void; label?: string }) {
  const { t, locale } = useLanguage()
  const [open, setOpen] = useState(false)
  const selected = value ? new Date(value + 'T00:00:00') : new Date()
  const [viewMonth, setViewMonth] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1))
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const today = new Date()
  const cells = daysInMonthGrid(viewMonth)

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
          {label}
        </p>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-left"
        style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}
      >
        <CalendarDays size={15} style={{ color: 'var(--text-muted)' }} />
        {selected.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.14 }}
            className="absolute z-30 mt-2 rounded-2xl p-3 shadow-xl"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', width: 280 }}
          >
            <div className="flex items-center justify-between mb-2 px-1">
              <button
                type="button"
                onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
              >
                <ChevronLeft size={16} />
              </button>
              <p className="text-sm font-semibold capitalize">
                {viewMonth.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
              </p>
              <button
                type="button"
                onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAY_KEYS.map((key) => (
                <div key={key} className="text-center text-[11px] font-medium py-1" style={{ color: 'var(--text-muted)' }}>
                  {t(key)}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, i) => {
                if (!day) return <div key={i} />
                const key = toKey(day)
                const isSelected = key === value
                const isToday = key === toKey(today)
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      onChange(key)
                      setOpen(false)
                    }}
                    className="aspect-square rounded-lg text-xs font-medium flex items-center justify-center"
                    style={
                      isSelected
                        ? { background: 'var(--accent)', color: 'var(--accent-text)' }
                        : isToday
                          ? { border: '1px solid var(--accent)' }
                          : {}
                    }
                  >
                    {day.getDate()}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
