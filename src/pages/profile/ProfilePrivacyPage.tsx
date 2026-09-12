import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { authApi } from '../../api/client'
import { useAuth } from '../../context/AppProviders'
import { useToast } from '../../context/ToastContext'
import { useLanguage } from '../../i18n/LanguageContext'
import { describeUserAgent } from '../../lib/userAgent'

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
      {children}
    </div>
  )
}

export function ProfilePrivacyPage() {
  const { user } = useAuth()
  const { t, locale } = useLanguage()
  const toast = useToast()
  const queryClient = useQueryClient()
  const { data: sessions = [] } = useQuery({ queryKey: ['sessions'], queryFn: () => authApi.sessions().then((r) => r.sessions) })
  const revoke = useMutation({
    mutationFn: authApi.revokeSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      toast(t('toast.sessionRevoked'))
    },
    onError: () => toast(t('toast.error'), 'error'),
  })

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
          {t('profile.privacy.title')}
        </p>
        <div className="rounded-2xl overflow-hidden [&>*:first-child]:border-t-0" style={{ background: 'var(--surface-secondary)' }}>
          <Row>
            <p className="text-sm">{t('profile.privacy.email')}</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {user?.email}
            </p>
          </Row>
          <Row>
            <p className="text-sm">{t('profile.privacy.memberSince')}</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {user ? new Date(user.createdAt).toLocaleDateString(locale) : ''}
            </p>
          </Row>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
          {t('profile.privacy.sessions')}
        </p>
        <div className="rounded-2xl overflow-hidden [&>*:first-child]:border-t-0" style={{ background: 'var(--surface-secondary)' }}>
          {sessions.length === 0 && (
            <p className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>
              {t('profile.privacy.sessionsEmpty')}
            </p>
          )}
          {sessions.map((s) => (
            <Row key={s.id}>
              <div>
                <p className="text-sm font-medium">
                  {describeUserAgent(s.userAgent)}
                  {s.current && (
                    <span className="ml-2 text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                      · {t('profile.privacy.currentSession')}
                    </span>
                  )}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {new Date(s.createdAt).toLocaleString(locale)}
                </p>
              </div>
              {!s.current && (
                <button
                  onClick={() => revoke.mutate(s.id)}
                  disabled={revoke.isPending}
                  className="text-sm font-medium text-red-500 disabled:opacity-50"
                >
                  {t('profile.privacy.revoke')}
                </button>
              )}
            </Row>
          ))}
        </div>
      </div>

      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        {t('profile.privacy.dataNote')}
      </p>
    </motion.div>
  )
}
