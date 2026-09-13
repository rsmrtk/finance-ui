import { motion } from 'framer-motion'

// A looping animated logo shown instead of a blank screen while the app
// doesn't yet know if the user is signed in (or any other "we genuinely
// don't have anything to paint yet" moment) — replaces what used to be a
// bare `null`. Green square + the "V" from Vaultly, set in the same
// Maker Mono face as the wordmark — a real mark, not a decorative emoji.
export function LoadingLogo() {
  return (
    <div className="min-h-full flex items-center justify-center">
      <motion.div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold brand-wordmark"
        style={{ background: '#34c759', color: '#ffffff' }}
        animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.06, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        V
      </motion.div>
    </div>
  )
}
