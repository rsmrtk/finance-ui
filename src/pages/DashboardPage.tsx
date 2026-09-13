import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Gauge, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { advisorApi, categoriesApi, ratesApi, transactionsApi, TRANSACTIONS_POLL_MS } from '../api/client'
import { AnimatedNumber } from '../components/AnimatedNumber'
import { CategoryGlyph } from '../components/CategoryGlyph'
import { OnboardingChecklist } from '../components/OnboardingChecklist'
import { RunwayCard } from '../components/RunwayCard'
import { Skeleton } from '../components/Skeleton'
import { StatCard } from '../components/StatCard'
import { useAmountVisibility } from '../context/AmountVisibilityContext'
import { useAuth } from '../context/AppProviders'
import { useHistoricalRates } from '../hooks/useHistoricalRates'
import { translateCategoryName } from '../i18n/defaultCategories'
import { useLanguage } from '../i18n/LanguageContext'
import { dateKey, toDisplayTransaction } from '../lib/analytics'
import { convert, formatCurrency } from '../lib/currency'

// A KPI strip that grows its own column count with the viewport
// (auto-fill) instead of the page sitting in one fixed-width column —
// on a wide screen this fills the row with more cards rather than
// leaving the sides empty. See components/StatCard for the pattern.
const STAT_GRID_STYLE = { gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }

export function DashboardPage() {
  const { user } = useAuth()
  const { mask } = useAmountVisibility()
  const { t } = useLanguage()
  const baseCurrency = user?.baseCurrency ?? 'UAH'

  const { data: transactions = [], isPending: txPending } = useQuery({
    queryKey: ['transactions'],
    queryFn: transactionsApi.list,
    refetchInterval: TRANSACTIONS_POLL_MS,
  })
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list })
  const { data: rates = [] } = useQuery({ queryKey: ['rates'], queryFn: ratesApi.list })
  const { data: score } = useQuery({ queryKey: ['financialScore'], queryFn: advisorApi.score })
  const history = useHistoricalRates(transactions)

  const now = new Date()
  const monthTx = transactions.filter((t) => {
    const d = new Date(t.date)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  })
  const income = monthTx
    .filter((t) => t.type === 'income' && !t.isInternalTransfer)
    .reduce((sum, t) => sum + convert(Number(t.amount), t.currency, baseCurrency, rates, history[dateKey(t.date)]), 0)
  const expense = monthTx
    .filter((t) => t.type === 'expense' && !t.isInternalTransfer)
    .reduce((sum, t) => sum + convert(Number(t.amount), t.currency, baseCurrency, rates, history[dateKey(t.date)]), 0)
  const balance = income - expense

  const recent = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8)
    .map((t) => toDisplayTransaction(t, categories))

  if (txPending) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid gap-4" style={STAT_GRID_STYLE}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl p-4" style={{ background: 'var(--surface-secondary)' }}>
              <Skeleton className="h-3 w-16 mb-3" />
              <Skeleton className="h-7 w-24" />
            </div>
          ))}
        </div>
        <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: 'var(--surface-secondary)' }}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-full shrink-0" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <OnboardingChecklist hasTransactions={transactions.length > 0} />

      <div className="grid gap-4" style={STAT_GRID_STYLE}>
        <StatCard
          tone="accent"
          label={t('dashboard.balance')}
          icon={<Wallet size={16} />}
          value={<AnimatedNumber value={balance} format={(n) => mask(formatCurrency(n, baseCurrency))} />}
        />
        <StatCard
          tone="income"
          label={t('dashboard.income')}
          icon={<TrendingUp size={16} style={{ color: 'var(--income)' }} />}
          value={<AnimatedNumber value={income} format={(n) => mask(formatCurrency(n, baseCurrency))} />}
          delay={0.04}
        />
        <StatCard
          tone="expense"
          label={t('dashboard.expense')}
          icon={<TrendingDown size={16} style={{ color: 'var(--expense)' }} />}
          value={<AnimatedNumber value={expense} format={(n) => mask(formatCurrency(n, baseCurrency))} />}
          delay={0.08}
        />
        {score && (
          <StatCard
            label={t('profile.score.title')}
            icon={<Gauge size={16} />}
            value={`${score.total}/100`}
            delay={0.12}
          />
        )}
      </div>

      <RunwayCard />

      <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.08 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--surface-secondary)' }}
        >
          <p className="px-4 pt-3 pb-1 text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
            {t('dashboard.recent')}
          </p>
          {recent.length === 0 && (
            <p className="px-4 py-6 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
              {t('dashboard.empty')}
            </p>
          )}
          {recent.map((tx, i) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 + i * 0.04 }}
              className="flex items-center gap-3 px-4 py-2.5"
              style={i > 0 ? { borderTop: '1px solid var(--border)', marginLeft: 44 } : {}}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ background: `#${tx.categoryColorHex}2e` }}
              >
                <CategoryGlyph iconName={tx.categoryIconName} size={16} color={`#${tx.categoryColorHex}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{translateCategoryName(tx.categoryName, t)}</p>
                {tx.note && (
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                    {tx.note}
                  </p>
                )}
              </div>
              <p className="text-sm font-semibold" style={{ color: `var(--${tx.tint})` }}>
                {mask(tx.amountText)}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
