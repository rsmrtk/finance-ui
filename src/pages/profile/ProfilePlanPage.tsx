import { motion } from 'framer-motion'
import { PricingTiers } from '../../components/PricingTiers'
import { useAuth } from '../../context/AppProviders'
import { useLanguage } from '../../i18n/LanguageContext'

export function ProfilePlanPage() {
  const { user } = useAuth()
  const { t } = useLanguage()

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
      <PricingTiers currentPlan={user?.plan} />
    </motion.div>
  )
}
