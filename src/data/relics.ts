// ══════════════════════════════════════════════════════════
//  Relic System — Star Rail-style Artifact Sets
// ══════════════════════════════════════════════════════════

export interface RelicSet {
  id: string
  name: string
  emoji: string
  twoPiece: string // 2-piece set bonus description
  fourPiece: string // 4-piece set bonus description
  twoPieceEffect: RelicSetEffect
  fourPieceEffect: RelicSetEffect
}

export interface RelicSetEffect {
  atkPercent?: number
  defPercent?: number
  hpPercent?: number
  spdPercent?: number
  critRate?: number
  critDmg?: number
  healBonus?: number
  shieldBonus?: number
  dmgBonus?: number // general damage bonus
  dotDmg?: number // DoT damage bonus
  debuffChance?: number // debuff accuracy bonus
  energyRegen?: number // flat energy per turn
}

export type RelicSlot = 'head' | 'hands' | 'body' | 'feet'
export type MainStatType =
  | 'hp'
  | 'atk'
  | 'def'
  | 'spd'
  | 'critRate'
  | 'critDmg'
  | 'healBonus'
  | 'dmgBonus'

export interface RelicMainStat {
  type: MainStatType
  value: number
}

export interface RelicSubStat {
  type: MainStatType
  value: number
}

export interface RelicDrop {
  setId: string
  slot: RelicSlot
  mainStat: RelicMainStat
  subStats: RelicSubStat[]
  quality: 'normal' | 'good' | 'excellent' | 'perfect'
}

// Fixed main stats per slot
export const slotMainStats: Record<RelicSlot, MainStatType[]> = {
  head: ['hp'], // always HP
  hands: ['atk'], // always ATK
  body: ['critRate', 'critDmg', 'healBonus', 'def', 'hp'],
  feet: ['spd', 'atk', 'hp', 'def'],
}

const mainStatValues: Record<MainStatType, Record<string, number>> = {
  hp: { normal: 200, good: 280, excellent: 360, perfect: 440 },
  atk: { normal: 100, good: 140, excellent: 180, perfect: 220 },
  def: { normal: 80, good: 112, excellent: 144, perfect: 176 },
  spd: { normal: 10, good: 14, excellent: 18, perfect: 22 },
  critRate: { normal: 5, good: 7, excellent: 9, perfect: 12 },
  critDmg: { normal: 10, good: 14, excellent: 18, perfect: 24 },
  healBonus: { normal: 8, good: 11, excellent: 14, perfect: 18 },
  dmgBonus: { normal: 8, good: 11, excellent: 14, perfect: 18 },
}

const subStatPool: MainStatType[] = [
  'hp',
  'atk',
  'def',
  'spd',
  'critRate',
  'critDmg',
]
const subStatRanges: Record<MainStatType, [number, number]> = {
  hp: [30, 80],
  atk: [15, 45],
  def: [12, 35],
  spd: [2, 6],
  critRate: [1, 4],
  critDmg: [2, 8],
  healBonus: [2, 6],
  dmgBonus: [2, 6],
}

// ── Relic Sets (10) ──────────────────────────────────────

export const relicSets: RelicSet[] = [
  {
    id: 'flame_warrior',
    name: '화염 전사',
    emoji: '🔥',
    twoPiece: '화염 피해 +15%',
    fourPiece: '스킬 사용 후 다음 공격 피해 +25%',
    twoPieceEffect: { dmgBonus: 15 },
    fourPieceEffect: { dmgBonus: 25 },
  },
  {
    id: 'ice_guardian',
    name: '빙결 수호자',
    emoji: '❄️',
    twoPiece: '빙결 피해 +15%',
    fourPiece: '동결 명중 시 크리티컬 확률 +12%',
    twoPieceEffect: { dmgBonus: 15 },
    fourPieceEffect: { critRate: 12 },
  },
  {
    id: 'thunder_dancer',
    name: '뇌전 무희',
    emoji: '⚡',
    twoPiece: '번개 피해 +15%',
    fourPiece: '감전 상태의 적 공격 시 피해 +20%',
    twoPieceEffect: { dmgBonus: 15 },
    fourPieceEffect: { dmgBonus: 20 },
  },
  {
    id: 'wind_wanderer',
    name: '바람 방랑자',
    emoji: '🌀',
    twoPiece: 'SPD +8%',
    fourPiece: 'SPD 120 이상 시 피해 +20%',
    twoPieceEffect: { spdPercent: 8 },
    fourPieceEffect: { dmgBonus: 20 },
  },
  {
    id: 'quantum_researcher',
    name: '양자 연구자',
    emoji: '🔮',
    twoPiece: '양자 피해 +15%',
    fourPiece: '디버프 상태의 적 공격 시 크리티컬 피해 +20%',
    twoPieceEffect: { dmgBonus: 15 },
    fourPieceEffect: { critDmg: 20 },
  },
  {
    id: 'void_walker',
    name: '허무 행자',
    emoji: '🌑',
    twoPiece: '허무 피해 +15%',
    fourPiece: '속박 시 추가 피해 +18%',
    twoPieceEffect: { dmgBonus: 15 },
    fourPieceEffect: { dmgBonus: 18 },
  },
  {
    id: 'iron_fortress',
    name: '철벽 요새',
    emoji: '🏰',
    twoPiece: 'DEF +20%',
    fourPiece: '보호막 효과 +25%',
    twoPieceEffect: { defPercent: 20 },
    fourPieceEffect: { shieldBonus: 25 },
  },
  {
    id: 'life_bloom',
    name: '생명의 꽃',
    emoji: '🌸',
    twoPiece: '치유량 +15%',
    fourPiece: '힐 시 대상 에너지 +5, HP 50% 이하 대상 추가 치유 +20%',
    twoPieceEffect: { healBonus: 15 },
    fourPieceEffect: { healBonus: 20 },
  },
  {
    id: 'star_harmony',
    name: '성간 조화',
    emoji: '🎵',
    twoPiece: 'HP +15%',
    fourPiece: '버프 효과 +20%, 버프 대상 에너지 +5',
    twoPieceEffect: { hpPercent: 15 },
    fourPieceEffect: { dmgBonus: 20 },
  },
  {
    id: 'shadow_curse',
    name: '그림자 저주',
    emoji: '☠️',
    twoPiece: 'DoT 피해 +15%',
    fourPiece: '디버프 명중률 +12%, 디버프 대상 DEF -8%',
    twoPieceEffect: { dotDmg: 15 },
    fourPieceEffect: { debuffChance: 12 },
  },
]

export const relicSetMap = new Map(relicSets.map((r) => [r.id, r]))

// ── Relic Generation ─────────────────────────────────────

export function generateRelic(setId: string, difficulty: number): RelicDrop {
  const qualityRoll = Math.random() * 100
  let quality: RelicDrop['quality']
  // Higher difficulty = better quality chance
  const bonus = difficulty * 5
  if (qualityRoll < 5 + bonus) quality = 'perfect'
  else if (qualityRoll < 20 + bonus) quality = 'excellent'
  else if (qualityRoll < 50 + bonus) quality = 'good'
  else quality = 'normal'

  const slots: RelicSlot[] = ['head', 'hands', 'body', 'feet']
  const slot = slots[Math.floor(Math.random() * slots.length)]

  const possibleMainStats = slotMainStats[slot]
  const mainStatType =
    possibleMainStats[Math.floor(Math.random() * possibleMainStats.length)]
  const mainStat: RelicMainStat = {
    type: mainStatType,
    value: mainStatValues[mainStatType][quality],
  }

  // Generate substats (1-4 depending on quality)
  const numSubStats =
    quality === 'perfect'
      ? 4
      : quality === 'excellent'
        ? 3
        : quality === 'good'
          ? 2
          : 1
  const availableSubs = subStatPool.filter((s) => s !== mainStatType)
  const chosenSubs: MainStatType[] = []
  for (let i = 0; i < numSubStats && availableSubs.length > 0; i++) {
    const idx = Math.floor(Math.random() * availableSubs.length)
    chosenSubs.push(availableSubs.splice(idx, 1)[0])
  }

  const subStats: RelicSubStat[] = chosenSubs.map((type) => {
    const [min, max] = subStatRanges[type]
    return { type, value: Math.floor(Math.random() * (max - min + 1)) + min }
  })

  return { setId, slot, mainStat, subStats, quality }
}

export const qualityLabels: Record<string, string> = {
  normal: '⬜ 일반',
  good: '🟢 양호',
  excellent: '🔵 우수',
  perfect: '🟠 완벽',
}

export const qualityColors: Record<string, number> = {
  normal: 0x808080,
  good: 0x2ecc71,
  excellent: 0x3498db,
  perfect: 0xf39c12,
}

export const mainStatLabels: Record<MainStatType, string> = {
  hp: 'HP',
  atk: 'ATK',
  def: 'DEF',
  spd: 'SPD',
  critRate: '크리티컬 확률',
  critDmg: '크리티컬 피해',
  healBonus: '치유 보너스',
  dmgBonus: '피해 보너스',
}

export const slotLabels: Record<RelicSlot, string> = {
  head: '머리',
  hands: '손',
  body: '몸통',
  feet: '발',
}
