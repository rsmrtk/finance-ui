import { createContext, useContext, useState, type ReactNode } from 'react'

const HIDE_KEY = 'appearanceStore.amountsHidden'
const MASK = '••••'

interface AmountVisibilityState {
  hidden: boolean
  toggle: () => void
  // Wraps an already-formatted amount string — swaps it for a fixed mask
  // while hidden, so every call site stays a one-line change instead of
  // threading raw numbers through a second formatting path.
  mask: (text: string) => string
}

const Ctx = createContext<AmountVisibilityState | null>(null)

export function AmountVisibilityProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(() => localStorage.getItem(HIDE_KEY) === '1')

  const toggle = () =>
    setHidden((h) => {
      const next = !h
      localStorage.setItem(HIDE_KEY, next ? '1' : '0')
      return next
    })

  return <Ctx.Provider value={{ hidden, toggle, mask: (text) => (hidden ? MASK : text) }}>{children}</Ctx.Provider>
}

export function useAmountVisibility() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAmountVisibility must be used within AmountVisibilityProvider')
  return ctx
}
