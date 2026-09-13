// Opens the Felix widget with a question already asked — see the
// matching listener in components/FelixWidget.tsx.
export function openFelixWith(prefill: string) {
  window.dispatchEvent(new CustomEvent('felix:open', { detail: { prefill } }))
}
