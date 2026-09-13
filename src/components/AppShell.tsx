import { AnimatePresence, motion } from 'framer-motion'
import { Eye, EyeOff, Home, LayoutDashboard, ListOrdered, Moon, PieChart, Sun, Tags } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAmountVisibility } from '../context/AmountVisibilityContext'
import { useAuth } from '../context/AppProviders'
import { useLanguage } from '../i18n/LanguageContext'
import { CommandPalette } from './CommandPalette'
import { FelixWidget } from './FelixWidget'
import { GradientBackdrop } from './GradientBackdrop'

const NAV_ITEMS = [
  { to: '/app', key: 'nav.overview', icon: LayoutDashboard, end: true },
  { to: '/app/transactions', key: 'nav.transactions', icon: ListOrdered, end: false },
  { to: '/app/categories', key: 'nav.categories', icon: Tags, end: false },
  { to: '/app/analytics', key: 'nav.analytics', icon: PieChart, end: false },
] as const

export function AppShell() {
  const { user, resolvedTheme, setTheme, logout } = useAuth()
  const { hidden, toggle: toggleHidden } = useAmountVisibility()
  const { t } = useLanguage()
  const location = useLocation()
  const navigate = useNavigate()

  // The nav rail's "home" affordance deliberately ends the session instead
  // of just navigating to "/" — leaving the app that way while still
  // authenticated would let the landing page's login button silently skip
  // straight back in, which defeats the point of "leaving". Navigate FIRST,
  // logout after: clearing the session while still under /app makes
  // RequireAuth's own redirect win the race and bounce to /login before
  // our navigate('/') ever lands.
  const goHome = () => {
    navigate('/', { replace: true })
    void logout()
  }

  return (
    <div className="h-screen flex flex-col md:flex-row">
      <GradientBackdrop />

      {/* Mobile top bar (< md): the fixed sidebar below doesn't fit a phone
          screen at all, so mobile gets its own compact header + a bottom
          tab bar (see below) instead — the same nav rail can't just shrink. */}
      <header
        className="md:hidden shrink-0 flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--surface) 70%, transparent)' }}
      >
        <Link to="/" className="brand-wordmark font-semibold">
          {t('app.name')}
        </Link>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleHidden}
            aria-label={hidden ? t('nav.amounts.show') : t('nav.amounts.hide')}
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ color: 'var(--text-muted)' }}
          >
            {hidden ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            aria-label={resolvedTheme === 'dark' ? t('nav.theme.light') : t('nav.theme.dark')}
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ color: 'var(--text-muted)' }}
          >
            {resolvedTheme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <Link
            to="/app/profile"
            className="w-8 h-8 ml-1 rounded-full flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              (user?.name || user?.email || '?').slice(0, 1).toUpperCase()
            )}
          </Link>
        </div>
      </header>

      {/* Fixed to the viewport (h-screen, not min-h-full) so the nav rail
          never stretches to match a tall page's content height — only
          <main> scrolls, so "Dark theme" always sits at the bottom of the
          visible screen instead of sinking to the bottom of the page. */}
      <aside
        className="hidden md:flex w-56 shrink-0 h-full overflow-y-auto p-4 flex-col gap-1 border-r"
        style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--surface) 60%, transparent)' }}
      >
        <div className="flex items-center justify-between px-2 mb-1">
          <span className="brand-wordmark font-semibold">{t('app.name')}</span>
          <button
            onClick={goHome}
            aria-label={t('nav.home')}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5"
            style={{ color: 'var(--text-muted)' }}
          >
            <Home size={15} />
          </button>
        </div>
        <button
          onClick={() => window.dispatchEvent(new Event('command-palette:open'))}
          className="flex items-center justify-between px-2 py-1.5 mb-2 rounded-lg text-xs hover:bg-black/5 dark:hover:bg-white/5"
          style={{ color: 'var(--text-muted)' }}
        >
          {t('palette.placeholder')}
          <kbd className="px-1.5 py-0.5 rounded" style={{ background: 'var(--border)', fontSize: 10 }}>
            ⌘K
          </kbd>
        </button>

        {/* Corner profile chip — the entry point into the Profile hub
            (goals, integrations, appearance, currency, plan, privacy),
            kept out of the regular nav list since it's a distinct sub-area. */}
        <NavLink
          to="/app/profile"
          className="flex items-center gap-2.5 px-2 py-2 mb-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5"
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              (user?.name || user?.email || '?').slice(0, 1).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate">{user?.name || user?.email}</p>
            <p className="text-[11px] uppercase font-medium" style={{ color: 'var(--text-muted)' }}>
              {user?.plan ?? 'free'}
            </p>
          </div>
        </NavLink>

        {NAV_ITEMS.map(({ to, key, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className="relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium"
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="nav-active-pill"
                    className="absolute inset-0 rounded-xl"
                    style={{ background: 'var(--accent)' }}
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span
                  className={`relative flex items-center gap-2.5 ${!isActive ? 'hover:opacity-70 transition-opacity' : ''}`}
                  style={isActive ? { color: 'var(--accent-text)' } : {}}
                >
                  <Icon size={18} />
                  {t(key)}
                </span>
              </>
            )}
          </NavLink>
        ))}

        <button
          onClick={toggleHidden}
          className="mt-auto flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5"
        >
          {hidden ? <EyeOff size={18} /> : <Eye size={18} />}
          {hidden ? t('nav.amounts.show') : t('nav.amounts.hide')}
        </button>
        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5"
        >
          {resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          {resolvedTheme === 'dark' ? t('nav.theme.light') : t('nav.theme.dark')}
        </button>
      </aside>

      <main className="flex-1 min-h-0 p-4 md:p-6 pb-20 md:pb-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile bottom tab bar (< md) — mirrors the iOS app's own tab bar,
          the pattern this whole nav item list already exists for. */}
      <nav
        className="md:hidden shrink-0 fixed bottom-0 inset-x-0 flex border-t z-10"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        {NAV_ITEMS.map(({ to, key, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="relative flex-1 flex flex-col items-center gap-0.5 py-2.5">
            {({ isActive }) => (
              <>
                <Icon size={19} style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)' }} />
                <span
                  className="text-[10px] font-medium"
                  style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}
                >
                  {t(key)}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <CommandPalette />
      <FelixWidget />
    </div>
  )
}
