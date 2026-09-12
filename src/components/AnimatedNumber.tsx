import { animate, useMotionValue, useTransform, motion } from 'framer-motion'
import { useEffect } from 'react'

// Animates from the previous value to `value` whenever it changes — used
// for the dashboard balance so it counts up/down instead of jumping,
// which is what makes a number "feel" live rather than static text.
export function AnimatedNumber({ value, format }: { value: number; format: (n: number) => string }) {
  const motionValue = useMotionValue(value)
  const display = useTransform(motionValue, (v) => format(v))

  useEffect(() => {
    const controls = animate(motionValue, value, { duration: 0.6, ease: 'easeOut' })
    return controls.stop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return <motion.span>{display}</motion.span>
}
