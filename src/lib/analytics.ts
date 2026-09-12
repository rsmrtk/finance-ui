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
  tint: 'income' | 'expense'
  date: Date
  type: 'income' | 'expense'
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
    tint: tx.type,
    date: new Date(tx.date),
    type: tx.type,
    searchText: `${category?.name ?? ''} ${tx.note}`.toLowerCase(),
  }
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
    if (tx.type !== type) continue
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

export interface MonthlyTotal {
  month: Date
  income: number
  expense: number
}

export function monthlyTotals(
  transactions: Transaction[],
  monthsBack: number,
  baseCurrency: Currency,
  rates: Rate[],
  referenceDate = new Date(),
  historyByDate: Record<string, RateMap> = {},
): MonthlyTotal[] {
  const months: MonthlyTotal[] = []
  for (let i = monthsBack - 1; i >= 0; i--) {
    const month = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - i, 1)
    months.push({ month, income: 0, expense: 0 })
  }

  for (const tx of transactions) {
    const date = new Date(tx.date)
    const bucket = months.find((m) => m.month.getFullYear() === date.getFullYear() && m.month.getMonth() === date.getMonth())
    if (!bucket) continue
    const converted = convert(Number(tx.amount), tx.currency, baseCurrency, rates, historyByDate[dateKey(tx.date)])
    if (tx.type === 'income') bucket.income += converted
    else bucket.expense += converted
  }

  return months
}

export interface CumulativePoint {
  month: Date
  balance: number
}

// Running net balance across the last `monthsBack` months — a "net worth
// trend" line, distinct from the income-vs-expense comparison above.
export function cumulativeBalance(
  transactions: Transaction[],
  monthsBack: number,
  baseCurrency: Currency,
  rates: Rate[],
  referenceDate = new Date(),
  historyByDate: Record<string, RateMap> = {},
): CumulativePoint[] {
  const months = monthlyTotals(transactions, monthsBack, baseCurrency, rates, referenceDate, historyByDate)
  let running = 0
  return months.map((m) => {
    running += m.income - m.expense
    return { month: m.month, balance: running }
  })
}
