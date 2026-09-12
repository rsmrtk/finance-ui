import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { authApi } from '../../api/client'
import { useAuth } from '../../context/AppProviders'
import { useLanguage } from '../../i18n/LanguageContext'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function ProfileOverviewPage() {
  const { user, refreshUser } = useAuth()
  const { t, locale } = useLanguage()

  const [goals, setGoals] = useState(user?.goals ?? '')
  const [status, setStatus] = useState<SaveStatus>('idle')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setGoals(user?.goals ?? '')
  }, [user?.goals])

  const onGoalsChange = (value: string) => {
    setGoals(value)
    setStatus('saving')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await authApi.updateGoals(value)
        refreshUser(res.user)
        setStatus('saved')
      } catch {
        setStatus('error')
      }
    }, 700)
  }

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-5 flex items-center gap-4"
        style={{ background: 'var(--surface-secondary)' }}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold shrink-0"
          style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
        >
          {(user?.email ?? '?').slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{user?.email}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {t('profile.memberSince')} {user ? new Date(user.createdAt).toLocaleDateString(locale, { month: 'long', year: 'numeric' }) : ''}
          </p>
        </div>
      </motion.div>

      <section>
        <p className="text-sm font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
          {t('profile.goals.label')}
        </p>
        <div className="rounded-2xl p-1" style={{ background: 'var(--surface-secondary)' }}>
          <textarea
            value={goals}
            onChange={(e) => onGoalsChange(e.target.value)}
            placeholder={t('profile.goals.placeholder')}
            rows={6}
            maxLength={4000}
            className="w-full resize-none rounded-xl px-4 py-3 text-sm outline-none bg-transparent"
          />
        </div>
        <p className="text-xs mt-1.5 h-4" style={{ color: 'var(--text-muted)' }}>
          {status === 'saving' && t('profile.goals.saving')}
          {status === 'saved' && t('profile.goals.saved')}
          {status === 'error' && t('profile.goals.error')}
        </p>
      </section>
    </div>
  )
}
