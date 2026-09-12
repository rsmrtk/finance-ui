import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { ApiError, monobankApi } from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { useLanguage } from '../../i18n/LanguageContext'
import { formatSyncStatus } from '../../lib/syncStatus'

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
      {children}
    </div>
  )
}

export function ProfileIntegrationsPage() {
  const { t, locale } = useLanguage()
  const toast = useToast()
  const queryClient = useQueryClient()
  const { data: monobank } = useQuery({ queryKey: ['monobank'], queryFn: monobankApi.status })
  const [token, setToken] = useState('')

  const connect = useMutation({
    mutationFn: monobankApi.connect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monobank'] })
      toast(t('toast.monoConnected'))
      setToken('')
    },
  })
  const disconnect = useMutation({
    mutationFn: monobankApi.disconnect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monobank'] })
      toast(t('toast.monoDisconnected'))
    },
  })

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <p className="text-sm font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
        {t('profile.integrations.title')}
      </p>
      <div className="rounded-2xl overflow-hidden [&>*:first-child]:border-t-0" style={{ background: 'var(--surface-secondary)' }}>
        {monobank?.isConnected ? (
          <>
            <Row>
              <p className="text-sm">{t('profile.integrations.card')}</p>
              <p className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>
                {monobank.maskedPan || '••••'}
              </p>
            </Row>
            <Row>
              <p className="text-sm">{t('profile.integrations.lastSync')}</p>
              {(() => {
                const status = formatSyncStatus(monobank.lastSyncedAt, t, locale)
                return (
                  <p className="text-sm" style={{ color: status.stale ? 'var(--expense)' : 'var(--text-muted)' }}>
                    {status.label}
                  </p>
                )
              })()}
            </Row>
            <Row>
              <button onClick={() => disconnect.mutate()} className="text-sm font-medium text-red-500">
                {t('profile.integrations.disconnect')}
              </button>
            </Row>
          </>
        ) : (
          <div className="p-4 flex flex-col gap-2">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {t('profile.integrations.hint')}
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder={t('profile.integrations.tokenPlaceholder')}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="flex-1 rounded-xl px-3 py-2 text-sm outline-none"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              />
              <button
                onClick={() => token && connect.mutate(token)}
                disabled={!token || connect.isPending}
                className="rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
                style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
              >
                {t('profile.integrations.connect')}
              </button>
            </div>
            {connect.isError && (
              <p className="text-xs text-red-500">
                {connect.error instanceof ApiError ? connect.error.message : t('profile.integrations.error')}
              </p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
