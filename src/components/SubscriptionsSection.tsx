import { useQuery } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { advisorApi } from '../api/client'
import { useAmountVisibility } from '../context/AmountVisibilityContext'
import { useLanguage } from '../i18n/LanguageContext'

// Groups same-note expenses that recur roughly monthly at a roughly
// stable amount — surfaces subscriptions the user may have forgotten
// about, since nothing else in the app aggregates by "recurring merchant"
// specifically. Only detects charges imported with a note (Monobank
// always sets one; manual entries need one too).
export function SubscriptionsSection() {
  const { t } = useLanguage()
  const { mask } = useAmountVisibility()
  const { data: subscriptions } = useQuery({ queryKey: ['subscriptions'], queryFn: advisorApi.subscriptions })

  if (!subscriptions || subscriptions.length === 0) return null

  const totalByCurrency = subscriptions.reduce<Record<string, number>>((acc, s) => {
    acc[s.currency] = (acc[s.currency] ?? 0) + s.averageAmount
    return acc
  }, {})

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
          {t('subs.title')}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {Object.entries(totalByCurrency)
            .map(([currency, total]) => mask(`${total.toFixed(0)} ${currency}`))
            .join(' + ')}
          {t('subs.perMonth')}
        </p>
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface-secondary)' }}>
        {subscriptions.map((s, i) => (
          <div key={s.description} className="flex items-center gap-3 px-4 py-2.5" style={i > 0 ? { borderTop: '1px solid var(--border)' } : {}}>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'color-mix(in srgb, var(--accent) 16%, transparent)', color: 'var(--accent)' }}
            >
              <RefreshCw size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{s.description}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {t('subs.occurrences').replace('{n}', String(s.occurrences))}
              </p>
            </div>
            <p className="text-sm font-semibold">{mask(`${s.averageAmount.toFixed(0)} ${s.currency}`)}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
