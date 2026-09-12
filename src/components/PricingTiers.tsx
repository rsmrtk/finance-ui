import { Check } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'
import type { Plan } from '../api/types'
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

// No billing is wired up yet — every non-Free tier is honestly labeled
// "coming soon" rather than pretending an upgrade button does something
// it doesn't. currentPlan (when known, i.e. the user is signed in) gets a
// "current plan" badge instead of a button.
export function PricingTiers({ currentPlan }: { currentPlan?: Plan }) {
  const { t } = useLanguage()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {TIERS.map((tier) => {
        const isCurrent = currentPlan === tier.id
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
            ) : (
              <button
                disabled
                className="rounded-xl px-3 py-2 text-xs font-semibold text-center cursor-not-allowed opacity-60"
                style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}
                title={t('pricing.notWiredUp')}
              >
                {tier.id === 'enterprise' ? t('pricing.contact') : t('pricing.soon')}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
