import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { advisorApi } from '../api/client'
import { useLanguage } from '../i18n/LanguageContext'
import { openFelixWith } from '../lib/felixTrigger'

const RADIUS = 30
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

// A single 0-100 number is easiest to read as a ring, not a bar — and
// clicking it is the whole point (see openFelixWith), so it has to read
// as a button, not decoration.
export function FinancialScoreGauge() {
  const { t } = useLanguage()
  const { data: score } = useQuery({ queryKey: ['financialScore'], queryFn: advisorApi.score })

  if (!score) return null

  const progress = (score.total / 100) * CIRCUMFERENCE
  // Reuses the app's own income(green)/expense(red) tokens instead of a
  // one-off palette — a low score reads as "expense-red", a high one as
  // "income-green", consistent with how color already means that everywhere else.
  const ringColor = `color-mix(in srgb, var(--income) ${score.total}%, var(--expense))`

  const askFelix = () => {
    openFelixWith(t('profile.score.ask').replace('{score}', String(score.total)))
  }

  return (
    <motion.button
      onClick={askFelix}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-3 rounded-2xl p-3 text-left w-full"
      style={{ background: 'var(--surface-secondary)' }}
      aria-label={t('profile.score.title')}
    >
      <svg width="72" height="72" viewBox="0 0 72 72" className="shrink-0 -rotate-90">
        <circle cx="36" cy="36" r={RADIUS} fill="none" stroke="var(--border)" strokeWidth="6" />
        <motion.circle
          cx="36"
          cy="36"
          r={RADIUS}
          fill="none"
          stroke={ringColor}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          initial={{ strokeDashoffset: CIRCUMFERENCE }}
          animate={{ strokeDashoffset: CIRCUMFERENCE - progress }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
        <text
          x="36"
          y="36"
          textAnchor="middle"
          dominantBaseline="central"
          transform="rotate(90 36 36)"
          className="font-bold"
          style={{ fill: 'var(--text)', fontSize: 20 }}
        >
          {score.total}
        </text>
      </svg>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{t('profile.score.title')}</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {t('profile.score.hint')}
        </p>
      </div>
    </motion.button>
  )
}
