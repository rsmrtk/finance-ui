import { motion } from 'framer-motion'
import { LayoutDashboard, Moon, PieChart, ShieldCheck, Sparkles, Sun, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AppProviders'
import { GradientBackdrop } from '../components/GradientBackdrop'
import { LanguageToggle } from '../components/LanguageToggle'
import { PricingTiers } from '../components/PricingTiers'
import { useLanguage } from '../i18n/LanguageContext'
import { contrastText } from '../lib/color'

const FEATURE_ICONS = [Wallet, PieChart, ShieldCheck, Sparkles] as const
const FEATURE_KEYS = ['landing.feature1', 'landing.feature2', 'landing.feature3', 'landing.feature4'] as const

const LANDING_THEME_KEY = 'landingStore.theme'
const LANDING_GREEN = '#34c759'

export function LandingPage() {
  const { t } = useLanguage()
  const { user, resolvedTheme, gradientColor } = useAuth()
  const [landingTheme, setLandingTheme] = useState<'light' | 'dark'>(
    () => (localStorage.getItem(LANDING_THEME_KEY) as 'light' | 'dark' | null) ?? 'light',
  )

  // The landing page is a fixed first impression — green on white by
  // default, independent of whatever theme the visitor's account had set —
  // so it overrides data-theme/accent while mounted. On unmount it restores
  // the account's *current* theme/gradient from useAuth() (not a captured
  // DOM snapshot): AuthProvider skips applying the account theme while
  // pathname is "/" (see its effects), so a raw snapshot could be stale or
  // simply unset, and restoring from live state is the only way that's
  // correct regardless of how this page was reached (fresh load or in-app nav).
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', landingTheme)
    root.style.setProperty('--gradient-accent', LANDING_GREEN)
    root.style.setProperty('--accent-text', contrastText(LANDING_GREEN))
    localStorage.setItem(LANDING_THEME_KEY, landingTheme)

    return () => {
      root.setAttribute('data-theme', resolvedTheme)
      root.style.setProperty('--gradient-accent', gradientColor)
      root.style.setProperty('--accent-text', contrastText(gradientColor))
    }
  }, [landingTheme, resolvedTheme, gradientColor])

  return (
    <div className="min-h-full relative">
      <GradientBackdrop />

      <header className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        <div className="brand-wordmark text-lg font-semibold">{t('app.name')}</div>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <button
            onClick={() => setLandingTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            className="w-9 h-9 rounded-lg flex items-center justify-center border shrink-0"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            {landingTheme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <Link
            to={user ? '/app/profile' : '/login'}
            className="rounded-xl px-4 py-2 text-sm font-semibold"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
          >
            {user ? t('landing.backToApp') : t('landing.login')}
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pb-24">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center py-16 sm:py-24"
        >
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            {t('landing.heroTitle')}
            <span style={{ color: 'var(--accent)' }}>{t('landing.heroTitleAccent')}</span>
          </h1>
          <p className="text-base sm:text-lg max-w-xl mx-auto mb-8" style={{ color: 'var(--text-muted)' }}>
            {t('landing.heroSubtitle')}
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              to={user ? '/app' : '/login'}
              className="rounded-xl px-6 py-3 text-sm font-semibold inline-flex items-center gap-2"
              style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
            >
              <LayoutDashboard size={16} />
              {t('landing.cta')}
            </Link>
          </div>
        </motion.section>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-24">
          {FEATURE_KEYS.map((key, i) => {
            const Icon = FEATURE_ICONS[i]
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="rounded-2xl p-5 flex gap-4"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'color-mix(in srgb, var(--accent) 18%, transparent)' }}
                >
                  <Icon size={18} style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">{t(`${key}.title` as never)}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {t(`${key}.text` as never)}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </section>

        <section>
          <h2 className="text-2xl font-bold text-center mb-2">{t('landing.pricingTitle')}</h2>
          <p className="text-sm text-center mb-8" style={{ color: 'var(--text-muted)' }}>
            {t('landing.pricingSubtitle')}
          </p>
          <PricingTiers />
        </section>
      </main>
    </div>
  )
}
