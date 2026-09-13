import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ListChecks, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { categoriesApi, transactionsApi, TRANSACTIONS_POLL_MS } from '../api/client'
import { CategoryGlyph } from '../components/CategoryGlyph'
import { Skeleton } from '../components/Skeleton'
import { TransactionModal } from '../components/TransactionModal'
import { useAmountVisibility } from '../context/AmountVisibilityContext'
import { useToast } from '../context/ToastContext'
import { translateCategoryName } from '../i18n/defaultCategories'
import { useLanguage } from '../i18n/LanguageContext'
import { toDisplayTransaction, type DisplayTransaction } from '../lib/analytics'
import type { Transaction, TransactionType } from '../api/types'

export function TransactionsPage() {
  const { t, locale } = useLanguage()
  const { mask } = useAmountVisibility()
  const toast = useToast()
  const queryClient = useQueryClient()
  const { data: transactions = [], isPending: txPending } = useQuery({
    queryKey: ['transactions'],
    queryFn: transactionsApi.list,
    refetchInterval: TRANSACTIONS_POLL_MS,
  })
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list })

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | TransactionType>('all')
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const deleteTx = useMutation({
    mutationFn: transactionsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      toast(t('toast.txDeleted'))
    },
    onError: () => toast(t('toast.error'), 'error'),
  })

  const bulkDeleteTx = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => transactionsApi.delete(id))),
    onSuccess: (_result, ids) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      toast(t('toast.txsDeleted').replace('{count}', String(ids.length)))
      setSelectedIds(new Set())
      setSelectMode(false)
    },
    onError: () => toast(t('toast.error'), 'error'),
  })

  const toggleSelectMode = () => {
    setSelectMode((prev) => !prev)
    setSelectedIds(new Set())
  }
  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const toggleSelectDay = (txs: DisplayTransaction[]) => {
    setSelectedIds((prev) => {
      const allSelected = txs.every((tx) => prev.has(tx.id))
      const next = new Set(prev)
      for (const tx of txs) {
        if (allSelected) next.delete(tx.id)
        else next.add(tx.id)
      }
      return next
    })
  }

  const display = useMemo(() => {
    return transactions
      .map((t) => toDisplayTransaction(t, categories))
      .filter((t) => filter === 'all' || t.type === filter)
      .filter((t) => !search || t.searchText.includes(search.toLowerCase()))
      .sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [transactions, categories, filter, search])

  const grouped = useMemo(() => {
    const groups = new Map<string, DisplayTransaction[]>()
    for (const tx of display) {
      const key = tx.date.toDateString()
      groups.set(key, [...(groups.get(key) ?? []), tx])
    }
    return [...groups.entries()]
  }, [display])

  return (
    <div className="max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t('tx.title')}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSelectMode}
            className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium"
            style={{ background: 'var(--surface-secondary)', color: selectMode ? 'var(--text-muted)' : 'var(--text)' }}
          >
            {selectMode ? (
              t('tx.selectCancel')
            ) : (
              <>
                <ListChecks size={14} /> {t('tx.select')}
              </>
            )}
          </button>
          {!selectMode && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-[var(--accent-text)]"
              style={{ background: 'var(--accent)' }}
            >
              <Plus size={16} /> {t('tx.add')}
            </motion.button>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <div
          className="flex-1 flex items-center gap-2 rounded-xl px-3"
          style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}
        >
          <Search size={15} style={{ color: 'var(--text-muted)' }} />
          <input
            placeholder={t('tx.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 py-2 text-sm bg-transparent outline-none"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as 'all' | TransactionType)}
          className="rounded-xl px-3 text-sm"
          style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}
        >
          <option value="all">{t('tx.filterAll')}</option>
          <option value="expense">{t('tx.expense')}</option>
          <option value="income">{t('tx.income')}</option>
        </select>
      </div>

      {txPending && (
        <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: 'var(--surface-secondary)' }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-full shrink-0" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      )}

      {!txPending && grouped.length === 0 && (
        <p className="text-sm text-center py-10" style={{ color: 'var(--text-muted)' }}>
          {t('tx.empty')}
        </p>
      )}

      {grouped.map(([day, txs], groupIndex) => (
        <motion.div
          key={day}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: groupIndex * 0.03 }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            {selectMode && (
              <button
                onClick={() => toggleSelectDay(txs)}
                className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                style={
                  txs.every((tx) => selectedIds.has(tx.id))
                    ? { background: 'var(--accent)', color: 'var(--accent-text)' }
                    : { border: '1px solid var(--border)' }
                }
                aria-label={t('tx.selectDay')}
              >
                {txs.every((tx) => selectedIds.has(tx.id)) && <Check size={13} strokeWidth={3} />}
              </button>
            )}
            <p
              className={selectMode ? 'text-xs font-semibold cursor-pointer' : 'text-xs font-semibold'}
              style={{ color: 'var(--text-muted)' }}
              onClick={selectMode ? () => toggleSelectDay(txs) : undefined}
            >
              {new Date(day).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface-secondary)' }}>
            <AnimatePresence initial={false}>
              {txs.map((tx, i) => {
                const isSelected = selectedIds.has(tx.id)
                return (
                  <motion.div
                    key={tx.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="group flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
                    style={i > 0 ? { borderTop: '1px solid var(--border)' } : {}}
                    onClick={() =>
                      selectMode
                        ? toggleSelected(tx.id)
                        : setEditing(transactions.find((t) => t.id === tx.id) ?? null)
                    }
                  >
                    {selectMode && (
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
                    )}
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: `#${tx.categoryColorHex}2e` }}
                    >
                      <CategoryGlyph iconName={tx.categoryIconName} size={16} color={`#${tx.categoryColorHex}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{translateCategoryName(tx.categoryName, t)}</p>
                      {tx.note && (
                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                          {tx.note}
                        </p>
                      )}
                    </div>
                    <p className="text-sm font-semibold" style={{ color: `var(--${tx.tint})` }}>
                      {mask(tx.amountText)}
                    </p>
                    {!selectMode && (
                      <>
                        <Pencil size={14} className="opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteTx.mutate(tx.id)
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 shrink-0"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </motion.div>
      ))}

      <AnimatePresence>
        {selectMode && selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 rounded-2xl pl-5 pr-3 py-3 shadow-2xl"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <p className="text-sm font-semibold whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
              {t('tx.selectedCount').replace('{count}', String(selectedIds.size))}
            </p>
            <button
              onClick={() => bulkDeleteTx.mutate(Array.from(selectedIds))}
              disabled={bulkDeleteTx.isPending}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-red-500 whitespace-nowrap disabled:opacity-50"
              style={{ background: 'var(--surface-secondary)', border: '1px solid color-mix(in srgb, var(--expense) 40%, transparent)' }}
            >
              <Trash2 size={16} />
              {t('tx.deleteSelected').replace('{count}', String(selectedIds.size))}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAdd && <TransactionModal categories={categories} onClose={() => setShowAdd(false)} />}
        {editing && <TransactionModal categories={categories} editing={editing} onClose={() => setEditing(null)} />}
      </AnimatePresence>
    </div>
  )
}
