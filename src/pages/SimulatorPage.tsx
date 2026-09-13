import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { advisorApi, categoriesApi, ratesApi, transactionsApi } from '../api/client'
import { CategoryGlyph } from '../components/CategoryGlyph'
import { useAuth } from '../context/AppProviders'
import { useHistoricalRates } from '../hooks/useHistoricalRates'
import { translateCategoryName } from '../i18n/defaultCategories'
import { useLanguage } from '../i18n/LanguageContext'
import { categoryTotals, dateKey } from '../lib/analytics'
import { convert, formatCurrency } from '../lib/currency'
import { simulate } from '../lib/whatif'

// A hypothetical-scenario sandbox: "what if I spent 20% less on X" or "what
// if I earned more" — recomputed instantly client-side against the same
// weights the real financial score uses (lib/whatif.ts), so it's a real
// preview of the score's reaction, not a toy estimate.
export function SimulatorPage() {
  const { t, locale } = useLanguage()
  const { user } = useAuth()
  const baseCurrency = user?.baseCurrency ?? 'UAH'

  const { data: transactions = [] } = useQuery({ queryKey: ['transactions'], queryFn: transactionsApi.list })
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list })
  const { data: rates = [] } = useQuery({ queryKey: ['rates'], queryFn: ratesApi.list })
  const { data: score } = useQuery({ queryKey: ['financialScore'], queryFn: advisorApi.score })
  const history = useHistoricalRates(transactions)

  const [adjustments, setAdjustments] = useState<Record<string, number>>({})
  const [extraMonthly, setExtraMonthly] = useState(0)

  const now = new Date()
  const thisMonthTx = useMemo(
    () => transactions.filter((tx) => {
      const d = new Date(tx.date)
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [transactions],
  )

  const expenseTotals = useMemo(
    () => categoryTotals(thisMonthTx, categories, 'expense', baseCurrency, rates, history),
    [thisMonthTx, categories, baseCurrency, rates, history],
  )
  const income = useMemo(
    () =>
      thisMonthTx
        .filter((tx) => tx.type === 'income' && !tx.isInternalTransfer)
        .reduce((sum, tx) => sum + convert(Number(tx.amount), tx.currency, baseCurrency, rates, history[dateKey(tx.date)]), 0),
    [thisMonthTx, baseCurrency, rates, history],
  )

  const categoryTotalsMap = useMemo(() => {
    const map: Record<string, number> = {}
    for (const ct of expenseTotals) map[ct.id] = ct.total
    return map
  }, [expenseTotals])

  const baseline = useMemo(
    () => simulate({ categoryTotals: categoryTotalsMap, income, extraMonthly: 0, adjustments: {}, consistencyScore: score?.consistencyScore ?? 0 }),
    [categoryTotalsMap, income, score],
  )
  const simulated = useMemo(
    () => simulate({ categoryTotals: categoryTotalsMap, income, extraMonthly, adjustments, consistencyScore: score?.consistencyScore ?? 0 }),
    [categoryTotalsMap, income, extraMonthly, adjustments, score],
  )

  const delta = simulated.total - baseline.total
  const hasAdjustments = extraMonthly !== 0 || Object.values(adjustments).some((v) => v !== 0)

  const reset = () => {
    setAdjustments({})
    setExtraMonthly(0)
  }

  if (!score) return null

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl lg:max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t('sim.title')}</h1>
        {hasAdjustments && (
          <button onClick={reset} className="flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            <RotateCcw size={14} />
            {t('sim.reset')}
          </button>
        )}
      </div>
      <p className="text-xs -mt-4" style={{ color: 'var(--text-muted)' }}>
        {t('sim.hint')}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl p-5" style={{ background: 'var(--surface-secondary)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {t('sim.currentScore')}
          </p>
          <p className="text-3xl font-bold mt-1">{baseline.total}</p>
        </div>
        <div
          className="rounded-2xl p-5"
          style={{ background: delta === 0 ? 'var(--surface-secondary)' : 'color-mix(in srgb, var(--accent) 14%, var(--surface-secondary))' }}
        >
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {t('sim.simulatedScore')}
          </p>
          <p className="text-3xl font-bold mt-1 flex items-baseline gap-2">
            {simulated.total}
            {delta !== 0 && (
              <span className="text-sm font-semibold" style={{ color: delta > 0 ? 'var(--income)' : 'var(--expense)' }}>
                {delta > 0 ? '+' : ''}
                {delta}
              </span>
            )}
          </p>
        </div>
      </div>

      <section>
        <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>
          {t('sim.extra')}
        </p>
        <div className="rounded-2xl p-4" style={{ background: 'var(--surface-secondary)' }}>
          <input
            type="number"
            value={extraMonthly || ''}
            onChange={(e) => setExtraMonthly(Number(e.target.value) || 0)}
            placeholder="0"
            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none bg-transparent"
            style={{ border: '1px solid var(--border)' }}
          />
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            {t('sim.extraHint')}
          </p>
        </div>
      </section>

      {expenseTotals.length > 0 && (
        <section>
          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>
            {t('sim.categories')}
          </p>
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface-secondary)' }}>
            {expenseTotals.map((ct, i) => {
              const pct = adjustments[ct.id] ?? 0
              return (
                <div key={ct.id} className="px-4 py-3" style={i > 0 ? { borderTop: '1px solid var(--border)' } : {}}>
                  <div className="flex items-center gap-3 mb-2">
                    <CategoryGlyph iconName={ct.iconName} size={15} color={`#${ct.colorHex}`} />
                    <p className="text-sm font-medium flex-1">{translateCategoryName(ct.name, t)}</p>
                    <p className="text-xs font-mono" style={{ color: pct === 0 ? 'var(--text-muted)' : pct > 0 ? 'var(--expense)' : 'var(--income)' }}>
                      {pct > 0 ? '+' : ''}
                      {pct}%
                    </p>
                  </div>
                  <input
                    type="range"
                    min={-50}
                    max={50}
                    step={5}
                    value={pct}
                    onChange={(e) => setAdjustments((prev) => ({ ...prev, [ct.id]: Number(e.target.value) }))}
                    className="w-full"
                  />
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {formatCurrency(ct.total, baseCurrency)} → {formatCurrency(ct.total * (1 + pct / 100), baseCurrency)}
                  </p>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
        {t('sim.savingsRate')
          .replace('{before}', `${Math.round(baseline.savingsRate * 100)}%`)
          .replace('{after}', `${Math.round(simulated.savingsRate * 100)}%`)}
        {' · '}
        {new Date().toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
      </p>
    </motion.div>
  )
}
