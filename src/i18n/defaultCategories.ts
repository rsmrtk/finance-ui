import type { TranslationKey } from './translations'

// The exact Ukrainian names seeded by finance-engine's migrations/00001_init.sql
// (shared/global default categories, same for every account). Matched by
// literal name rather than the isDefault flag, since that's simpler and a
// user-made category happening to share the exact name would want the
// same label anyway.
const DEFAULT_NAME_TO_KEY: Record<string, TranslationKey> = {
  Продукти: 'defcat.groceries',
  Транспорт: 'defcat.transport',
  Житло: 'defcat.housing',
  Розваги: 'defcat.entertainment',
  "Здоров'я": 'defcat.health',
  Одяг: 'defcat.clothing',
  Освіта: 'defcat.education',
  Інше: 'defcat.other',
  Зарплата: 'defcat.salary',
  Фріланс: 'defcat.freelance',
  Подарунки: 'defcat.gifts',
  Інвестиції: 'defcat.investments',
}

// Translates a category's display name if it's one of the built-in
// defaults; anything the user typed themselves (in any language) is
// returned unchanged — auto-translating free-form user text would need a
// real machine-translation API, out of scope here.
export function translateCategoryName(name: string, t: (key: TranslationKey) => string): string {
  const key = DEFAULT_NAME_TO_KEY[name]
  return key ? t(key) : name
}
