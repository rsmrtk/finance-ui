import type { Currency, Rate } from '../api/types'

const SYMBOLS: Record<Currency, string> = { UAH: '₴', USD: '$', EUR: '€', GBP: '£', PLN: 'zł' }

export function formatCurrency(amount: number, currency: Currency): string {
  const formatted = new Intl.NumberFormat('uk-UA', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(
    Math.abs(amount),
  )
  const sign = amount < 0 ? '-' : ''
  return `${sign}${formatted} ${SYMBOLS[currency]}`
}

export type RateMap = Record<string, number>

// Converts an amount from `from` into `to`, via rate-to-UAH. When
// `historicalRates` has an entry for the currency involved (see
// useHistoricalRates), that rate is used instead of the latest one — so a
// transaction from a year ago converts at the rate that actually applied
// then, not today's.
export function convert(amount: number, from: Currency, to: Currency, rates: Rate[], historicalRates?: RateMap): number {
  if (from === to) return amount
  const rateOf = (c: Currency) => {
    if (c === 'UAH') return 1
    if (historicalRates?.[c] !== undefined) return historicalRates[c]
    return rates.find((r) => r.currency === c)?.rateToUah ?? 1
  }
  const inUah = amount * rateOf(from)
  return inUah / rateOf(to)
}
