import { useLanguage } from '../i18n/LanguageContext'
import type { Language } from '../i18n/translations'

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="flex rounded-lg overflow-hidden border shrink-0" style={{ borderColor: 'var(--border)' }}>
      {(['uk', 'en'] as Language[]).map((lang) => (
        <button
          key={lang}
          onClick={() => setLanguage(lang)}
          className="px-3 py-1 text-xs font-semibold uppercase"
          style={
            language === lang
              ? { background: 'var(--accent)', color: 'var(--accent-text)' }
              : { color: 'var(--text-muted)' }
          }
        >
          {lang}
        </button>
      ))}
    </div>
  )
}
