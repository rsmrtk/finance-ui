import { motion } from 'framer-motion'

// A soft mesh gradient (Stripe/Linear-style): several large, heavily
// blurred blobs drifting slowly. All colors derive from the single
// user-configurable --gradient-accent via hue-rotate, so the mesh always
// stays tonally tied to whatever accent color is picked in the profile,
// instead of hardcoding an unrelated palette.
const BLOBS = [
  { key: 'a', size: 46, top: -12, left: -10, hue: 0, duration: 22, drift: [0, 14, -4, 0] },
  { key: 'b', size: 40, top: 55, left: 68, hue: 0, duration: 26, drift: [0, -12, 6, 0] },
  { key: 'c', size: 34, top: 8, left: 62, hue: 42, duration: 19, drift: [0, 10, -10, 0] },
  { key: 'd', size: 30, top: 64, left: -6, hue: -38, duration: 24, drift: [0, -8, 12, 0] },
  { key: 'e', size: 26, top: 32, left: 30, hue: 18, duration: 30, drift: [0, 8, -6, 0] },
] as const

export function GradientBackdrop() {
  return (
    <div className="gradient-backdrop">
      {BLOBS.map((b) => (
        <motion.div
          key={b.key}
          className="gradient-mesh-blob"
          style={{
            width: `${b.size}vw`,
            height: `${b.size}vw`,
            top: `${b.top}%`,
            left: `${b.left}%`,
            filter: `blur(70px) hue-rotate(${b.hue}deg)`,
          }}
          animate={{ x: [...b.drift.map((d) => `${d}vw`)], y: [...b.drift.map((d) => `${-d * 0.6}vw`)] }}
          transition={{ duration: b.duration, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}
