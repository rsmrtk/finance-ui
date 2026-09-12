import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { categoriesApi } from '../api/client'
import { CategoryGlyph } from '../components/CategoryGlyph'
import { Skeleton } from '../components/Skeleton'
import { useToast } from '../context/ToastContext'
import { translateCategoryName } from '../i18n/defaultCategories'
import { useLanguage } from '../i18n/LanguageContext'
import { CATEGORY_COLORS, CATEGORY_EMOJIS, CATEGORY_ICONS } from '../lib/categoryPalette'
import type { TransactionType } from '../api/types'

export function CategoriesPage() {
  const { t } = useLanguage()
  const toast = useToast()
  const queryClient = useQueryClient()
  const { data: categories = [], isPending: catPending } = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list })
  const [addType, setAddType] = useState<TransactionType | null>(null)

  const deleteCategory = useMutation({
    mutationFn: categoriesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast(t('toast.catDeleted'))
    },
    onError: () => toast(t('toast.error'), 'error'),
  })

  const sections: { type: TransactionType; labelKey: 'cat.expense' | 'cat.income' }[] = [
    { type: 'expense', labelKey: 'cat.expense' },
    { type: 'income', labelKey: 'cat.income' },
  ]

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <h1 className="text-xl font-bold">{t('cat.title')}</h1>

      {catPending &&
        [0, 1].map((i) => (
          <div key={i} className="rounded-2xl p-2 flex flex-col gap-2" style={{ background: 'var(--surface-secondary)' }}>
            {[0, 1, 2].map((j) => (
              <div key={j} className="flex items-center gap-3 px-2 py-1">
                <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        ))}

      {!catPending &&
        sections.map(({ type, labelKey }, sectionIndex) => (
        <motion.div
          key={type}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: sectionIndex * 0.05 }}
        >
          <p className="text-sm font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
            {t(labelKey)}
          </p>
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface-secondary)' }}>
            <AnimatePresence initial={false}>
              {categories
                .filter((c) => c.type === type)
                .map((c, i) => (
                  <motion.div
                    key={c.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="group flex items-center gap-3 px-4 py-2.5"
                    style={i > 0 ? { borderTop: '1px solid var(--border)' } : {}}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: `#${c.colorHex}2e` }}
                    >
                      <CategoryGlyph iconName={c.iconName} size={16} color={`#${c.colorHex}`} />
                    </div>
                    <p className="flex-1 text-sm font-medium">{translateCategoryName(c.name, t)}</p>
                    {c.isDefault && (
                      <span
                        className="text-[11px] px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--border)', color: 'var(--text-muted)' }}
                      >
                        {t('cat.default')}
                      </span>
                    )}
                    {!c.isDefault && (
                      <button
                        onClick={() => deleteCategory.mutate(c.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </motion.div>
                ))}
            </AnimatePresence>
            <button
              onClick={() => setAddType(type)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium"
              style={{ color: 'var(--accent)', borderTop: '1px solid var(--border)' }}
            >
              <Plus size={16} /> {t('cat.add')}
            </button>
          </div>
        </motion.div>
      ))}

      <AnimatePresence>
        {addType && <AddCategoryModal type={addType} onClose={() => setAddType(null)} />}
      </AnimatePresence>
    </div>
  )
}

function AddCategoryModal({ type, onClose }: { type: TransactionType; onClose: () => void }) {
  const { t } = useLanguage()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [glyphTab, setGlyphTab] = useState<'icon' | 'emoji'>('icon')
  const [name, setName] = useState('')
  const [iconName, setIconName] = useState<string>(CATEGORY_ICONS[0])
  const [colorHex, setColorHex] = useState<string>(CATEGORY_COLORS[0])

  const create = useMutation({
    mutationFn: categoriesApi.create,
    onError: () => toast(t('toast.error'), 'error'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast(t('toast.catCreated'))
      onClose()
    },
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    create.mutate({ name: name.trim(), iconName, colorHex, type })
  }

  return (
    <motion.div
      className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        initial={{ opacity: 0, scale: 0.94, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 6 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-bold">{t('cat.newTitle')}</h2>
          <button type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <input
          required
          autoFocus
          placeholder={t('cat.name')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-xl px-4 py-2.5 text-sm outline-none"
          style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}
        />

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              {glyphTab === 'icon' ? t('cat.icons') : t('cat.emoji')}
            </p>
            <div className="relative flex rounded-lg overflow-hidden border text-xs" style={{ borderColor: 'var(--border)' }}>
              {(['icon', 'emoji'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setGlyphTab(tab)}
                  className="relative px-2.5 py-1 font-medium"
                >
                  {glyphTab === tab && (
                    <motion.div
                      layoutId="glyph-tab-pill"
                      className="absolute inset-0"
                      style={{ background: 'var(--accent)' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className="relative" style={glyphTab === tab ? { color: 'var(--accent-text)' } : { color: 'var(--text-muted)' }}>
                    {tab === 'icon' ? t('cat.icons') : t('cat.emoji')}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {glyphTab === 'icon' ? (
            <div className="grid grid-cols-5 gap-2">
              {CATEGORY_ICONS.map((icon) => {
                const selected = icon === iconName
                return (
                  <motion.button
                    key={icon}
                    type="button"
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIconName(icon)}
                    className="aspect-square rounded-full flex items-center justify-center"
                    style={{
                      background: selected ? `#${colorHex}33` : 'var(--surface-secondary)',
                      color: selected ? `#${colorHex}` : 'var(--text)',
                    }}
                  >
                    <CategoryGlyph iconName={icon} size={18} color={selected ? `#${colorHex}` : 'var(--text)'} />
                  </motion.button>
                )
              })}
            </div>
          ) : (
            <div className="grid grid-cols-8 gap-1.5 max-h-32 overflow-y-auto">
              {CATEGORY_EMOJIS.map((emoji) => (
                <motion.button
                  key={emoji}
                  type="button"
                  whileTap={{ scale: 0.85 }}
                  onClick={() => setIconName(emoji)}
                  className="aspect-square rounded-lg flex items-center justify-center text-lg"
                  style={{ background: emoji === iconName ? `#${colorHex}33` : 'var(--surface-secondary)' }}
                >
                  {emoji}
                </motion.button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
            {t('cat.color')}
          </p>
          <div className="grid grid-cols-5 gap-2">
            {CATEGORY_COLORS.map((color) => (
              <motion.button
                key={color}
                type="button"
                whileTap={{ scale: 0.85 }}
                onClick={() => setColorHex(color)}
                className="aspect-square rounded-full"
                style={{
                  background: `#${color}`,
                  outline: color === colorHex ? '2px solid var(--text)' : 'none',
                  outlineOffset: 3,
                }}
              />
            ))}
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          type="submit"
          disabled={create.isPending || !name.trim()}
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[var(--accent-text)] disabled:opacity-50"
          style={{ background: 'var(--accent)' }}
        >
          {t('cat.save')}
        </motion.button>
      </motion.form>
    </motion.div>
  )
}
