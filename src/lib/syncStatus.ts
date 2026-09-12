import type { TranslationKey } from '../i18n/translations'

// Beyond this age a "synced" banner is misleading — it's more likely the
// webhook stopped firing (revoked token, Monobank-side outage) than that
// the account genuinely had zero transactions this long.
const STALE_AFTER_HOURS = 24

export interface SyncStatus {
  label: string
  stale: boolean
}

export function formatSyncStatus(
  lastSyncedAt: string | null | undefined,
  t: (key: TranslationKey) => string,
  locale: string,
): SyncStatus {
  if (!lastSyncedAt) return { label: t('profile.integrations.neverSynced'), stale: false }

  const date = new Date(lastSyncedAt)
  const diffMs = Date.now() - date.getTime()
  const hours = diffMs / 3_600_000

  if (hours >= STALE_AFTER_HOURS) {
    return { label: `${t('profile.integrations.notSyncingSince')} ${date.toLocaleDateString(locale)}`, stale: true }
  }
  if (diffMs < 60_000) return { label: t('profile.integrations.justNow'), stale: false }

  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 60) return { label: t('profile.integrations.minutesAgo').replace('{n}', String(minutes)), stale: false }

  return { label: t('profile.integrations.hoursAgo').replace('{n}', String(Math.floor(hours))), stale: false }
}
