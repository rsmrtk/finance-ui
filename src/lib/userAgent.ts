// A lightweight, good-enough label for the "active sessions" list — not a
// full UA parser (not needed for showing "Chrome on macOS" to the account
// owner), just enough to tell devices apart at a glance.
export function describeUserAgent(ua: string): string {
  if (!ua) return 'Unknown device'

  const os = ua.includes('iPhone')
    ? 'iOS'
    : ua.includes('iPad')
      ? 'iPadOS'
      : ua.includes('Android')
        ? 'Android'
        : ua.includes('Mac OS X') || ua.includes('Macintosh')
          ? 'macOS'
          : ua.includes('Windows')
            ? 'Windows'
            : ua.includes('Linux')
              ? 'Linux'
              : ''

  const browser = ua.includes('Edg/')
    ? 'Edge'
    : ua.includes('OPR/') || ua.includes('Opera')
      ? 'Opera'
      : ua.includes('Chrome/')
        ? 'Chrome'
        : ua.includes('CriOS/')
          ? 'Chrome'
          : ua.includes('Firefox/')
            ? 'Firefox'
            : ua.includes('Safari/')
              ? 'Safari'
              : 'Browser'

  return os ? `${browser} on ${os}` : browser
}
