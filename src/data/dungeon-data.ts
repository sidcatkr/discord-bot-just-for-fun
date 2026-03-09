// ══════════════════════════════════════════════════════════
//  Dungeon System — Star Rail-style difficulties
// ══════════════════════════════════════════════════════════

export interface DungeonDefinition {
  id: string
  name: string
  emoji: string
  description: string
  type: 'relic' | 'levelup' | 'weapon' | 'stellarite'
  relicSetIds?: string[] // for relic dungeons
  difficulties: DungeonDifficulty[]
}

export interface DungeonDifficulty {
  level: number // 1-6
  name: string
  recommendedPower: number // total party power recommendation
  staminaCost: number
  rewards: DungeonRewards
}

export interface DungeonRewards {
  stellariteMin: number
  stellariteMax: number
  goldMin: number
  goldMax: number
  xpMaterialMin: number // character XP materials
  xpMaterialMax: number
  relicDropChance: number // 0-100 for relic dungeons
  fatePassChance: number // 0-100 for fate pass drops (very rare)
  weaponXpMin: number // weapon enhancement materials
  weaponXpMax: number
}

// ── Dungeon Definitions ──────────────────────────────────

function makeDifficulties(
  basePower: number,
  baseStamina: number,
  baseRewards: Omit<DungeonRewards, 'relicDropChance' | 'fatePassChance'>,
  relicBase: number,
  fateBase: number,
): DungeonDifficulty[] {
  const diffNames = ['쉬움', '보통', '어려움', '매우 어려움', '악몽', '절멸']
  return diffNames.map((name, i) => {
    const mult = 1 + i * 0.5
    return {
      level: i + 1,
      name,
      recommendedPower: Math.floor(basePower * mult),
      staminaCost: baseStamina + i * 5,
      rewards: {
        stellariteMin: Math.floor(baseRewards.stellariteMin * mult),
        stellariteMax: Math.floor(baseRewards.stellariteMax * mult),
        goldMin: Math.floor(baseRewards.goldMin * mult),
        goldMax: Math.floor(baseRewards.goldMax * mult),
        xpMaterialMin: Math.floor(baseRewards.xpMaterialMin * mult),
        xpMaterialMax: Math.floor(baseRewards.xpMaterialMax * mult),
        weaponXpMin: Math.floor(baseRewards.weaponXpMin * mult),
        weaponXpMax: Math.floor(baseRewards.weaponXpMax * mult),
        relicDropChance: Math.min(100, relicBase + i * 12),
        fatePassChance: Math.min(15, fateBase + i * 1.5),
      },
    }
  })
}

export const dungeons: DungeonDefinition[] = [
  {
    id: 'flame_ruins',
    name: '화염의 폐허',
    emoji: '🔥',
    description: '타오르는 폐허에서 화염 전사의 유물을 수집합니다.',
    type: 'relic',
    relicSetIds: ['flame_warrior', 'iron_fortress'],
    difficulties: makeDifficulties(
      2000,
      20,
      {
        stellariteMin: 20,
        stellariteMax: 40,
        goldMin: 200,
        goldMax: 500,
        xpMaterialMin: 2,
        xpMaterialMax: 5,
        weaponXpMin: 1,
        weaponXpMax: 3,
      },
      30,
      1,
    ),
  },
  {
    id: 'frozen_cavern',
    name: '빙결의 동굴',
    emoji: '❄️',
    description: '얼어붙은 동굴 속 빙결 수호자의 유물을 찾습니다.',
    type: 'relic',
    relicSetIds: ['ice_guardian', 'life_bloom'],
    difficulties: makeDifficulties(
      2000,
      20,
      {
        stellariteMin: 20,
        stellariteMax: 40,
        goldMin: 200,
        goldMax: 500,
        xpMaterialMin: 2,
        xpMaterialMax: 5,
        weaponXpMin: 1,
        weaponXpMax: 3,
      },
      30,
      1,
    ),
  },
  {
    id: 'thunder_peak',
    name: '뇌전의 봉우리',
    emoji: '⚡',
    description: '번개가 치는 산봉우리에서 뇌전 무희의 유물을 수집합니다.',
    type: 'relic',
    relicSetIds: ['thunder_dancer', 'wind_wanderer'],
    difficulties: makeDifficulties(
      2200,
      20,
      {
        stellariteMin: 20,
        stellariteMax: 40,
        goldMin: 200,
        goldMax: 500,
        xpMaterialMin: 2,
        xpMaterialMax: 5,
        weaponXpMin: 1,
        weaponXpMax: 3,
      },
      30,
      1,
    ),
  },
  {
    id: 'quantum_lab',
    name: '양자 연구소',
    emoji: '🔮',
    description: '양자 연구자의 실험실에서 유물과 데이터를 수집합니다.',
    type: 'relic',
    relicSetIds: ['quantum_researcher', 'shadow_curse'],
    difficulties: makeDifficulties(
      2200,
      20,
      {
        stellariteMin: 20,
        stellariteMax: 40,
        goldMin: 200,
        goldMax: 500,
        xpMaterialMin: 2,
        xpMaterialMax: 5,
        weaponXpMin: 1,
        weaponXpMax: 3,
      },
      30,
      1,
    ),
  },
  {
    id: 'void_rift',
    name: '허무의 균열',
    emoji: '🌑',
    description: '차원의 틈에서 허무 행자의 유물을 발굴합니다.',
    type: 'relic',
    relicSetIds: ['void_walker', 'star_harmony'],
    difficulties: makeDifficulties(
      2400,
      25,
      {
        stellariteMin: 25,
        stellariteMax: 50,
        goldMin: 250,
        goldMax: 600,
        xpMaterialMin: 3,
        xpMaterialMax: 6,
        weaponXpMin: 2,
        weaponXpMax: 4,
      },
      35,
      1.5,
    ),
  },
  {
    id: 'golden_calyx',
    name: '황금 꽃받침',
    emoji: '🌻',
    description: '캐릭터 경험치 재화를 대량 획득할 수 있는 던전입니다.',
    type: 'levelup',
    difficulties: makeDifficulties(
      1800,
      15,
      {
        stellariteMin: 10,
        stellariteMax: 20,
        goldMin: 300,
        goldMax: 800,
        xpMaterialMin: 5,
        xpMaterialMax: 12,
        weaponXpMin: 0,
        weaponXpMax: 0,
      },
      0,
      0.5,
    ),
  },
  {
    id: 'weapon_forge',
    name: '무기 제련소',
    emoji: '⚒️',
    description: '무기 강화 재료를 획득할 수 있는 던전입니다.',
    type: 'weapon',
    difficulties: makeDifficulties(
      1800,
      15,
      {
        stellariteMin: 10,
        stellariteMax: 20,
        goldMin: 300,
        goldMax: 800,
        xpMaterialMin: 0,
        xpMaterialMax: 0,
        weaponXpMin: 5,
        weaponXpMax: 12,
      },
      0,
      0.5,
    ),
  },
  {
    id: 'stellarite_mine',
    name: '성흔석 광산',
    emoji: '💎',
    description: '성흔석을 대량 채굴할 수 있는 특수 던전입니다.',
    type: 'stellarite',
    difficulties: makeDifficulties(
      2000,
      25,
      {
        stellariteMin: 40,
        stellariteMax: 80,
        goldMin: 100,
        goldMax: 300,
        xpMaterialMin: 1,
        xpMaterialMax: 3,
        weaponXpMin: 1,
        weaponXpMax: 3,
      },
      0,
      2,
    ),
  },
]

export const dungeonMap = new Map(dungeons.map((d) => [d.id, d]))

// ── Stamina System ───────────────────────────────────────

export const MAX_STAMINA = 180
export const STAMINA_REGEN_MINUTES = 6 // 1 stamina per 6 minutes
export const STAMINA_PER_HOUR = 10

// ── Dungeon Enemies ──────────────────────────────────────

export interface DungeonEnemy {
  name: string
  emoji: string
  hp: number
  atk: number
  def: number
  spd: number
}

export function generateDungeonEnemies(difficulty: number): DungeonEnemy[] {
  const names = [
    { name: '그림자 병사', emoji: '👤' },
    { name: '타락한 기사', emoji: '⚔️' },
    { name: '어둠 마법사', emoji: '🧙' },
    { name: '저주받은 골렘', emoji: '🗿' },
    { name: '독 전갈', emoji: '🦂' },
    { name: '불꽃 정령', emoji: '🔥' },
    { name: '얼음 요정', emoji: '❄️' },
    { name: '번개 늑대', emoji: '🐺' },
    { name: '바람 요소', emoji: '🌪️' },
    { name: '심연 수호자', emoji: '🌑' },
  ]

  const count = Math.min(4, 2 + Math.floor(difficulty / 2))
  const mult = 1 + (difficulty - 1) * 0.4
  const enemies: DungeonEnemy[] = []

  for (let i = 0; i < count; i++) {
    const template = names[Math.floor(Math.random() * names.length)]
    enemies.push({
      name: template.name,
      emoji: template.emoji,
      hp: Math.floor((800 + Math.random() * 400) * mult),
      atk: Math.floor((200 + Math.random() * 150) * mult),
      def: Math.floor((100 + Math.random() * 80) * mult),
      spd: Math.floor(85 + Math.random() * 20),
    })
  }

  return enemies
}
