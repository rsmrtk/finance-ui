import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useState } from 'react'
import { transactionsApi } from '../api/client'
import { useAuth } from '../context/AppProviders'
import { useToast } from '../context/ToastContext'
import { translateCategoryName } from '../i18n/defaultCategories'
import { useLanguage } from '../i18n/LanguageContext'
import { CategoryGlyph } from './CategoryGlyph'
import { DatePicker } from './DatePicker'
import type { Category, Transaction, TransactionType } from '../api/types'

export function TransactionModal({
  categories,
  editing,
  onClose,
}: {
  categories: Category[]
  editing?: Transaction
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { t } = useLanguage()
  const toast = useToast()
  const [type, setType] = useState<TransactionType>(editing?.type ?? 'expense')
  const [amount, setAmount] = useState(editing?.amount ?? '')
  const [categoryId, setCategoryId] = useState(editing?.categoryId ?? '')
  const [date, setDate] = useState(() => (editing ? editing.date.slice(0, 10) : new Date().toISOString().slice(0, 10)))
  const [note, setNote] = useState(editing?.note ?? '')

  const filtered = categories.filter((c) => c.type === type)

  const save = useMutation({
    mutationFn: (input: Parameters<typeof transactionsApi.create>[0]) =>
      editing ? transactionsApi.update(editing.id, input) : transactionsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      toast(t('toast.txSaved'))
      onClose()
    },
    onError: () => toast(t('toast.error'), 'error'),
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || Number(amount) <= 0 || !categoryId) return
    save.mutate({
      categoryId,
      amount: Number(amount).toFixed(2),
      currency: editing?.currency ?? user?.baseCurrency ?? 'UAH',
      type,
      date: new Date(date).toISOString(),
      note,
    })
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
        className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-3"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        initial={{ opacity: 0, scale: 0.94, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 6 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-bold">{editing ? t('tx.editTitle') : t('tx.newTitle')}</h2>
          <button type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
          {(['expense', 'income'] as const).map((txType) => (
            <button
              key={txType}
              type="button"
              onClick={() => {
                setType(txType)
                setCategoryId('')
              }}
              className="relative flex-1 py-2 text-sm font-medium"
            >
              {type === txType && (
                <motion.div
                  layoutId="tx-type-pill"
                  className="absolute inset-0"
                  style={{ background: 'var(--accent)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative" style={type === txType ? { color: 'var(--accent-text)' } : {}}>
                {txType === 'expense' ? t('tx.typeExpense') : t('tx.typeIncome')}
              </span>
            </button>
          ))}
        </div>

        <div className="relative">
          <input
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder={t('tx.amount')}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            // The browser's native up/down spinner buttons don't make sense
            // for typing an amount — hidden here (both engines need their
            // own rule) so the currency label can sit in that spot instead.
            className="amount-input w-full rounded-xl pl-4 pr-14 py-2.5 text-lg font-semibold outline-none"
            style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}
          />
          <span
            className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold pointer-events-none"
            style={{ color: 'var(--text-muted)' }}
          >
            {editing?.currency ?? user?.baseCurrency ?? 'UAH'}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {filtered.map((c) => {
            const selected = c.id === categoryId
            return (
              <motion.button
                key={c.id}
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={() => setCategoryId(c.id)}
                className="flex flex-col items-center gap-1 w-16"
              >
                <motion.div
                  animate={{ scale: selected ? 1.08 : 1 }}
                  className="w-11 h-11 rounded-full flex items-center justify-center"
                  style={{
                    background: `#${c.colorHex}2e`,
                    outline: selected ? `2px solid #${c.colorHex}` : 'none',
                    outlineOffset: 2,
                  }}
                >
                  <CategoryGlyph iconName={c.iconName} size={18} color={`#${c.colorHex}`} />
                </motion.div>
                <span className="text-[11px] truncate w-full text-center">{translateCategoryName(c.name, t)}</span>
              </motion.button>
            )
          })}
        </div>

        <DatePicker value={date} onChange={setDate} />
        <input
          placeholder={t('tx.note')}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="rounded-xl px-4 py-2.5 text-sm outline-none"
          style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}
        />

        <motion.button
          whileTap={{ scale: 0.97 }}
          type="submit"
          disabled={save.isPending || !amount || !categoryId}
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[var(--accent-text)] disabled:opacity-50 mt-2"
          style={{ background: 'var(--accent)' }}
        >
          {t('tx.save')}
        </motion.button>
      </motion.form>
    </motion.div>
  )
}
