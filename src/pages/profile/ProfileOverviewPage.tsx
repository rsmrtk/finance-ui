import { motion } from 'framer-motion'
import { Camera } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { authApi } from '../../api/client'
import { FinancialScoreGauge } from '../../components/FinancialScoreGauge'
import { useAuth } from '../../context/AppProviders'
import { useLanguage } from '../../i18n/LanguageContext'
import { resizeImageToDataUrl } from '../../lib/avatar'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function ProfileOverviewPage() {
  const { user, refreshUser } = useAuth()
  const { t, locale } = useLanguage()

  const [goals, setGoals] = useState(user?.goals ?? '')
  const [goalsStatus, setGoalsStatus] = useState<SaveStatus>('idle')
  const goalsDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [name, setName] = useState(user?.name ?? '')
  const [avatarError, setAvatarError] = useState(false)
  const nameDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setGoals(user?.goals ?? '')
  }, [user?.goals])
  useEffect(() => {
    setName(user?.name ?? '')
  }, [user?.name])

  const onGoalsChange = (value: string) => {
    setGoals(value)
    setGoalsStatus('saving')
    if (goalsDebounce.current) clearTimeout(goalsDebounce.current)
    goalsDebounce.current = setTimeout(async () => {
      try {
        const res = await authApi.updateGoals(value)
        refreshUser(res.user)
        setGoalsStatus('saved')
      } catch {
        setGoalsStatus('error')
      }
    }, 700)
  }

  const onNameChange = (value: string) => {
    setName(value)
    if (nameDebounce.current) clearTimeout(nameDebounce.current)
    nameDebounce.current = setTimeout(async () => {
      try {
        const res = await authApi.updateProfile(value, user?.avatar ?? '')
        refreshUser(res.user)
      } catch {
        // A failed name save just silently keeps the previous server value
        // next render — nothing destructive enough here to warrant an
        // error banner on every keystroke pause.
      }
    }, 700)
  }

  const onAvatarPick = async (file: File | undefined) => {
    if (!file) return
    setAvatarError(false)
    try {
      const dataUrl = await resizeImageToDataUrl(file)
      const res = await authApi.updateProfile(name, dataUrl)
      refreshUser(res.user)
    } catch {
      setAvatarError(true)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-5 flex items-center gap-4"
        style={{ background: 'var(--surface-secondary)' }}
      >
        <button
          onClick={() => fileInputRef.current?.click()}
          aria-label={t('profile.avatar.change')}
          className="relative w-16 h-16 rounded-full shrink-0 overflow-hidden group"
        >
          {user?.avatar ? (
            <img src={user.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-xl font-bold"
              style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
            >
              {(user?.name || user?.email || '?').slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera size={18} color="white" />
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onAvatarPick(e.target.files?.[0])}
        />
        <div className="min-w-0 flex-1">
          <input
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder={t('profile.name.placeholder')}
            maxLength={80}
            className="text-sm font-semibold bg-transparent outline-none w-full"
          />
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {t('profile.memberSince')} {user ? new Date(user.createdAt).toLocaleDateString(locale, { month: 'long', year: 'numeric' }) : ''}
          </p>
          {avatarError && (
            <p className="text-xs text-red-500 mt-0.5">{t('profile.avatar.error')}</p>
          )}
        </div>
      </motion.div>

      <FinancialScoreGauge />

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
          {goalsStatus === 'saving' && t('profile.goals.saving')}
          {goalsStatus === 'saved' && t('profile.goals.saved')}
          {goalsStatus === 'error' && t('profile.goals.error')}
        </p>
      </section>
    </div>
  )
}
