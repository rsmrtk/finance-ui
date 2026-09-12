import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { categoriesApi, ratesApi, transactionsApi } from '../api/client'
import { CategoryGlyph } from '../components/CategoryGlyph'
import { DatePicker } from '../components/DatePicker'
import { markAnalyticsVisited } from '../components/OnboardingChecklist'
import { Skeleton } from '../components/Skeleton'
import { useAmountVisibility } from '../context/AmountVisibilityContext'
import { useAuth } from '../context/AppProviders'
import { useHistoricalRates } from '../hooks/useHistoricalRates'
import { translateCategoryName } from '../i18n/defaultCategories'
import { useLanguage } from '../i18n/LanguageContext'
import { categoryTotals, cumulativeBalance, monthlyTotals } from '../lib/analytics'
import { formatCurrency } from '../lib/currency'
import type { Currency, TransactionType } from '../api/types'

type Period = 'month' | 'quarter' | 'year' | 'all' | 'custom'

// A compact, low-chrome tooltip — closer to a trading-chart crosshair
// readout than a big rounded card.
const tooltipStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '6px 10px',
  fontSize: 12,
  lineHeight: 1.4,
  boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
}
const tooltipLabelStyle = { color: 'var(--text-muted)', fontSize: 11, marginBottom: 2 }
const tooltipItemStyle = { color: 'var(--text)', padding: 0 }

interface PieTooltipPayload {
  name: string
  value: number
  payload: { colorHex: string }
}

// Recharts' default tooltip content has no way to show the slice's own
// color next to its value, so with several similarly-sized slices it's
// not obvious which reading belongs to which color in the ring. A custom
// content renders a small color dot matching the hovered Cell instead.
function renderCategoryTooltip(baseCurrency: Currency, mask: (text: string) => string) {
  return ({ active, payload }: { active?: boolean; payload?: PieTooltipPayload[] }) => {
    if (!active || !payload?.length) return null
    const item = payload[0]
    return (
      <div style={tooltipStyle} className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: `#${item.payload.colorHex}` }} />
        <span style={tooltipLabelStyle}>{item.name}</span>
        <span style={{ ...tooltipItemStyle, fontWeight: 600 }}>{mask(formatCurrency(item.value, baseCurrency))}</span>
      </div>
    )
  }
}

function withinPeriod(date: Date, period: Period, ref: Date, from: string, to: string): boolean {
  if (period === 'all') return true
  if (period === 'custom') {
    const fromDate = from ? new Date(from + 'T00:00:00') : null
    const toDate = to ? new Date(to + 'T23:59:59') : null
    if (fromDate && date < fromDate) return false
    if (toDate && date > toDate) return false
    return true
  }
  const months = { month: 1, quarter: 3, year: 12 }[period]
  const cutoff = new Date(ref.getFullYear(), ref.getMonth() - months + 1, 1)
  return date >= cutoff
}

export function AnalyticsPage() {
  const { user } = useAuth()
  const { mask } = useAmountVisibility()
  const { t, locale } = useLanguage()
  const baseCurrency = user?.baseCurrency ?? 'UAH'

  useEffect(() => markAnalyticsVisited(), [])

  const { data: transactions = [], isPending: txPending } = useQuery({ queryKey: ['transactions'], queryFn: transactionsApi.list })
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list })
  const { data: rates = [] } = useQuery({ queryKey: ['rates'], queryFn: ratesApi.list })
  const history = useHistoricalRates(transactions)

  const [period, setPeriod] = useState<Period>('month')
  const [type, setType] = useState<TransactionType>('expense')
  const [customFrom, setCustomFrom] = useState(() => new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10))
  const [customTo, setCustomTo] = useState(() => new Date().toISOString().slice(0, 10))

  const now = new Date()
  const filtered = useMemo(
    () => transactions.filter((tx) => withinPeriod(new Date(tx.date), period, now, customFrom, customTo)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [transactions, period, customFrom, customTo],
  )

  const totals = useMemo(
    () =>
      categoryTotals(filtered, categories, type, baseCurrency, rates, history).map((ct) => ({
        ...ct,
        name: translateCategoryName(ct.name, t),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtered, categories, type, baseCurrency, rates, history],
  )
  const total = totals.reduce((sum, ct) => sum + ct.total, 0)

  const months = useMemo(
    () => monthlyTotals(transactions, 6, baseCurrency, rates, now, history),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [transactions, baseCurrency, rates, history],
  )
  const trendData = months.map((m) => ({
    name: m.month.toLocaleDateString(locale, { month: 'short' }),
    [t('dashboard.income')]: Math.round(m.income),
    [t('dashboard.expense')]: Math.round(m.expense),
  }))
  const incomeKey = t('dashboard.income')
  const expenseKey = t('dashboard.expense')

  const balancePoints = useMemo(
    () => cumulativeBalance(transactions, 6, baseCurrency, rates, now, history),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [transactions, baseCurrency, rates, history],
  )
  const balanceKey = t('an.balanceOverTime')
  const balanceData = balancePoints.map((p) => ({
    name: p.month.toLocaleDateString(locale, { month: 'short' }),
    [balanceKey]: Math.round(p.balance),
  }))

  const allTimeTotals = useMemo(() => {
    const expense = categoryTotals(transactions, categories, 'expense', baseCurrency, rates, history)
    const income = categoryTotals(transactions, categories, 'income', baseCurrency, rates, history)
    return [...expense, ...income]
      .sort((a, b) => b.total - a.total)
      .slice(0, 8)
      .map((ct) => ({ ...ct, name: translateCategoryName(ct.name, t) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, categories, baseCurrency, rates, history])
  const rankingMax = Math.max(1, ...allTimeTotals.map((ct) => ct.total))

  if (txPending) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        <h1 className="text-xl font-bold">{t('an.title')}</h1>
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-8">
      <h1 className="text-xl font-bold">{t('an.title')}</h1>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="rounded-xl px-3 py-1.5 text-sm"
            style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}
          >
            <option value="month">{t('an.month')}</option>
            <option value="quarter">{t('an.quarter')}</option>
            <option value="year">{t('an.year')}</option>
            <option value="all">{t('an.allTime')}</option>
            <option value="custom">{t('an.custom')}</option>
          </select>
          <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
            {(['expense', 'income'] as const).map((txType) => (
              <button
                key={txType}
                onClick={() => setType(txType)}
                className="px-3 py-1.5 text-sm font-medium"
                style={type === txType ? { background: 'var(--accent)', color: 'var(--accent-text)' } : {}}
              >
                {txType === 'expense' ? t('tx.expense') : t('tx.income')}
              </button>
            ))}
          </div>
        </div>

        {period === 'custom' && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <DatePicker value={customFrom} onChange={setCustomFrom} label={t('an.from')} />
            <DatePicker value={customTo} onChange={setCustomTo} label={t('an.to')} />
          </div>
        )}

        {totals.length === 0 ? (
          <p className="text-sm text-center py-10" style={{ color: 'var(--text-muted)' }}>
            {t('an.empty')}
          </p>
        ) : (
          <>
            <div className="relative h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={totals}
                    dataKey="total"
                    nameKey="name"
                    innerRadius="60%"
                    outerRadius="90%"
                    paddingAngle={2}
                    cornerRadius={3}
                  >
                    {totals.map((ct) => (
                      <Cell key={ct.id} fill={`#${ct.colorHex}`} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    content={renderCategoryTooltip(baseCurrency, mask)}
                    // The default cursor-following position sits right over
                    // the center "Total" label whenever a slice near the
                    // middle of the ring is hovered — pin it to a corner
                    // that's always empty space instead.
                    position={{ x: 4, y: 4 }}
                    allowEscapeViewBox={{ x: true, y: true }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {t('an.total')}
                </p>
                <p className="text-lg font-bold">{mask(formatCurrency(total, baseCurrency))}</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl overflow-hidden" style={{ background: 'var(--surface-secondary)' }}>
              {totals.map((ct, i) => {
                const pct = total ? Math.round((ct.total / total) * 100) : 0
                return (
                  <div
                    key={ct.id}
                    className="flex items-center gap-3 px-4 py-2.5"
                    style={i > 0 ? { borderTop: '1px solid var(--border)' } : {}}
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: `#${ct.colorHex}` }} />
                    <CategoryGlyph iconName={ct.iconName} size={15} color={`#${ct.colorHex}`} />
                    <p className="flex-1 text-sm font-medium">{ct.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {pct}%
                    </p>
                    <p className="text-sm font-semibold w-24 text-right">{mask(formatCurrency(ct.total, baseCurrency))}</p>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </section>

      <section>
        <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>
          {t('an.trend6')}
        </p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 16, right: 8, left: 8, bottom: 0 }}>
              <defs>
                <filter id="lineGlowIncome" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="var(--income)" floodOpacity="0.55" />
                </filter>
                <filter id="lineGlowExpense" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="var(--expense)" floodOpacity="0.55" />
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} width={36} />
              <Tooltip
                formatter={(v) => mask(formatCurrency(Number(v), baseCurrency))}
                contentStyle={tooltipStyle}
                labelStyle={tooltipLabelStyle}
                itemStyle={tooltipItemStyle}
                cursor={{ stroke: 'var(--border)', strokeWidth: 1 }}
              />
              <Line
                type="linear"
                dataKey={incomeKey}
                stroke="var(--income)"
                strokeWidth={2}
                dot={{ r: 3, fill: 'var(--income)', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                filter="url(#lineGlowIncome)"
              />
              <Line
                type="linear"
                dataKey={expenseKey}
                stroke="var(--expense)"
                strokeWidth={2}
                dot={{ r: 3, fill: 'var(--expense)', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                filter="url(#lineGlowExpense)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>
          {t('an.balanceOverTime')}
        </p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={balanceData} margin={{ top: 16, right: 8, left: 8, bottom: 0 }}>
              <defs>
                <filter id="lineGlowBalance" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="var(--accent)" floodOpacity="0.55" />
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} width={36} />
              <Tooltip
                formatter={(v) => mask(formatCurrency(Number(v), baseCurrency))}
                contentStyle={tooltipStyle}
                labelStyle={tooltipLabelStyle}
                itemStyle={tooltipItemStyle}
                cursor={{ stroke: 'var(--border)', strokeWidth: 1 }}
              />
              <Line
                type="linear"
                dataKey={balanceKey}
                stroke="var(--accent)"
                strokeWidth={2.5}
                dot={{ r: 3, fill: 'var(--accent)', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                filter="url(#lineGlowBalance)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {allTimeTotals.length > 0 && (
        <section>
          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>
            {t('an.allTimeCategories')}
          </p>
          <div className="rounded-2xl p-2" style={{ background: 'var(--surface-secondary)' }}>
            {allTimeTotals.map((ct) => (
              <div key={ct.id} className="flex items-center gap-3 px-2 py-2">
                <CategoryGlyph iconName={ct.iconName} size={15} color={`#${ct.colorHex}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium truncate">{ct.name}</p>
                    <p className="text-xs font-semibold shrink-0 ml-2">{mask(formatCurrency(ct.total, baseCurrency))}</p>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(ct.total / rankingMax) * 100}%`, background: `#${ct.colorHex}` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
