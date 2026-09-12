import { motion } from 'framer-motion'
import { LanguageToggle } from '../../components/LanguageToggle'
import { useAuth } from '../../context/AppProviders'
import { useLanguage } from '../../i18n/LanguageContext'

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
      {children}
    </div>
  )
}

export function ProfileAppearancePage() {
  const { resolvedTheme, setTheme, gradientColor, setGradientColor } = useAuth()
  const { t } = useLanguage()

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden [&>*:first-child]:border-t-0"
      style={{ background: 'var(--surface-secondary)' }}
    >
      <Row>
        <p className="text-sm">{t('profile.appearance.theme')}</p>
        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="text-sm font-medium"
          style={{ color: 'var(--accent)' }}
        >
          {resolvedTheme === 'dark' ? t('profile.appearance.themeDark') : t('profile.appearance.themeLight')}
        </button>
      </Row>
      <Row>
        <p className="text-sm">{t('profile.appearance.accentColor')}</p>
        <input
          type="color"
          value={gradientColor}
          onChange={(e) => setGradientColor(e.target.value)}
          className="w-9 h-9 rounded-full overflow-hidden cursor-pointer border-0 p-0"
        />
      </Row>
      <Row>
        <p className="text-sm">{t('profile.appearance.language')}</p>
        <LanguageToggle />
      </Row>
    </motion.div>
  )
}
