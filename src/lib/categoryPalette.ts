import {
  Banknote,
  BookOpen,
  Car,
  Dumbbell,
  Gamepad2,
  Gift,
  HelpCircle,
  Home,
  Laptop,
  Plane,
  ShoppingCart,
  Shirt,
  TrendingUp,
  Utensils,
  type LucideIcon,
} from 'lucide-react'

// Same 15 icons + 8 colors as the iOS app's AddCategoryView, so a category
// created on web looks identical on iOS and vice versa.
export const CATEGORY_ICONS = [
  'cart.fill',
  'car.fill',
  'house.fill',
  'gamecontroller.fill',
  'cross.case.fill',
  'tshirt.fill',
  'book.fill',
  'banknote.fill',
  'laptopcomputer',
  'gift.fill',
  'chart.line.uptrend.xyaxis',
  'airplane',
  'fork.knife',
  'pawprint.fill',
  'ellipsis.circle.fill',
] as const

export const CATEGORY_COLORS = [
  'FF9500',
  '007AFF',
  '5856D6',
  'FF2D55',
  '34C759',
  'AF52DE',
  '5AC8FA',
  '8E8E93',
] as const

const ICON_MAP: Record<string, LucideIcon> = {
  'cart.fill': ShoppingCart,
  'car.fill': Car,
  'house.fill': Home,
  'gamecontroller.fill': Gamepad2,
  'cross.case.fill': Dumbbell,
  'tshirt.fill': Shirt,
  'book.fill': BookOpen,
  'banknote.fill': Banknote,
  laptopcomputer: Laptop,
  'gift.fill': Gift,
  'chart.line.uptrend.xyaxis': TrendingUp,
  airplane: Plane,
  'fork.knife': Utensils,
  'pawprint.fill': Dumbbell,
  'ellipsis.circle.fill': HelpCircle,
}

export function iconFor(iconName: string): LucideIcon {
  return ICON_MAP[iconName] ?? HelpCircle
}

// A category's "icon" can be either one of the fixed lucide keys above, or
// a free-form emoji the user picked (stored as the literal character in
// the same `iconName` column — no schema change needed). Anything that
// isn't a known lucide key is treated as an emoji/text glyph.
export function isEmojiIcon(iconName: string): boolean {
  return !(iconName in ICON_MAP)
}

// A broad, category-relevant emoji set for the picker — deliberately wider
// than the 15 lucide icons, since emoji is the "richer customization"
// option, not a 1:1 replacement.
export const CATEGORY_EMOJIS = [
  '🛒', '🍔', '☕', '🍕', '🚗', '🚕', '🚌', '⛽', '🏠', '💡',
  '🎮', '🎬', '🎵', '🎨', '⚽', '🏋️', '💊', '🏥', '👕', '👟',
  '📚', '🎓', '💻', '📱', '✈️', '🏖️', '🐾', '🎁', '💰', '📈',
  '💳', '🧾', '📦', '🔧', '🌱', '❤️', '👶', '🐕', '☂️', '🎉',
] as const
