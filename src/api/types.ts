export type TransactionType = 'expense' | 'income'
export type Currency = 'UAH' | 'USD' | 'EUR' | 'GBP' | 'PLN'

export type Theme = 'system' | 'light' | 'dark'
export type Plan = 'free' | 'pro' | 'max' | 'enterprise'

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  baseCurrency: Currency
  theme: Theme
  gradientColor: string
  plan: Plan
  goals: string
  subscriptionStatus?: string
  trialEndsAt?: string
  createdAt: string
}

export interface FinancialScore {
  total: number
  savingsRate: number
  savingsScore: number
  topCategoryShare: number
  balanceScore: number
  activeDays: number
  consistencyScore: number
}

export interface Subscription {
  description: string
  averageAmount: number
  currency: string
  occurrences: number
  lastDate: string
  averageIntervalDays: number
}

export interface RunwayForecast {
  currentBalance: number
  dailyBurnRate: number
  projectedZeroDate?: string
  nextPaydayEstimate?: string
  willMakeIt: boolean
}

export interface CategoryPace {
  categoryId: string
  categoryName: string
  typicalMonthly: number
  spentSoFar: number
  paceRatio: number
}

export interface Category {
  id: string
  name: string
  iconName: string
  colorHex: string
  type: TransactionType
  isDefault: boolean
}

export interface Transaction {
  id: string
  amount: string // Decimal as string — never parse with parseFloat for display math, only for chart aggregation.
  currency: Currency
  type: TransactionType
  date: string // ISO 8601.
  note: string
  categoryId: string
  isInternalTransfer?: boolean // Money moved between the user's own Monobank cards/jars — not real income/expense.
}

export interface Rate {
  currency: Currency
  rateToUah: number
  updatedAt: string
}

export interface MonobankConnection {
  isConnected: boolean
  maskedPans: string[]
  connectedAt?: string
  lastSyncedAt?: string
}

export interface MonobankAccount {
  id: string
  maskedPan: string
  currency: string
  type: string
  selected?: boolean
}

export interface ImportResult {
  imported: number
  skipped: number
  errors: string[]
}

export interface Receipt {
  orderId: string
  plan: Plan
  status: string
  amount: number
  currency: string
  errorDescription: string
  createdAt: string
}

export interface Session {
  id: string
  userAgent: string
  createdAt: string
  expiresAt: string
  current: boolean
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}
