import type {
  Category,
  MonobankConnection,
  Rate,
  Session,
  Transaction,
  TransactionType,
  User,
} from './types'

// Proxied by Vite in dev (vite.config.ts) so requests are same-origin —
// keeps the backend's session cookie on SameSite=Lax instead of needing
// SameSite=None+Secure for a cross-site request.
const BASE = '/api'

class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// Endpoints where a 401 means "wrong credentials" / "already logged out",
// not "access token expired" — never worth an auto-refresh-and-retry.
const NO_REFRESH_RETRY = new Set(['/auth/login', '/auth/signup', '/auth/google', '/auth/refresh', '/auth/logout'])

// Access tokens live only 15 minutes (internal/config's JWT_WEB_ACCESS_DURATION)
// by design — a stolen one goes stale fast. The 30-day refresh token (also
// an httpOnly cookie) is what's supposed to make that invisible to the
// user; this is the one place that actually uses it. Concurrent 401s share
// a single in-flight refresh instead of each firing their own.
let refreshInFlight: Promise<boolean> | null = null

function refreshAccessToken(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${BASE}/auth/refresh`, { method: 'POST', credentials: 'include' })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null
      })
  }
  return refreshInFlight
}

async function request<T>(path: string, init?: RequestInit, isRetry = false): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })

  if (res.status === 401 && !isRetry && !NO_REFRESH_RETRY.has(path)) {
    if (await refreshAccessToken()) return request<T>(path, init, true)
  }

  if (res.status === 204) return undefined as T
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(res.status, body.error ?? `request failed (${res.status})`)
  return body as T
}

export { ApiError }

// --- Auth -------------------------------------------------------------

export const authApi = {
  me: () => request<{ user: User }>('/auth/me'),
  signup: (email: string, password: string) =>
    request<{ user: User }>('/auth/signup', { method: 'POST', body: JSON.stringify({ email, password }) }),
  login: (email: string, password: string) =>
    request<{ user: User }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  loginWithGoogle: (idToken: string) =>
    request<{ user: User }>('/auth/google', { method: 'POST', body: JSON.stringify({ id_token: idToken }) }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  updatePreferences: (theme: string, gradientColor: string) =>
    request<{ user: User }>('/auth/preferences', {
      method: 'PATCH',
      body: JSON.stringify({ theme, gradientColor }),
    }),
  updateGoals: (goals: string) =>
    request<{ user: User }>('/auth/goals', { method: 'PATCH', body: JSON.stringify({ goals }) }),
  updateCurrency: (currency: string) =>
    request<{ user: User }>('/auth/currency', { method: 'PATCH', body: JSON.stringify({ currency }) }),
  sessions: () => request<{ sessions: Session[] }>('/auth/sessions'),
  revokeSession: (id: string) => request<void>(`/auth/sessions/${id}`, { method: 'DELETE' }),
}

// --- Categories ---------------------------------------------------------

export const categoriesApi = {
  list: () => request<Category[]>('/categories'),
  create: (input: { name: string; iconName: string; colorHex: string; type: TransactionType }) =>
    request<Category>('/categories', { method: 'POST', body: JSON.stringify(input) }),
  delete: (id: string) => request<void>(`/categories/${id}`, { method: 'DELETE' }),
}

// --- Transactions ---------------------------------------------------------

interface TransactionInput {
  categoryId: string
  amount: string
  currency: string
  type: TransactionType
  date: string
  note: string
}

export const transactionsApi = {
  list: () => request<Transaction[]>('/transactions'),
  create: (input: TransactionInput) =>
    request<Transaction>('/transactions', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, input: TransactionInput) =>
    request<Transaction>(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
  delete: (id: string) => request<void>(`/transactions/${id}`, { method: 'DELETE' }),
}

// --- Rates ---------------------------------------------------------

export const ratesApi = {
  list: () => request<Rate[]>('/rates'),
  // A past date's rates never change once published — safe to cache
  // forever client-side too (see useHistoricalRates).
  history: (date: string) => request<Record<string, number>>(`/rates/history?date=${date}`),
}

// --- Monobank ---------------------------------------------------------

export const monobankApi = {
  status: () => request<MonobankConnection>('/monobank/status'),
  connect: (personalToken: string) =>
    request<MonobankConnection>('/monobank/connect', { method: 'POST', body: JSON.stringify({ personalToken }) }),
  disconnect: () => request<void>('/monobank/disconnect', { method: 'POST' }),
}
