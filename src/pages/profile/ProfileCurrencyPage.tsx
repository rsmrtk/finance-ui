import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { authApi } from '../../api/client'
import { useAuth } from '../../context/AppProviders'
import { useLanguage } from '../../i18n/LanguageContext'
import type { Currency } from '../../api/types'

const CURRENCIES: Currency[] = ['UAH', 'USD', 'EUR', 'GBP', 'PLN']

export function ProfileCurrencyPage() {
  const { user, refreshUser } = useAuth()
  const { t } = useLanguage()
  const [justSaved, setJustSaved] = useState(false)

  const update = useMutation({
    mutationFn: authApi.updateCurrency,
    onSuccess: (res) => {
      refreshUser(res.user)
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 1500)
    },
  })

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
      <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
        {t('profile.currency.label')}
      </p>
      <div className="grid grid-cols-5 gap-2">
        {CURRENCIES.map((c) => {
          const selected = user?.baseCurrency === c
          return (
            <motion.button
              key={c}
              whileTap={{ scale: 0.95 }}
              onClick={() => update.mutate(c)}
              disabled={update.isPending}
              className="rounded-xl py-3 text-sm font-semibold"
              style={
                selected
                  ? { background: 'var(--accent)', color: 'var(--accent-text)' }
                  : { background: 'var(--surface-secondary)', border: '1px solid var(--border)' }
              }
            >
              {c}
            </motion.button>
          )
        })}
      </div>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        {t('profile.currency.hint')}
      </p>
      <p className="text-xs h-4" style={{ color: 'var(--accent)' }}>
        {update.isPending && t('profile.currency.saving')}
        {justSaved && t('profile.currency.saved')}
      </p>
    </motion.div>
  )
}
