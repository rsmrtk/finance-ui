import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { authApi } from '../api/client'
import { contrastText } from '../lib/color'
import type { Theme, User } from '../api/types'

const THEME_KEY = 'themeStore.mode'
const GRADIENT_KEY = 'appearanceStore.gradientColor'
const DEFAULT_GRADIENT = '#34c759' // Same green already used for income/default categories.

function resolvedTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  return theme
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', resolvedTheme(theme))
}

function applyGradient(color: string) {
  document.documentElement.style.setProperty('--gradient-accent', color)
  // Text/icons drawn on top of --accent must stay readable no matter what
  // color the user picks — a hardcoded "white" breaks the instant someone
  // chooses a light/pastel accent.
  document.documentElement.style.setProperty('--accent-text', contrastText(color))
}

interface AuthState {
  user: User | null
  loading: boolean
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  gradientColor: string
  setTheme: (theme: Theme) => void
  setGradientColor: (color: string) => void
  refreshUser: (u: User) => void
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string) => Promise<void>
  loginWithGoogle: (idToken: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Instant paint from localStorage (avoids a flash of the wrong theme
  // before /auth/me resolves); overwritten by the account's saved values
  // the moment they load, further down.
  const [theme, setThemeState] = useState<Theme>(() => (localStorage.getItem(THEME_KEY) as Theme | null) ?? 'system')
  const [gradientColor, setGradientColorState] = useState(() => localStorage.getItem(GRADIENT_KEY) ?? DEFAULT_GRADIENT)

  // LandingPage forces its own fixed light/green look while mounted (see
  // its effect) — but on a fresh load of "/" both it and this provider
  // mount together, and React fires child effects (LandingPage's) before
  // parent effects (this one), so without this guard the account's theme
  // would win the race and clobber landing's override a tick later.
  useEffect(() => {
    if (window.location.pathname === '/') return
    applyTheme(theme)
  }, [theme])
  useEffect(() => {
    if (window.location.pathname === '/') return
    applyGradient(gradientColor)
  }, [gradientColor])

  const applyUser = (u: User) => {
    setUser(u)
    setThemeState(u.theme)
    setGradientColorState(u.gradientColor)
    localStorage.setItem(THEME_KEY, u.theme)
    localStorage.setItem(GRADIENT_KEY, u.gradientColor)
  }

  useEffect(() => {
    authApi
      .me()
      .then((res) => applyUser(res.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  // Preferences are account-wide (tied to the user, not the browser) —
  // saved server-side the moment they change, so they follow the user to
  // any device/browser. localStorage is kept in sync too, purely so the
  // *next* page load can paint the right theme instantly, before the
  // /auth/me round-trip finishes.
  const persist = async (nextTheme: Theme, nextGradient: string) => {
    localStorage.setItem(THEME_KEY, nextTheme)
    localStorage.setItem(GRADIENT_KEY, nextGradient)
    if (!user) return // Not signed in yet (e.g. on /login) — local-only for now.
    try {
      const res = await authApi.updatePreferences(nextTheme, nextGradient)
      setUser(res.user)
    } catch {
      // Keep the local change even if the save failed — better a
      // temporarily unsynced preference than reverting the user's click.
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        theme,
        resolvedTheme: resolvedTheme(theme),
        gradientColor,
        setTheme: (next) => {
          setThemeState(next)
          void persist(next, gradientColor)
        },
        setGradientColor: (next) => {
          setGradientColorState(next)
          void persist(theme, next)
        },
        // For updates that don't touch theme/gradient (e.g. saving Profile
        // goals) — merges the fresh user object without a full /me refetch.
        refreshUser: (u) => setUser(u),
        login: async (email, password) => applyUser((await authApi.login(email, password)).user),
        signup: async (email, password) => applyUser((await authApi.signup(email, password)).user),
        loginWithGoogle: async (idToken) => applyUser((await authApi.loginWithGoogle(idToken)).user),
        logout: async () => {
          await authApi.logout()
          setUser(null)
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
