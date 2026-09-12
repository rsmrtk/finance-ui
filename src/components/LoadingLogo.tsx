import { motion } from 'framer-motion'

// A looping animated logo shown instead of a blank screen while the app
// doesn't yet know if the user is signed in (or any other "we genuinely
// don't have anything to paint yet" moment) — replaces what used to be a
// bare `null`.
export function LoadingLogo() {
  return (
    <div className="min-h-full flex items-center justify-center">
      <motion.div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
        style={{ background: 'linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 60%, transparent))' }}
        animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.06, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        💰
      </motion.div>
    </div>
  )
}
