import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { authApi, billingApi } from '../../api/client'
import { PricingTiers } from '../../components/PricingTiers'
import { useAuth } from '../../context/AppProviders'
import { useToast } from '../../context/ToastContext'
import { useLanguage } from '../../i18n/LanguageContext'
import type { TranslationKey } from '../../i18n/translations'

const RECEIPT_STATUS_KEYS: Record<string, TranslationKey> = {
  subscribed: 'profile.plan.receiptStatus.subscribed',
  success: 'profile.plan.receiptStatus.success',
  failure: 'profile.plan.receiptStatus.failure',
  error: 'profile.plan.receiptStatus.error',
  unsubscribed: 'profile.plan.receiptStatus.unsubscribed',
}

export function ProfilePlanPage() {
  const { user, refreshUser } = useAuth()
  const { t, locale } = useLanguage()
  const toast = useToast()
  const queryClient = useQueryClient()

  const cancel = useMutation({
    mutationFn: billingApi.cancel,
    onSuccess: async () => {
      const { user: fresh } = await authApi.me()
      refreshUser(fresh)
      queryClient.invalidateQueries()
      toast(t('profile.plan.canceled'))
    },
  })

  const isTrialing = user?.subscriptionStatus === 'trialing' || user?.subscriptionStatus === 'active'
  const { data: receipts } = useQuery({ queryKey: ['receipts'], queryFn: billingApi.receipts, enabled: !!user })

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
          {t('profile.plan.current')}
        </p>
        <span
          className="text-[11px] px-2 py-0.5 rounded-full font-semibold uppercase"
          style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
        >
          {user?.plan ?? 'free'}
        </span>
      </div>

      {user?.subscriptionStatus === 'trialing' && user.trialEndsAt && (
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          {t('profile.plan.trialUntil')} {new Date(user.trialEndsAt).toLocaleDateString(locale)}
        </p>
      )}

      <PricingTiers user={user ?? undefined} />

      {isTrialing && (
        <div className="mt-4">
          <button
            onClick={() => cancel.mutate()}
            disabled={cancel.isPending}
            className="text-sm font-medium text-red-500 disabled:opacity-50"
          >
            {t('profile.plan.cancel')}
          </button>
        </div>
      )}

      {receipts && receipts.length > 0 && (
        <div className="mt-6">
          <p className="text-sm font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
            {t('profile.plan.receipts')}
          </p>
          <div className="rounded-2xl overflow-hidden [&>*:first-child]:border-t-0" style={{ background: 'var(--surface-secondary)' }}>
            {receipts.map((receipt) => (
              <div
                key={receipt.orderId + receipt.createdAt}
                className="flex items-center justify-between px-4 py-3"
                style={{ borderTop: '1px solid var(--border)' }}
              >
                <div>
                  <p className="text-sm capitalize">{receipt.plan}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {new Date(receipt.createdAt).toLocaleString(locale)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono">
                    {receipt.amount > 0 ? `${receipt.amount.toFixed(2)} ${receipt.currency}` : '—'}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: receipt.status === 'success' ? 'var(--income)' : 'var(--text-muted)' }}
                  >
                    {t(RECEIPT_STATUS_KEYS[receipt.status] ?? 'profile.plan.receiptStatus.error')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}
