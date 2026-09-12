import { motion } from 'framer-motion'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AppProviders'
import { useLanguage } from '../../i18n/LanguageContext'

const TABS = [
  { to: '/app/profile', key: 'profile.nav.overview', end: true },
  { to: '/app/profile/integrations', key: 'profile.nav.integrations', end: false },
  { to: '/app/profile/appearance', key: 'profile.nav.appearance', end: false },
  { to: '/app/profile/currency', key: 'profile.nav.currency', end: false },
  { to: '/app/profile/plan', key: 'profile.nav.plan', end: false },
  { to: '/app/profile/privacy', key: 'profile.nav.privacy', end: false },
] as const

// Profile is a small hub with its own sub-pages (rather than one long
// Settings page) — each concern (integrations, appearance, currency,
// plan, privacy) gets room to breathe.
export function ProfileLayout() {
  const { logout } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t('profile.title')}</h1>
        <button
          onClick={async () => {
            await logout()
            navigate('/login', { replace: true })
          }}
          className="text-sm font-medium text-red-500"
        >
          {t('profile.logout')}
        </button>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-xl p-1" style={{ background: 'var(--surface-secondary)' }}>
        {TABS.map((tab) => (
          <NavLink key={tab.to} to={tab.to} end={tab.end} className="relative shrink-0">
            {({ isActive }) => (
              <div className="relative px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap">
                {isActive && (
                  <motion.div
                    layoutId="profile-tab-pill"
                    className="absolute inset-0 rounded-lg"
                    style={{ background: 'var(--accent)' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative" style={isActive ? { color: 'var(--accent-text)' } : { color: 'var(--text-muted)' }}>
                  {t(tab.key)}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </div>

      <Outlet />
    </div>
  )
}
