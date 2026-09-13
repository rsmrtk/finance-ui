import type { Plan } from '../api/types'

// Mirrors finance-engine's internal/plan — the backend is the real
// enforcement point (these are only used for UI treatment: hiding a
// step, blurring a chart, locking an icon), never trust this alone.
export function allowsMonobank(plan: Plan): boolean {
  return plan === 'max' || plan === 'enterprise'
}

export function allowsFelix(plan: Plan): boolean {
  return plan !== 'free'
}

export function allowsAnalytics(plan: Plan): boolean {
  return plan !== 'free'
}
