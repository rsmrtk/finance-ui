import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { CheckCircle2, Download, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { ApiError, reportsApi } from '../api/client'
import { DatePicker } from '../components/DatePicker'
import { useLanguage } from '../i18n/LanguageContext'

type Period = 'month' | 'lastMonth' | 'year' | 'all' | 'custom'

function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function rangeFor(period: Period, customFrom: string, customTo: string): { from: string; to: string } {
  const now = new Date()
  switch (period) {
    case 'month':
      return { from: toKey(new Date(now.getFullYear(), now.getMonth(), 1)), to: toKey(now) }
    case 'lastMonth':
      return {
        from: toKey(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        to: toKey(new Date(now.getFullYear(), now.getMonth(), 0)),
      }
    case 'year':
      return { from: toKey(new Date(now.getFullYear(), 0, 1)), to: toKey(now) }
    case 'all':
      return { from: '2000-01-01', to: toKey(now) }
    case 'custom':
      return { from: customFrom || toKey(now), to: customTo || toKey(now) }
  }
}

const TEMPLATE_CSV =
  'date,type,category,amount,currency,note\n' +
  '2026-09-01,expense,Продукти,450.00,UAH,Тижнева закупка\n' +
  '2026-09-05,income,Зарплата,25000.00,UAH,\n'

function downloadTemplate() {
  const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'vaultly-template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export function ReportsPage() {
  const { t } = useLanguage()
  const [period, setPeriod] = useState<Period>('month')
  const [customFrom, setCustomFrom] = useState(toKey(new Date()))
  const [customTo, setCustomTo] = useState(toKey(new Date()))
  const fileInputRef = useRef<HTMLInputElement>(null)

  const range = rangeFor(period, customFrom, customTo)

  const importMutation = useMutation({
    mutationFn: reportsApi.import,
  })

  const onFilePicked = (file: File | undefined) => {
    if (!file) return
    importMutation.mutate(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl flex flex-col gap-6">
      <h1 className="text-xl font-bold">{t('reports.title')}</h1>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
      <section className="rounded-2xl p-5" style={{ background: 'var(--surface-secondary)' }}>
        <p className="text-sm font-semibold mb-1">{t('reports.export.title')}</p>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          {t('reports.export.hint')}
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {(['month', 'lastMonth', 'year', 'all', 'custom'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="rounded-xl px-3 py-1.5 text-sm font-medium"
              style={
                period === p
                  ? { background: 'var(--accent)', color: 'var(--accent-text)' }
                  : { background: 'var(--surface)', border: '1px solid var(--border)' }
              }
            >
              {t(`reports.period.${p}`)}
            </button>
          ))}
        </div>

        {period === 'custom' && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <DatePicker value={customFrom} onChange={setCustomFrom} label={t('an.from')} />
            <DatePicker value={customTo} onChange={setCustomTo} label={t('an.to')} />
          </div>
        )}

        <a
          href={reportsApi.exportUrl(range.from, range.to)}
          download
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
          style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
        >
          <Download size={15} />
          {t('reports.export.button')}
        </a>
      </section>

      <section className="rounded-2xl p-5" style={{ background: 'var(--surface-secondary)' }}>
        <p className="text-sm font-semibold mb-1">{t('reports.import.title')}</p>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          {t('reports.import.hint')}
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importMutation.isPending}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
          >
            <Upload size={15} />
            {importMutation.isPending ? t('reports.import.uploading') : t('reports.import.button')}
          </button>
          <button
            onClick={downloadTemplate}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            {t('reports.import.template')}
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => onFilePicked(e.target.files?.[0])} />

        {importMutation.isSuccess && (
          <div className="mt-4 rounded-xl p-3 flex flex-col gap-1" style={{ background: 'var(--surface)' }}>
            <p className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--income)' }}>
              <CheckCircle2 size={16} />
              {t('reports.import.result').replace('{imported}', String(importMutation.data.imported)).replace('{skipped}', String(importMutation.data.skipped))}
            </p>
            {importMutation.data.errors.length > 0 && (
              <ul className="text-xs mt-1 flex flex-col gap-0.5" style={{ color: 'var(--text-muted)' }}>
                {importMutation.data.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        {importMutation.isError && (
          <p className="text-xs text-red-500 mt-3">
            {importMutation.error instanceof ApiError ? importMutation.error.message : t('reports.import.error')}
          </p>
        )}
      </section>
      </div>
    </motion.div>
  )
}
