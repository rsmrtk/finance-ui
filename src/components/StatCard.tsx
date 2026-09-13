import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

type Tone = 'default' | 'accent' | 'income' | 'expense'

const TONE_STYLE: Record<Tone, React.CSSProperties> = {
  default: { background: 'var(--surface-secondary)' },
  accent: {
    background: 'linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 70%, transparent))',
    color: 'var(--accent-text)',
  },
  income: { background: 'color-mix(in srgb, var(--income) 14%, var(--surface-secondary))' },
  expense: { background: 'color-mix(in srgb, var(--expense) 14%, var(--surface-secondary))' },
}

// A single KPI tile for a grid-template-columns: repeat(auto-fill,
// minmax(...)) strip — the column count grows with the viewport instead
// of the whole page sitting in a fixed narrow column, so a wide screen
// fills up with more cards rather than empty margin (the pattern most
// dashboard SaaS products — Copilot Money, Monarch — use for KPI rows).
export function StatCard({
  label,
  value,
  icon,
  tone = 'default',
  delay = 0,
}: {
  label: string
  value: ReactNode
  icon?: ReactNode
  tone?: Tone
  delay?: number
}) {
  const isAccent = tone === 'accent'
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      className="rounded-2xl p-4 flex flex-col gap-2"
      style={TONE_STYLE[tone]}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ opacity: isAccent ? 0.8 : 1, color: isAccent ? undefined : 'var(--text-muted)' }}>
          {label}
        </p>
        {icon && (
          <span style={{ opacity: isAccent ? 0.85 : 0.7 }}>{icon}</span>
        )}
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </motion.div>
  )
}
