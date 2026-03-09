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
  const powerMults = [1, 1.8, 2.8, 4.0, 5.5, 7.5] // Match enemy scaling
  return diffNames.map((name, i) => {
    const mult = 1 + i * 0.5
    return {
      level: i + 1,
      name,
      recommendedPower: Math.floor(basePower * powerMults[i]),
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

import type { Element, SkillEffect, SkillTarget } from './characters.js'
import type { EnemyDef } from './combat-engine.js'

// ── Enhanced enemy templates with skills ─────────────────

interface EnemyTemplate {
  name: string
  emoji: string
  element: Element
  role: 'dps' | 'tank' | 'support' | 'boss'
  baseHP: number
  baseATK: number
  baseDEF: number
  baseSPD: number
  basicMult: number
  skillMult: number
  skillTarget: SkillTarget
  skillEffects: SkillEffect[]
  ultMult: number
  ultTarget: SkillTarget
  ultCost: number
}

const enemyTemplates: EnemyTemplate[] = [
  // DPS enemies
  {
    name: '그림자 암살자',
    emoji: '🗡️',
    element: 'physical',
    role: 'dps',
    baseHP: 2800,
    baseATK: 750,
    baseDEF: 320,
    baseSPD: 108,
    basicMult: 70,
    skillMult: 140,
    skillTarget: 'single',
    skillEffects: [{ type: 'bleed', value: 20, duration: 2, chance: 60 }],
    ultMult: 280,
    ultTarget: 'single',
    ultCost: 100,
  },
  {
    name: '화염 마도사',
    emoji: '🔥',
    element: 'fire',
    role: 'dps',
    baseHP: 2400,
    baseATK: 820,
    baseDEF: 280,
    baseSPD: 102,
    basicMult: 65,
    skillMult: 110,
    skillTarget: 'allEnemies',
    skillEffects: [{ type: 'burn', value: 25, duration: 2, chance: 70 }],
    ultMult: 200,
    ultTarget: 'allEnemies',
    ultCost: 120,
  },
  {
    name: '뇌전 사냥꾼',
    emoji: '⚡',
    element: 'lightning',
    role: 'dps',
    baseHP: 2600,
    baseATK: 780,
    baseDEF: 300,
    baseSPD: 112,
    basicMult: 70,
    skillMult: 150,
    skillTarget: 'single',
    skillEffects: [{ type: 'shock', value: 22, duration: 2, chance: 65 }],
    ultMult: 300,
    ultTarget: 'single',
    ultCost: 110,
  },
  {
    name: '빙결 요술사',
    emoji: '❄️',
    element: 'ice',
    role: 'dps',
    baseHP: 2500,
    baseATK: 700,
    baseDEF: 340,
    baseSPD: 98,
    basicMult: 60,
    skillMult: 100,
    skillTarget: 'allEnemies',
    skillEffects: [{ type: 'freeze', value: 0, duration: 1, chance: 40 }],
    ultMult: 180,
    ultTarget: 'allEnemies',
    ultCost: 130,
  },
  // Tank enemies
  {
    name: '강철 골렘',
    emoji: '🗿',
    element: 'physical',
    role: 'tank',
    baseHP: 5500,
    baseATK: 450,
    baseDEF: 650,
    baseSPD: 82,
    basicMult: 55,
    skillMult: 80,
    skillTarget: 'allEnemies',
    skillEffects: [{ type: 'atkDown', value: 15, duration: 2, chance: 80 }],
    ultMult: 150,
    ultTarget: 'allEnemies',
    ultCost: 140,
  },
  {
    name: '심연 수호자',
    emoji: '🌑',
    element: 'imaginary',
    role: 'tank',
    baseHP: 5000,
    baseATK: 500,
    baseDEF: 600,
    baseSPD: 85,
    basicMult: 55,
    skillMult: 90,
    skillTarget: 'single',
    skillEffects: [{ type: 'defDown', value: 20, duration: 2, chance: 70 }],
    ultMult: 160,
    ultTarget: 'allEnemies',
    ultCost: 130,
  },
  // Support enemies
  {
    name: '독 비술사',
    emoji: '🦂',
    element: 'wind',
    role: 'support',
    baseHP: 3000,
    baseATK: 600,
    baseDEF: 350,
    baseSPD: 95,
    basicMult: 55,
    skillMult: 100,
    skillTarget: 'allEnemies',
    skillEffects: [
      { type: 'atkDown', value: 15, duration: 2, chance: 70 },
      { type: 'spdDown', value: 10, duration: 2, chance: 60 },
    ],
    ultMult: 120,
    ultTarget: 'allEnemies',
    ultCost: 120,
  },
  {
    name: '차원 점술사',
    emoji: '🔮',
    element: 'quantum',
    role: 'support',
    baseHP: 3200,
    baseATK: 580,
    baseDEF: 380,
    baseSPD: 100,
    basicMult: 55,
    skillMult: 80,
    skillTarget: 'single',
    skillEffects: [{ type: 'entangle', value: 25, duration: 2, chance: 60 }],
    ultMult: 140,
    ultTarget: 'allEnemies',
    ultCost: 110,
  },
  // Boss-type enemies (appear at higher difficulties)
  {
    name: '타락한 장군',
    emoji: '👹',
    element: 'physical',
    role: 'boss',
    baseHP: 8000,
    baseATK: 900,
    baseDEF: 500,
    baseSPD: 105,
    basicMult: 75,
    skillMult: 130,
    skillTarget: 'allEnemies',
    skillEffects: [{ type: 'bleed', value: 30, duration: 3, chance: 80 }],
    ultMult: 250,
    ultTarget: 'allEnemies',
    ultCost: 100,
  },
  {
    name: '업화의 마왕',
    emoji: '😈',
    element: 'fire',
    role: 'boss',
    baseHP: 9000,
    baseATK: 950,
    baseDEF: 480,
    baseSPD: 100,
    basicMult: 70,
    skillMult: 120,
    skillTarget: 'allEnemies',
    skillEffects: [{ type: 'burn', value: 35, duration: 3, chance: 90 }],
    ultMult: 280,
    ultTarget: 'allEnemies',
    ultCost: 110,
  },
]

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function generateDungeonEnemies(difficulty: number): DungeonEnemy[] {
  // Legacy interface for backward compat
  const enhanced = generateEnhancedEnemies(difficulty)
  return enhanced.map((e) => ({
    name: e.name,
    emoji: e.emoji,
    hp: e.hp,
    atk: e.atk,
    def: e.def,
    spd: e.spd,
  }))
}

export function generateEnhancedEnemies(difficulty: number): EnemyDef[] {
  // Difficulty scaling: much steeper curve
  // Diff 1: mult 1.0   — needs Lv.15-25 party
  // Diff 2: mult 1.8   — needs Lv.30-40 party
  // Diff 3: mult 2.8   — needs Lv.40-50 party
  // Diff 4: mult 4.0   — needs Lv.50-60 party
  // Diff 5: mult 5.5   — needs Lv.60-70 party
  // Diff 6: mult 7.5   — needs Lv.70-80 max gear
  const mult = difficulty <= 1 ? 1 : Math.pow(1.5, difficulty - 1) * 0.9

  // Enemy count scales with difficulty
  const count = Math.min(5, 2 + Math.floor(difficulty / 2))

  // Select enemy templates based on difficulty
  const availableTemplates =
    difficulty >= 5
      ? enemyTemplates // all including bosses
      : difficulty >= 3
        ? enemyTemplates.filter((t) => t.role !== 'boss')
        : enemyTemplates.filter((t) => t.role === 'dps' || t.role === 'support')

  // At difficulty 5+, one enemy is a boss
  const hasBoss = difficulty >= 5
  const bossTemplates = enemyTemplates.filter((t) => t.role === 'boss')

  const enemies: EnemyDef[] = []

  for (let i = 0; i < count; i++) {
    const isBossSlot = hasBoss && i === 0
    const template = isBossSlot
      ? pickRandom(bossTemplates)
      : pickRandom(availableTemplates)

    const bossMult = isBossSlot ? 1.5 : 1

    enemies.push({
      name: template.name,
      emoji: template.emoji,
      hp: Math.floor(
        template.baseHP * mult * bossMult * (0.9 + Math.random() * 0.2),
      ),
      atk: Math.floor(
        template.baseATK * mult * bossMult * (0.9 + Math.random() * 0.2),
      ),
      def: Math.floor(
        template.baseDEF * mult * bossMult * (0.9 + Math.random() * 0.2),
      ),
      spd: Math.floor(template.baseSPD * (0.95 + Math.random() * 0.1)),
      element: template.element,
      basicMult: template.basicMult,
      skillMult: template.skillMult,
      skillTarget: template.skillTarget,
      skillEffects: template.skillEffects,
      ultMult: template.ultMult,
      ultTarget: template.ultTarget,
      ultCost: template.ultCost,
    })
  }

  return enemies
}
