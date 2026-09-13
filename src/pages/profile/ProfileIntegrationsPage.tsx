import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Check, Lock } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, monobankApi } from '../../api/client'
import type { MonobankAccount } from '../../api/types'
import { useAuth } from '../../context/AppProviders'
import { useToast } from '../../context/ToastContext'
import { useLanguage } from '../../i18n/LanguageContext'
import { formatSyncStatus } from '../../lib/syncStatus'
import { monobankAccountTypeLabel } from '../../lib/monobankAccountLabel'
import { allowsMonobank } from '../../lib/plan'

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
      {children}
    </div>
  )
}

export function ProfileIntegrationsPage() {
  const { t, locale } = useLanguage()
  const { user } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const { data: monobank, isLoading: monobankLoading } = useQuery({ queryKey: ['monobank'], queryFn: monobankApi.status })
  const [token, setToken] = useState('')
  const [accounts, setAccounts] = useState<MonobankAccount[] | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isEditing, setIsEditing] = useState(false)
  const unlocked = !!user && allowsMonobank(user.plan)

  const closePicker = () => {
    setAccounts(null)
    setIsEditing(false)
    setSelectedIds(new Set())
  }

  const fetchAccounts = useMutation({
    mutationFn: monobankApi.accounts,
    onSuccess: (result) => {
      setAccounts(result)
      setSelectedIds(new Set())
      setIsEditing(false)
    },
  })
  const editAccounts = useMutation({
    mutationFn: monobankApi.myAccounts,
    onSuccess: (result) => {
      setAccounts(result)
      setSelectedIds(new Set(result.filter((a) => a.selected).map((a) => a.id)))
      setIsEditing(true)
    },
  })
  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const connect = useMutation({
    mutationFn: () => {
      const chosen = (accounts ?? []).filter((a) => selectedIds.has(a.id))
      return monobankApi.connect(
        token,
        chosen.map((a) => a.id),
        chosen.map((a) => a.maskedPan),
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monobank'] })
      toast(t('toast.monoConnected'))
      setToken('')
      closePicker()
    },
  })
  const updateAccounts = useMutation({
    mutationFn: () => {
      const chosen = (accounts ?? []).filter((a) => selectedIds.has(a.id))
      return monobankApi.updateAccounts(
        chosen.map((a) => a.id),
        chosen.map((a) => a.maskedPan),
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monobank'] })
      toast(t('toast.monoConnected'))
      closePicker()
    },
  })
  const savePicker = isEditing ? updateAccounts : connect
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
        {monobankLoading ? (
          // Never fall through to the "enter token" form while the real
          // status is still in flight — doing so briefly shows "not
          // connected" on every page load even for an already-connected
          // account, which reads as the connection not having saved.
          <div className="p-4 h-[52px] animate-pulse" />
        ) : accounts ? (
          <div className="p-4 flex flex-col gap-2">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {t('profile.integrations.chooseAccount')}
            </p>
            <div className="flex flex-col gap-2">
              {accounts.map((account) => {
                const isSelected = selectedIds.has(account.id)
                return (
                  <button
                    key={account.id}
                    onClick={() => toggleSelected(account.id)}
                    disabled={savePicker.isPending}
                    className="rounded-xl px-3 py-2.5 text-sm flex items-center gap-3 disabled:opacity-50 text-left"
                    style={{
                      background: 'var(--surface)',
                      border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
                    }}
                  >
                    <span
                      className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                      style={
                        isSelected
                          ? { background: 'var(--accent)', color: 'var(--accent-text)' }
                          : { border: '1px solid var(--border)' }
                      }
                    >
                      {isSelected && <Check size={13} strokeWidth={3} />}
                    </span>
                    <span className="font-medium flex-1">{monobankAccountTypeLabel(account.type, locale)}</span>
                    <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                      {account.currency} {account.maskedPan || '••••'}
                    </span>
                  </button>
                )
              })}
            </div>
            {savePicker.isError && (
              <p className="text-xs text-red-500">
                {savePicker.error instanceof ApiError ? savePicker.error.message : t('profile.integrations.error')}
              </p>
            )}
            <div className="flex items-center justify-between mt-1">
              <button
                onClick={closePicker}
                disabled={savePicker.isPending}
                className="text-xs font-medium"
                style={{ color: 'var(--text-muted)' }}
              >
                {t('profile.integrations.back')}
              </button>
              <button
                onClick={() => savePicker.mutate()}
                disabled={selectedIds.size === 0 || savePicker.isPending}
                className="rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
                style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
              >
                {isEditing ? t('profile.integrations.save') : t('profile.integrations.connect')}
              </button>
            </div>
          </div>
        ) : monobank?.isConnected ? (
          <>
            {(monobank.maskedPans.length > 0 ? monobank.maskedPans : ['••••']).map((pan, i) => (
              <Row key={pan + i}>
                <p className="text-sm">{t('profile.integrations.card')}</p>
                <p className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>
                  {pan}
                </p>
              </Row>
            ))}
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
              <button
                onClick={() => editAccounts.mutate()}
                disabled={editAccounts.isPending}
                className="text-sm font-medium disabled:opacity-50"
                style={{ color: 'var(--accent)' }}
              >
                {t('profile.integrations.edit')}
              </button>
            </Row>
            {editAccounts.isError && (
              <Row>
                <p className="text-xs text-red-500">
                  {editAccounts.error instanceof ApiError ? editAccounts.error.message : t('profile.integrations.accountsError')}
                </p>
              </Row>
            )}
            <Row>
              <button onClick={() => disconnect.mutate()} className="text-sm font-medium text-red-500">
                {t('profile.integrations.disconnect')}
              </button>
            </Row>
          </>
        ) : !unlocked ? (
          <div className="p-4 flex flex-col items-center text-center gap-2">
            <Lock size={18} style={{ color: 'var(--accent)' }} />
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {t('profile.integrations.locked')}
            </p>
            <Link
              to="/app/profile/plan"
              className="rounded-xl px-4 py-2 text-sm font-semibold"
              style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
            >
              {t('felix.upgrade')}
            </Link>
          </div>
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
                onClick={() => token && fetchAccounts.mutate(token)}
                disabled={!token || fetchAccounts.isPending}
                className="rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
                style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
              >
                {t('profile.integrations.continue')}
              </button>
            </div>
            {fetchAccounts.isError && (
              <p className="text-xs text-red-500">
                {fetchAccounts.error instanceof ApiError ? fetchAccounts.error.message : t('profile.integrations.accountsError')}
              </p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
