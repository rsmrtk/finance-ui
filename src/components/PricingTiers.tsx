import { useMutation } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import { billingApi, ApiError } from '../api/client'
import { useLanguage } from '../i18n/LanguageContext'
import { redirectToLiqPayCheckout } from '../lib/liqpay'
import type { Plan, User } from '../api/types'
import type { TranslationKey } from '../i18n/translations'

interface Tier {
  id: Plan
  name: string
  price: string
  hasPeriod?: boolean
  featureKeys: TranslationKey[]
}

const TIERS: Tier[] = [
  { id: 'free', name: 'Free', price: '$0', featureKeys: ['pricing.free.f1', 'pricing.free.f2', 'pricing.free.f3', 'pricing.free.f4'] },
  {
    id: 'pro',
    name: 'Pro',
    price: '$15',
    hasPeriod: true,
    featureKeys: ['pricing.pro.f1', 'pricing.pro.f2', 'pricing.pro.f3', 'pricing.pro.f4'],
  },
  {
    id: 'max',
    name: 'Max',
    price: '$99',
    hasPeriod: true,
    featureKeys: ['pricing.max.f1', 'pricing.max.f2', 'pricing.max.f3', 'pricing.max.f4'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '',
    featureKeys: ['pricing.enterprise.f1', 'pricing.enterprise.f2', 'pricing.enterprise.f3', 'pricing.enterprise.f4'],
  },
]

// Pro and Max are both real purchases via LiqPay (see lib/liqpay) —
// Enterprise is a mailto:, and Free needs no button. `user` is only
// passed when signed in (ProfilePlanPage); the logged-out landing page
// omits it and every tier falls back to its plain informational state.
export function PricingTiers({ user }: { user?: User }) {
  const { t } = useLanguage()

  const startTrial = useMutation({
    mutationFn: billingApi.startTrial,
    onSuccess: (checkout) => redirectToLiqPayCheckout(checkout.url, checkout.data, checkout.signature),
  })
  const subscribe = useMutation({
    mutationFn: (plan: string) => billingApi.subscribe(plan),
    onSuccess: (checkout) => redirectToLiqPayCheckout(checkout.url, checkout.data, checkout.signature),
  })

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {TIERS.map((tier) => {
        const isCurrent = user?.plan === tier.id
        const canPurchase = (tier.id === 'pro' || tier.id === 'max') && !!user && !isCurrent && !user.subscriptionStatus
        const pending = tier.id === 'max' ? startTrial.isPending : subscribe.isPending
        const purchaseError = tier.id === 'max' ? startTrial.error : subscribe.error
        return (
          <div
            key={tier.id}
            className="rounded-2xl p-5 flex flex-col gap-4"
            style={{
              background: 'var(--surface)',
              border: isCurrent ? '2px solid var(--accent)' : '1px solid var(--border)',
            }}
          >
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
                {tier.name}
              </p>
              <p className="text-2xl font-bold mt-1">
                {tier.id === 'enterprise' ? t('pricing.onRequest') : tier.price}
                {tier.hasPeriod && (
                  <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>
                    {t('pricing.perMonth')}
                  </span>
                )}
              </p>
            </div>
            <ul className="flex flex-col gap-2 flex-1">
              {tier.featureKeys.map((key) => (
                <li key={key} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <Check size={14} className="shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                  {t(key)}
                </li>
              ))}
            </ul>
            {isCurrent ? (
              <div
                className="rounded-xl px-3 py-2 text-xs font-semibold text-center"
                style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
              >
                {t('pricing.current')}
              </div>
            ) : tier.id === 'enterprise' ? (
              <a
                href="mailto:martun.ros.dev@gmail.com?subject=Vaultly%20Enterprise"
                className="rounded-xl px-3 py-2 text-xs font-semibold text-center"
                style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
              >
                {t('pricing.contact')}
              </a>
            ) : canPurchase ? (
              <>
                <button
                  onClick={() => (tier.id === 'max' ? startTrial.mutate() : subscribe.mutate(tier.id))}
                  disabled={pending}
                  className="rounded-xl px-3 py-2 text-xs font-semibold text-center disabled:opacity-60"
                  style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
                >
                  {pending ? t('pricing.redirecting') : tier.id === 'max' ? t('pricing.startTrial') : t('pricing.buyNow')}
                </button>
                {purchaseError && (
                  <p className="text-[11px] text-red-500 text-center -mt-2">
                    {purchaseError instanceof ApiError ? purchaseError.message : t('pricing.trialError')}
                  </p>
                )}
              </>
            ) : (
              <button
                disabled
                className="rounded-xl px-3 py-2 text-xs font-semibold text-center cursor-not-allowed opacity-60"
                style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}
                title={t('pricing.notWiredUp')}
              >
                {t('pricing.soon')}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
