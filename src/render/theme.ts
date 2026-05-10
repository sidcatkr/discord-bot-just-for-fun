// Visual tokens for canvas-rendered cards.
// Single source of truth for rarity colors, gradients, and dimensions.

export type CardTier =
  | 'trash'
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'mythic'

export interface TierPalette {
  base: string // primary tint
  light: string // gradient top
  dark: string // gradient bottom
  accent: string // badge / highlight strokes
  textOnBase: string // readable text color on base
  label: string // ALL-CAPS English label
  labelKr: string // 한글 label with emoji
}

export const TIERS: Record<CardTier, TierPalette> = {
  trash: {
    base: '#8B5A2B',
    light: '#B88959',
    dark: '#5C3A1A',
    accent: '#D4A373',
    textOnBase: '#FFF8F0',
    label: 'TRASH',
    labelKr: '🗑️ 쓰레기',
  },
  common: {
    base: '#9CA3AF',
    light: '#CBD5E1',
    dark: '#4B5563',
    accent: '#E5E7EB',
    textOnBase: '#0F172A',
    label: 'COMMON',
    labelKr: '⬜ 일반',
  },
  uncommon: {
    base: '#22C55E',
    light: '#4ADE80',
    dark: '#15803D',
    accent: '#A7F3D0',
    textOnBase: '#052E16',
    label: 'UNCOMMON',
    labelKr: '🟩 고급',
  },
  rare: {
    base: '#3B82F6',
    light: '#60A5FA',
    dark: '#1D4ED8',
    accent: '#BFDBFE',
    textOnBase: '#0B1B3D',
    label: 'RARE',
    labelKr: '🟦 희귀',
  },
  epic: {
    base: '#A855F7',
    light: '#C084FC',
    dark: '#6B21A8',
    accent: '#E9D5FF',
    textOnBase: '#1E0A33',
    label: 'EPIC',
    labelKr: '🟪 영웅',
  },
  legendary: {
    base: '#FACC15',
    light: '#FDE68A',
    dark: '#B45309',
    accent: '#FEF3C7',
    textOnBase: '#3F2A05',
    label: 'LEGENDARY',
    labelKr: '🟨 전설',
  },
  mythic: {
    base: '#EF4444',
    light: '#FB7185',
    dark: '#7F1D1D',
    accent: '#FEE2E2',
    textOnBase: '#1B0202',
    label: 'MYTHIC',
    labelKr: '🟥 신화',
  },
}

// Card layout constants
export const CARD = {
  width: 800,
  height: 450,
  padding: 36,
  cornerRadius: 24,
  bottomBarHeight: 90,
  badgePadding: 14,
  badgeHeight: 36,
} as const

// Font stack — 'Sans KR' is the family registered in fonts.ts.
// Emoji glyphs come from system fallbacks via napi-rs/canvas.
export const FONTS = {
  family: 'Sans KR',
  emoji: 'Sans KR', // emoji rendering uses napi-rs/canvas system fallback
  titleSize: 52,
  subtitleSize: 22,
  bodySize: 20,
  smallSize: 16,
  badgeSize: 18,
} as const
