import { useQueries } from '@tanstack/react-query'
import { ratesApi } from '../api/client'
import { dateKey } from '../lib/analytics'
import type { RateMap } from '../lib/currency'
import type { Transaction } from '../api/types'

// Fetches one NBU historical-rate snapshot per unique transaction day, so
// old amounts convert at the rate that applied then. Cached forever
// client-side (staleTime/gcTime: Infinity) — a past day's rate is
// immutable, same reasoning as the server-side Redis cache.
export function useHistoricalRates(transactions: Transaction[]): Record<string, RateMap> {
  const uniqueDates = [...new Set(transactions.map((t) => dateKey(t.date)))]

  const results = useQueries({
    queries: uniqueDates.map((d) => ({
      queryKey: ['rate-history', d],
      queryFn: () => ratesApi.history(d),
      staleTime: Infinity,
      gcTime: Infinity,
    })),
  })

  const map: Record<string, RateMap> = {}
  uniqueDates.forEach((d, i) => {
    const data = results[i].data
    if (data) map[d] = data
  })
  return map
}
