import { createContext, useContext, useState, type ReactNode } from 'react'
import { LOCALE, translations, type Language, type TranslationKey } from './translations'

const LANGUAGE_KEY = 'languageStore.language'

function detectDefault(): Language {
  const stored = localStorage.getItem(LANGUAGE_KEY)
  if (stored === 'uk' || stored === 'en') return stored
  return navigator.language.toLowerCase().startsWith('uk') ? 'uk' : 'en'
}

interface LanguageState {
  language: Language
  locale: string
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageState | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(detectDefault)

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem(LANGUAGE_KEY, lang)
  }

  const t = (key: TranslationKey) => translations[language][key] ?? translations.uk[key] ?? key

  return (
    <LanguageContext.Provider value={{ language, locale: LOCALE[language], setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
