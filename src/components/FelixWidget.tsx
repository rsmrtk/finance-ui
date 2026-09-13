import { useMutation } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { Lock, MessageCircle, Send, Sparkles, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { advisorApi, ApiError } from '../api/client'
import { useAuth } from '../context/AppProviders'
import { useLanguage } from '../i18n/LanguageContext'
import { allowsFelix } from '../lib/plan'
import type { ChatMessage } from '../api/types'

// Felix is the app's AI assistant — a floating chat bubble available on
// every /app/* page, not a full page of its own, so asking it something
// never interrupts whatever screen you're on. Free-plan accounts see the
// same bubble (so the feature isn't invisible) but it opens a locked
// upsell panel instead of the real chat — the backend enforces this too
// (POST /api/advisor/chat 403s for free), this is just the honest UI for it.
export function FelixWidget() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const unlocked = !!user && allowsFelix(user.plan)
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const listEndRef = useRef<HTMLDivElement>(null)

  const send = useMutation({
    mutationFn: (message: string) => advisorApi.chat(message, messages),
    onSuccess: (res) => {
      setMessages((prev) => [...prev, { role: 'assistant', content: res.reply }])
      requestAnimationFrame(() => listEndRef.current?.scrollIntoView({ behavior: 'smooth' }))
    },
    onError: (err) => {
      const text = err instanceof ApiError ? err.message : t('advisor.error')
      setMessages((prev) => [...prev, { role: 'assistant', content: text }])
    },
  })

  // Other UI (e.g. the profile page's financial-score gauge) can open
  // Felix with a question already asked, via
  // window.dispatchEvent(new CustomEvent('felix:open', { detail: { prefill } })) —
  // sends immediately instead of just filling the input, since the whole
  // point is a one-click "explain this" rather than one more step.
  useEffect(() => {
    const onOpenEvent = (e: Event) => {
      setOpen(true)
      const prefill = (e as CustomEvent<{ prefill?: string }>).detail?.prefill
      if (prefill && unlocked) {
        setMessages((prev) => [...prev, { role: 'user', content: prefill }])
        send.mutate(prefill)
      }
    }
    window.addEventListener('felix:open', onOpenEvent)
    return () => window.removeEventListener('felix:open', onOpenEvent)
  }, [send, unlocked])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || send.isPending) return
    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setInput('')
    send.mutate(text)
    requestAnimationFrame(() => listEndRef.current?.scrollIntoView({ behavior: 'smooth' }))
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="fixed z-40 bottom-36 md:bottom-24 right-4 md:right-6 w-[calc(100vw-2rem)] max-w-sm h-[28rem] rounded-2xl overflow-hidden flex flex-col shadow-2xl"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div
              className="flex items-center justify-between px-4 py-3 shrink-0"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
                >
                  <Sparkles size={14} />
                </div>
                <p className="font-semibold text-sm">{t('felix.name')}</p>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close">
                <X size={17} />
              </button>
            </div>

            {!unlocked ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 p-6">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: 'color-mix(in srgb, var(--accent) 16%, transparent)', color: 'var(--accent)' }}
                >
                  <Lock size={20} />
                </div>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {t('felix.locked')}
                </p>
                <Link
                  to="/app/profile/plan"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-2 text-sm font-semibold"
                  style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
                >
                  {t('felix.upgrade')}
                </Link>
              </div>
            ) : (
              <>
            <div className="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-2.5">
              {messages.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-6 px-4">
                  <Sparkles size={24} style={{ color: 'var(--accent)' }} />
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {t('felix.empty')}
                  </p>
                </div>
              )}
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${m.role === 'user' ? 'self-end' : 'self-start'}`}
                  style={
                    m.role === 'user'
                      ? { background: 'var(--accent)', color: 'var(--accent-text)' }
                      : { background: 'var(--surface-secondary)' }
                  }
                >
                  {m.content}
                </motion.div>
              ))}
              {send.isPending && (
                <div
                  className="self-start rounded-2xl px-3.5 py-2 text-sm"
                  style={{ background: 'var(--surface-secondary)', color: 'var(--text-muted)' }}
                >
                  {t('advisor.thinking')}
                </div>
              )}
              <div ref={listEndRef} />
            </div>

            <form onSubmit={submit} className="flex gap-2 p-3 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
              <input
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('advisor.placeholder')}
                className="flex-1 rounded-xl px-3.5 py-2 text-sm outline-none"
                style={{ background: 'var(--surface-secondary)' }}
              />
              <button
                type="submit"
                disabled={!input.trim() || send.isPending}
                className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center disabled:opacity-50"
                style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
              >
                <Send size={15} />
              </button>
            </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileTap={{ scale: 0.92 }}
        aria-label={t('felix.name')}
        className="fixed z-40 bottom-20 md:bottom-6 right-4 md:right-6 w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
        style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span key="close" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }}>
              <X size={20} />
            </motion.span>
          ) : (
            <motion.span key="open" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }}>
              <MessageCircle size={20} />
            </motion.span>
          )}
        </AnimatePresence>
        {!unlocked && !open && (
          <span
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            <Lock size={10} />
          </span>
        )}
      </motion.button>
    </>
  )
}
