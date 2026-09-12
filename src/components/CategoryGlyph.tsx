import { isEmojiIcon, iconFor } from '../lib/categoryPalette'

export function CategoryGlyph({ iconName, size, color }: { iconName: string; size: number; color: string }) {
  if (isEmojiIcon(iconName)) {
    return (
      <span style={{ fontSize: size, lineHeight: 1 }} aria-hidden>
        {iconName}
      </span>
    )
  }
  const Icon = iconFor(iconName)
  return <Icon size={size} color={color} />
}
