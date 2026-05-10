import { getUserFortune } from '../db/helpers.js'

// ══════════════════════════════════════════════════════════
//  Types
// ══════════════════════════════════════════════════════════

export type FishRarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'mythic'

export type Habitat =
  | 'freshwater'
  | 'saltwater'
  | 'deep_sea'
  | 'tropical'
  | 'arctic'
  | 'mythical'

export type Season = 'spring' | 'summer' | 'autumn' | 'winter' | 'all'

export type TimeOfDay = 'day' | 'night' | 'dusk' | 'dawn' | 'any'

export type BaitType = 'worm' | 'shrimp' | 'lure' | 'pellet' | 'special' | 'any'

export interface FishType {
  id: string // stable slug (primary key for collection)
  name: string // 한글 이름
  scientificName?: string // Latin (real fish only)
  emoji: string
  rarity: FishRarity
  habitat: Habitat[]
  season: Season[]
  timeOfDay: TimeOfDay[]
  baitTypes: BaitType[]
  weatherAffinity?: string[] // weather names that boost catch rate
  size: { min: number; max: number; mean: number; stdDev: number } // cm
  weightCoeff: number // kg per (length/100m)^3 — shape factor
  baseValuePerKg: number // gold per kg
  description: string
  loreFlavor?: string
}

export interface TrashType {
  name: string
  emoji: string
  disposalCost: number
  pollutionAmount: number
  description: string
}

export type FishingEventType =
  | 'normal'
  | 'line_break'
  | 'trash'
  | 'double_catch'
  | 'golden_hour'
  | 'storm'
  | 'treasure'
  | 'sea_monster'
  | 'dangerous'

export interface FishingEvent {
  type: FishingEventType
  message: string
  emoji: string
}

export interface SeaMonster {
  name: string
  emoji: string
  hp: number
  attack: number
  goldReward: number
  xpReward: number
  description: string
}

export interface DangerousCatch {
  name: string
  emoji: string
  damage: number // 0 = instant kill
  goldLoss: number
  description: string
  deathMessage: string
}

// ══════════════════════════════════════════════════════════
//  Sea monsters
// ══════════════════════════════════════════════════════════

export const seaMonsters: SeaMonster[] = [
  {
    name: '거대 문어',
    emoji: '🦑',
    hp: 50,
    attack: 15,
    goldReward: 200,
    xpReward: 50,
    description: '바다 속에서 거대한 촉수가 나타났다!',
  },
  {
    name: '해적 유령선',
    emoji: '👻',
    hp: 70,
    attack: 20,
    goldReward: 350,
    xpReward: 70,
    description: '안개 속에서 유령선이 나타났다!',
  },
  {
    name: '바다뱀',
    emoji: '🐍',
    hp: 40,
    attack: 25,
    goldReward: 180,
    xpReward: 40,
    description: '물 속에서 거대한 뱀이 떠올랐다!',
  },
  {
    name: '보석 거북',
    emoji: '🐢',
    hp: 100,
    attack: 8,
    goldReward: 500,
    xpReward: 80,
    description: '등껍질에 보석을 지닌 거대 거북이! 잡으면 대박!',
  },
  {
    name: '폭풍 상어',
    emoji: '🦈',
    hp: 80,
    attack: 30,
    goldReward: 400,
    xpReward: 60,
    description: '수면을 가르며 거대 상어가 나타났다!',
  },
  {
    name: '크라켄',
    emoji: '🦑',
    hp: 120,
    attack: 35,
    goldReward: 600,
    xpReward: 100,
    description: '전설의 해양 괴물 크라켄이 나타났다!!',
  },
  {
    name: '저주받은 닻',
    emoji: '⚓',
    hp: 30,
    attack: 10,
    goldReward: 100,
    xpReward: 30,
    description: '닻이 혼자 움직이고 있다...?!',
  },
  {
    name: '심해 용왕',
    emoji: '🐉',
    hp: 150,
    attack: 40,
    goldReward: 1000,
    xpReward: 150,
    description: '심해에서 전설의 용이 떠올랐다!!!',
  },
]

export function rollSeaMonster(): SeaMonster {
  return seaMonsters[Math.floor(Math.random() * seaMonsters.length)]
}

// ══════════════════════════════════════════════════════════
//  Dangerous catches
// ══════════════════════════════════════════════════════════

export const dangerousCatches: DangerousCatch[] = [
  {
    name: '광대버섯',
    emoji: '🍄',
    damage: 0,
    goldLoss: 0,
    description: '화려한 색의 독버섯이 낚싯줄에 걸려왔다!',
    deathMessage:
      '광대버섯을 먹어버렸습니다... 🍄💀\n영혼이 무지개빛으로 빛나며 승천합니다.',
  },
  {
    name: '다이너마이트',
    emoji: '🧨',
    damage: 0,
    goldLoss: 100,
    description: '낚싯줄에 뭔가... 빨간 것이?!',
    deathMessage:
      '다이너마이트가 터졌습니다!!! 💥💀\n반경 10m가 초토화되었습니다.',
  },
  {
    name: '저주받은 인형',
    emoji: '🪆',
    damage: 0,
    goldLoss: 0,
    description: '깊은 바다에서 인형이 올라왔다... 눈이 움직인다!',
    deathMessage:
      '인형이 당신을 쳐다봅니다... "같이 놀자..." 🪆💀\n당신의 영혼이 인형에 봉인되었습니다.',
  },
  {
    name: '세금 고지서',
    emoji: '📋',
    damage: 30,
    goldLoss: 500,
    description: '국세청에서 날아온 세금 고지서!!',
    deathMessage:
      '밀린 세금 500G가 자동 납부되었습니다... 📋💸\n정신적 데미지가 심각합니다.',
  },
  {
    name: '폭탄',
    emoji: '💣',
    damage: 0,
    goldLoss: 50,
    description: '째깍째깍... 3초 남았다!!!',
    deathMessage: '💣💥 BOOM! 낚싯대와 함께 산산조각!',
  },
  {
    name: '복어 독',
    emoji: '🐡',
    damage: 80,
    goldLoss: 0,
    description: '복어가 터지면서 독이 퍼졌다!',
    deathMessage:
      '테트로도톡신에 중독되었습니다! 🐡☠️\n혀가 마비됩니다... 구급차를 불러주세요...',
  },
  {
    name: '전 여친/남친의 편지',
    emoji: '💌',
    damage: 50,
    goldLoss: 0,
    description: '바다에서 편지가 올라왔다... 읽으면 안 되는데...',
    deathMessage:
      '"우리 그때 왜 헤어졌을까..." 💌😭\n정신적 데미지 50! 눈물이 멈추지 않습니다.',
  },
  {
    name: '해파리 떼',
    emoji: '🪼',
    damage: 60,
    goldLoss: 0,
    description: '해파리 떼가 낚싯줄을 타고 올라온다!',
    deathMessage: '해파리에 온몸이 쏘였습니다! 🪼⚡\n따끔따끔...',
  },
  {
    name: '고대 지뢰',
    emoji: '💥',
    damage: 0,
    goldLoss: 200,
    description: '녹슨 금속 물체가... 잠깐, 이거 지뢰 아닌가?!',
    deathMessage: '6.25 때 매설된 지뢰가 폭발했습니다! 💥💀',
  },
  {
    name: '유독성 해삼',
    emoji: '🫠',
    damage: 40,
    goldLoss: 0,
    description: '이상하게 생긴 해삼이 독성 물질을 뿜고 있다!',
    deathMessage: '독성 해삼의 내장을 맞았습니다! 🫠\n얼굴이 부어오릅니다...',
  },
  {
    name: '카드값 청구서',
    emoji: '💳',
    damage: 70,
    goldLoss: 300,
    description: '물 위에 뭔가 떠다닌다... 이번 달 카드값!',
    deathMessage: '이번 달 카드값: 300G 💳💸\n현실의 공포에 HP가 급감합니다.',
  },
  {
    name: '방사능 폐기물',
    emoji: '☢️',
    damage: 0,
    goldLoss: 0,
    description: '형광빛 드럼통이 올라왔다... 체르노빌 느낌?',
    deathMessage:
      '방사능에 노출되었습니다! ☢️💀\n당신은 이제 밤에 빛납니다.',
  },
]

export function rollDangerousCatch(): DangerousCatch {
  return dangerousCatches[Math.floor(Math.random() * dangerousCatches.length)]
}

// ══════════════════════════════════════════════════════════
//  Trash items
// ══════════════════════════════════════════════════════════

export const trashPool: TrashType[] = [
  { name: '빈 깡통', emoji: '🥫', disposalCost: 5, pollutionAmount: 2, description: '녹슨 깡통이다' },
  { name: '비닐봉지', emoji: '🛍️', disposalCost: 3, pollutionAmount: 3, description: '환경 오염의 주범' },
  { name: '오래된 장화', emoji: '👢', disposalCost: 8, pollutionAmount: 2, description: '누가 버린 걸까' },
  { name: '깨진 유리병', emoji: '🍾', disposalCost: 10, pollutionAmount: 4, description: '위험! 물고기들이 다칠 수 있다' },
  { name: '타이어', emoji: '🛞', disposalCost: 30, pollutionAmount: 8, description: '거대한 폐타이어' },
  { name: '폐배터리', emoji: '🔋', disposalCost: 25, pollutionAmount: 10, description: '수질을 심각하게 오염시킨다' },
  { name: '스티로폼', emoji: '📦', disposalCost: 5, pollutionAmount: 3, description: '잘게 부서져 미세플라스틱이 된다' },
  { name: '떠다니는 쓰레기 봉투', emoji: '🗑️', disposalCost: 4, pollutionAmount: 2, description: '거북이가 해파리로 착각한다' },
  { name: '녹슨 낚싯바늘 뭉치', emoji: '🪝', disposalCost: 7, pollutionAmount: 3, description: '이전 낚시꾼의 흔적' },
  { name: '폐유통', emoji: '🛢️', disposalCost: 50, pollutionAmount: 10, description: '기름이 새고 있다! 긴급 처리 필요!' },
  { name: '낡은 신발', emoji: '👟', disposalCost: 6, pollutionAmount: 2, description: '한 짝만 있다' },
  { name: '플라스틱 빨대', emoji: '🥤', disposalCost: 2, pollutionAmount: 2, description: '바다거북의 천적' },
  { name: '부서진 우산', emoji: '☂️', disposalCost: 8, pollutionAmount: 3, description: '강풍에 날아온 듯' },
  { name: '엉킨 낚싯줄', emoji: '🧵', disposalCost: 5, pollutionAmount: 4, description: '물고기가 감길 수 있어 위험하다' },
  { name: '침몰한 보트 조각', emoji: '🚣', disposalCost: 40, pollutionAmount: 6, description: '페인트 성분이 물에 녹고 있다' },
]

export function rollTrash(): TrashType {
  return trashPool[Math.floor(Math.random() * trashPool.length)]
}

// ══════════════════════════════════════════════════════════
//  Labels & colors (mirror src/render/theme.ts for embed fallback paths)
// ══════════════════════════════════════════════════════════

export const fishRarityLabels: Record<string, string> = {
  common: '⬜ 일반',
  uncommon: '🟩 고급',
  rare: '🟦 희귀',
  epic: '🟪 영웅',
  legendary: '🟨 전설',
  mythic: '🟥 신화',
}

export const fishRarityColors: Record<string, number> = {
  common: 0x9ca3af,
  uncommon: 0x22c55e,
  rare: 0x3b82f6,
  epic: 0xa855f7,
  legendary: 0xfacc15,
  mythic: 0xef4444,
}

// ══════════════════════════════════════════════════════════
//  Fish dataset — curated, real Korean/Asian fish + mythical
// ══════════════════════════════════════════════════════════

// Helper to keep entries terse. Defaults reflect "no constraint".
type FishDef = Partial<FishType> &
  Pick<
    FishType,
    | 'id'
    | 'name'
    | 'emoji'
    | 'rarity'
    | 'habitat'
    | 'size'
    | 'weightCoeff'
    | 'baseValuePerKg'
    | 'description'
  >

function f(def: FishDef): FishType {
  return {
    season: ['all'],
    timeOfDay: ['any'],
    baitTypes: ['any'],
    ...def,
  } as FishType
}

// ─── COMMON (60) ──────────────────────────────────────────
const commonFish: FishType[] = [
  // Freshwater
  f({ id: 'crucian_carp', name: '붕어', scientificName: 'Carassius carassius', emoji: '🐟', rarity: 'common', habitat: ['freshwater'], baitTypes: ['worm', 'pellet'], size: { min: 8, max: 35, mean: 18, stdDev: 5 }, weightCoeff: 14, baseValuePerKg: 80, description: '한국에서 가장 흔한 민물고기' }),
  f({ id: 'common_carp', name: '잉어', scientificName: 'Cyprinus carpio', emoji: '🐟', rarity: 'common', habitat: ['freshwater'], baitTypes: ['worm', 'pellet'], size: { min: 20, max: 80, mean: 45, stdDev: 12 }, weightCoeff: 16, baseValuePerKg: 70, description: '연못의 터줏대감' }),
  f({ id: 'mudfish', name: '미꾸라지', scientificName: 'Misgurnus anguillicaudatus', emoji: '🐍', rarity: 'common', habitat: ['freshwater'], baitTypes: ['worm'], size: { min: 6, max: 22, mean: 12, stdDev: 4 }, weightCoeff: 2, baseValuePerKg: 90, description: '미끌미끌한 민물고기, 추어탕의 주재료' }),
  f({ id: 'minnow', name: '피라미', scientificName: 'Zacco platypus', emoji: '🐠', rarity: 'common', habitat: ['freshwater'], baitTypes: ['worm'], size: { min: 5, max: 16, mean: 9, stdDev: 3 }, weightCoeff: 4, baseValuePerKg: 60, description: '맑은 개울의 작은 물고기' }),
  f({ id: 'medaka', name: '송사리', scientificName: 'Oryzias latipes', emoji: '🐟', rarity: 'common', habitat: ['freshwater'], baitTypes: ['worm'], size: { min: 2, max: 8, mean: 4, stdDev: 1.5 }, weightCoeff: 1, baseValuePerKg: 50, description: '정말 작은 민물고기' }),
  f({ id: 'pond_smelt', name: '빙어', scientificName: 'Hypomesus nipponensis', emoji: '🐟', rarity: 'common', habitat: ['freshwater'], season: ['winter'], baitTypes: ['worm'], size: { min: 5, max: 15, mean: 9, stdDev: 3 }, weightCoeff: 3, baseValuePerKg: 100, description: '겨울 빙어낚시의 주인공' }),
  f({ id: 'chinese_minnow', name: '버들치', emoji: '🐟', rarity: 'common', habitat: ['freshwater'], baitTypes: ['worm'], size: { min: 4, max: 12, mean: 7, stdDev: 2 }, weightCoeff: 3, baseValuePerKg: 50, description: '맑은 계곡의 작은 물고기' }),
  f({ id: 'bitterling', name: '납자루', emoji: '🐟', rarity: 'common', habitat: ['freshwater'], baitTypes: ['worm'], size: { min: 3, max: 10, mean: 6, stdDev: 2 }, weightCoeff: 4, baseValuePerKg: 60, description: '조개에 알을 낳는 신기한 물고기' }),
  f({ id: 'rock_minnow', name: '돌고기', emoji: '🐟', rarity: 'common', habitat: ['freshwater'], baitTypes: ['worm'], size: { min: 5, max: 15, mean: 9, stdDev: 3 }, weightCoeff: 5, baseValuePerKg: 60, description: '돌 틈에 사는 물고기' }),
  f({ id: 'sand_loach', name: '모래무지', emoji: '🐟', rarity: 'common', habitat: ['freshwater'], baitTypes: ['worm'], size: { min: 5, max: 18, mean: 10, stdDev: 3 }, weightCoeff: 4, baseValuePerKg: 60, description: '모래 바닥을 좋아한다' }),
  f({ id: 'bluegill', name: '블루길', scientificName: 'Lepomis macrochirus', emoji: '🐠', rarity: 'common', habitat: ['freshwater'], baitTypes: ['worm', 'lure'], size: { min: 8, max: 25, mean: 15, stdDev: 4 }, weightCoeff: 10, baseValuePerKg: 50, description: '외래종 — 생태계 교란종' }),
  f({ id: 'crucian_carp_pp', name: '떡붕어', emoji: '🐟', rarity: 'common', habitat: ['freshwater'], baitTypes: ['pellet'], size: { min: 15, max: 40, mean: 25, stdDev: 6 }, weightCoeff: 18, baseValuePerKg: 75, description: '떡밥에 잘 무는 큰 붕어' }),
  f({ id: 'common_minnow', name: '갈겨니', emoji: '🐟', rarity: 'common', habitat: ['freshwater'], baitTypes: ['worm'], size: { min: 6, max: 16, mean: 10, stdDev: 3 }, weightCoeff: 4, baseValuePerKg: 55, description: '맑은 강의 작은 물고기' }),
  f({ id: 'gizzard_shad', name: '누치', emoji: '🐟', rarity: 'common', habitat: ['freshwater'], baitTypes: ['worm', 'lure'], size: { min: 15, max: 50, mean: 28, stdDev: 7 }, weightCoeff: 10, baseValuePerKg: 70, description: '강의 잡어' }),
  f({ id: 'spotted_steed', name: '얼룩동사리', emoji: '🐟', rarity: 'common', habitat: ['freshwater'], baitTypes: ['worm'], size: { min: 6, max: 18, mean: 11, stdDev: 3 }, weightCoeff: 6, baseValuePerKg: 60, description: '바닥에 사는 잡식성 물고기' }),
  f({ id: 'topmouth_gudgeon', name: '참붕어', emoji: '🐟', rarity: 'common', habitat: ['freshwater'], baitTypes: ['worm'], size: { min: 4, max: 11, mean: 7, stdDev: 2 }, weightCoeff: 4, baseValuePerKg: 50, description: '흔한 민물 잡어' }),
  // Saltwater commons
  f({ id: 'mackerel', name: '고등어', scientificName: 'Scomber japonicus', emoji: '🐟', rarity: 'common', habitat: ['saltwater'], baitTypes: ['lure', 'shrimp'], size: { min: 20, max: 50, mean: 30, stdDev: 7 }, weightCoeff: 6, baseValuePerKg: 100, description: '국민 생선' }),
  f({ id: 'sardine', name: '정어리', scientificName: 'Sardinops sagax', emoji: '🐟', rarity: 'common', habitat: ['saltwater'], baitTypes: ['shrimp'], size: { min: 10, max: 25, mean: 16, stdDev: 4 }, weightCoeff: 4, baseValuePerKg: 70, description: '떼지어 다니는 작은 청어과 어류' }),
  f({ id: 'anchovy', name: '멸치', scientificName: 'Engraulis japonicus', emoji: '🐟', rarity: 'common', habitat: ['saltwater'], baitTypes: ['shrimp'], size: { min: 5, max: 15, mean: 9, stdDev: 2 }, weightCoeff: 2, baseValuePerKg: 110, description: '국물의 기본' }),
  f({ id: 'sandlance', name: '까나리', emoji: '🐟', rarity: 'common', habitat: ['saltwater'], baitTypes: ['shrimp'], size: { min: 6, max: 18, mean: 11, stdDev: 3 }, weightCoeff: 1.5, baseValuePerKg: 80, description: '액젓의 주재료' }),
  f({ id: 'horse_mackerel', name: '전갱이', scientificName: 'Trachurus japonicus', emoji: '🐟', rarity: 'common', habitat: ['saltwater'], baitTypes: ['lure', 'shrimp'], size: { min: 15, max: 40, mean: 23, stdDev: 6 }, weightCoeff: 5, baseValuePerKg: 90, description: '회로도 구이로도 좋다' }),
  f({ id: 'mullet', name: '숭어', scientificName: 'Mugil cephalus', emoji: '🐟', rarity: 'common', habitat: ['saltwater', 'freshwater'], baitTypes: ['worm', 'pellet'], size: { min: 20, max: 60, mean: 35, stdDev: 9 }, weightCoeff: 8, baseValuePerKg: 90, description: '강과 바다를 오가는 물고기' }),
  f({ id: 'gray_mullet_juvenile', name: '모쟁이', emoji: '🐟', rarity: 'common', habitat: ['saltwater'], baitTypes: ['worm'], size: { min: 8, max: 20, mean: 13, stdDev: 3 }, weightCoeff: 5, baseValuePerKg: 75, description: '숭어의 어린 시절' }),
  f({ id: 'pacific_saury', name: '꽁치', scientificName: 'Cololabis saira', emoji: '🐟', rarity: 'common', habitat: ['saltwater'], baitTypes: ['lure', 'shrimp'], size: { min: 20, max: 35, mean: 27, stdDev: 4 }, weightCoeff: 3, baseValuePerKg: 100, description: '가을 꽁치 구이!' }),
  f({ id: 'pollack_juvenile', name: '노가리', emoji: '🐟', rarity: 'common', habitat: ['saltwater'], baitTypes: ['lure'], size: { min: 15, max: 30, mean: 22, stdDev: 4 }, weightCoeff: 4, baseValuePerKg: 70, description: '명태의 새끼, 안주의 친구' }),
  f({ id: 'small_bream', name: '도다리', emoji: '🐟', rarity: 'common', habitat: ['saltwater'], baitTypes: ['shrimp'], size: { min: 15, max: 35, mean: 22, stdDev: 5 }, weightCoeff: 8, baseValuePerKg: 110, description: '봄 도다리쑥국' }),
  f({ id: 'gizzard_shad_sw', name: '전어', scientificName: 'Konosirus punctatus', emoji: '🐟', rarity: 'common', habitat: ['saltwater'], baitTypes: ['shrimp'], season: ['autumn'], size: { min: 15, max: 30, mean: 22, stdDev: 4 }, weightCoeff: 5, baseValuePerKg: 120, description: '집 나간 며느리도 돌아오는 가을 별미' }),
  f({ id: 'bullet_tuna', name: '점다랑어', emoji: '🐟', rarity: 'common', habitat: ['saltwater'], baitTypes: ['lure'], size: { min: 25, max: 50, mean: 35, stdDev: 6 }, weightCoeff: 8, baseValuePerKg: 110, description: '작은 다랑어' }),
  f({ id: 'rockfish_juvenile', name: '뽀돌락', emoji: '🐟', rarity: 'common', habitat: ['saltwater'], baitTypes: ['shrimp'], size: { min: 10, max: 22, mean: 15, stdDev: 3 }, weightCoeff: 6, baseValuePerKg: 90, description: '볼락의 어린 시절' }),
  f({ id: 'chub', name: '끄리', emoji: '🐟', rarity: 'common', habitat: ['freshwater'], baitTypes: ['lure', 'worm'], size: { min: 15, max: 50, mean: 28, stdDev: 8 }, weightCoeff: 8, baseValuePerKg: 65, description: '강의 약탈자' }),
  f({ id: 'eel_baby', name: '실뱀장어', emoji: '🐍', rarity: 'common', habitat: ['freshwater', 'saltwater'], baitTypes: ['worm'], size: { min: 5, max: 10, mean: 7, stdDev: 1 }, weightCoeff: 0.8, baseValuePerKg: 200, description: '뱀장어의 새끼, 비싸다' }),
  f({ id: 'silver_carp', name: '은연어', emoji: '🐟', rarity: 'common', habitat: ['freshwater'], baitTypes: ['lure'], size: { min: 30, max: 70, mean: 45, stdDev: 10 }, weightCoeff: 12, baseValuePerKg: 80, description: '큰 잉어과 외래종' }),
  f({ id: 'baby_octopus', name: '주꾸미', scientificName: 'Octopus ocellatus', emoji: '🐙', rarity: 'common', habitat: ['saltwater'], baitTypes: ['lure'], season: ['spring'], size: { min: 10, max: 25, mean: 16, stdDev: 4 }, weightCoeff: 5, baseValuePerKg: 130, description: '봄 주꾸미!' }),
  f({ id: 'stickleback', name: '큰가시고기', emoji: '🐟', rarity: 'common', habitat: ['freshwater', 'saltwater'], baitTypes: ['worm'], size: { min: 4, max: 12, mean: 7, stdDev: 2 }, weightCoeff: 2, baseValuePerKg: 60, description: '가시 돋힌 작은 물고기' }),
  f({ id: 'half_beak', name: '학꽁치', emoji: '🐟', rarity: 'common', habitat: ['saltwater'], baitTypes: ['shrimp'], size: { min: 15, max: 30, mean: 22, stdDev: 4 }, weightCoeff: 2, baseValuePerKg: 90, description: '주둥이가 긴 작은 물고기' }),
  f({ id: 'common_pond_smelt', name: '바다빙어', emoji: '🐟', rarity: 'common', habitat: ['saltwater'], baitTypes: ['shrimp'], season: ['winter'], size: { min: 8, max: 20, mean: 13, stdDev: 3 }, weightCoeff: 3, baseValuePerKg: 80, description: '바다의 빙어' }),
  f({ id: 'long_jaw', name: '긴턱멸', emoji: '🐟', rarity: 'common', habitat: ['saltwater'], baitTypes: ['shrimp'], size: { min: 6, max: 16, mean: 10, stdDev: 3 }, weightCoeff: 2, baseValuePerKg: 60, description: '주둥이가 긴 멸치' }),
  f({ id: 'rabbit_fish', name: '독가시치', emoji: '🐠', rarity: 'common', habitat: ['saltwater'], baitTypes: ['worm'], size: { min: 12, max: 28, mean: 18, stdDev: 4 }, weightCoeff: 7, baseValuePerKg: 75, description: '독가시가 있다, 조심!' }),
  f({ id: 'sand_eel', name: '양미리', emoji: '🐟', rarity: 'common', habitat: ['saltwater'], baitTypes: ['shrimp'], size: { min: 10, max: 22, mean: 15, stdDev: 3 }, weightCoeff: 2, baseValuePerKg: 70, description: '겨울 양미리 구이' }),
  f({ id: 'common_dace', name: '갈겨니류', emoji: '🐟', rarity: 'common', habitat: ['freshwater'], baitTypes: ['worm'], size: { min: 8, max: 22, mean: 14, stdDev: 4 }, weightCoeff: 4, baseValuePerKg: 55, description: '강 중상류의 작은 물고기' }),
  f({ id: 'common_smelt', name: '왜몰개', emoji: '🐟', rarity: 'common', habitat: ['freshwater'], baitTypes: ['worm'], size: { min: 4, max: 11, mean: 7, stdDev: 2 }, weightCoeff: 2, baseValuePerKg: 50, description: '논두렁의 작은 물고기' }),
  f({ id: 'silvery_dace', name: '은어새끼', emoji: '🐟', rarity: 'common', habitat: ['freshwater'], baitTypes: ['worm'], size: { min: 5, max: 14, mean: 9, stdDev: 2 }, weightCoeff: 3, baseValuePerKg: 90, description: '은어의 어린 시절' }),
  f({ id: 'spotted_loach', name: '점박이미꾸라지', emoji: '🐍', rarity: 'common', habitat: ['freshwater'], baitTypes: ['worm'], size: { min: 6, max: 18, mean: 11, stdDev: 3 }, weightCoeff: 2, baseValuePerKg: 65, description: '점박이 무늬의 미꾸라지' }),
  f({ id: 'gobi', name: '망둑어', emoji: '🐟', rarity: 'common', habitat: ['saltwater', 'freshwater'], baitTypes: ['worm'], size: { min: 8, max: 22, mean: 13, stdDev: 4 }, weightCoeff: 4, baseValuePerKg: 70, description: '갯벌의 점프하는 물고기' }),
  f({ id: 'common_chub', name: '동사리', emoji: '🐟', rarity: 'common', habitat: ['freshwater'], baitTypes: ['worm'], size: { min: 8, max: 22, mean: 13, stdDev: 4 }, weightCoeff: 5, baseValuePerKg: 60, description: '바닥에 사는 잡어' }),
  f({ id: 'kid_shark', name: '두툽상어', emoji: '🦈', rarity: 'common', habitat: ['saltwater'], baitTypes: ['shrimp'], size: { min: 30, max: 60, mean: 45, stdDev: 8 }, weightCoeff: 5, baseValuePerKg: 80, description: '작은 상어, 바닥에 산다' }),
  f({ id: 'starry_flounder', name: '별가자미', emoji: '🐟', rarity: 'common', habitat: ['saltwater'], baitTypes: ['shrimp'], size: { min: 15, max: 35, mean: 22, stdDev: 5 }, weightCoeff: 8, baseValuePerKg: 100, description: '별 무늬의 작은 가자미' }),
  f({ id: 'cod_baby', name: '대구새끼', emoji: '🐟', rarity: 'common', habitat: ['saltwater'], baitTypes: ['lure'], size: { min: 20, max: 40, mean: 28, stdDev: 5 }, weightCoeff: 6, baseValuePerKg: 100, description: '대구의 어린 시절' }),
  f({ id: 'small_squid', name: '꼴뚜기', emoji: '🦑', rarity: 'common', habitat: ['saltwater'], baitTypes: ['lure'], size: { min: 5, max: 15, mean: 9, stdDev: 3 }, weightCoeff: 3, baseValuePerKg: 90, description: '작은 오징어' }),
  f({ id: 'mantis_shrimp', name: '갯가재', emoji: '🦐', rarity: 'common', habitat: ['saltwater'], baitTypes: ['worm'], size: { min: 8, max: 18, mean: 12, stdDev: 3 }, weightCoeff: 6, baseValuePerKg: 100, description: '강력한 앞발의 갑각류' }),
  f({ id: 'crab_baby', name: '어린 게', emoji: '🦀', rarity: 'common', habitat: ['saltwater'], baitTypes: ['worm'], size: { min: 5, max: 15, mean: 9, stdDev: 3 }, weightCoeff: 6, baseValuePerKg: 90, description: '바닷가의 작은 게' }),
  f({ id: 'eel_grass_fish', name: '실고기', emoji: '🐠', rarity: 'common', habitat: ['saltwater'], baitTypes: ['shrimp'], size: { min: 8, max: 20, mean: 13, stdDev: 3 }, weightCoeff: 1, baseValuePerKg: 60, description: '해초 사이에 사는 가는 물고기' }),
  f({ id: 'puffer_juv', name: '복어새끼', emoji: '🐡', rarity: 'common', habitat: ['saltwater'], baitTypes: ['shrimp'], size: { min: 8, max: 20, mean: 13, stdDev: 3 }, weightCoeff: 8, baseValuePerKg: 80, description: '복어의 어린 시절, 독은 약함' }),
  f({ id: 'snake_fish_baby', name: '꺽지', emoji: '🐟', rarity: 'common', habitat: ['freshwater'], baitTypes: ['lure'], size: { min: 10, max: 22, mean: 15, stdDev: 3 }, weightCoeff: 7, baseValuePerKg: 80, description: '계곡의 포식자' }),
  f({ id: 'barbel_steed', name: '누치류', emoji: '🐟', rarity: 'common', habitat: ['freshwater'], baitTypes: ['worm'], size: { min: 15, max: 40, mean: 25, stdDev: 6 }, weightCoeff: 9, baseValuePerKg: 70, description: '큰 강의 잡어' }),
  f({ id: 'small_jellyfish', name: '해파리', emoji: '🪼', rarity: 'common', habitat: ['saltwater'], baitTypes: ['any'], size: { min: 10, max: 30, mean: 18, stdDev: 5 }, weightCoeff: 4, baseValuePerKg: 40, description: '말랑말랑한 바다 생물' }),
  f({ id: 'rockfish_juv', name: '쏨뱅이새끼', emoji: '🐟', rarity: 'common', habitat: ['saltwater'], baitTypes: ['shrimp'], size: { min: 10, max: 22, mean: 15, stdDev: 3 }, weightCoeff: 7, baseValuePerKg: 85, description: '쏨뱅이의 어린 시절' }),
  f({ id: 'small_octopus', name: '낙지새끼', emoji: '🐙', rarity: 'common', habitat: ['saltwater'], baitTypes: ['lure'], size: { min: 10, max: 25, mean: 16, stdDev: 4 }, weightCoeff: 4, baseValuePerKg: 130, description: '낙지의 어린 시절' }),
  f({ id: 'small_cuttle', name: '갑오징어', scientificName: 'Sepia esculenta', emoji: '🦑', rarity: 'common', habitat: ['saltwater'], baitTypes: ['lure'], size: { min: 10, max: 25, mean: 16, stdDev: 4 }, weightCoeff: 8, baseValuePerKg: 110, description: '뼈가 있는 오징어' }),
  f({ id: 'small_sea_cucumber', name: '해삼', emoji: '🫠', rarity: 'common', habitat: ['saltwater'], baitTypes: ['any'], size: { min: 8, max: 25, mean: 15, stdDev: 4 }, weightCoeff: 7, baseValuePerKg: 90, description: '바다의 인삼' }),
]

// ─── UNCOMMON (50) ────────────────────────────────────────
const uncommonFish: FishType[] = [
  f({ id: 'catfish', name: '메기', scientificName: 'Silurus asotus', emoji: '🐟', rarity: 'uncommon', habitat: ['freshwater'], baitTypes: ['worm', 'special'], timeOfDay: ['night', 'dusk'], size: { min: 30, max: 90, mean: 55, stdDev: 12 }, weightCoeff: 18, baseValuePerKg: 200, description: '강과 호수의 야행성 포식자' }),
  f({ id: 'snakehead', name: '가물치', scientificName: 'Channa argus', emoji: '🐟', rarity: 'uncommon', habitat: ['freshwater'], baitTypes: ['lure', 'worm'], size: { min: 30, max: 100, mean: 55, stdDev: 15 }, weightCoeff: 18, baseValuePerKg: 220, description: '한국 토종 포식자, 가물치죽 별미' }),
  f({ id: 'eel', name: '뱀장어', scientificName: 'Anguilla japonica', emoji: '🐍', rarity: 'uncommon', habitat: ['freshwater', 'saltwater'], baitTypes: ['worm'], timeOfDay: ['night'], size: { min: 30, max: 100, mean: 55, stdDev: 14 }, weightCoeff: 3, baseValuePerKg: 350, description: '뱀장어구이!' }),
  f({ id: 'rainbow_trout', name: '무지개송어', scientificName: 'Oncorhynchus mykiss', emoji: '🐟', rarity: 'uncommon', habitat: ['freshwater'], baitTypes: ['lure', 'pellet'], season: ['spring', 'autumn'], size: { min: 25, max: 70, mean: 40, stdDev: 10 }, weightCoeff: 12, baseValuePerKg: 180, description: '무지개빛 옆구리의 송어' }),
  f({ id: 'masu_salmon', name: '산천어', scientificName: 'Oncorhynchus masou', emoji: '🐟', rarity: 'uncommon', habitat: ['freshwater'], baitTypes: ['lure'], size: { min: 20, max: 50, mean: 32, stdDev: 8 }, weightCoeff: 10, baseValuePerKg: 200, description: '계곡의 청정수에 사는 송어' }),
  f({ id: 'lenok', name: '열목어', emoji: '🐟', rarity: 'uncommon', habitat: ['freshwater'], baitTypes: ['lure'], size: { min: 25, max: 60, mean: 38, stdDev: 9 }, weightCoeff: 11, baseValuePerKg: 180, description: '천연기념물, 보호 대상' }),
  f({ id: 'sweetfish', name: '은어', scientificName: 'Plecoglossus altivelis', emoji: '🐟', rarity: 'uncommon', habitat: ['freshwater'], baitTypes: ['lure'], season: ['summer'], size: { min: 15, max: 30, mean: 22, stdDev: 4 }, weightCoeff: 5, baseValuePerKg: 280, description: '향기로운 강 물고기' }),
  f({ id: 'mandarin', name: '쏘가리', scientificName: 'Siniperca scherzeri', emoji: '🐠', rarity: 'uncommon', habitat: ['freshwater'], baitTypes: ['lure'], size: { min: 25, max: 60, mean: 38, stdDev: 9 }, weightCoeff: 12, baseValuePerKg: 320, description: '강 중상류의 보석' }),
  f({ id: 'korean_aucha_perch', name: '꺽저기', emoji: '🐟', rarity: 'uncommon', habitat: ['freshwater'], baitTypes: ['lure'], size: { min: 12, max: 28, mean: 18, stdDev: 4 }, weightCoeff: 7, baseValuePerKg: 200, description: '한국 고유종 농어과' }),
  f({ id: 'common_dab', name: '가자미', scientificName: 'Pleuronectidae sp.', emoji: '🐟', rarity: 'uncommon', habitat: ['saltwater'], baitTypes: ['shrimp'], size: { min: 20, max: 50, mean: 32, stdDev: 7 }, weightCoeff: 10, baseValuePerKg: 220, description: '바닥에 사는 납작한 물고기' }),
  f({ id: 'olive_flounder', name: '광어', scientificName: 'Paralichthys olivaceus', emoji: '🐟', rarity: 'uncommon', habitat: ['saltwater'], baitTypes: ['lure', 'shrimp'], size: { min: 30, max: 80, mean: 45, stdDev: 11 }, weightCoeff: 11, baseValuePerKg: 280, description: '회의 왕, 광어회!' }),
  f({ id: 'sea_bass', name: '농어', scientificName: 'Lateolabrax japonicus', emoji: '🐟', rarity: 'uncommon', habitat: ['saltwater'], baitTypes: ['lure'], size: { min: 30, max: 90, mean: 50, stdDev: 12 }, weightCoeff: 9, baseValuePerKg: 240, description: '바다의 사냥꾼' }),
  f({ id: 'rockfish', name: '우럭', scientificName: 'Sebastes schlegeli', emoji: '🐟', rarity: 'uncommon', habitat: ['saltwater'], baitTypes: ['shrimp'], size: { min: 20, max: 50, mean: 32, stdDev: 7 }, weightCoeff: 10, baseValuePerKg: 220, description: '낚시의 인기 어종' }),
  f({ id: 'redbanded_rockfish', name: '볼락', scientificName: 'Sebastes inermis', emoji: '🐟', rarity: 'uncommon', habitat: ['saltwater'], baitTypes: ['shrimp'], size: { min: 15, max: 35, mean: 22, stdDev: 5 }, weightCoeff: 8, baseValuePerKg: 240, description: '맛있는 볼락구이' }),
  f({ id: 'spanish_mackerel', name: '삼치', scientificName: 'Scomberomorus niphonius', emoji: '🐟', rarity: 'uncommon', habitat: ['saltwater'], baitTypes: ['lure'], season: ['autumn'], size: { min: 50, max: 100, mean: 70, stdDev: 12 }, weightCoeff: 7, baseValuePerKg: 230, description: '가을 삼치 구이' }),
  f({ id: 'hairtail', name: '갈치', scientificName: 'Trichiurus lepturus', emoji: '🐟', rarity: 'uncommon', habitat: ['saltwater'], baitTypes: ['shrimp', 'lure'], timeOfDay: ['night'], size: { min: 50, max: 130, mean: 80, stdDev: 18 }, weightCoeff: 2, baseValuePerKg: 280, description: '은빛 칼날 같은 물고기' }),
  f({ id: 'pacific_cod', name: '대구', scientificName: 'Gadus macrocephalus', emoji: '🐟', rarity: 'uncommon', habitat: ['saltwater'], baitTypes: ['lure'], season: ['winter'], size: { min: 40, max: 100, mean: 60, stdDev: 14 }, weightCoeff: 8, baseValuePerKg: 250, description: '겨울 대구탕' }),
  f({ id: 'pollack', name: '명태', scientificName: 'Gadus chalcogrammus', emoji: '🐟', rarity: 'uncommon', habitat: ['saltwater'], baitTypes: ['lure'], season: ['winter'], size: { min: 30, max: 70, mean: 45, stdDev: 10 }, weightCoeff: 6, baseValuePerKg: 230, description: '동태, 황태, 코다리... 변신의 왕' }),
  f({ id: 'red_seabream', name: '참돔', scientificName: 'Pagrus major', emoji: '🐠', rarity: 'uncommon', habitat: ['saltwater'], baitTypes: ['shrimp', 'lure'], size: { min: 30, max: 80, mean: 45, stdDev: 11 }, weightCoeff: 13, baseValuePerKg: 320, description: '돔 중의 왕' }),
  f({ id: 'black_seabream', name: '감성돔', scientificName: 'Acanthopagrus schlegelii', emoji: '🐠', rarity: 'uncommon', habitat: ['saltwater'], baitTypes: ['shrimp'], size: { min: 25, max: 60, mean: 38, stdDev: 8 }, weightCoeff: 12, baseValuePerKg: 290, description: '감성적인 돔' }),
  f({ id: 'yellow_corvina', name: '참조기', scientificName: 'Larimichthys polyactis', emoji: '🐟', rarity: 'uncommon', habitat: ['saltwater'], baitTypes: ['shrimp'], size: { min: 20, max: 40, mean: 28, stdDev: 5 }, weightCoeff: 8, baseValuePerKg: 280, description: '굴비의 원료' }),
  f({ id: 'large_yellow_croaker', name: '부세', emoji: '🐟', rarity: 'uncommon', habitat: ['saltwater'], baitTypes: ['shrimp'], size: { min: 30, max: 60, mean: 42, stdDev: 8 }, weightCoeff: 9, baseValuePerKg: 240, description: '조기과의 큰 물고기' }),
  f({ id: 'small_yellow_croaker', name: '백조기', emoji: '🐟', rarity: 'uncommon', habitat: ['saltwater'], baitTypes: ['shrimp'], size: { min: 20, max: 40, mean: 28, stdDev: 5 }, weightCoeff: 7, baseValuePerKg: 220, description: '하얀 조기' }),
  f({ id: 'puffer', name: '복어', scientificName: 'Takifugu sp.', emoji: '🐡', rarity: 'uncommon', habitat: ['saltwater'], baitTypes: ['shrimp'], size: { min: 20, max: 50, mean: 30, stdDev: 7 }, weightCoeff: 12, baseValuePerKg: 260, description: '독이 있지만 별미' }),
  f({ id: 'sailfin_sandfish', name: '도루묵', emoji: '🐟', rarity: 'uncommon', habitat: ['saltwater'], baitTypes: ['shrimp'], season: ['winter'], size: { min: 15, max: 30, mean: 22, stdDev: 4 }, weightCoeff: 5, baseValuePerKg: 200, description: '겨울 도루묵찌개' }),
  f({ id: 'spear_squid', name: '오징어', scientificName: 'Todarodes pacificus', emoji: '🦑', rarity: 'uncommon', habitat: ['saltwater'], baitTypes: ['lure'], timeOfDay: ['night'], size: { min: 20, max: 45, mean: 30, stdDev: 6 }, weightCoeff: 6, baseValuePerKg: 200, description: '밤바다의 별미' }),
  f({ id: 'long_arm_octopus', name: '낙지', scientificName: 'Octopus minor', emoji: '🐙', rarity: 'uncommon', habitat: ['saltwater'], baitTypes: ['lure'], size: { min: 30, max: 70, mean: 45, stdDev: 10 }, weightCoeff: 5, baseValuePerKg: 250, description: '뻘낙지! 산낙지!' }),
  f({ id: 'webfoot_octopus', name: '주꾸미(중)', emoji: '🐙', rarity: 'uncommon', habitat: ['saltwater'], baitTypes: ['lure'], season: ['spring'], size: { min: 18, max: 35, mean: 25, stdDev: 5 }, weightCoeff: 5, baseValuePerKg: 200, description: '봄 주꾸미 샤브샤브' }),
  f({ id: 'monkfish', name: '아귀', scientificName: 'Lophius litulon', emoji: '🐟', rarity: 'uncommon', habitat: ['saltwater'], baitTypes: ['lure'], size: { min: 40, max: 90, mean: 60, stdDev: 13 }, weightCoeff: 16, baseValuePerKg: 220, description: '못생겼지만 맛있는 아귀찜' }),
  f({ id: 'common_skate', name: '홍어', scientificName: 'Beringraja pulchra', emoji: '🐟', rarity: 'uncommon', habitat: ['saltwater'], baitTypes: ['shrimp'], size: { min: 50, max: 120, mean: 75, stdDev: 18 }, weightCoeff: 9, baseValuePerKg: 320, description: '삭힌 홍어회의 추억' }),
  f({ id: 'flying_fish', name: '날치', scientificName: 'Cypselurus agoo', emoji: '🐠', rarity: 'uncommon', habitat: ['saltwater'], baitTypes: ['lure'], size: { min: 20, max: 40, mean: 28, stdDev: 5 }, weightCoeff: 4, baseValuePerKg: 240, description: '바다 위로 날아오르는 물고기' }),
  f({ id: 'ribbon_fish', name: '갈치류', emoji: '🐟', rarity: 'uncommon', habitat: ['saltwater'], baitTypes: ['lure'], timeOfDay: ['night'], size: { min: 60, max: 120, mean: 85, stdDev: 16 }, weightCoeff: 2, baseValuePerKg: 270, description: '비슷하지만 다른 갈치과 어종' }),
  f({ id: 'spotted_seabass', name: '점농어', emoji: '🐟', rarity: 'uncommon', habitat: ['saltwater'], baitTypes: ['lure'], size: { min: 30, max: 70, mean: 45, stdDev: 9 }, weightCoeff: 9, baseValuePerKg: 230, description: '점박이 농어' }),
  f({ id: 'amberjack', name: '잿방어', emoji: '🐟', rarity: 'uncommon', habitat: ['saltwater'], baitTypes: ['lure'], size: { min: 50, max: 100, mean: 70, stdDev: 13 }, weightCoeff: 12, baseValuePerKg: 290, description: '회로 인기 좋은 방어과' }),
  f({ id: 'lobster_small', name: '랍스터(소)', emoji: '🦞', rarity: 'uncommon', habitat: ['saltwater'], baitTypes: ['shrimp'], size: { min: 15, max: 30, mean: 22, stdDev: 4 }, weightCoeff: 12, baseValuePerKg: 350, description: '작은 랍스터' }),
  f({ id: 'crab_blue', name: '꽃게', scientificName: 'Portunus trituberculatus', emoji: '🦀', rarity: 'uncommon', habitat: ['saltwater'], baitTypes: ['shrimp'], size: { min: 15, max: 25, mean: 19, stdDev: 3 }, weightCoeff: 14, baseValuePerKg: 320, description: '꽃게탕!' }),
  f({ id: 'snow_crab', name: '대게(소)', emoji: '🦀', rarity: 'uncommon', habitat: ['saltwater'], baitTypes: ['shrimp'], size: { min: 12, max: 22, mean: 17, stdDev: 3 }, weightCoeff: 13, baseValuePerKg: 380, description: '영덕대게의 동생' }),
  f({ id: 'shrimp_jumbo', name: '대하', emoji: '🦐', rarity: 'uncommon', habitat: ['saltwater'], baitTypes: ['shrimp'], season: ['autumn'], size: { min: 12, max: 22, mean: 17, stdDev: 3 }, weightCoeff: 4, baseValuePerKg: 280, description: '대하소금구이' }),
  f({ id: 'sea_squirt', name: '멍게', emoji: '🫠', rarity: 'uncommon', habitat: ['saltwater'], baitTypes: ['any'], size: { min: 8, max: 18, mean: 12, stdDev: 3 }, weightCoeff: 8, baseValuePerKg: 180, description: '바다의 파인애플' }),
  f({ id: 'abalone_small', name: '전복', scientificName: 'Haliotis discus hannai', emoji: '🐚', rarity: 'uncommon', habitat: ['saltwater'], baitTypes: ['any'], size: { min: 8, max: 15, mean: 11, stdDev: 2 }, weightCoeff: 12, baseValuePerKg: 450, description: '전복죽!' }),
  f({ id: 'jeju_jelly', name: '제주옥돔', emoji: '🐠', rarity: 'uncommon', habitat: ['saltwater'], baitTypes: ['shrimp'], size: { min: 25, max: 50, mean: 35, stdDev: 6 }, weightCoeff: 8, baseValuePerKg: 320, description: '제주의 별미' }),
  f({ id: 'sweet_lip', name: '돌돔', scientificName: 'Oplegnathus fasciatus', emoji: '🐠', rarity: 'uncommon', habitat: ['saltwater'], baitTypes: ['shrimp'], size: { min: 25, max: 60, mean: 38, stdDev: 8 }, weightCoeff: 13, baseValuePerKg: 350, description: '바위 사이의 돔' }),
  f({ id: 'striped_beakperch', name: '벵에돔', emoji: '🐠', rarity: 'uncommon', habitat: ['saltwater'], baitTypes: ['shrimp'], size: { min: 25, max: 50, mean: 35, stdDev: 7 }, weightCoeff: 10, baseValuePerKg: 280, description: '검은 빛깔의 돔' }),
  f({ id: 'mottled_skate', name: '간자미', emoji: '🐟', rarity: 'uncommon', habitat: ['saltwater'], baitTypes: ['shrimp'], size: { min: 30, max: 70, mean: 45, stdDev: 9 }, weightCoeff: 8, baseValuePerKg: 200, description: '홍어 사촌' }),
  f({ id: 'hairy_crab', name: '털게', emoji: '🦀', rarity: 'uncommon', habitat: ['saltwater'], baitTypes: ['shrimp'], season: ['winter'], size: { min: 10, max: 20, mean: 14, stdDev: 3 }, weightCoeff: 12, baseValuePerKg: 350, description: '겨울의 별미' }),
  f({ id: 'mantis_shrimp_big', name: '갯가재(대)', emoji: '🦐', rarity: 'uncommon', habitat: ['saltwater'], baitTypes: ['worm'], size: { min: 15, max: 28, mean: 20, stdDev: 3 }, weightCoeff: 7, baseValuePerKg: 200, description: '큰 갯가재, 격투가' }),
  f({ id: 'jeju_eel', name: '먹장어', emoji: '🐍', rarity: 'uncommon', habitat: ['saltwater'], baitTypes: ['worm'], timeOfDay: ['night'], size: { min: 30, max: 60, mean: 42, stdDev: 8 }, weightCoeff: 3, baseValuePerKg: 280, description: '꼼장어구이!' }),
  f({ id: 'sea_horse', name: '해마', emoji: '🐠', rarity: 'uncommon', habitat: ['saltwater'], baitTypes: ['shrimp'], size: { min: 8, max: 18, mean: 12, stdDev: 3 }, weightCoeff: 1, baseValuePerKg: 400, description: '바닷속의 신기한 작은 말' }),
  f({ id: 'sand_lance_big', name: '큰까나리', emoji: '🐟', rarity: 'uncommon', habitat: ['saltwater'], baitTypes: ['shrimp'], size: { min: 15, max: 28, mean: 20, stdDev: 3 }, weightCoeff: 2, baseValuePerKg: 110, description: '큰 까나리' }),
  f({ id: 'eel_river', name: '실치', emoji: '🐍', rarity: 'uncommon', habitat: ['saltwater'], baitTypes: ['shrimp'], season: ['spring'], size: { min: 5, max: 12, mean: 8, stdDev: 2 }, weightCoeff: 1, baseValuePerKg: 250, description: '봄날의 실치회' }),
]

// ─── RARE (45) ────────────────────────────────────────────
const rareFish: FishType[] = [
  f({ id: 'golden_carp', name: '황금 잉어', emoji: '✨', rarity: 'rare', habitat: ['freshwater'], baitTypes: ['special'], size: { min: 25, max: 70, mean: 45, stdDev: 10 }, weightCoeff: 18, baseValuePerKg: 700, description: '황금빛으로 빛나는 행운의 잉어' }),
  f({ id: 'big_eel', name: '대형 뱀장어', emoji: '🐍', rarity: 'rare', habitat: ['freshwater', 'saltwater'], baitTypes: ['worm'], timeOfDay: ['night'], size: { min: 80, max: 150, mean: 110, stdDev: 15 }, weightCoeff: 4, baseValuePerKg: 600, description: '거대한 뱀장어!' }),
  f({ id: 'ayu_big', name: '대형 은어', emoji: '🐟', rarity: 'rare', habitat: ['freshwater'], baitTypes: ['lure'], season: ['summer'], size: { min: 25, max: 40, mean: 32, stdDev: 4 }, weightCoeff: 6, baseValuePerKg: 800, description: '대형 은어 — 향이 짙다' }),
  f({ id: 'blue_marlin_juv', name: '청새치 새끼', emoji: '🐠', rarity: 'rare', habitat: ['saltwater', 'deep_sea'], baitTypes: ['lure'], size: { min: 80, max: 200, mean: 130, stdDev: 25 }, weightCoeff: 6, baseValuePerKg: 600, description: '청새치의 어린 시절' }),
  f({ id: 'tuna_yellow', name: '황다랑어', scientificName: 'Thunnus albacares', emoji: '🐟', rarity: 'rare', habitat: ['saltwater'], baitTypes: ['lure'], size: { min: 80, max: 200, mean: 120, stdDev: 25 }, weightCoeff: 12, baseValuePerKg: 700, description: '참치 회의 별미' }),
  f({ id: 'tuna_skipjack', name: '가다랑어', scientificName: 'Katsuwonus pelamis', emoji: '🐟', rarity: 'rare', habitat: ['saltwater'], baitTypes: ['lure'], size: { min: 50, max: 100, mean: 70, stdDev: 12 }, weightCoeff: 10, baseValuePerKg: 600, description: '가쓰오부시의 원료' }),
  f({ id: 'great_seabass', name: '대형 농어', emoji: '🐟', rarity: 'rare', habitat: ['saltwater'], baitTypes: ['lure'], size: { min: 80, max: 130, mean: 100, stdDev: 12 }, weightCoeff: 11, baseValuePerKg: 580, description: '거대한 농어!' }),
  f({ id: 'great_olive_flounder', name: '대광어', emoji: '🐟', rarity: 'rare', habitat: ['saltwater'], baitTypes: ['shrimp'], size: { min: 70, max: 110, mean: 88, stdDev: 12 }, weightCoeff: 13, baseValuePerKg: 600, description: '대형 광어, 회 한 접시 가득' }),
  f({ id: 'big_red_seabream', name: '대형 참돔', emoji: '🐠', rarity: 'rare', habitat: ['saltwater'], baitTypes: ['shrimp', 'lure'], size: { min: 70, max: 100, mean: 85, stdDev: 10 }, weightCoeff: 14, baseValuePerKg: 700, description: '왕참돔!' }),
  f({ id: 'rock_octopus', name: '돌문어', emoji: '🐙', rarity: 'rare', habitat: ['saltwater'], baitTypes: ['lure'], size: { min: 50, max: 100, mean: 70, stdDev: 12 }, weightCoeff: 8, baseValuePerKg: 500, description: '바위 틈의 문어' }),
  f({ id: 'tiger_puffer', name: '자주복', scientificName: 'Takifugu rubripes', emoji: '🐡', rarity: 'rare', habitat: ['saltwater'], baitTypes: ['shrimp'], size: { min: 30, max: 70, mean: 45, stdDev: 9 }, weightCoeff: 14, baseValuePerKg: 700, description: '복어의 왕, 비싸다' }),
  f({ id: 'snow_crab_big', name: '대게', emoji: '🦀', rarity: 'rare', habitat: ['saltwater'], baitTypes: ['shrimp'], size: { min: 18, max: 28, mean: 22, stdDev: 3 }, weightCoeff: 16, baseValuePerKg: 750, description: '영덕 대게! 다리가 굵다' }),
  f({ id: 'king_crab_small', name: '왕게', emoji: '🦀', rarity: 'rare', habitat: ['saltwater', 'arctic'], baitTypes: ['shrimp'], size: { min: 18, max: 30, mean: 23, stdDev: 4 }, weightCoeff: 17, baseValuePerKg: 800, description: '왕게의 다리...' }),
  f({ id: 'lobster', name: '랍스터', emoji: '🦞', rarity: 'rare', habitat: ['saltwater'], baitTypes: ['shrimp'], size: { min: 25, max: 45, mean: 33, stdDev: 5 }, weightCoeff: 14, baseValuePerKg: 750, description: '바다의 진미' }),
  f({ id: 'sword_fish', name: '황새치', scientificName: 'Xiphias gladius', emoji: '🐟', rarity: 'rare', habitat: ['saltwater', 'deep_sea'], baitTypes: ['lure'], size: { min: 100, max: 250, mean: 160, stdDev: 30 }, weightCoeff: 8, baseValuePerKg: 700, description: '검 같은 주둥이의 물고기' }),
  f({ id: 'mahi_mahi', name: '만새기', scientificName: 'Coryphaena hippurus', emoji: '🐟', rarity: 'rare', habitat: ['saltwater', 'tropical'], baitTypes: ['lure'], size: { min: 60, max: 130, mean: 90, stdDev: 16 }, weightCoeff: 8, baseValuePerKg: 580, description: '컬러풀한 열대 물고기' }),
  f({ id: 'wahoo', name: '꼬치고기', emoji: '🐟', rarity: 'rare', habitat: ['saltwater', 'tropical'], baitTypes: ['lure'], size: { min: 60, max: 130, mean: 90, stdDev: 16 }, weightCoeff: 6, baseValuePerKg: 520, description: '빠른 열대 물고기' }),
  f({ id: 'dorado', name: '도라도', emoji: '🐠', rarity: 'rare', habitat: ['saltwater', 'tropical'], baitTypes: ['lure'], size: { min: 50, max: 110, mean: 75, stdDev: 14 }, weightCoeff: 8, baseValuePerKg: 540, description: '황금빛 열대 물고기' }),
  f({ id: 'goldspot_seabream', name: '옥돔', scientificName: 'Branchiostegus japonicus', emoji: '🐠', rarity: 'rare', habitat: ['saltwater'], baitTypes: ['shrimp'], size: { min: 30, max: 50, mean: 40, stdDev: 5 }, weightCoeff: 9, baseValuePerKg: 600, description: '제주 옥돔구이' }),
  f({ id: 'dolly_varden', name: '곤들매기', emoji: '🐟', rarity: 'rare', habitat: ['freshwater'], baitTypes: ['lure'], size: { min: 30, max: 60, mean: 42, stdDev: 8 }, weightCoeff: 10, baseValuePerKg: 480, description: '청정 산천의 송어과' }),
  f({ id: 'arapaima_juv', name: '아라파이마(소)', emoji: '🐟', rarity: 'rare', habitat: ['freshwater', 'tropical'], baitTypes: ['lure'], size: { min: 50, max: 100, mean: 70, stdDev: 13 }, weightCoeff: 18, baseValuePerKg: 600, description: '아마존 거대 어류' }),
  f({ id: 'sturgeon_small', name: '철갑상어(소)', emoji: '🐟', rarity: 'rare', habitat: ['freshwater'], baitTypes: ['worm'], size: { min: 50, max: 120, mean: 80, stdDev: 16 }, weightCoeff: 12, baseValuePerKg: 700, description: '캐비어로 유명한 철갑상어' }),
  f({ id: 'red_snapper', name: '도미', emoji: '🐠', rarity: 'rare', habitat: ['saltwater', 'tropical'], baitTypes: ['shrimp'], size: { min: 30, max: 70, mean: 45, stdDev: 9 }, weightCoeff: 12, baseValuePerKg: 600, description: '붉은 빛깔의 도미' }),
  f({ id: 'spotted_grouper', name: '능성어', emoji: '🐠', rarity: 'rare', habitat: ['saltwater'], baitTypes: ['lure'], size: { min: 40, max: 90, mean: 60, stdDev: 12 }, weightCoeff: 13, baseValuePerKg: 620, description: '큰 입의 포식자' }),
  f({ id: 'longtooth_grouper', name: '구문쟁이', emoji: '🐠', rarity: 'rare', habitat: ['saltwater'], baitTypes: ['lure'], size: { min: 40, max: 90, mean: 60, stdDev: 12 }, weightCoeff: 14, baseValuePerKg: 650, description: '제주 구문쟁이회' }),
  f({ id: 'koi_pearl', name: '비단잉어', emoji: '🎏', rarity: 'rare', habitat: ['freshwater'], baitTypes: ['pellet'], size: { min: 30, max: 80, mean: 50, stdDev: 12 }, weightCoeff: 16, baseValuePerKg: 750, description: '관상용 잉어, 색이 화려하다' }),
  f({ id: 'crab_red_king', name: '레드킹크랩', emoji: '🦀', rarity: 'rare', habitat: ['saltwater', 'arctic'], baitTypes: ['shrimp'], size: { min: 25, max: 40, mean: 32, stdDev: 4 }, weightCoeff: 18, baseValuePerKg: 800, description: '러시아산 레드킹크랩' }),
  f({ id: 'big_lobster', name: '대형 랍스터', emoji: '🦞', rarity: 'rare', habitat: ['saltwater'], baitTypes: ['shrimp'], size: { min: 40, max: 70, mean: 52, stdDev: 8 }, weightCoeff: 16, baseValuePerKg: 800, description: '거대한 랍스터, 한 마리 가득!' }),
  f({ id: 'hammerhead_juv', name: '귀상어(소)', emoji: '🦈', rarity: 'rare', habitat: ['saltwater'], baitTypes: ['lure'], size: { min: 80, max: 180, mean: 120, stdDev: 22 }, weightCoeff: 7, baseValuePerKg: 580, description: '망치 모양 머리의 상어' }),
  f({ id: 'whitetip_shark', name: '흰지느러미상어', emoji: '🦈', rarity: 'rare', habitat: ['saltwater', 'tropical'], baitTypes: ['lure'], size: { min: 80, max: 200, mean: 130, stdDev: 25 }, weightCoeff: 7, baseValuePerKg: 540, description: '하얀 지느러미 끝의 상어' }),
  f({ id: 'sea_bream_japan', name: '일본도미', emoji: '🐠', rarity: 'rare', habitat: ['saltwater'], baitTypes: ['shrimp'], size: { min: 30, max: 70, mean: 45, stdDev: 9 }, weightCoeff: 12, baseValuePerKg: 590, description: '일본의 명물 도미' }),
  f({ id: 'octopus_giant', name: '대왕문어', emoji: '🐙', rarity: 'rare', habitat: ['saltwater'], baitTypes: ['lure'], size: { min: 80, max: 150, mean: 110, stdDev: 18 }, weightCoeff: 9, baseValuePerKg: 580, description: '대왕문어다리...!' }),
  f({ id: 'cobia', name: '코비아', emoji: '🐟', rarity: 'rare', habitat: ['saltwater', 'tropical'], baitTypes: ['lure'], size: { min: 60, max: 130, mean: 90, stdDev: 16 }, weightCoeff: 9, baseValuePerKg: 540, description: '회유하는 큰 물고기' }),
  f({ id: 'marlin_striped', name: '청새치', scientificName: 'Kajikia audax', emoji: '🐟', rarity: 'rare', habitat: ['saltwater', 'deep_sea'], baitTypes: ['lure'], size: { min: 150, max: 280, mean: 200, stdDev: 30 }, weightCoeff: 7, baseValuePerKg: 700, description: '거대 회유 어종' }),
  f({ id: 'mackerel_pike', name: '꽁치(대)', emoji: '🐟', rarity: 'rare', habitat: ['saltwater'], baitTypes: ['lure'], size: { min: 35, max: 50, mean: 42, stdDev: 4 }, weightCoeff: 4, baseValuePerKg: 400, description: '대형 꽁치' }),
  f({ id: 'fancy_carp', name: '비단잉어(특)', emoji: '🎏', rarity: 'rare', habitat: ['freshwater'], baitTypes: ['pellet'], size: { min: 50, max: 100, mean: 70, stdDev: 12 }, weightCoeff: 17, baseValuePerKg: 850, description: '특상품 비단잉어, 일본 수출용' }),
  f({ id: 'electric_eel_small', name: '전기뱀장어(소)', emoji: '⚡', rarity: 'rare', habitat: ['freshwater', 'tropical'], baitTypes: ['worm'], timeOfDay: ['night'], size: { min: 40, max: 80, mean: 55, stdDev: 10 }, weightCoeff: 4, baseValuePerKg: 700, description: '약한 전기를 흘리는 작은 전기뱀장어' }),
  f({ id: 'spotted_lobster', name: '점박이랍스터', emoji: '🦞', rarity: 'rare', habitat: ['saltwater', 'tropical'], baitTypes: ['shrimp'], size: { min: 25, max: 45, mean: 33, stdDev: 5 }, weightCoeff: 13, baseValuePerKg: 700, description: '열대 점박이 랍스터' }),
  f({ id: 'sea_bass_giant', name: '큰입농어', emoji: '🐟', rarity: 'rare', habitat: ['saltwater'], baitTypes: ['lure'], size: { min: 60, max: 110, mean: 85, stdDev: 12 }, weightCoeff: 12, baseValuePerKg: 600, description: '큰 입의 농어' }),
  f({ id: 'eel_giant', name: '왕장어', emoji: '🐍', rarity: 'rare', habitat: ['freshwater', 'saltwater'], baitTypes: ['worm'], timeOfDay: ['night'], size: { min: 100, max: 200, mean: 140, stdDev: 22 }, weightCoeff: 5, baseValuePerKg: 700, description: '거대한 장어' }),
  f({ id: 'fugu_supreme', name: '검복', emoji: '🐡', rarity: 'rare', habitat: ['saltwater'], baitTypes: ['shrimp'], size: { min: 25, max: 55, mean: 38, stdDev: 7 }, weightCoeff: 13, baseValuePerKg: 720, description: '복어의 명품' }),
  f({ id: 'snake_mackerel', name: '갈치아재비', emoji: '🐟', rarity: 'rare', habitat: ['deep_sea'], baitTypes: ['lure'], timeOfDay: ['night'], size: { min: 60, max: 130, mean: 90, stdDev: 16 }, weightCoeff: 5, baseValuePerKg: 580, description: '심해의 가는 물고기' }),
  f({ id: 'spiny_lobster', name: '닭새우', emoji: '🦞', rarity: 'rare', habitat: ['saltwater', 'tropical'], baitTypes: ['shrimp'], size: { min: 25, max: 45, mean: 33, stdDev: 5 }, weightCoeff: 13, baseValuePerKg: 720, description: '집게가 없는 가시 랍스터' }),
  f({ id: 'silver_arowana', name: '은빛아로와나', emoji: '🐠', rarity: 'rare', habitat: ['freshwater', 'tropical'], baitTypes: ['lure'], size: { min: 60, max: 100, mean: 78, stdDev: 12 }, weightCoeff: 7, baseValuePerKg: 700, description: '관상용 고급 어종' }),
  f({ id: 'large_red_snapper', name: '대형 도미', emoji: '🐠', rarity: 'rare', habitat: ['saltwater'], baitTypes: ['shrimp'], size: { min: 60, max: 90, mean: 75, stdDev: 9 }, weightCoeff: 13, baseValuePerKg: 650, description: '대형 도미, 잔치상의 주인공' }),
]

// ─── EPIC (35) ────────────────────────────────────────────
const epicFish: FishType[] = [
  f({ id: 'bluefin_tuna_juv', name: '참다랑어', scientificName: 'Thunnus orientalis', emoji: '🐟', rarity: 'epic', habitat: ['saltwater', 'deep_sea'], baitTypes: ['lure'], size: { min: 100, max: 250, mean: 160, stdDev: 30 }, weightCoeff: 14, baseValuePerKg: 2000, description: '참다랑어 — 회의 황제' }),
  f({ id: 'giant_squid', name: '대왕오징어', emoji: '🦑', rarity: 'epic', habitat: ['deep_sea'], baitTypes: ['lure'], timeOfDay: ['night'], size: { min: 100, max: 250, mean: 160, stdDev: 30 }, weightCoeff: 9, baseValuePerKg: 1700, description: '심해의 거인' }),
  f({ id: 'arapaima', name: '아라파이마', scientificName: 'Arapaima gigas', emoji: '🐟', rarity: 'epic', habitat: ['freshwater', 'tropical'], baitTypes: ['lure'], size: { min: 150, max: 300, mean: 220, stdDev: 30 }, weightCoeff: 20, baseValuePerKg: 1800, description: '아마존의 살아있는 화석' }),
  f({ id: 'sturgeon', name: '철갑상어', scientificName: 'Acipenser sinensis', emoji: '🐟', rarity: 'epic', habitat: ['freshwater'], baitTypes: ['worm'], size: { min: 100, max: 200, mean: 150, stdDev: 22 }, weightCoeff: 14, baseValuePerKg: 2200, description: '캐비어로 유명한 거대 어류' }),
  f({ id: 'goliath_grouper', name: '대왕그루퍼', emoji: '🐠', rarity: 'epic', habitat: ['saltwater', 'tropical'], baitTypes: ['lure'], size: { min: 120, max: 250, mean: 180, stdDev: 28 }, weightCoeff: 18, baseValuePerKg: 1900, description: '거대한 열대 그루퍼' }),
  f({ id: 'tarpon', name: '타폰', emoji: '🐟', rarity: 'epic', habitat: ['saltwater', 'tropical'], baitTypes: ['lure'], size: { min: 100, max: 200, mean: 150, stdDev: 22 }, weightCoeff: 9, baseValuePerKg: 1700, description: '점프력 좋은 거대 물고기' }),
  f({ id: 'bull_shark', name: '황소상어', emoji: '🦈', rarity: 'epic', habitat: ['saltwater'], baitTypes: ['lure'], size: { min: 200, max: 350, mean: 270, stdDev: 32 }, weightCoeff: 12, baseValuePerKg: 1800, description: '강하구를 노니는 위험한 상어' }),
  f({ id: 'ocean_sunfish_baby', name: '개복치(소)', scientificName: 'Mola mola', emoji: '🐡', rarity: 'epic', habitat: ['saltwater'], baitTypes: ['lure'], size: { min: 100, max: 200, mean: 150, stdDev: 22 }, weightCoeff: 25, baseValuePerKg: 1600, description: '개복치의 어린 시절, 그래도 크다' }),
  f({ id: 'whale_shark_baby', name: '고래상어(유)', emoji: '🦈', rarity: 'epic', habitat: ['saltwater', 'tropical'], baitTypes: ['lure'], size: { min: 200, max: 400, mean: 290, stdDev: 35 }, weightCoeff: 11, baseValuePerKg: 1800, description: '고래상어의 어린 시절' }),
  f({ id: 'manta_ray', name: '만타가오리', emoji: '🐟', rarity: 'epic', habitat: ['saltwater', 'tropical'], baitTypes: ['lure'], size: { min: 200, max: 400, mean: 300, stdDev: 35 }, weightCoeff: 8, baseValuePerKg: 1700, description: '날개 같은 큰 가오리' }),
  f({ id: 'electric_eel', name: '전기뱀장어', scientificName: 'Electrophorus electricus', emoji: '⚡', rarity: 'epic', habitat: ['freshwater', 'tropical'], baitTypes: ['worm'], timeOfDay: ['night'], size: { min: 100, max: 200, mean: 150, stdDev: 22 }, weightCoeff: 5, baseValuePerKg: 1800, description: '600V를 흘리는 위험한 어류' }),
  f({ id: 'wels_catfish', name: '대형 메기', emoji: '🐟', rarity: 'epic', habitat: ['freshwater'], baitTypes: ['worm'], timeOfDay: ['night'], size: { min: 150, max: 300, mean: 220, stdDev: 30 }, weightCoeff: 17, baseValuePerKg: 1500, description: '유럽 거대 메기' }),
  f({ id: 'paddlefish', name: '주걱철갑상어', emoji: '🐟', rarity: 'epic', habitat: ['freshwater'], baitTypes: ['worm'], size: { min: 100, max: 220, mean: 160, stdDev: 28 }, weightCoeff: 12, baseValuePerKg: 1700, description: '주걱같은 주둥이의 거대 어류' }),
  f({ id: 'alligator_gar', name: '엘리게이터가아', emoji: '🐊', rarity: 'epic', habitat: ['freshwater', 'tropical'], baitTypes: ['lure'], size: { min: 150, max: 300, mean: 220, stdDev: 30 }, weightCoeff: 9, baseValuePerKg: 1700, description: '악어 같은 주둥이의 거대 어류' }),
  f({ id: 'mekong_giant_catfish', name: '메콩대왕메기', emoji: '🐟', rarity: 'epic', habitat: ['freshwater', 'tropical'], baitTypes: ['lure'], size: { min: 150, max: 300, mean: 220, stdDev: 30 }, weightCoeff: 18, baseValuePerKg: 1800, description: '메콩강의 거대 메기' }),
  f({ id: 'piranha_giant', name: '대왕피라냐', emoji: '🐠', rarity: 'epic', habitat: ['freshwater', 'tropical'], baitTypes: ['lure'], size: { min: 50, max: 100, mean: 70, stdDev: 13 }, weightCoeff: 12, baseValuePerKg: 1500, description: '거대 피라냐, 위험!' }),
  f({ id: 'anglerfish', name: '심해아귀', emoji: '🐟', rarity: 'epic', habitat: ['deep_sea'], baitTypes: ['lure'], timeOfDay: ['night'], size: { min: 60, max: 120, mean: 88, stdDev: 14 }, weightCoeff: 14, baseValuePerKg: 1800, description: '머리에 빛나는 미끼를 단 심해 어류' }),
  f({ id: 'oarfish', name: '산갈치', scientificName: 'Regalecus glesne', emoji: '🐍', rarity: 'epic', habitat: ['deep_sea'], baitTypes: ['lure'], size: { min: 200, max: 500, mean: 320, stdDev: 50 }, weightCoeff: 3, baseValuePerKg: 1900, description: '심해의 거대 띠 모양 어류' }),
  f({ id: 'frilled_shark', name: '주름상어', emoji: '🦈', rarity: 'epic', habitat: ['deep_sea'], baitTypes: ['lure'], size: { min: 100, max: 200, mean: 150, stdDev: 22 }, weightCoeff: 6, baseValuePerKg: 1700, description: '살아있는 화석 상어' }),
  f({ id: 'goblin_shark', name: '도깨비상어', emoji: '🦈', rarity: 'epic', habitat: ['deep_sea'], baitTypes: ['lure'], size: { min: 200, max: 400, mean: 280, stdDev: 35 }, weightCoeff: 7, baseValuePerKg: 1800, description: '돌출되는 턱이 무서운 심해 상어' }),
  f({ id: 'megamouth_shark_juv', name: '메가마우스상어', emoji: '🦈', rarity: 'epic', habitat: ['deep_sea'], baitTypes: ['lure'], size: { min: 200, max: 400, mean: 280, stdDev: 35 }, weightCoeff: 10, baseValuePerKg: 1900, description: '거대한 입의 심해 상어' }),
  f({ id: 'great_barracuda', name: '대형 꼬치고기', emoji: '🐟', rarity: 'epic', habitat: ['saltwater', 'tropical'], baitTypes: ['lure'], size: { min: 100, max: 200, mean: 150, stdDev: 22 }, weightCoeff: 6, baseValuePerKg: 1500, description: '거대한 꼬치고기, 빠르고 위험' }),
  f({ id: 'royal_grouper', name: '대왕능성어', emoji: '🐠', rarity: 'epic', habitat: ['saltwater'], baitTypes: ['lure'], size: { min: 100, max: 200, mean: 150, stdDev: 22 }, weightCoeff: 18, baseValuePerKg: 1900, description: '왕자급 능성어' }),
  f({ id: 'big_marlin', name: '대형 청새치', emoji: '🐟', rarity: 'epic', habitat: ['saltwater', 'deep_sea'], baitTypes: ['lure'], size: { min: 250, max: 400, mean: 320, stdDev: 30 }, weightCoeff: 9, baseValuePerKg: 1900, description: '대형 청새치, 트로피 피쉬' }),
  f({ id: 'sail_fish', name: '돛새치', scientificName: 'Istiophorus platypterus', emoji: '⛵', rarity: 'epic', habitat: ['saltwater', 'deep_sea'], baitTypes: ['lure'], size: { min: 200, max: 350, mean: 270, stdDev: 30 }, weightCoeff: 6, baseValuePerKg: 1800, description: '돛 같은 등지느러미의 빠른 물고기' }),
  f({ id: 'silver_marlin', name: '은청새치', emoji: '🐟', rarity: 'epic', habitat: ['saltwater', 'deep_sea'], baitTypes: ['lure'], size: { min: 200, max: 350, mean: 270, stdDev: 30 }, weightCoeff: 7, baseValuePerKg: 1800, description: '은빛 청새치' }),
  f({ id: 'white_sturgeon', name: '백철갑상어', emoji: '🐟', rarity: 'epic', habitat: ['freshwater'], baitTypes: ['worm'], size: { min: 200, max: 400, mean: 280, stdDev: 35 }, weightCoeff: 14, baseValuePerKg: 2100, description: '백색 거대 철갑상어, 캐비어 최고급' }),
  f({ id: 'blue_lobster', name: '파란 랍스터', emoji: '🦞', rarity: 'epic', habitat: ['saltwater'], baitTypes: ['shrimp'], size: { min: 30, max: 60, mean: 45, stdDev: 7 }, weightCoeff: 14, baseValuePerKg: 2000, description: '200만마리 중 1마리, 파란 랍스터' }),
  f({ id: 'colossal_squid_juv', name: '남극대왕오징어(유)', emoji: '🦑', rarity: 'epic', habitat: ['deep_sea', 'arctic'], baitTypes: ['lure'], size: { min: 150, max: 300, mean: 220, stdDev: 30 }, weightCoeff: 11, baseValuePerKg: 1900, description: '남극의 거대 오징어' }),
  f({ id: 'humboldt_squid', name: '훔볼트오징어', emoji: '🦑', rarity: 'epic', habitat: ['deep_sea'], baitTypes: ['lure'], timeOfDay: ['night'], size: { min: 100, max: 200, mean: 150, stdDev: 22 }, weightCoeff: 9, baseValuePerKg: 1700, description: '식인 오징어로 유명한 종' }),
  f({ id: 'wolf_eel', name: '늑대장어', emoji: '🐍', rarity: 'epic', habitat: ['deep_sea'], baitTypes: ['lure'], size: { min: 100, max: 200, mean: 150, stdDev: 22 }, weightCoeff: 6, baseValuePerKg: 1600, description: '늑대 같은 이빨의 장어' }),
  f({ id: 'gulper_eel', name: '풍선장어', emoji: '🐍', rarity: 'epic', habitat: ['deep_sea'], baitTypes: ['lure'], size: { min: 80, max: 180, mean: 120, stdDev: 22 }, weightCoeff: 4, baseValuePerKg: 1700, description: '입을 풍선처럼 부풀리는 심해어' }),
  f({ id: 'big_octopus', name: '거대 문어', emoji: '🐙', rarity: 'epic', habitat: ['saltwater'], baitTypes: ['lure'], size: { min: 150, max: 300, mean: 220, stdDev: 30 }, weightCoeff: 10, baseValuePerKg: 1700, description: '거대한 문어' }),
  f({ id: 'blue_marlin', name: '청새치(대)', emoji: '🐟', rarity: 'epic', habitat: ['saltwater', 'deep_sea'], baitTypes: ['lure'], size: { min: 250, max: 450, mean: 350, stdDev: 35 }, weightCoeff: 8, baseValuePerKg: 2000, description: '대형 청새치, 5m급!' }),
  f({ id: 'beluga_sturgeon', name: '벨루가철갑상어', emoji: '🐟', rarity: 'epic', habitat: ['freshwater'], baitTypes: ['worm'], size: { min: 200, max: 400, mean: 290, stdDev: 38 }, weightCoeff: 16, baseValuePerKg: 2300, description: '캐비어의 최고봉' }),
]

// ─── LEGENDARY (25) ───────────────────────────────────────
const legendaryFish: FishType[] = [
  f({ id: 'great_white_shark', name: '백상아리', scientificName: 'Carcharodon carcharias', emoji: '🦈', rarity: 'legendary', habitat: ['saltwater', 'deep_sea'], baitTypes: ['lure'], size: { min: 300, max: 600, mean: 420, stdDev: 50 }, weightCoeff: 12, baseValuePerKg: 5500, description: '바다의 최상위 포식자' }),
  f({ id: 'whale_shark', name: '고래상어', scientificName: 'Rhincodon typus', emoji: '🦈', rarity: 'legendary', habitat: ['saltwater', 'tropical'], baitTypes: ['lure'], size: { min: 500, max: 1200, mean: 800, stdDev: 100 }, weightCoeff: 12, baseValuePerKg: 6000, description: '바다에서 가장 큰 물고기' }),
  f({ id: 'ocean_sunfish', name: '개복치', scientificName: 'Mola mola', emoji: '🐡', rarity: 'legendary', habitat: ['saltwater'], baitTypes: ['lure'], size: { min: 300, max: 500, mean: 380, stdDev: 35 }, weightCoeff: 28, baseValuePerKg: 5000, description: '둥글고 거대한 신비의 어류' }),
  f({ id: 'colossal_squid', name: '남극대왕오징어', scientificName: 'Mesonychoteuthis hamiltoni', emoji: '🦑', rarity: 'legendary', habitat: ['deep_sea', 'arctic'], baitTypes: ['lure'], size: { min: 400, max: 700, mean: 540, stdDev: 50 }, weightCoeff: 13, baseValuePerKg: 5500, description: '눈이 농구공만한 심해 오징어' }),
  f({ id: 'tiger_shark_legend', name: '뱀상어', emoji: '🦈', rarity: 'legendary', habitat: ['saltwater'], baitTypes: ['lure'], size: { min: 300, max: 550, mean: 410, stdDev: 45 }, weightCoeff: 11, baseValuePerKg: 5200, description: '호랑이 줄무늬의 거대 상어' }),
  f({ id: 'mako_shark', name: '청상아리', emoji: '🦈', rarity: 'legendary', habitat: ['saltwater', 'deep_sea'], baitTypes: ['lure'], size: { min: 250, max: 450, mean: 340, stdDev: 40 }, weightCoeff: 10, baseValuePerKg: 5000, description: '시속 70km의 빠른 상어' }),
  f({ id: 'giant_grouper', name: '대왕바리', emoji: '🐠', rarity: 'legendary', habitat: ['saltwater', 'tropical'], baitTypes: ['lure'], size: { min: 150, max: 270, mean: 200, stdDev: 28 }, weightCoeff: 22, baseValuePerKg: 5300, description: '인간을 삼킨다는 전설의 그루퍼' }),
  f({ id: 'goliath_tigerfish', name: '골리앗 호랑이고기', emoji: '🐠', rarity: 'legendary', habitat: ['freshwater', 'tropical'], baitTypes: ['lure'], size: { min: 100, max: 180, mean: 140, stdDev: 18 }, weightCoeff: 11, baseValuePerKg: 5200, description: '아프리카의 거대 포식자' }),
  f({ id: 'dunkleosteus_juv', name: '둔클레오스테우스(소)', emoji: '🐟', rarity: 'legendary', habitat: ['deep_sea'], baitTypes: ['lure'], size: { min: 200, max: 400, mean: 290, stdDev: 38 }, weightCoeff: 16, baseValuePerKg: 5800, description: '고대 데본기 갑주어의 후예?' }),
  f({ id: 'coelacanth', name: '실러캔스', scientificName: 'Latimeria chalumnae', emoji: '🐟', rarity: 'legendary', habitat: ['deep_sea'], baitTypes: ['special'], size: { min: 100, max: 200, mean: 150, stdDev: 22 }, weightCoeff: 18, baseValuePerKg: 6500, description: '살아있는 화석' }),
  f({ id: 'giant_oarfish', name: '대형 산갈치', emoji: '🐍', rarity: 'legendary', habitat: ['deep_sea'], baitTypes: ['special'], size: { min: 500, max: 1100, mean: 750, stdDev: 100 }, weightCoeff: 4, baseValuePerKg: 5800, description: '11m급 거대 산갈치, 인어 전설의 모델' }),
  f({ id: 'giant_pacific_octopus', name: '북태평양대왕문어', emoji: '🐙', rarity: 'legendary', habitat: ['deep_sea'], baitTypes: ['lure'], size: { min: 300, max: 600, mean: 430, stdDev: 50 }, weightCoeff: 11, baseValuePerKg: 5400, description: '몸길이 6m의 거대 문어' }),
  f({ id: 'mekong_stingray', name: '메콩 가오리', emoji: '🐟', rarity: 'legendary', habitat: ['freshwater', 'tropical'], baitTypes: ['worm'], size: { min: 200, max: 500, mean: 320, stdDev: 50 }, weightCoeff: 12, baseValuePerKg: 5300, description: '몸길이 5m의 민물 가오리' }),
  f({ id: 'taimen', name: '타이멘', emoji: '🐟', rarity: 'legendary', habitat: ['freshwater', 'arctic'], baitTypes: ['lure'], size: { min: 100, max: 200, mean: 150, stdDev: 22 }, weightCoeff: 14, baseValuePerKg: 5200, description: '시베리아의 거대 송어과' }),
  f({ id: 'oarfish_record', name: '산갈치(전설급)', emoji: '🐍', rarity: 'legendary', habitat: ['deep_sea'], baitTypes: ['special'], size: { min: 700, max: 1500, mean: 1000, stdDev: 130 }, weightCoeff: 4, baseValuePerKg: 6000, description: '15m급 산갈치, 지진 전조' }),
  f({ id: 'megamouth_shark', name: '메가마우스(대)', emoji: '🦈', rarity: 'legendary', habitat: ['deep_sea'], baitTypes: ['lure'], size: { min: 400, max: 600, mean: 500, stdDev: 35 }, weightCoeff: 11, baseValuePerKg: 5500, description: '5m급 거대 입 상어' }),
  f({ id: 'sperm_whale_calf', name: '향유고래 새끼', emoji: '🐋', rarity: 'legendary', habitat: ['deep_sea'], baitTypes: ['special'], size: { min: 400, max: 700, mean: 540, stdDev: 50 }, weightCoeff: 18, baseValuePerKg: 5800, description: '향유고래의 어린 시절...' }),
  f({ id: 'narwhal', name: '일각고래', emoji: '🐋', rarity: 'legendary', habitat: ['saltwater', 'arctic'], baitTypes: ['special'], size: { min: 300, max: 500, mean: 400, stdDev: 35 }, weightCoeff: 13, baseValuePerKg: 5500, description: '뿔 달린 북극의 고래' }),
  f({ id: 'beluga_whale_calf', name: '벨루가 새끼', emoji: '🐋', rarity: 'legendary', habitat: ['saltwater', 'arctic'], baitTypes: ['special'], size: { min: 200, max: 400, mean: 300, stdDev: 35 }, weightCoeff: 14, baseValuePerKg: 5400, description: '북극 흰돌고래의 새끼' }),
  f({ id: 'orca_calf', name: '범고래 새끼', emoji: '🐋', rarity: 'legendary', habitat: ['saltwater'], baitTypes: ['special'], size: { min: 200, max: 400, mean: 300, stdDev: 35 }, weightCoeff: 17, baseValuePerKg: 5600, description: '바다의 늑대 범고래' }),
  f({ id: 'old_carp', name: '천년 잉어', emoji: '🐉', rarity: 'legendary', habitat: ['freshwater', 'mythical'], baitTypes: ['special'], size: { min: 100, max: 200, mean: 150, stdDev: 22 }, weightCoeff: 18, baseValuePerKg: 5800, description: '천년을 산 잉어, 용이 되기 직전' }),
  f({ id: 'koi_emperor', name: '황제 비단잉어', emoji: '🎏', rarity: 'legendary', habitat: ['freshwater'], baitTypes: ['special'], size: { min: 80, max: 130, mean: 100, stdDev: 14 }, weightCoeff: 18, baseValuePerKg: 6200, description: '경매에서 1억원 넘는 비단잉어' }),
  f({ id: 'rainbow_dragon_fish', name: '무지개 용어', emoji: '🌈', rarity: 'legendary', habitat: ['mythical'], baitTypes: ['special'], size: { min: 100, max: 200, mean: 150, stdDev: 22 }, weightCoeff: 12, baseValuePerKg: 5800, description: '무지개 비늘의 용 닮은 물고기' }),
  f({ id: 'crystal_lobster', name: '크리스탈 랍스터', emoji: '🦞', rarity: 'legendary', habitat: ['mythical'], baitTypes: ['special'], size: { min: 50, max: 100, mean: 75, stdDev: 11 }, weightCoeff: 16, baseValuePerKg: 5500, description: '투명한 수정 같은 랍스터' }),
  f({ id: 'kraken_juv', name: '크라켄(유)', emoji: '🦑', rarity: 'legendary', habitat: ['deep_sea', 'mythical'], baitTypes: ['special'], size: { min: 300, max: 600, mean: 450, stdDev: 50 }, weightCoeff: 14, baseValuePerKg: 5800, description: '전설의 크라켄, 아직 어린 시절' }),
]

// ─── MYTHIC (15) ──────────────────────────────────────────
const mythicFish: FishType[] = [
  f({ id: 'imugi', name: '이무기', emoji: '🐉', rarity: 'mythic', habitat: ['mythical', 'freshwater'], baitTypes: ['special'], size: { min: 500, max: 1000, mean: 720, stdDev: 100 }, weightCoeff: 12, baseValuePerKg: 22000, description: '용이 되지 못한 천년 묵은 큰 뱀', loreFlavor: '천년의 한이 비늘마다 맺혀있다' }),
  f({ id: 'dragon_king', name: '용왕', emoji: '🐲', rarity: 'mythic', habitat: ['mythical', 'deep_sea'], baitTypes: ['special'], size: { min: 800, max: 1500, mean: 1100, stdDev: 130 }, weightCoeff: 15, baseValuePerKg: 30000, description: '바다를 다스리는 용왕 본체!', loreFlavor: '낚싯대를 든 자에게 천운이 깃든다' }),
  f({ id: 'mermaid', name: '인어', emoji: '🧜‍♀️', rarity: 'mythic', habitat: ['mythical', 'saltwater'], baitTypes: ['special'], size: { min: 150, max: 250, mean: 190, stdDev: 22 }, weightCoeff: 9, baseValuePerKg: 25000, description: '전설의 인어, 영원한 젊음을 준다는 그것' }),
  f({ id: 'leviathan', name: '리바이어던', emoji: '🐲', rarity: 'mythic', habitat: ['mythical', 'deep_sea'], baitTypes: ['special'], size: { min: 1000, max: 2000, mean: 1400, stdDev: 180 }, weightCoeff: 14, baseValuePerKg: 28000, description: '구약의 거대 해양 괴수', loreFlavor: '바다 그 자체가 분노한 듯하다' }),
  f({ id: 'jormungandr', name: '요르문간드', emoji: '🐍', rarity: 'mythic', habitat: ['mythical', 'deep_sea'], baitTypes: ['special'], size: { min: 1500, max: 3000, mean: 2200, stdDev: 250 }, weightCoeff: 10, baseValuePerKg: 28000, description: '북유럽 신화의 세계뱀', loreFlavor: '꼬리를 물면 세계가 끝난다' }),
  f({ id: 'human_face_fish', name: '인면어', emoji: '😱', rarity: 'mythic', habitat: ['mythical', 'freshwater'], baitTypes: ['special'], size: { min: 50, max: 120, mean: 80, stdDev: 15 }, weightCoeff: 14, baseValuePerKg: 23000, description: '사람 얼굴을 닮은 잉어... 눈이 마주치면 안 된다' }),
  f({ id: 'time_fish', name: '시간의 잉어', emoji: '⌛', rarity: 'mythic', habitat: ['mythical'], baitTypes: ['special'], size: { min: 100, max: 200, mean: 150, stdDev: 22 }, weightCoeff: 12, baseValuePerKg: 26000, description: '시간을 거꾸로 헤엄친다', loreFlavor: '잡는 순간 1초가 영원이 된다' }),
  f({ id: 'dimension_fish', name: '차원물고기', emoji: '🌀', rarity: 'mythic', habitat: ['mythical'], baitTypes: ['special'], size: { min: 100, max: 200, mean: 150, stdDev: 22 }, weightCoeff: 11, baseValuePerKg: 27000, description: '여러 차원을 동시에 헤엄친다' }),
  f({ id: 'cosmic_whale', name: '우주고래', emoji: '🐋', rarity: 'mythic', habitat: ['mythical'], baitTypes: ['special'], size: { min: 1500, max: 3000, mean: 2200, stdDev: 250 }, weightCoeff: 16, baseValuePerKg: 30000, description: '은하 사이를 헤엄치는 거대 고래', loreFlavor: '뱃속에 별 하나가 들어있다' }),
  f({ id: 'phoenix_fish', name: '불사조어', emoji: '🔥', rarity: 'mythic', habitat: ['mythical'], baitTypes: ['special'], size: { min: 100, max: 200, mean: 150, stdDev: 22 }, weightCoeff: 11, baseValuePerKg: 25000, description: '불에서 다시 태어나는 물고기' }),
  f({ id: 'starfish_god', name: '별의 불가사리', emoji: '⭐', rarity: 'mythic', habitat: ['mythical'], baitTypes: ['special'], size: { min: 80, max: 150, mean: 110, stdDev: 18 }, weightCoeff: 14, baseValuePerKg: 24000, description: '하늘의 별이 떨어져 불가사리가 된 것' }),
  f({ id: 'origin_water_drop', name: '태초의 물방울', emoji: '💧', rarity: 'mythic', habitat: ['mythical'], baitTypes: ['special'], size: { min: 30, max: 80, mean: 50, stdDev: 12 }, weightCoeff: 25, baseValuePerKg: 35000, description: '태초의 바다에서 떨어진 한 방울', loreFlavor: '이걸 마시면 모든 것을 안다' }),
  f({ id: 'eye_of_abyss', name: '심연의 눈', emoji: '👁️', rarity: 'mythic', habitat: ['mythical', 'deep_sea'], baitTypes: ['special'], size: { min: 100, max: 250, mean: 170, stdDev: 30 }, weightCoeff: 15, baseValuePerKg: 28000, description: '심연이 당신을 들여다본다' }),
  f({ id: 'world_fish', name: '세계물고기', emoji: '🌍', rarity: 'mythic', habitat: ['mythical'], baitTypes: ['special'], size: { min: 2000, max: 5000, mean: 3300, stdDev: 400 }, weightCoeff: 18, baseValuePerKg: 32000, description: '세계 자체가 거대한 물고기였다', loreFlavor: '낚아낸 순간 세계는 새로 시작된다' }),
  f({ id: 'wish_fish', name: '소원의 잉어', emoji: '🎏', rarity: 'mythic', habitat: ['mythical', 'freshwater'], baitTypes: ['special'], size: { min: 100, max: 200, mean: 150, stdDev: 22 }, weightCoeff: 16, baseValuePerKg: 28000, description: '소원 한 가지를 들어준다는 전설의 잉어' }),
]

// Combined pool. Order: common first → mythic last.
export const fishPool: FishType[] = [
  ...commonFish,
  ...uncommonFish,
  ...rareFish,
  ...epicFish,
  ...legendaryFish,
  ...mythicFish,
]

// Lookup helpers
const fishById = new Map(fishPool.map((f) => [f.id, f]))
const fishByName = new Map(fishPool.map((f) => [f.name, f]))

export function findFishById(id: string): FishType | undefined {
  return fishById.get(id)
}

export function findFishByName(name: string): FishType | undefined {
  return fishByName.get(name)
}

// ══════════════════════════════════════════════════════════
//  Sampling utilities
// ══════════════════════════════════════════════════════════

// Box-Muller transform for normal distribution. Trophy fish should feel earned.
function sampleNormal(mean: number, stdDev: number, min: number, max: number) {
  const u1 = Math.max(Math.random(), 1e-9)
  const u2 = Math.random()
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  const value = mean + z * stdDev
  return Math.max(min, Math.min(max, value))
}

export function sampleSize(fish: FishType): number {
  const { min, max, mean, stdDev } = fish.size
  const raw = sampleNormal(mean, stdDev, min, max)
  return Math.round(raw * 10) / 10
}

export function computeWeight(fish: FishType, sizeCm: number): number {
  // weight ∝ length^3, scaled by per-fish coefficient (kg at 100cm)
  const ratio = sizeCm / 100
  const w = fish.weightCoeff * ratio * ratio * ratio
  return Math.max(0.01, Math.round(w * 100) / 100)
}

// Trophy: top 15% within the sampling distribution. Record: top 2%.
export function classifySize(fish: FishType, sizeCm: number) {
  const trophyThreshold = fish.size.mean + fish.size.stdDev * 1.0
  const recordThreshold = fish.size.mean + fish.size.stdDev * 2.0
  return {
    isTrophy: sizeCm >= trophyThreshold && sizeCm < recordThreshold,
    isRecord: sizeCm >= recordThreshold,
  }
}

export function computeValue(
  fish: FishType,
  weightKg: number,
  sizeCm: number,
  multipliers: { weather?: number; event?: number } = {},
): number {
  const sizeClass = classifySize(fish, sizeCm)
  let sizeMult = 1.0
  if (sizeClass.isRecord) sizeMult = 4.0
  else if (sizeClass.isTrophy) sizeMult = 2.5
  else if (sizeCm >= fish.size.mean + fish.size.stdDev * 0.5) sizeMult = 1.5
  const weather = multipliers.weather ?? 1.0
  const event = multipliers.event ?? 1.0
  const raw = weightKg * fish.baseValuePerKg * sizeMult * weather * event
  // Rarity-tier safety caps to avoid INTEGER overflow / runaway gold
  const caps: Record<FishRarity, number> = {
    common: 5000,
    uncommon: 25000,
    rare: 120000,
    epic: 600000,
    legendary: 3_000_000,
    mythic: 15_000_000,
  }
  return Math.min(Math.round(raw), caps[fish.rarity])
}

// ══════════════════════════════════════════════════════════
//  Time / season helpers
// ══════════════════════════════════════════════════════════

export function currentSeason(date = new Date()): Season {
  const m = date.getMonth() + 1 // 1-12
  if (m >= 3 && m <= 5) return 'spring'
  if (m >= 6 && m <= 8) return 'summer'
  if (m >= 9 && m <= 11) return 'autumn'
  return 'winter'
}

export function currentTimeOfDay(date = new Date()): TimeOfDay {
  const h = date.getHours()
  if (h >= 5 && h < 8) return 'dawn'
  if (h >= 8 && h < 17) return 'day'
  if (h >= 17 && h < 20) return 'dusk'
  return 'night'
}

// ══════════════════════════════════════════════════════════
//  Fishing event roll (preserved API + behavior)
// ══════════════════════════════════════════════════════════

export function rollFishingEvent(
  spotLevel: number,
  pollutionLevel: number,
): FishingEvent {
  const roll = Math.random() * 100

  const trashChance = 10 + pollutionLevel * 3
  const lineBreakChance = 5 + pollutionLevel * 1.5
  const treasureChance = Math.max(0, 3 - pollutionLevel * 0.3)
  const doubleCatchChance = Math.max(0, 5 - pollutionLevel * 0.5)
  const goldenHourChance = 2
  const stormChance = 3
  const dangerousChance = 2.5 + pollutionLevel * 0.3
  const seaMonsterChance = 2 + Math.max(0, spotLevel - 4) * 0.3

  let cumulative = 0
  cumulative += lineBreakChance
  if (roll < cumulative)
    return { type: 'line_break', message: '낚싯줄이 끊어졌다!', emoji: '💔' }
  cumulative += dangerousChance
  if (roll < cumulative)
    return {
      type: 'dangerous',
      message: '뭔가 위험한 게 낚였다...!',
      emoji: '☠️',
    }
  cumulative += trashChance
  if (roll < cumulative)
    return { type: 'trash', message: '쓰레기가 걸렸다...', emoji: '🗑️' }
  cumulative += stormChance
  if (roll < cumulative)
    return {
      type: 'storm',
      message: '폭풍이 몰아친다! 큰 물고기가 올라올 수도...',
      emoji: '🌊',
    }
  cumulative += goldenHourChance
  if (roll < cumulative)
    return {
      type: 'golden_hour',
      message: '황금 시간! 물고기의 가치가 2배!',
      emoji: '✨',
    }
  cumulative += doubleCatchChance
  if (roll < cumulative)
    return {
      type: 'double_catch',
      message: '대박! 한 번에 두 마리를 잡았다!',
      emoji: '🎉',
    }
  cumulative += treasureChance
  if (roll < cumulative)
    return { type: 'treasure', message: '보물 상자를 낚았다!', emoji: '🎁' }
  cumulative += seaMonsterChance
  if (roll < cumulative)
    return {
      type: 'sea_monster',
      message: '바다 괴물이 나타났다!',
      emoji: '🦑',
    }
  return { type: 'normal', message: '물고기가 걸렸다!', emoji: '🐟' }
}

// ══════════════════════════════════════════════════════════
//  Fish roll — context-aware (habitat / season / TOD / bait)
// ══════════════════════════════════════════════════════════

export interface RollFishOpts {
  pollutionLevel?: number
  isStorm?: boolean
  weather?: string // weather name
  bait?: BaitType
  season?: Season
  timeOfDay?: TimeOfDay
  habitats?: Habitat[] // restrict candidates to these habitats
  userId?: string
}

export interface FishCatch {
  fish: FishType
  sizeCm: number
  weightKg: number
  value: number
  isTrophy: boolean
  isRecord: boolean
}

const RARITY_ORDER: FishRarity[] = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
  'mythic',
]

function pickRarity(
  spotLevel: number,
  pollutionLevel: number,
  isStorm: boolean,
  fortuneBonus: number,
): FishRarity {
  const pollutionPenalty = pollutionLevel * 1.5
  const stormBonus = isStorm ? 5 : 0
  const _f = fortuneBonus > 0
  const _fb = fortuneBonus
  const levelBonus = Math.max(0, spotLevel - 1)

  const mythicChance = Math.max(
    0,
    (spotLevel >= 5 ? 0.05 + (levelBonus - 4) * 0.02 : 0) -
      pollutionPenalty * 0.01 +
      stormBonus * 0.02 +
      (_f ? 0.8 + _fb * 0.15 : 0),
  )
  const legendaryChance = Math.max(
    0,
    (spotLevel >= 5 ? 0.4 + (levelBonus - 4) * 0.05 : 0) -
      pollutionPenalty * 0.05 +
      stormBonus * 0.1 +
      (_f ? 3.2 + _fb * 0.35 : 0),
  )
  const epicChance = Math.max(
    0,
    (spotLevel >= 4 ? 1.2 + (levelBonus - 3) * 0.15 : 0) -
      pollutionPenalty * 0.1 +
      stormBonus * 0.3 +
      (_f ? 4.5 + _fb * 0.4 : 0),
  )
  const rareChance = Math.max(
    0,
    (spotLevel >= 3 ? 3 + (levelBonus - 2) * 0.3 : 0) -
      pollutionPenalty * 0.2 +
      stormBonus * 0.5 +
      (_f ? 7.0 + _fb * 0.5 : 0),
  )
  const uncommonChance = Math.max(
    0,
    (spotLevel >= 2 ? 8 + (levelBonus - 1) * 0.5 : 0) -
      pollutionPenalty * 0.3 +
      stormBonus * 1 +
      (_f ? 8.0 : 0),
  )

  const roll = Math.random() * 100
  if (roll < mythicChance) return 'mythic'
  if (roll < mythicChance + legendaryChance) return 'legendary'
  if (roll < mythicChance + legendaryChance + epicChance) return 'epic'
  if (roll < mythicChance + legendaryChance + epicChance + rareChance)
    return 'rare'
  if (
    roll <
    mythicChance + legendaryChance + epicChance + rareChance + uncommonChance
  )
    return 'uncommon'
  return 'common'
}

function filterCandidates(
  rarity: FishRarity,
  opts: RollFishOpts,
): FishType[] {
  const season = opts.season ?? currentSeason()
  const tod = opts.timeOfDay ?? currentTimeOfDay()
  const bait = opts.bait ?? 'any'
  const habitats = opts.habitats

  let candidates = fishPool.filter((f) => f.rarity === rarity)

  if (habitats && habitats.length > 0) {
    candidates = candidates.filter((f) =>
      f.habitat.some((h) => habitats.includes(h)),
    )
  }
  // Season filter — fish flagged 'all' always pass
  candidates = candidates.filter(
    (f) => f.season.includes('all') || f.season.includes(season),
  )
  // TOD filter — 'any' always passes
  candidates = candidates.filter(
    (f) => f.timeOfDay.includes('any') || f.timeOfDay.includes(tod),
  )
  // Bait filter — 'any' always passes; if user supplied a specific bait,
  // accept fish tagged 'any' too (they're not picky).
  if (bait !== 'any') {
    candidates = candidates.filter(
      (f) => f.baitTypes.includes('any') || f.baitTypes.includes(bait),
    )
  }

  return candidates
}

// Backwards-compatible signature: rollFish(spotLevel, pollutionLevel?, isStorm?, userId?)
// Plus optional opts object for future callers.
export function rollFish(
  spotLevel: number,
  pollutionLevel: number = 0,
  isStorm: boolean = false,
  userId?: string,
  opts: Omit<RollFishOpts, 'pollutionLevel' | 'isStorm' | 'userId'> = {},
): FishCatch {
  const fortune = userId ? getUserFortune(userId) : null
  const fortuneBonus = fortune?.fish_bonus ?? 0

  const rarity = pickRarity(spotLevel, pollutionLevel, isStorm, fortuneBonus)

  let candidates = filterCandidates(rarity, {
    ...opts,
    pollutionLevel,
    isStorm,
    userId,
  })

  // Fallback: if filters wiped the candidate set, drop the bait/season/TOD
  // filters before falling back to a different rarity.
  if (candidates.length === 0) {
    candidates = fishPool.filter((f) => f.rarity === rarity)
  }
  if (candidates.length === 0) {
    candidates = fishPool.filter((f) => f.rarity === 'common')
  }

  const fish = candidates[Math.floor(Math.random() * candidates.length)]
  const sizeCm = sampleSize(fish)
  const weightKg = computeWeight(fish, sizeCm)
  const { isTrophy, isRecord } = classifySize(fish, sizeCm)
  const value = computeValue(fish, weightKg, sizeCm)

  return { fish, sizeCm, weightKg, value, isTrophy, isRecord }
}

// Legacy helper retained for /shop or other callers that surveyed the pool.
export function getAvailableFish(spotLevel: number): FishType[] {
  const allowed: FishRarity[] = ['common']
  if (spotLevel >= 2) allowed.push('uncommon')
  if (spotLevel >= 3) allowed.push('rare')
  if (spotLevel >= 4) allowed.push('epic')
  if (spotLevel >= 5) allowed.push('legendary', 'mythic')
  return fishPool.filter((f) => allowed.includes(f.rarity))
}

export const RARITIES = RARITY_ORDER
