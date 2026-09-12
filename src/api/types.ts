export type TransactionType = 'expense' | 'income'
export type Currency = 'UAH' | 'USD' | 'EUR' | 'GBP' | 'PLN'

export type Theme = 'system' | 'light' | 'dark'
export type Plan = 'free' | 'pro' | 'max' | 'enterprise'

export interface User {
  id: string
  email: string
  baseCurrency: Currency
  theme: Theme
  gradientColor: string
  plan: Plan
  goals: string
  createdAt: string
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
}

export interface Rate {
  currency: Currency
  rateToUah: number
  updatedAt: string
}

export interface MonobankConnection {
  isConnected: boolean
  maskedPan: string
  connectedAt?: string
  lastSyncedAt?: string
}

export interface Session {
  id: string
  userAgent: string
  createdAt: string
  expiresAt: string
  current: boolean
}
