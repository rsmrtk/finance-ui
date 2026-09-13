// Client-side mirror of internal/service/advisor/insights.go's
// FinancialScore weights/thresholds — kept here (not fetched per
// keystroke) so slider changes recompute instantly. If the Go formula's
// weights ever change, update both.
const SAVINGS_WEIGHT = 0.4
const BALANCE_WEIGHT = 0.3
const CONSISTENCY_WEIGHT = 0.3
const SAVINGS_RATE_CAP = 0.2 // 20%+ saved = full marks.
const BALANCE_MIN_SHARE = 0.25 // Top category under 25% of spend = full marks.
const BALANCE_MAX_SHARE = 0.75 // Top category over 75% of spend = zero.

function clampScore(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)))
}

export interface WhatIfInput {
  categoryTotals: Record<string, number> // categoryId -> this month's spend, base currency
  income: number
  extraMonthly: number // Signed: positive = more income, negative = a new/bigger expense.
  adjustments: Record<string, number> // categoryId -> percent adjustment, -50..50
  consistencyScore: number // Taken as-is from the real score — logging behavior isn't hypothetical.
}

export interface WhatIfResult {
  total: number
  savingsRate: number
  expense: number
  income: number
}

export function simulate(input: WhatIfInput): WhatIfResult {
  const adjustedIncome = input.income + input.extraMonthly
  let adjustedExpense = 0
  const adjustedByCategory: Record<string, number> = {}
  for (const [categoryId, amount] of Object.entries(input.categoryTotals)) {
    const pct = input.adjustments[categoryId] ?? 0
    const adjusted = amount * (1 + pct / 100)
    adjustedByCategory[categoryId] = adjusted
    adjustedExpense += adjusted
  }

  const savingsRate = adjustedIncome > 0 ? (adjustedIncome - adjustedExpense) / adjustedIncome : 0
  const savingsScore = clampScore((savingsRate / SAVINGS_RATE_CAP) * 100)

  let topShare = 0
  if (adjustedExpense > 0) {
    for (const amount of Object.values(adjustedByCategory)) {
      const share = amount / adjustedExpense
      if (share > topShare) topShare = share
    }
  }
  const balanceScore = clampScore(((BALANCE_MAX_SHARE - topShare) / (BALANCE_MAX_SHARE - BALANCE_MIN_SHARE)) * 100)

  const total = Math.round(
    SAVINGS_WEIGHT * savingsScore + BALANCE_WEIGHT * balanceScore + CONSISTENCY_WEIGHT * clampScore(input.consistencyScore),
  )

  return { total, savingsRate, expense: adjustedExpense, income: adjustedIncome }
}
