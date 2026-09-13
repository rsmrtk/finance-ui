// Monobank's raw account "type" values, translated for display in the
// account picker (see ProfileIntegrationsPage). Anything not in this map
// (Monobank adds new card types occasionally) falls back to the raw
// string rather than hiding the option.
const LABELS_UK: Record<string, string> = {
  black: 'Чорна картка',
  white: 'Біла картка',
  platinum: 'Platinum',
  iron: 'Iron картка',
  yellow: 'Жовта картка',
  fop: 'ФОП',
  jar: 'Банка',
}

const LABELS_EN: Record<string, string> = {
  black: 'Black card',
  white: 'White card',
  platinum: 'Platinum',
  iron: 'Iron card',
  yellow: 'Yellow card',
  fop: 'FOP (business)',
  jar: 'Jar',
}

export function monobankAccountTypeLabel(type: string, locale: string): string {
  const labels = locale === 'uk' ? LABELS_UK : LABELS_EN
  return labels[type] ?? type
}
