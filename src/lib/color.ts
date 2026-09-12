// Picks readable text color (black or white) for an arbitrary background
// hex, via relative luminance (WCAG-ish). Needed because --accent is
// user-chosen (Settings → gradient color) — hardcoding white text breaks
// the moment someone picks a light/pastel color.
export function contrastText(hex: string): string {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  const r = parseInt(full.slice(0, 2), 16) / 255
  const g = parseInt(full.slice(2, 4), 16) / 255
  const b = parseInt(full.slice(4, 6), 16) / 255
  const linear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
  const luminance = 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)
  return luminance > 0.45 ? '#1c1c1e' : '#ffffff'
}
