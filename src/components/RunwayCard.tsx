import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { advisorApi } from '../api/client'
import { useAuth } from '../context/AppProviders'
import { useAmountVisibility } from '../context/AmountVisibilityContext'
import { useLanguage } from '../i18n/LanguageContext'
import { formatCurrency } from '../lib/currency'

// "Will I make it to payday" — cross-checks spend pace against the
// detected payday pattern instead of just showing a running total, which
// is the thing most budget apps leave the user to work out themselves.
export function RunwayCard() {
  const { t, locale } = useLanguage()
  const { user } = useAuth()
  const { mask } = useAmountVisibility()
  const { data: runway } = useQuery({ queryKey: ['runway'], queryFn: advisorApi.runway })

  if (!runway) return null
  const baseCurrency = user?.baseCurrency ?? 'UAH'

  // Nothing meaningful to say yet — no burn rate and no payday pattern.
  if (runway.dailyBurnRate <= 0 && !runway.nextPaydayEstimate) return null

  const warning = !runway.willMakeIt

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4 flex items-start gap-3"
      style={{
        background: warning ? 'color-mix(in srgb, var(--expense) 12%, var(--surface-secondary))' : 'var(--surface-secondary)',
      }}
    >
      {warning ? (
        <AlertTriangle size={20} className="shrink-0 mt-0.5" style={{ color: 'var(--expense)' }} />
      ) : (
        <CheckCircle2 size={20} className="shrink-0 mt-0.5" style={{ color: 'var(--income)' }} />
      )}
      <div className="min-w-0">
        <p className="text-sm font-semibold">{warning ? t('runway.warning.title') : t('runway.ok.title')}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {warning && runway.projectedZeroDate
            ? t('runway.warning.hint')
                .replace('{date}', new Date(runway.projectedZeroDate).toLocaleDateString(locale, { day: 'numeric', month: 'long' }))
                .replace('{payday}', runway.nextPaydayEstimate ? new Date(runway.nextPaydayEstimate).toLocaleDateString(locale, { day: 'numeric', month: 'long' }) : '')
            : runway.nextPaydayEstimate
              ? t('runway.ok.hint').replace(
                  '{payday}',
                  new Date(runway.nextPaydayEstimate).toLocaleDateString(locale, { day: 'numeric', month: 'long' }),
                )
              : t('runway.ok.hintNoPayday')}
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          {t('runway.burnRate').replace('{amount}', mask(formatCurrency(runway.dailyBurnRate, baseCurrency)))}
        </p>
      </div>
    </motion.div>
  )
}
