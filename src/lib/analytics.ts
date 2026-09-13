import type { Category, Currency, Rate, Transaction } from '../api/types'
import { convert, formatCurrency, type RateMap } from './currency'

export function dateKey(iso: string): string {
  return iso.slice(0, 10)
}

// --- DisplayTransaction (port of the iOS app's normalized UI shape) ------

export interface DisplayTransaction {
  id: string
  categoryName: string
  categoryIconName: string
  categoryColorHex: string
  note: string
  amountText: string
  tint: 'income' | 'expense' | 'transfer'
  date: Date
  type: 'income' | 'expense'
  isInternalTransfer: boolean
  searchText: string
}

export function toDisplayTransaction(tx: Transaction, categories: Category[]): DisplayTransaction {
  const category = categories.find((c) => c.id === tx.categoryId)
  const amount = Number(tx.amount)
  const sign = tx.type === 'expense' ? -1 : 1
  return {
    id: tx.id,
    categoryName: category?.name ?? 'Без категорії',
    categoryIconName: category?.iconName ?? 'ellipsis.circle.fill',
    categoryColorHex: category?.colorHex ?? '8E8E93',
    note: tx.note,
    amountText: formatCurrency(sign * amount, tx.currency),
    tint: tx.isInternalTransfer ? 'transfer' : tx.type,
    date: new Date(tx.date),
    type: tx.type,
    isInternalTransfer: !!tx.isInternalTransfer,
    searchText: `${category?.name ?? ''} ${tx.note}`.toLowerCase(),
  }
}

// Excludes internal transfers (money moved between the user's own
// Monobank cards/jars) — real income/expense math should never count
// them, per the same logic applied server-side in
// internal/service/advisor's aggregations.
export function excludeTransfers(transactions: Transaction[]): Transaction[] {
  return transactions.filter((tx) => !tx.isInternalTransfer)
}

// --- AnalyticsCalculator (port of the iOS app's pure aggregation funcs) --

export interface CategoryTotal {
  id: string
  name: string
  iconName: string
  colorHex: string
  total: number
}

export function categoryTotals(
  transactions: Transaction[],
  categories: Category[],
  type: 'income' | 'expense',
  baseCurrency: Currency,
  rates: Rate[],
  historyByDate: Record<string, RateMap> = {},
): CategoryTotal[] {
  const totals = new Map<string, number>()
  for (const tx of transactions) {
    if (tx.type !== type || tx.isInternalTransfer) continue
    const converted = convert(Number(tx.amount), tx.currency, baseCurrency, rates, historyByDate[dateKey(tx.date)])
    totals.set(tx.categoryId, (totals.get(tx.categoryId) ?? 0) + converted)
  }
  return [...totals.entries()]
    .map(([categoryId, total]) => {
      const category = categories.find((c) => c.id === categoryId)
      return {
        id: categoryId || 'uncategorized',
        name: category?.name ?? 'Без категорії',
        iconName: category?.iconName ?? 'ellipsis.circle.fill',
        colorHex: category?.colorHex ?? '8E8E93',
        total,
      }
    })
    .sort((a, b) => b.total - a.total)
}

// --- Period-accurate trend/balance (replaces a hardcoded "always 6
// months" trend that ignored whatever range the user actually selected —
// see trendForRange/balanceForRange below, which superseded the old
// fixed-monthsBack monthlyTotals/cumulativeBalance) ---

export interface TrendBucket {
  label: Date
  income: number
  expense: number
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}
function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}
function sameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

// Short ranges (a month or less) get daily buckets — a single monthly bar
// for a "this month" view wouldn't show anything. Longer ranges (quarter,
// year, all-time, a wide custom range) get monthly buckets instead of
// exploding into hundreds of daily bars.
const DAILY_GRANULARITY_MAX_DAYS = 62

export function trendForRange(
  transactions: Transaction[],
  from: Date,
  to: Date,
  baseCurrency: Currency,
  rates: Rate[],
  historyByDate: Record<string, RateMap> = {},
): { buckets: TrendBucket[]; granularity: 'day' | 'month' } {
  const spanDays = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86_400_000))
  const granularity: 'day' | 'month' = spanDays <= DAILY_GRANULARITY_MAX_DAYS ? 'day' : 'month'

  const buckets: TrendBucket[] = []
  if (granularity === 'day') {
    for (let d = startOfDay(from); d <= to; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
      buckets.push({ label: new Date(d), income: 0, expense: 0 })
    }
  } else {
    const end = startOfMonth(to)
    for (let d = startOfMonth(from); d <= end; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
      buckets.push({ label: new Date(d), income: 0, expense: 0 })
    }
  }

  for (const tx of transactions) {
    if (tx.isInternalTransfer) continue
    const date = new Date(tx.date)
    if (date < from || date > to) continue
    const bucket = granularity === 'day' ? buckets.find((b) => sameDay(b.label, date)) : buckets.find((b) => sameMonth(b.label, date))
    if (!bucket) continue
    const converted = convert(Number(tx.amount), tx.currency, baseCurrency, rates, historyByDate[dateKey(tx.date)])
    if (tx.type === 'income') bucket.income += converted
    else bucket.expense += converted
  }

  return { buckets, granularity }
}

export interface RangeBalancePoint {
  label: Date
  balance: number
}

// Balance trend restricted to [from, to] — unlike a naive "start counting
// from 0 at the window's start", this carries in the real balance
// accumulated from every transaction before `from`, so a "this month"
// view's line starts at the actual running balance, not a fake zero.
export function balanceForRange(
  transactions: Transaction[],
  from: Date,
  to: Date,
  baseCurrency: Currency,
  rates: Rate[],
  historyByDate: Record<string, RateMap> = {},
): { points: RangeBalancePoint[]; granularity: 'day' | 'month' } {
  let priorBalance = 0
  for (const tx of transactions) {
    if (tx.isInternalTransfer) continue
    const date = new Date(tx.date)
    if (date >= from) continue
    const converted = convert(Number(tx.amount), tx.currency, baseCurrency, rates, historyByDate[dateKey(tx.date)])
    priorBalance += tx.type === 'income' ? converted : -converted
  }

  const { buckets, granularity } = trendForRange(transactions, from, to, baseCurrency, rates, historyByDate)
  let running = priorBalance
  const points = buckets.map((b) => {
    running += b.income - b.expense
    return { label: b.label, balance: running }
  })
  return { points, granularity }
}
