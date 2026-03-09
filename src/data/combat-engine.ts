// ══════════════════════════════════════════════════════════
//  Star Rail-style Turn-Based Combat Engine
//  Shared between PVP and Dungeon systems
// ══════════════════════════════════════════════════════════

import {
  characterMap,
  getCharacterStats,
  elementEmoji,
  type CharacterTemplate,
  type CharacterSkill,
  type UltimateSkill,
  type SkillEffect,
  type SkillTarget,
  type Element,
} from './characters.js'
import { weaponMap } from './weapons.js'
import { relicSetMap as dungeonRelicSets } from './relics.js'
import { relicSetMap as farmRelicSets } from './relic-data.js'
import {
  getOwnedCharacter,
  getWeaponEquippedBy,
  getRelicsForCharacter,
} from '../db/helpers.js'

// ── Types ────────────────────────────────────────────────

export interface CombatStats {
  maxHP: number
  atk: number
  def: number
  spd: number
  critRate: number
  critDmg: number
}

export interface ActiveEffect {
  type: SkillEffect['type']
  value: number
  duration: number
  sourceId: string
  sourceAtk: number
}

export interface SkillDef {
  name: string
  multiplier: number
  target: SkillTarget
  spChange: number
  energyGen: number
  effects: SkillEffect[]
}

export interface UltDef {
  name: string
  multiplier: number
  target: SkillTarget
  energyCost: number
  effects: SkillEffect[]
}

export interface Combatant {
  id: string
  name: string
  emoji: string
  team: 1 | 2
  ownerId: string
  stats: CombatStats
  currentHP: number
  energy: number
  maxEnergy: number
  shieldHP: number
  actionValue: number
  basic: SkillDef
  skill: SkillDef
  ultimate: UltDef
  talentId: string
  element: Element
  effects: ActiveEffect[]
  isAlive: boolean
}

export type ActionType = 'basic' | 'skill' | 'ultimate'

export interface TurnResult {
  lines: string[]
  finished: boolean
}

export interface CombatState {
  combatants: Combatant[]
  team1SP: number
  team2SP: number
  maxSP: number
  turnCount: number
  maxTurns: number
  isFinished: boolean
  winner: 1 | 2 | null
}

// ── Relic stat accumulator ───────────────────────────────

interface StatAccum {
  atkFlat: number
  atkPct: number
  defFlat: number
  defPct: number
  hpFlat: number
  hpPct: number
  critRate: number
  critDmg: number
  spdFlat: number
}

function applyRelicStat(statType: string, value: number, accum: StatAccum) {
  switch (statType) {
    // relics.ts naming (dungeon drops) — whole number %
    case 'hp':
      accum.hpFlat += value
      break
    case 'atk':
      accum.atkFlat += value
      break
    case 'def':
      accum.defFlat += value
      break
    case 'spd':
      accum.spdFlat += value
      break
    case 'critRate':
      accum.critRate += value / 100
      break
    case 'critDmg':
      accum.critDmg += value / 100
      break
    // relic-data.ts naming (relic farm) — decimal fractions
    case 'hp_flat':
      accum.hpFlat += value
      break
    case 'hp_pct':
      accum.hpPct += value
      break
    case 'atk_flat':
      accum.atkFlat += value
      break
    case 'atk_pct':
      accum.atkPct += value
      break
    case 'def_flat':
      accum.defFlat += value
      break
    case 'def_pct':
      accum.defPct += value
      break
    case 'crit_rate':
      accum.critRate += value
      break
    case 'crit_dmg':
      accum.critDmg += value
      break
    case 'spd_flat':
      accum.spdFlat += value
      break
  }
}

// ── Build Combatants ─────────────────────────────────────

export function buildPlayerCombatant(
  userId: string,
  characterId: string,
  team: 1 | 2,
): Combatant | null {
  const owned = getOwnedCharacter(userId, characterId)
  const template = characterMap.get(characterId)
  if (!owned || !template) return null

  const baseStats = getCharacterStats(template, owned.level)
  let atk = baseStats.atk
  let def = baseStats.def
  let hp = baseStats.hp
  let spd = baseStats.spd
  let critRate = 0.05
  let critDmg = 1.5

  // Awakening bonus: +5% base stats per awakening level
  atk += owned.awakening * Math.floor(template.baseATK * 0.05)
  def += owned.awakening * Math.floor(template.baseDEF * 0.05)
  hp += owned.awakening * Math.floor(template.baseHP * 0.05)

  // Weapon bonus
  const weapon = getWeaponEquippedBy(userId, characterId)
  if (weapon) {
    const wt = weaponMap.get(weapon.weapon_id)
    if (wt) {
      atk += Math.floor(wt.baseATK * (1 + (weapon.refinement - 1) * 0.1))
      hp += wt.baseHP
      def += wt.baseDEF
    }
  }

  // Relic stat accumulation
  const relics = getRelicsForCharacter(userId, characterId)
  const accum: StatAccum = {
    atkFlat: 0,
    atkPct: 0,
    defFlat: 0,
    defPct: 0,
    hpFlat: 0,
    hpPct: 0,
    critRate: 0,
    critDmg: 0,
    spdFlat: 0,
  }

  for (const relic of relics) {
    applyRelicStat(relic.main_stat_type, relic.main_stat_value, accum)
    const subs: { type: string; value: number }[] = JSON.parse(relic.sub_stats)
    for (const sub of subs) {
      applyRelicStat(sub.type, sub.value, accum)
    }
  }

  // Relic set bonuses
  const setCounts = new Map<string, number>()
  for (const r of relics) {
    setCounts.set(r.set_id, (setCounts.get(r.set_id) ?? 0) + 1)
  }
  for (const [setId, count] of setCounts) {
    // Check dungeon relic sets
    const dSet = dungeonRelicSets.get(setId)
    if (dSet) {
      if (count >= 2) {
        const e = dSet.twoPieceEffect
        if (e.atkPercent) accum.atkPct += e.atkPercent / 100
        if (e.defPercent) accum.defPct += e.defPercent / 100
        if (e.hpPercent) accum.hpPct += e.hpPercent / 100
        if (e.spdPercent)
          accum.spdFlat += Math.floor((spd * e.spdPercent) / 100)
        if (e.critRate) accum.critRate += e.critRate / 100
        if (e.critDmg) accum.critDmg += e.critDmg / 100
      }
      if (count >= 4) {
        const e = dSet.fourPieceEffect
        if (e.atkPercent) accum.atkPct += e.atkPercent / 100
        if (e.defPercent) accum.defPct += e.defPercent / 100
        if (e.critRate) accum.critRate += e.critRate / 100
        if (e.critDmg) accum.critDmg += e.critDmg / 100
      }
    }
    // Check farm relic sets
    const fSet = farmRelicSets.get(setId)
    if (fSet) {
      if (count >= 2) {
        for (const [k, v] of Object.entries(fSet.bonus2Stats)) {
          applyRelicStat(k, v, accum)
        }
      }
      if (count >= 4) {
        for (const [k, v] of Object.entries(fSet.bonus4Stats)) {
          applyRelicStat(k, v, accum)
        }
      }
    }
  }

  // Apply percentages to base stats
  atk = Math.floor((atk + accum.atkFlat) * (1 + accum.atkPct))
  def = Math.floor((def + accum.defFlat) * (1 + accum.defPct))
  hp = Math.floor((hp + accum.hpFlat) * (1 + accum.hpPct))
  spd = Math.floor(spd + accum.spdFlat)
  critRate = Math.min(1, critRate + accum.critRate)
  critDmg = critDmg + accum.critDmg

  // Apply talent stat bonuses
  applyTalentStats(template, { atk, def, hp, spd, critRate, critDmg })

  return {
    id: `${userId}_${characterId}`,
    name: template.name,
    emoji: template.emoji,
    team,
    ownerId: userId,
    stats: { maxHP: hp, atk, def, spd, critRate, critDmg },
    currentHP: hp,
    energy: 0,
    maxEnergy: template.ultimate.energyCost,
    shieldHP: 0,
    actionValue: 10000 / spd,
    basic: {
      name: template.basic.name,
      multiplier: template.basic.multiplier,
      target: template.basic.target,
      spChange: template.basic.spChange,
      energyGen: template.basic.energyGen,
      effects: template.basic.effects,
    },
    skill: {
      name: template.skill.name,
      multiplier: template.skill.multiplier,
      target: template.skill.target,
      spChange: template.skill.spChange,
      energyGen: template.skill.energyGen,
      effects: template.skill.effects,
    },
    ultimate: {
      name: template.ultimate.name,
      multiplier: template.ultimate.multiplier,
      target: template.ultimate.target,
      energyCost: template.ultimate.energyCost,
      effects: template.ultimate.effects,
    },
    talentId: template.id,
    element: template.element,
    effects: [],
    isAlive: true,
  }
}

function applyTalentStats(
  template: CharacterTemplate,
  stats: {
    atk: number
    def: number
    hp: number
    spd: number
    critRate: number
    critDmg: number
  },
) {
  // Parse known talent stat bonuses from description
  const desc = template.talent.description
  if (desc.includes('ATK +') || desc.includes('공격력 +')) {
    const match = desc.match(/ATK \+(\d+)%|공격력 \+(\d+)%/)
    if (match)
      stats.atk = Math.floor(
        stats.atk * (1 + parseInt(match[1] ?? match[2]) / 100),
      )
  }
  if (desc.includes('DEF +') || desc.includes('방어력 +')) {
    const match = desc.match(/DEF \+(\d+)%|방어력 \+(\d+)%/)
    if (match)
      stats.def = Math.floor(
        stats.def * (1 + parseInt(match[1] ?? match[2]) / 100),
      )
  }
  if (desc.includes('SPD +')) {
    const match = desc.match(/SPD \+(\d+)/)
    if (match) stats.spd += parseInt(match[1])
  }
  if (desc.includes('크리티컬 확률 +') || desc.includes('치명타 확률 +')) {
    const match = desc.match(/(?:크리티컬|치명타) 확률 \+(\d+)%/)
    if (match)
      stats.critRate = Math.min(1, stats.critRate + parseInt(match[1]) / 100)
  }
}

export interface EnemyDef {
  name: string
  emoji: string
  hp: number
  atk: number
  def: number
  spd: number
  element: Element
  basicMult: number
  skillMult: number
  skillTarget: SkillTarget
  skillEffects: SkillEffect[]
  ultMult: number
  ultTarget: SkillTarget
  ultCost: number
}

export function buildEnemyCombatant(enemy: EnemyDef, index: number): Combatant {
  return {
    id: `enemy_${index}`,
    name: enemy.name,
    emoji: enemy.emoji,
    team: 2,
    ownerId: 'enemy',
    stats: {
      maxHP: enemy.hp,
      atk: enemy.atk,
      def: enemy.def,
      spd: enemy.spd,
      critRate: 0.05,
      critDmg: 1.5,
    },
    currentHP: enemy.hp,
    energy: 0,
    maxEnergy: enemy.ultCost,
    shieldHP: 0,
    actionValue: 10000 / enemy.spd,
    basic: {
      name: '공격',
      multiplier: enemy.basicMult,
      target: 'single',
      spChange: 1,
      energyGen: 20,
      effects: [],
    },
    skill: {
      name: '강력한 공격',
      multiplier: enemy.skillMult,
      target: enemy.skillTarget,
      spChange: -1,
      energyGen: 30,
      effects: enemy.skillEffects,
    },
    ultimate: {
      name: '필살기',
      multiplier: enemy.ultMult,
      target: enemy.ultTarget,
      energyCost: enemy.ultCost,
      effects: [],
    },
    talentId: '',
    element: enemy.element,
    effects: [],
    isAlive: true,
  }
}

// ── Combat Initialization ────────────────────────────────

export function initCombat(
  team1: Combatant[],
  team2: Combatant[],
  maxTurns = 30,
): CombatState {
  return {
    combatants: [...team1, ...team2],
    team1SP: 3,
    team2SP: 3,
    maxSP: 5,
    turnCount: 0,
    maxTurns,
    isFinished: false,
    winner: null,
  }
}

// ── Turn Management ──────────────────────────────────────

export function getNextActor(state: CombatState): Combatant | null {
  const alive = state.combatants.filter((c) => c.isAlive)
  if (alive.length === 0) return null

  // Find minimum AV
  const minAV = Math.min(...alive.map((c) => c.actionValue))

  // Subtract minimum AV from all alive combatants
  for (const c of alive) {
    c.actionValue -= minAV
  }

  // Return the one with AV closest to 0 (highest speed breaks ties)
  alive.sort(
    (a, b) => a.actionValue - b.actionValue || b.stats.spd - a.stats.spd,
  )
  return alive[0]
}

export function canUseSkill(state: CombatState, actor: Combatant): boolean {
  const sp = actor.team === 1 ? state.team1SP : state.team2SP
  return sp >= 1
}

export function canUseUltimate(actor: Combatant): boolean {
  return actor.energy >= actor.maxEnergy
}

// ── Damage & Healing Calculation ─────────────────────────

function calculateDamage(
  attackerAtk: number,
  multiplier: number,
  targetDef: number,
  attackerLevel: number,
  critRate: number,
  critDmg: number,
): { damage: number; isCrit: boolean } {
  const baseDmg = attackerAtk * (multiplier / 100)
  const defReduction = targetDef / (targetDef + 200 + attackerLevel * 10)
  let dmg = Math.floor(baseDmg * (1 - defReduction))

  const isCrit = Math.random() < critRate
  if (isCrit) {
    dmg = Math.floor(dmg * critDmg)
  }

  return { damage: Math.max(1, dmg), isCrit }
}

function calculateHealing(maxHP: number, multiplier: number): number {
  return Math.floor(maxHP * (multiplier / 100))
}

// ── Action Execution ─────────────────────────────────────

export function executeAction(
  state: CombatState,
  actor: Combatant,
  actionType: ActionType,
): TurnResult {
  const lines: string[] = []
  state.turnCount++

  // Process DoT effects on actor
  const dotLines = processDoTEffects(state, actor)
  lines.push(...dotLines)

  if (!actor.isAlive) {
    return { lines, finished: checkEnd(state) }
  }

  // Check frozen status
  const freezeEffect = actor.effects.find((e) => e.type === 'freeze')
  if (freezeEffect) {
    lines.push(`❄️ ${actor.emoji} ${actor.name}이(가) 빙결 상태! 행동 불가!`)
    actor.actionValue = 10000 / actor.stats.spd
    tickEffects(actor)
    return { lines, finished: checkEnd(state) }
  }

  // Get the skill to use
  let skill: SkillDef | UltDef
  let actionName: string
  let spChange = 0
  let energyGen = 0

  if (actionType === 'ultimate' && canUseUltimate(actor)) {
    skill = actor.ultimate
    actionName = `💥 **필살기: ${actor.ultimate.name}**`
    actor.energy = 0
    energyGen = 0
  } else if (actionType === 'skill' && canUseSkill(state, actor)) {
    skill = actor.skill
    actionName = `✨ **전투 스킬: ${actor.skill.name}**`
    spChange = actor.skill.spChange
    energyGen = actor.skill.energyGen
  } else {
    skill = actor.basic
    actionName = `🗡️ **일반 공격: ${actor.basic.name}**`
    spChange = actor.basic.spChange
    energyGen = actor.basic.energyGen
  }

  // Apply SP change
  if (spChange !== 0) {
    if (actor.team === 1) {
      state.team1SP = Math.max(
        0,
        Math.min(state.maxSP, state.team1SP + spChange),
      )
    } else {
      state.team2SP = Math.max(
        0,
        Math.min(state.maxSP, state.team2SP + spChange),
      )
    }
  }

  // Apply energy gen
  actor.energy = Math.min(actor.maxEnergy, actor.energy + energyGen)

  // Determine targets
  const targets = getTargets(state, actor, skill.target)

  if (targets.length === 0) {
    lines.push(`${actor.emoji} ${actor.name} — ${actionName} → 대상 없음!`)
    actor.actionValue = 10000 / actor.stats.spd
    tickEffects(actor)
    return { lines, finished: checkEnd(state) }
  }

  // Check if this is a healing/buff/shield action
  const isHeal =
    skill.target === 'singleAlly' ||
    skill.target === 'allAllies' ||
    skill.target === 'self'
  const isHealing = isHeal && skill.multiplier > 0 && !isDamageSkill(skill)

  if (isHealing) {
    // Healing action
    const healAmount = calculateHealing(actor.stats.maxHP, skill.multiplier)
    for (const target of targets) {
      const oldHP = target.currentHP
      target.currentHP = Math.min(
        target.stats.maxHP,
        target.currentHP + healAmount,
      )
      const healed = target.currentHP - oldHP
      lines.push(
        `${actor.emoji} ${actor.name} ${actionName} → ${target.emoji} ${target.name} ❤️ +${healed} HP`,
      )
    }
  } else if (skill.multiplier > 0) {
    // Damage action
    const attackerLevel = Math.floor(actor.stats.atk / 50) // approximate level
    for (const target of targets) {
      const modifiedAtk = getModifiedAtk(actor)
      const modifiedDef = getModifiedDef(target)
      const { damage, isCrit } = calculateDamage(
        modifiedAtk,
        skill.multiplier,
        modifiedDef,
        attackerLevel,
        actor.stats.critRate,
        actor.stats.critDmg,
      )

      // Apply damage to shield first
      let remainingDmg = damage
      if (target.shieldHP > 0) {
        const shieldAbsorb = Math.min(target.shieldHP, remainingDmg)
        target.shieldHP -= shieldAbsorb
        remainingDmg -= shieldAbsorb
      }

      target.currentHP = Math.max(0, target.currentHP - remainingDmg)
      target.energy = Math.min(target.maxEnergy, target.energy + 10) // getting hit generates energy

      const critText = isCrit ? ' 💥치명타!' : ''
      const killText = target.currentHP === 0 ? ' 💀처치!' : ''
      lines.push(
        `${actor.emoji} ${actor.name} ${actionName} → ${target.emoji} ${target.name} -${damage}${critText}${killText}`,
      )

      if (target.currentHP === 0) {
        target.isAlive = false
      }
    }
  }

  // Apply buff/shield effects (for support skills)
  if (
    skill.target === 'allAllies' ||
    skill.target === 'self' ||
    skill.target === 'singleAlly'
  ) {
    for (const effect of skill.effects) {
      if (effect.type === 'shield') {
        const shieldAmount = Math.floor(
          actor.stats.maxHP * (effect.value / 100),
        )
        for (const target of targets) {
          target.shieldHP += shieldAmount
          lines.push(
            `🛡️ ${target.emoji} ${target.name}에게 실드 +${shieldAmount}!`,
          )
        }
      }
      if (
        ['atkUp', 'defUp', 'spdUp', 'critUp', 'healOverTime'].includes(
          effect.type,
        )
      ) {
        if (Math.random() * 100 < effect.chance) {
          for (const target of targets) {
            target.effects.push({
              type: effect.type,
              value: effect.value,
              duration: effect.duration,
              sourceId: actor.id,
              sourceAtk: actor.stats.atk,
            })
          }
          const effectName = getEffectName(effect.type)
          lines.push(
            `✨ ${targets.map((t) => t.emoji + t.name).join(', ')} ${effectName}!`,
          )
        }
      }
    }
  }

  // Apply debuff effects (for damage skills targeting enemies)
  if (skill.target === 'single' || skill.target === 'allEnemies') {
    for (const effect of skill.effects) {
      if (Math.random() * 100 < effect.chance) {
        for (const target of targets) {
          if (!target.isAlive) continue
          target.effects.push({
            type: effect.type,
            value: effect.value,
            duration: effect.duration,
            sourceId: actor.id,
            sourceAtk: actor.stats.atk,
          })
        }
        const effectName = getEffectName(effect.type)
        lines.push(
          `🔻 ${targets
            .filter((t) => t.isAlive)
            .map((t) => t.emoji + t.name)
            .join(', ')}에게 ${effectName} 부여!`,
        )
      }
    }
  }

  // Reset action value
  actor.actionValue = 10000 / actor.stats.spd

  // Tick status effects
  tickEffects(actor)

  return { lines, finished: checkEnd(state) }
}

function isDamageSkill(skill: SkillDef | UltDef): boolean {
  // Skills targeting allies are heals, not damage
  return true // multiplier is always damage for enemy-targeting skills
}

function getModifiedAtk(c: Combatant): number {
  let atk = c.stats.atk
  for (const e of c.effects) {
    if (e.type === 'atkUp') atk = Math.floor(atk * (1 + e.value / 100))
    if (e.type === 'atkDown') atk = Math.floor(atk * (1 - e.value / 100))
  }
  return atk
}

function getModifiedDef(c: Combatant): number {
  let def = c.stats.def
  for (const e of c.effects) {
    if (e.type === 'defUp') def = Math.floor(def * (1 + e.value / 100))
    if (e.type === 'defDown') def = Math.floor(def * (1 - e.value / 100))
  }
  return def
}

// ── Target Selection ─────────────────────────────────────

function getTargets(
  state: CombatState,
  actor: Combatant,
  target: SkillTarget,
): Combatant[] {
  const allies = state.combatants.filter(
    (c) => c.isAlive && c.team === actor.team,
  )
  const enemies = state.combatants.filter(
    (c) => c.isAlive && c.team !== actor.team,
  )

  switch (target) {
    case 'single':
      // Target enemy with lowest HP%
      if (enemies.length === 0) return []
      enemies.sort(
        (a, b) => a.currentHP / a.stats.maxHP - b.currentHP / b.stats.maxHP,
      )
      return [enemies[0]]

    case 'allEnemies':
      return enemies

    case 'self':
      return [actor]

    case 'singleAlly':
      // Target ally with lowest HP%
      if (allies.length === 0) return []
      allies.sort(
        (a, b) => a.currentHP / a.stats.maxHP - b.currentHP / b.stats.maxHP,
      )
      return [allies[0]]

    case 'allAllies':
      return allies

    default:
      return enemies
  }
}

// ── Status Effect Processing ─────────────────────────────

function processDoTEffects(state: CombatState, actor: Combatant): string[] {
  const lines: string[] = []

  for (const effect of actor.effects) {
    if (!actor.isAlive) break

    if (effect.type === 'burn') {
      const dmg = Math.floor(effect.sourceAtk * (effect.value / 100))
      actor.currentHP = Math.max(0, actor.currentHP - dmg)
      lines.push(`🔥 ${actor.emoji} ${actor.name} 화상! -${dmg}`)
      if (actor.currentHP === 0) {
        actor.isAlive = false
        lines.push(`💀 ${actor.emoji} ${actor.name} 화상으로 전사!`)
      }
    }
    if (effect.type === 'shock') {
      const dmg = Math.floor(effect.sourceAtk * (effect.value / 100))
      actor.currentHP = Math.max(0, actor.currentHP - dmg)
      lines.push(`⚡ ${actor.emoji} ${actor.name} 감전! -${dmg}`)
      if (actor.currentHP === 0) {
        actor.isAlive = false
        lines.push(`💀 ${actor.emoji} ${actor.name} 감전으로 전사!`)
      }
    }
    if (effect.type === 'bleed') {
      const dmg = Math.floor(effect.sourceAtk * (effect.value / 100))
      actor.currentHP = Math.max(0, actor.currentHP - dmg)
      lines.push(`🩸 ${actor.emoji} ${actor.name} 출혈! -${dmg}`)
      if (actor.currentHP === 0) {
        actor.isAlive = false
        lines.push(`💀 ${actor.emoji} ${actor.name} 출혈로 전사!`)
      }
    }
    if (effect.type === 'entangle') {
      const dmg = Math.floor(effect.sourceAtk * (effect.value / 100))
      actor.currentHP = Math.max(0, actor.currentHP - dmg)
      lines.push(`🌿 ${actor.emoji} ${actor.name} 속박! -${dmg}`)
      if (actor.currentHP === 0) {
        actor.isAlive = false
        lines.push(`💀 ${actor.emoji} ${actor.name} 속박으로 전사!`)
      }
    }
    if (effect.type === 'healOverTime') {
      const heal = Math.floor(actor.stats.maxHP * (effect.value / 100))
      const oldHP = actor.currentHP
      actor.currentHP = Math.min(actor.stats.maxHP, actor.currentHP + heal)
      lines.push(
        `💚 ${actor.emoji} ${actor.name} 지속 회복! +${actor.currentHP - oldHP}`,
      )
    }
  }

  return lines
}

function tickEffects(actor: Combatant) {
  for (const effect of actor.effects) {
    effect.duration--
  }
  actor.effects = actor.effects.filter((e) => e.duration > 0)
}

function getEffectName(type: SkillEffect['type']): string {
  const names: Record<string, string> = {
    burn: '🔥 화상',
    freeze: '❄️ 빙결',
    shock: '⚡ 감전',
    bleed: '🩸 출혈',
    entangle: '🌿 속박',
    shield: '🛡️ 실드',
    atkUp: '⚔️ 공격력 UP',
    defUp: '🛡️ 방어력 UP',
    spdUp: '💨 속도 UP',
    critUp: '🎯 치명타 UP',
    atkDown: '⚔️ 공격력 DOWN',
    defDown: '🛡️ 방어력 DOWN',
    spdDown: '🐌 속도 DOWN',
    healOverTime: '💚 지속 회복',
  }
  return names[type] ?? type
}

// ── End Condition Check ──────────────────────────────────

function checkEnd(state: CombatState): boolean {
  const team1Alive = state.combatants.some((c) => c.team === 1 && c.isAlive)
  const team2Alive = state.combatants.some((c) => c.team === 2 && c.isAlive)

  if (!team1Alive) {
    state.isFinished = true
    state.winner = 2
    return true
  }
  if (!team2Alive) {
    state.isFinished = true
    state.winner = 1
    return true
  }
  if (state.turnCount >= state.maxTurns) {
    state.isFinished = true
    // Team with more total HP% wins on timeout
    const team1HPPct = state.combatants
      .filter((c) => c.team === 1)
      .reduce((sum, c) => sum + c.currentHP / c.stats.maxHP, 0)
    const team2HPPct = state.combatants
      .filter((c) => c.team === 2)
      .reduce((sum, c) => sum + c.currentHP / c.stats.maxHP, 0)
    state.winner = team1HPPct >= team2HPPct ? 1 : 2
    return true
  }
  return false
}

// ── AI Action Picker ─────────────────────────────────────

export function aiPickAction(state: CombatState, actor: Combatant): ActionType {
  // Priority: Ultimate > Skill (if SP and beneficial) > Basic
  if (canUseUltimate(actor)) {
    return 'ultimate'
  }

  if (canUseSkill(state, actor)) {
    // Use skill 60% of the time if SP available
    if (Math.random() < 0.6) return 'skill'
  }

  return 'basic'
}

// ── Auto-Battle (for dungeons) ───────────────────────────

export function runAutoBattle(
  team1: Combatant[],
  team2: Combatant[],
  maxTurns = 30,
): { state: CombatState; fullLog: string[] } {
  const state = initCombat(team1, team2, maxTurns)
  const fullLog: string[] = []
  let displayedTurns = 0

  while (!state.isFinished) {
    const actor = getNextActor(state)
    if (!actor) break

    const action = aiPickAction(state, actor)
    const result = executeAction(state, actor, action)

    // Show first 5 turns and important events (kills/heals/ults)
    if (
      displayedTurns < 5 ||
      result.lines.some((l) => l.includes('💀') || l.includes('💥'))
    ) {
      fullLog.push(...result.lines)
      displayedTurns++
    } else if (displayedTurns === 5) {
      fullLog.push('*... 전투 진행 중 ...*')
      displayedTurns++
    }

    if (result.finished) {
      if (state.winner === 1) {
        fullLog.push('\n🎉 **파티 승리!**')
      } else {
        fullLog.push('\n💀 **파티 전멸...**')
      }
      break
    }
  }

  return { state, fullLog }
}

// ── Display Helpers ──────────────────────────────────────

export function formatHPBar(current: number, max: number, width = 10): string {
  const pct = Math.max(0, current / max)
  const filled = Math.round(pct * width)
  const empty = width - filled
  const bar = '▰'.repeat(filled) + '▱'.repeat(empty)
  const pctStr = Math.round(pct * 100)
  return `${bar} ${pctStr}%`
}

export function getTeamStatus(state: CombatState, team: 1 | 2): string {
  const members = state.combatants.filter((c) => c.team === team)
  const sp = team === 1 ? state.team1SP : state.team2SP

  const lines = members.map((c) => {
    const hp = c.isAlive
      ? `❤️ ${formatHPBar(c.currentHP, c.stats.maxHP)}`
      : '💀 전사'
    const energy = c.isAlive
      ? `⚡${Math.floor((c.energy / c.maxEnergy) * 100)}%`
      : ''
    const effectIcons = c.effects
      .map((e) => {
        if (e.type === 'burn') return '🔥'
        if (e.type === 'freeze') return '❄️'
        if (e.type === 'shock') return '⚡'
        if (e.type === 'bleed') return '🩸'
        if (e.type === 'atkUp') return '⬆️'
        if (e.type === 'defDown') return '⬇️'
        if (e.type === 'shield') return '🛡️'
        return ''
      })
      .filter(Boolean)
      .join('')
    const shield = c.shieldHP > 0 ? ` 🛡️${c.shieldHP}` : ''
    return `${c.emoji} **${c.name}** ${hp}${shield} ${energy} ${effectIcons}`
  })

  return `SP: ${'🔷'.repeat(sp)}${'⬜'.repeat(5 - sp)}\n${lines.join('\n')}`
}

// ── Party Synergy ────────────────────────────────────────

export interface SynergyBonus {
  name: string
  description: string
  emoji: string
}

export function getPartySynergies(characterIds: string[]): SynergyBonus[] {
  const synergies: SynergyBonus[] = []
  const templates = characterIds
    .map((id) => characterMap.get(id))
    .filter(Boolean) as CharacterTemplate[]

  if (templates.length === 0) return synergies

  // Element resonance
  const elementCounts = new Map<Element, number>()
  for (const t of templates) {
    elementCounts.set(t.element, (elementCounts.get(t.element) ?? 0) + 1)
  }

  for (const [element, count] of elementCounts) {
    if (count >= 2) {
      switch (element) {
        case 'fire':
          synergies.push({
            name: '화염 공명',
            description: '전체 ATK +15%',
            emoji: '🔥',
          })
          break
        case 'ice':
          synergies.push({
            name: '빙결 공명',
            description: '전체 DEF +15%',
            emoji: '❄️',
          })
          break
        case 'lightning':
          synergies.push({
            name: '뇌전 공명',
            description: '전체 SPD +10',
            emoji: '⚡',
          })
          break
        case 'wind':
          synergies.push({
            name: '바람 공명',
            description: '전체 SPD +10',
            emoji: '🌀',
          })
          break
        case 'quantum':
          synergies.push({
            name: '양자 공명',
            description: '전체 치명타 확률 +10%',
            emoji: '🔮',
          })
          break
        case 'imaginary':
          synergies.push({
            name: '허무 공명',
            description: '에너지 충전 +15%',
            emoji: '🌑',
          })
          break
        case 'physical':
          synergies.push({
            name: '물리 공명',
            description: '전체 HP +15%',
            emoji: '⚔️',
          })
          break
      }
    }
  }

  // Path synergy
  const paths = new Set(templates.map((t) => t.path))
  const dpsPaths = ['destruction', 'hunt', 'erudition']
  const dpsCount = templates.filter((t) => dpsPaths.includes(t.path)).length

  if (dpsCount >= 2) {
    synergies.push({
      name: '공격 시너지',
      description: '전체 피해 +10%',
      emoji: '⚔️',
    })
  }
  if (paths.has('preservation') && paths.has('abundance')) {
    synergies.push({
      name: '수호 시너지',
      description: '실드 +25%, 치유 +20%',
      emoji: '💚',
    })
  }
  if (paths.has('harmony')) {
    synergies.push({
      name: '조화 시너지',
      description: '버프 효과 +15%',
      emoji: '🎵',
    })
  }
  if (paths.has('nihility')) {
    synergies.push({
      name: '허무 시너지',
      description: '디버프 적중률 +15%',
      emoji: '☠️',
    })
  }

  // Specific powerful combos
  const ids = new Set(characterIds)
  if (ids.has('baekho') && ids.has('taeyangsin')) {
    synergies.push({
      name: '뜨거운 불길',
      description: '백호+하온: 화염 피해 +25%',
      emoji: '🌟',
    })
  }
  if (ids.has('cheongryong') && ids.has('dalbit')) {
    synergies.push({
      name: '쌍검의 섬광',
      description: '청룡+다인: 단일 대상 피해 +20%',
      emoji: '⚡',
    })
  }
  if (ids.has('hyeonmu') && ids.has('seolhwa')) {
    synergies.push({
      name: '빙설의 요새',
      description: '현무+소담: 팀 생존력 +30%',
      emoji: '🏰',
    })
  }
  if (ids.has('gumiho') && ids.has('narak')) {
    synergies.push({
      name: '어둠의 유혹',
      description: '구미호+나락: 디버프 피해 +20%',
      emoji: '🦊',
    })
  }
  if (ids.has('jujak') && ids.has('yonghuye')) {
    synergies.push({
      name: '쌍익의 폭풍',
      description: '주작+나래: AoE 피해 +20%',
      emoji: '🦅',
    })
  }

  return synergies
}

// Apply synergy bonuses to combatants
export function applySynergies(
  combatants: Combatant[],
  synergies: SynergyBonus[],
) {
  for (const syn of synergies) {
    for (const c of combatants) {
      if (syn.description.includes('ATK +15%')) {
        c.stats.atk = Math.floor(c.stats.atk * 1.15)
      }
      if (syn.description.includes('DEF +15%')) {
        c.stats.def = Math.floor(c.stats.def * 1.15)
      }
      if (syn.description.includes('HP +15%')) {
        c.stats.maxHP = Math.floor(c.stats.maxHP * 1.15)
        c.currentHP = c.stats.maxHP
      }
      if (syn.description.includes('SPD +10')) {
        c.stats.spd += 10
      }
      if (syn.description.includes('치명타 확률 +10%')) {
        c.stats.critRate = Math.min(1, c.stats.critRate + 0.1)
      }
      if (syn.description.includes('에너지 충전 +15%')) {
        // Boost starting energy
        c.energy = Math.floor(c.maxEnergy * 0.15)
      }
    }
  }
}

// ── Recommended Team Compositions ────────────────────────

export interface RecommendedComp {
  name: string
  emoji: string
  characters: string[] // character IDs
  description: string
  role: string
}

export const recommendedComps: RecommendedComp[] = [
  {
    name: '화염 폭풍',
    emoji: '🔥',
    characters: ['baekho', 'jujak', 'taeyangsin', 'seolhwa'],
    description: '하온의 ATK 버프 + 백호&주작의 화염 폭격. 소담으로 생존.',
    role: '공격 특화',
  },
  {
    name: '번개 일섬',
    emoji: '⚡',
    characters: ['cheongryong', 'cheondeung', 'taeyangsin', 'seolhwa'],
    description:
      '청룡의 초고 단일 피해 + 우레의 범위 번개. 하온 버프로 극대화.',
    role: '균형 공격',
  },
  {
    name: '빙결 요새',
    emoji: '❄️',
    characters: ['hyeonmu', 'seolhwa', 'gumiho', 'dalbit'],
    description:
      '현무의 실드 + 소담의 힐로 철벽 수비. 구미호 디버프 후 다인이 마무리.',
    role: '방어 특화',
  },
  {
    name: '디버프 지옥',
    emoji: '☠️',
    characters: ['gumiho', 'narak', 'soran', 'seolhwa'],
    description:
      '구미호+나락으로 적 약화. 소란의 디버프와 DoT로 서서히 녹인다.',
    role: '지속 피해',
  },
  {
    name: '속공 팀',
    emoji: '💨',
    characters: ['cheongryong', 'dalbit', 'hanui', 'taeyangsin'],
    description: '고속 캐릭터 집결. 적보다 먼저 행동하여 선제 처치.',
    role: '속도전',
  },
  {
    name: '올라운더',
    emoji: '🌟',
    characters: ['baekho', 'hyeonmu', 'taeyangsin', 'seolhwa'],
    description: '공격/방어/버프/힐 모든 역할 완비. 안정적인 범용 팀.',
    role: '범용',
  },
]
