// ══════════════════════════════════════════════════════════
//  Relic System Data — Star Rail Style
// ══════════════════════════════════════════════════════════

export interface RelicSetDef {
  id: string
  name: string
  emoji: string
  bonus2: string // 2-piece set bonus description
  bonus4: string // 4-piece set bonus description
  bonus2Stats: Partial<Record<RelicStatKey, number>>
  bonus4Stats: Partial<Record<RelicStatKey, number>>
}

export type RelicStatKey =
  | 'atk_flat'
  | 'atk_pct'
  | 'def_flat'
  | 'def_pct'
  | 'hp_flat'
  | 'hp_pct'
  | 'crit_rate'
  | 'crit_dmg'

export type RelicSlot = 'head' | 'hands' | 'body' | 'feet'

export const RELIC_SLOT_NAMES: Record<RelicSlot, string> = {
  head: '머리',
  hands: '손',
  body: '몸통',
  feet: '발',
}

export const RELIC_SLOT_EMOJI: Record<RelicSlot, string> = {
  head: '🎩',
  hands: '🧤',
  body: '👕',
  feet: '👟',
}

// Main stat pools per slot (Star Rail style)
export const SLOT_MAIN_STATS: Record<RelicSlot, RelicStatKey[]> = {
  head: ['hp_flat'], // always HP
  hands: ['atk_flat'], // always ATK
  body: ['hp_pct', 'atk_pct', 'def_pct', 'crit_rate', 'crit_dmg'],
  feet: ['hp_pct', 'atk_pct', 'def_pct'],
}

// Relic Sets
export const RELIC_SETS: RelicSetDef[] = [
  {
    id: 'warrior',
    name: '전사의 결의',
    emoji: '⚔️',
    bonus2: '공격력 +12%',
    bonus4: '치명타 확률 +8%',
    bonus2Stats: { atk_pct: 0.12 },
    bonus4Stats: { crit_rate: 0.08 },
  },
  {
    id: 'guardian',
    name: '수호자의 의지',
    emoji: '🛡️',
    bonus2: '방어력 +15%',
    bonus4: '체력 +12%',
    bonus2Stats: { def_pct: 0.15 },
    bonus4Stats: { hp_pct: 0.12 },
  },
  {
    id: 'hunter',
    name: '사냥꾼의 본능',
    emoji: '🎯',
    bonus2: '치명타 확률 +6%',
    bonus4: '치명타 피해 +20%',
    bonus2Stats: { crit_rate: 0.06 },
    bonus4Stats: { crit_dmg: 0.2 },
  },
  {
    id: 'sage',
    name: '현자의 지혜',
    emoji: '📖',
    bonus2: '체력 +15%',
    bonus4: '방어력 +10%, 공격력 +10%',
    bonus2Stats: { hp_pct: 0.15 },
    bonus4Stats: { def_pct: 0.1, atk_pct: 0.1 },
  },
  {
    id: 'berserker',
    name: '광전사의 광기',
    emoji: '🔥',
    bonus2: '공격력 +10%',
    bonus4: '치명타 피해 +25%',
    bonus2Stats: { atk_pct: 0.1 },
    bonus4Stats: { crit_dmg: 0.25 },
  },
  {
    id: 'iron',
    name: '강철의 요새',
    emoji: '🏰',
    bonus2: '방어력 +20%',
    bonus4: '체력 +15%',
    bonus2Stats: { def_pct: 0.2 },
    bonus4Stats: { hp_pct: 0.15 },
  },
]

export const relicSetMap = new Map(RELIC_SETS.map((s) => [s.id, s]))

// Quality definitions
export const QUALITY_NAMES: Record<string, string> = {
  normal: '⬜ 일반',
  rare: '🟦 희귀',
  epic: '🟪 영웅',
}

export const QUALITY_STARTING_SUBSTATS: Record<string, number> = {
  normal: 2,
  rare: 3,
  epic: 4,
}

export const QUALITY_COLORS: Record<string, number> = {
  normal: 0x808080,
  rare: 0x3498db,
  epic: 0x9b59b6,
}
