import { useQuery } from '@tanstack/react-query'
import { advisorApi } from '../api/client'
import { useAmountVisibility } from '../context/AmountVisibilityContext'
import { useAuth } from '../context/AppProviders'
import { translateCategoryName } from '../i18n/defaultCategories'
import { useLanguage } from '../i18n/LanguageContext'
import { formatCurrency } from '../lib/currency'

// Compares this month's spend-so-far against the category's typical
// monthly total, adjusted for how much of the month has elapsed — a
// category at "85% of typical" reads very differently on day 10 than on
// day 28, which a plain running total can't tell you.
export function BudgetPaceSection() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const { mask } = useAmountVisibility()
  const { data: paces } = useQuery({ queryKey: ['pace'], queryFn: advisorApi.pace })

  if (!paces || paces.length === 0) return null
  const baseCurrency = user?.baseCurrency ?? 'UAH'
  const overPace = paces.filter((p) => p.paceRatio > 1.15).slice(0, 5)
  if (overPace.length === 0) return null

  return (
    <section>
      <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>
        {t('pace.title')}
      </p>
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface-secondary)' }}>
        {overPace.map((p, i) => {
          const pct = Math.min(200, Math.round(p.paceRatio * 100))
          return (
            <div key={p.categoryId} className="px-4 py-2.5" style={i > 0 ? { borderTop: '1px solid var(--border)' } : {}}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium">{translateCategoryName(p.categoryName, t)}</p>
                <p className="text-xs font-semibold" style={{ color: 'var(--expense)' }}>
                  {t('pace.ofPace').replace('{pct}', String(pct))}
                </p>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ background: 'var(--border)' }}>
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: 'var(--expense)' }} />
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {mask(formatCurrency(p.spentSoFar, baseCurrency))} / {t('pace.typical')} {mask(formatCurrency(p.typicalMonthly, baseCurrency))}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
