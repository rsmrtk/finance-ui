import { GoogleLogin } from '@react-oauth/google'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { GradientBackdrop } from '../components/GradientBackdrop'
import { useAuth } from '../context/AppProviders'
import { useLanguage } from '../i18n/LanguageContext'

export function LoginPage() {
  const { login, signup, loginWithGoogle } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()

  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (mode === 'login') await login(email, password)
      else await signup(email, password)
      navigate('/app', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('login.genericError'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center relative">
      <GradientBackdrop />

      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full max-w-sm rounded-3xl p-8 shadow-xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h1 className="brand-wordmark text-2xl font-bold mb-1">{t('app.name')}</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
          {mode === 'login' ? t('login.signInTitle') : t('login.signUpTitle')}
        </p>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            placeholder={t('login.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl px-4 py-2.5 text-sm outline-none"
            style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder={t('login.password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl px-4 py-2.5 text-sm outline-none"
            style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[var(--accent-text)] disabled:opacity-50"
            style={{ background: 'var(--accent)' }}
          >
            {mode === 'login' ? t('login.signIn') : t('login.signUp')}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          {t('login.or')}
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        </div>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={async (cred) => {
              if (!cred.credential) return
              setError(null)
              try {
                await loginWithGoogle(cred.credential)
                navigate('/app', { replace: true })
              } catch {
                setError(t('login.googleError'))
              }
            }}
            onError={() => setError(t('login.googleError'))}
          />
        </div>

        <button
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          className="mt-6 text-sm underline w-full text-center"
          style={{ color: 'var(--text-muted)' }}
        >
          {mode === 'login' ? t('login.toSignUp') : t('login.toSignIn')}
        </button>
      </motion.div>
    </div>
  )
}
