import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Check, ListOrdered, Link2, PieChart, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { monobankApi } from '../api/client'
import { useLanguage } from '../i18n/LanguageContext'

const DISMISS_KEY = 'onboardingStore.dismissed'
const VISITED_ANALYTICS_KEY = 'onboardingStore.visitedAnalytics'

export function markAnalyticsVisited() {
  localStorage.setItem(VISITED_ANALYTICS_KEY, '1')
}

export function OnboardingChecklist({ hasTransactions }: { hasTransactions: boolean }) {
  const { t } = useLanguage()
  const { data: monobank } = useQuery({ queryKey: ['monobank'], queryFn: monobankApi.status })
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1')
  const [visitedAnalytics] = useState(() => localStorage.getItem(VISITED_ANALYTICS_KEY) === '1')

  const steps = [
    { done: hasTransactions, icon: ListOrdered, labelKey: 'onboarding.step1' as const, to: '/app/transactions' },
    { done: !!monobank?.isConnected, icon: Link2, labelKey: 'onboarding.step2' as const, to: '/app/profile/integrations' },
    { done: visitedAnalytics, icon: PieChart, labelKey: 'onboarding.step3' as const, to: '/app/analytics' },
  ]
  const allDone = steps.every((s) => s.done)

  if (dismissed || allDone) return null

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden relative"
      style={{ background: 'var(--surface-secondary)' }}
    >
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-3 top-3 w-6 h-6 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5"
        style={{ color: 'var(--text-muted)' }}
      >
        <X size={13} />
      </button>
      <p className="px-4 pt-3 pb-1 text-sm font-semibold pr-8">{t('onboarding.title')}</p>
      {steps.map((step, i) => (
        <Link
          key={step.labelKey}
          to={step.to}
          className="flex items-center gap-3 px-4 py-2.5 hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
          style={i > 0 ? { borderTop: '1px solid var(--border)' } : {}}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
            style={
              step.done
                ? { background: 'var(--income)', color: 'white' }
                : { background: 'color-mix(in srgb, var(--accent) 16%, transparent)', color: 'var(--accent)' }
            }
          >
            {step.done ? <Check size={14} /> : <step.icon size={14} />}
          </div>
          <p
            className="text-sm flex-1"
            style={step.done ? { color: 'var(--text-muted)', textDecoration: 'line-through' } : {}}
          >
            {t(step.labelKey)}
          </p>
        </Link>
      ))}
    </motion.div>
  )
}
