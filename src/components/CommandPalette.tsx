import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Eye,
  EyeOff,
  LayoutDashboard,
  ListOrdered,
  Moon,
  PieChart,
  Plus,
  Sparkles,
  Sun,
  Tags,
  User,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { categoriesApi } from '../api/client'
import { useAmountVisibility } from '../context/AmountVisibilityContext'
import { useAuth } from '../context/AppProviders'
import { useLanguage } from '../i18n/LanguageContext'
import { TransactionModal } from './TransactionModal'
import type { TranslationKey } from '../i18n/translations'

interface Command {
  id: string
  labelKey: TranslationKey
  icon: typeof Plus
  run: () => void
}

export function CommandPalette() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { resolvedTheme, setTheme } = useAuth()
  const { hidden, toggle: toggleHidden } = useAmountVisibility()
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list })

  const [open, setOpen] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    const onOpenEvent = () => setOpen(true)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('command-palette:open', onOpenEvent)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('command-palette:open', onOpenEvent)
    }
  }, [])

  const commands: Command[] = useMemo(
    () => [
      { id: 'add-tx', labelKey: 'tx.add', icon: Plus, run: () => setShowAdd(true) },
      { id: 'go-overview', labelKey: 'nav.overview', icon: LayoutDashboard, run: () => navigate('/app') },
      { id: 'go-tx', labelKey: 'nav.transactions', icon: ListOrdered, run: () => navigate('/app/transactions') },
      { id: 'go-cat', labelKey: 'nav.categories', icon: Tags, run: () => navigate('/app/categories') },
      { id: 'go-an', labelKey: 'nav.analytics', icon: PieChart, run: () => navigate('/app/analytics') },
      { id: 'open-felix', labelKey: 'felix.name', icon: Sparkles, run: () => window.dispatchEvent(new Event('felix:open')) },
      { id: 'go-profile', labelKey: 'profile.title', icon: User, run: () => navigate('/app/profile') },
      {
        id: 'toggle-theme',
        labelKey: resolvedTheme === 'dark' ? 'nav.theme.light' : 'nav.theme.dark',
        icon: resolvedTheme === 'dark' ? Sun : Moon,
        run: () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'),
      },
      {
        id: 'toggle-amounts',
        labelKey: hidden ? 'nav.amounts.show' : 'nav.amounts.hide',
        icon: hidden ? EyeOff : Eye,
        run: toggleHidden,
      },
    ],
    [resolvedTheme, hidden, navigate, setTheme, toggleHidden],
  )

  const filtered = commands.filter((c) => t(c.labelKey).toLowerCase().includes(query.toLowerCase()))

  const runAndClose = (cmd: Command) => {
    cmd.run()
    setOpen(false)
    setQuery('')
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-30 flex items-start justify-center bg-black/40 pt-[15vh] px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              initial={{ opacity: 0, scale: 0.96, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -4 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            >
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('palette.placeholder')}
                className="w-full px-4 py-3 text-sm outline-none"
                style={{ borderBottom: '1px solid var(--border)', background: 'transparent' }}
              />
              <div className="max-h-72 overflow-y-auto py-1.5">
                {filtered.length === 0 && (
                  <p className="px-4 py-4 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                    {t('palette.empty')}
                  </p>
                )}
                {filtered.map((cmd) => (
                  <button
                    key={cmd.id}
                    onClick={() => runAndClose(cmd)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
                  >
                    <cmd.icon size={16} style={{ color: 'var(--text-muted)' }} />
                    {t(cmd.labelKey)}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>{showAdd && <TransactionModal categories={categories} onClose={() => setShowAdd(false)} />}</AnimatePresence>
    </>
  )
}
