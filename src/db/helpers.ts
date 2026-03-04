import db from './database.js'

// ──────────────────────────────────────
//  Player helpers
// ──────────────────────────────────────

export interface Player {
  user_id: string
  guild_id: string
  username: string
  level: number
  xp: number
  hp: number
  max_hp: number
  attack: number
  defense: number
  crit_rate: number
  evasion: number
  gold: number
  last_daily: string | null
}

export function getOrCreatePlayer(
  userId: string,
  guildId: string,
  username: string,
): Player {
  const existing = db
    .prepare('SELECT * FROM players WHERE user_id = ? AND guild_id = ?')
    .get(userId, guildId) as Player | undefined

  if (existing) return existing

  db.prepare(
    `INSERT INTO players (user_id, guild_id, username) VALUES (?, ?, ?)`,
  ).run(userId, guildId, username)

  return db
    .prepare('SELECT * FROM players WHERE user_id = ? AND guild_id = ?')
    .get(userId, guildId) as Player
}

export function updatePlayer(
  userId: string,
  guildId: string,
  updates: Partial<Omit<Player, 'user_id' | 'guild_id'>>,
) {
  const keys = Object.keys(updates)
  const values = Object.values(updates)
  const setClause = keys.map((k) => `${k} = ?`).join(', ')
  db.prepare(
    `UPDATE players SET ${setClause} WHERE user_id = ? AND guild_id = ?`,
  ).run(...values, userId, guildId)
}

export function healPlayer(userId: string, guildId: string, amount: number) {
  db.prepare(
    `UPDATE players SET hp = MIN(max_hp, hp + ?) WHERE user_id = ? AND guild_id = ?`,
  ).run(amount, userId, guildId)
}

export function damagePlayer(userId: string, guildId: string, amount: number) {
  db.prepare(
    `UPDATE players SET hp = MAX(0, hp - ?) WHERE user_id = ? AND guild_id = ?`,
  ).run(amount, userId, guildId)
}

export function addXp(userId: string, guildId: string, amount: number) {
  const player = getOrCreatePlayer(userId, guildId, '')
  const newXp = player.xp + amount
  const xpNeeded = player.level * 100

  if (newXp >= xpNeeded) {
    // Level up!
    db.prepare(
      `UPDATE players SET xp = ?, level = level + 1, max_hp = max_hp + 10, 
       attack = attack + 2, defense = defense + 1, hp = max_hp + 10 
       WHERE user_id = ? AND guild_id = ?`,
    ).run(newXp - xpNeeded, userId, guildId)
    return true // leveled up
  } else {
    db.prepare(
      `UPDATE players SET xp = ? WHERE user_id = ? AND guild_id = ?`,
    ).run(newXp, userId, guildId)
    return false
  }
}

export function addGold(userId: string, guildId: string, amount: number) {
  db.prepare(
    `UPDATE players SET gold = gold + ? WHERE user_id = ? AND guild_id = ?`,
  ).run(amount, userId, guildId)
}

export function getLeaderboard(guildId: string, limit = 10): Player[] {
  return db
    .prepare(
      'SELECT * FROM players WHERE guild_id = ? ORDER BY level DESC, xp DESC LIMIT ?',
    )
    .all(guildId, limit) as Player[]
}

// ──────────────────────────────────────
//  Status Effects
// ──────────────────────────────────────

export type EffectType =
  | 'stunned'
  | 'poisoned'
  | 'burning'
  | 'frozen'
  | 'cute_overload'
  | 'npc'

export interface StatusEffect {
  id: number
  user_id: string
  guild_id: string
  effect_type: EffectType
  applied_at: string
  expires_at: string
  applied_by: string | null
}

export function applyStatusEffect(
  userId: string,
  guildId: string,
  effectType: EffectType,
  durationSeconds: number,
  appliedBy?: string,
) {
  // Remove any existing same-type effect
  db.prepare(
    `DELETE FROM status_effects WHERE user_id = ? AND guild_id = ? AND effect_type = ?`,
  ).run(userId, guildId, effectType)

  db.prepare(
    `INSERT INTO status_effects (user_id, guild_id, effect_type, expires_at, applied_by)
     VALUES (?, ?, ?, datetime('now', '+' || ? || ' seconds'), ?)`,
  ).run(userId, guildId, effectType, durationSeconds, appliedBy ?? null)
}

export function getActiveEffects(
  userId: string,
  guildId: string,
): StatusEffect[] {
  // Clean expired effects first
  db.prepare(
    `DELETE FROM status_effects WHERE expires_at < datetime('now')`,
  ).run()

  return db
    .prepare(
      `SELECT * FROM status_effects WHERE user_id = ? AND guild_id = ? AND expires_at > datetime('now')`,
    )
    .all(userId, guildId) as StatusEffect[]
}

export function hasEffect(
  userId: string,
  guildId: string,
  effectType: EffectType,
): boolean {
  db.prepare(
    `DELETE FROM status_effects WHERE expires_at < datetime('now')`,
  ).run()

  const row = db
    .prepare(
      `SELECT 1 FROM status_effects WHERE user_id = ? AND guild_id = ? AND effect_type = ? AND expires_at > datetime('now')`,
    )
    .get(userId, guildId, effectType)
  return !!row
}

export function clearEffect(
  userId: string,
  guildId: string,
  effectType: EffectType,
) {
  db.prepare(
    `DELETE FROM status_effects WHERE user_id = ? AND guild_id = ? AND effect_type = ?`,
  ).run(userId, guildId, effectType)
}

// ──────────────────────────────────────
//  Relationships
// ──────────────────────────────────────

export interface Relationship {
  id: number
  user1_id: string
  user2_id: string
  guild_id: string
  affinity: number
  trust: number
  is_couple: number
}

function relationshipKey(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a]
}

export function getOrCreateRelationship(
  userId1: string,
  userId2: string,
  guildId: string,
): Relationship {
  const [u1, u2] = relationshipKey(userId1, userId2)

  const existing = db
    .prepare(
      'SELECT * FROM relationships WHERE user1_id = ? AND user2_id = ? AND guild_id = ?',
    )
    .get(u1, u2, guildId) as Relationship | undefined

  if (existing) return existing

  db.prepare(
    `INSERT INTO relationships (user1_id, user2_id, guild_id) VALUES (?, ?, ?)`,
  ).run(u1, u2, guildId)

  return db
    .prepare(
      'SELECT * FROM relationships WHERE user1_id = ? AND user2_id = ? AND guild_id = ?',
    )
    .get(u1, u2, guildId) as Relationship
}

export function updateRelationship(
  userId1: string,
  userId2: string,
  guildId: string,
  updates: Partial<Pick<Relationship, 'affinity' | 'trust' | 'is_couple'>>,
) {
  const [u1, u2] = relationshipKey(userId1, userId2)
  const keys = Object.keys(updates)
  const values = Object.values(updates)
  const setClause = keys.map((k) => `${k} = ?`).join(', ')
  db.prepare(
    `UPDATE relationships SET ${setClause} WHERE user1_id = ? AND user2_id = ? AND guild_id = ?`,
  ).run(...values, u1, u2, guildId)
}

export function getTopRelationships(
  guildId: string,
  limit = 10,
): Relationship[] {
  return db
    .prepare(
      'SELECT * FROM relationships WHERE guild_id = ? ORDER BY affinity DESC LIMIT ?',
    )
    .all(guildId, limit) as Relationship[]
}

export function getMostHated(guildId: string, limit = 10): Relationship[] {
  return db
    .prepare(
      'SELECT * FROM relationships WHERE guild_id = ? ORDER BY trust ASC LIMIT ?',
    )
    .all(guildId, limit) as Relationship[]
}

// ──────────────────────────────────────
//  Inventory
// ──────────────────────────────────────

export interface InventoryItem {
  id: number
  user_id: string
  item_name: string
  item_rarity: string
  item_emoji: string
  attack_bonus: number
  defense_bonus: number
  hp_bonus: number
  crit_bonus: number
  equipped: number
}

export function addItem(
  userId: string,
  item: Omit<InventoryItem, 'id' | 'user_id' | 'equipped'>,
) {
  db.prepare(
    `INSERT INTO inventory (user_id, item_name, item_rarity, item_emoji, attack_bonus, defense_bonus, hp_bonus, crit_bonus)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    userId,
    item.item_name,
    item.item_rarity,
    item.item_emoji,
    item.attack_bonus,
    item.defense_bonus,
    item.hp_bonus,
    item.crit_bonus,
  )
}

export function getInventory(userId: string): InventoryItem[] {
  return db
    .prepare('SELECT * FROM inventory WHERE user_id = ?')
    .all(userId) as InventoryItem[]
}

export function equipItem(userId: string, itemId: number) {
  // Unequip all first
  db.prepare('UPDATE inventory SET equipped = 0 WHERE user_id = ?').run(userId)
  db.prepare(
    'UPDATE inventory SET equipped = 1 WHERE id = ? AND user_id = ?',
  ).run(itemId, userId)
}

export function getEquippedItem(userId: string): InventoryItem | undefined {
  return db
    .prepare('SELECT * FROM inventory WHERE user_id = ? AND equipped = 1')
    .get(userId) as InventoryItem | undefined
}

// ──────────────────────────────────────
//  Titles
// ──────────────────────────────────────

export function addTitle(userId: string, guildId: string, title: string) {
  db.prepare(
    `INSERT OR IGNORE INTO titles (user_id, guild_id, title) VALUES (?, ?, ?)`,
  ).run(userId, guildId, title)
}

export function getTitles(userId: string, guildId: string): string[] {
  const rows = db
    .prepare('SELECT title FROM titles WHERE user_id = ? AND guild_id = ?')
    .all(userId, guildId) as { title: string }[]
  return rows.map((r) => r.title)
}

// ──────────────────────────────────────
//  Battle Log
// ──────────────────────────────────────

export function logBattle(
  guildId: string,
  attackerId: string,
  defenderId: string,
  winnerId: string | null,
  xpGained: number,
  goldGained: number,
) {
  db.prepare(
    `INSERT INTO battle_log (guild_id, attacker_id, defender_id, winner_id, xp_gained, gold_gained)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(guildId, attackerId, defenderId, winnerId, xpGained, goldGained)
}

// ──────────────────────────────────────
//  Utility
// ──────────────────────────────────────

export function random(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function chance(percent: number): boolean {
  return Math.random() * 100 < percent
}

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ──────────────────────────────────────
//  Effective Stats (auto-equip all items)
// ──────────────────────────────────────

export interface EffectiveStats {
  attack: number
  defense: number
  max_hp: number
  crit_rate: number
  crit_damage: number // multiplier, base 2.0 (200%)
  evasion: number
  items: InventoryItem[]
  totalAttackBonus: number
  totalDefenseBonus: number
  totalHpBonus: number
  totalCritBonus: number
}

export function getEffectiveStats(
  userId: string,
  guildId: string,
): EffectiveStats {
  const player = getOrCreatePlayer(userId, guildId, '')
  const items = getInventory(userId)

  const totalAttackBonus = items.reduce((s, i) => s + i.attack_bonus, 0)
  const totalDefenseBonus = items.reduce((s, i) => s + i.defense_bonus, 0)
  const totalHpBonus = items.reduce((s, i) => s + i.hp_bonus, 0)
  const totalCritBonus = items.reduce((s, i) => s + i.crit_bonus, 0)

  const rawCritRate = player.crit_rate + totalCritBonus
  // Cap crit_rate at 1.0 (100%), overflow goes to crit_damage
  const effectiveCritRate = Math.min(1, rawCritRate)
  const overflowCrit = Math.max(0, rawCritRate - 1)
  // Base crit damage is 2x (200%), each 1% overflow adds 1% crit damage
  const critDamage = 2 + overflowCrit

  return {
    attack: player.attack + totalAttackBonus,
    defense: player.defense + totalDefenseBonus,
    max_hp: player.max_hp + totalHpBonus,
    crit_rate: effectiveCritRate,
    crit_damage: critDamage,
    evasion: player.evasion,
    items,
    totalAttackBonus,
    totalDefenseBonus,
    totalHpBonus,
    totalCritBonus,
  }
}

// ──────────────────────────────────────
//  Fish Collection
// ──────────────────────────────────────

export interface CaughtFish {
  id: number
  user_id: string
  guild_id: string
  fish_name: string
  fish_rarity: string
  fish_emoji: string
  fish_size: number
  fish_value: number
  caught_at: string
}

export function addFish(
  userId: string,
  guildId: string,
  fish: {
    fish_name: string
    fish_rarity: string
    fish_emoji: string
    fish_size: number
    fish_value: number
  },
) {
  db.prepare(
    `INSERT INTO fish_collection (user_id, guild_id, fish_name, fish_rarity, fish_emoji, fish_size, fish_value)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    userId,
    guildId,
    fish.fish_name,
    fish.fish_rarity,
    fish.fish_emoji,
    fish.fish_size,
    fish.fish_value,
  )
}

export function getFishCollection(
  userId: string,
  guildId: string,
): CaughtFish[] {
  return db
    .prepare(
      'SELECT * FROM fish_collection WHERE user_id = ? AND guild_id = ? ORDER BY fish_value DESC',
    )
    .all(userId, guildId) as CaughtFish[]
}

export function getUniqueFishCount(userId: string, guildId: string): number {
  const row = db
    .prepare(
      'SELECT COUNT(DISTINCT fish_name) as cnt FROM fish_collection WHERE user_id = ? AND guild_id = ?',
    )
    .get(userId, guildId) as { cnt: number }
  return row.cnt
}

export function getBiggestFish(
  userId: string,
  guildId: string,
): CaughtFish | undefined {
  return db
    .prepare(
      'SELECT * FROM fish_collection WHERE user_id = ? AND guild_id = ? ORDER BY fish_size DESC LIMIT 1',
    )
    .get(userId, guildId) as CaughtFish | undefined
}

export function getTotalFishValue(userId: string, guildId: string): number {
  const row = db
    .prepare(
      'SELECT COALESCE(SUM(fish_value), 0) as total FROM fish_collection WHERE user_id = ? AND guild_id = ?',
    )
    .get(userId, guildId) as { total: number }
  return row.total
}

// ──────────────────────────────────────
//  Islands
// ──────────────────────────────────────

export interface Island {
  user_id: string
  guild_id: string
  island_name: string
  island_level: number
  island_xp: number
  last_collect: string | null
}

export interface IslandBuilding {
  id: number
  user_id: string
  guild_id: string
  building_type: string
  building_level: number
  built_at: string
}

export function getOrCreateIsland(userId: string, guildId: string): Island {
  const existing = db
    .prepare('SELECT * FROM islands WHERE user_id = ? AND guild_id = ?')
    .get(userId, guildId) as Island | undefined

  if (existing) return existing

  db.prepare(`INSERT INTO islands (user_id, guild_id) VALUES (?, ?)`).run(
    userId,
    guildId,
  )

  return db
    .prepare('SELECT * FROM islands WHERE user_id = ? AND guild_id = ?')
    .get(userId, guildId) as Island
}

export function updateIsland(
  userId: string,
  guildId: string,
  updates: Partial<Omit<Island, 'user_id' | 'guild_id'>>,
) {
  const keys = Object.keys(updates)
  const values = Object.values(updates)
  const setClause = keys.map((k) => `${k} = ?`).join(', ')
  db.prepare(
    `UPDATE islands SET ${setClause} WHERE user_id = ? AND guild_id = ?`,
  ).run(...values, userId, guildId)
}

export function addIslandXp(
  userId: string,
  guildId: string,
  amount: number,
): boolean {
  const island = getOrCreateIsland(userId, guildId)
  if (island.island_level >= 5) return false // max level

  const newXp = island.island_xp + amount
  const xpNeeded = island.island_level * 500

  if (newXp >= xpNeeded) {
    db.prepare(
      `UPDATE islands SET island_xp = ?, island_level = MIN(5, island_level + 1) WHERE user_id = ? AND guild_id = ?`,
    ).run(newXp - xpNeeded, userId, guildId)
    return true
  }
  db.prepare(
    `UPDATE islands SET island_xp = ? WHERE user_id = ? AND guild_id = ?`,
  ).run(newXp, userId, guildId)
  return false
}

export function getIslandBuildings(
  userId: string,
  guildId: string,
): IslandBuilding[] {
  return db
    .prepare(
      'SELECT * FROM island_buildings WHERE user_id = ? AND guild_id = ?',
    )
    .all(userId, guildId) as IslandBuilding[]
}

export function getIslandBuilding(
  userId: string,
  guildId: string,
  buildingType: string,
): IslandBuilding | undefined {
  return db
    .prepare(
      'SELECT * FROM island_buildings WHERE user_id = ? AND guild_id = ? AND building_type = ?',
    )
    .get(userId, guildId, buildingType) as IslandBuilding | undefined
}

export function buildOrUpgrade(
  userId: string,
  guildId: string,
  buildingType: string,
): IslandBuilding {
  const existing = getIslandBuilding(userId, guildId, buildingType)
  if (existing) {
    db.prepare(
      `UPDATE island_buildings SET building_level = building_level + 1 WHERE user_id = ? AND guild_id = ? AND building_type = ?`,
    ).run(userId, guildId, buildingType)
  } else {
    db.prepare(
      `INSERT INTO island_buildings (user_id, guild_id, building_type) VALUES (?, ?, ?)`,
    ).run(userId, guildId, buildingType)
  }
  return getIslandBuilding(userId, guildId, buildingType)!
}

// Get gold ranking
export function getGoldRanking(guildId: string, limit = 10): Player[] {
  return db
    .prepare(
      'SELECT * FROM players WHERE guild_id = ? ORDER BY gold DESC LIMIT ?',
    )
    .all(guildId, limit) as Player[]
}

// Get island ranking (by island level then xp)
export function getIslandRanking(
  guildId: string,
  limit = 10,
): (Island & { username: string })[] {
  return db
    .prepare(
      `SELECT i.*, p.username FROM islands i 
       JOIN players p ON i.user_id = p.user_id AND i.guild_id = p.guild_id
       WHERE i.guild_id = ? ORDER BY i.island_level DESC, i.island_xp DESC LIMIT ?`,
    )
    .all(guildId, limit) as (Island & { username: string })[]
}

// Get unique item names a user has collected
export function getCollectedItemNames(userId: string): string[] {
  const rows = db
    .prepare('SELECT DISTINCT item_name FROM inventory WHERE user_id = ?')
    .all(userId) as { item_name: string }[]
  return rows.map((r) => r.item_name)
}

// Get unique fish names a user has collected
export function getCollectedFishNames(
  userId: string,
  guildId: string,
): string[] {
  const rows = db
    .prepare(
      'SELECT DISTINCT fish_name FROM fish_collection WHERE user_id = ? AND guild_id = ?',
    )
    .all(userId, guildId) as { fish_name: string }[]
  return rows.map((r) => r.fish_name)
}

// ──────────────────────────────────────
//  Pollution System
// ──────────────────────────────────────

export interface PollutionData {
  user_id: string
  guild_id: string
  pollution_level: number
  trash_dumped: number
  trash_disposed: number
}

export function getOrCreatePollution(
  userId: string,
  guildId: string,
): PollutionData {
  const existing = db
    .prepare(
      'SELECT * FROM island_pollution WHERE user_id = ? AND guild_id = ?',
    )
    .get(userId, guildId) as PollutionData | undefined

  if (existing) return existing

  db.prepare(
    `INSERT INTO island_pollution (user_id, guild_id) VALUES (?, ?)`,
  ).run(userId, guildId)

  return db
    .prepare(
      'SELECT * FROM island_pollution WHERE user_id = ? AND guild_id = ?',
    )
    .get(userId, guildId) as PollutionData
}

export function addPollution(userId: string, guildId: string, amount: number) {
  getOrCreatePollution(userId, guildId)
  db.prepare(
    `UPDATE island_pollution SET pollution_level = MIN(10, MAX(0, pollution_level + ?)), trash_dumped = trash_dumped + 1 WHERE user_id = ? AND guild_id = ?`,
  ).run(amount, userId, guildId)
}

export function reducePollution(
  userId: string,
  guildId: string,
  amount: number,
) {
  getOrCreatePollution(userId, guildId)
  db.prepare(
    `UPDATE island_pollution SET pollution_level = MAX(0, pollution_level - ?), trash_disposed = trash_disposed + 1 WHERE user_id = ? AND guild_id = ?`,
  ).run(amount, userId, guildId)
}

// Water treatment building passively reduces pollution
export function applyWaterTreatment(
  userId: string,
  guildId: string,
  treatmentLevel: number,
) {
  const reductionPerLevel = 0.5 // each level reduces 0.5 pollution
  const reduction = treatmentLevel * reductionPerLevel
  getOrCreatePollution(userId, guildId)
  db.prepare(
    `UPDATE island_pollution SET pollution_level = MAX(0, pollution_level - ?) WHERE user_id = ? AND guild_id = ?`,
  ).run(reduction, userId, guildId)
}

// ──────────────────────────────────────
//  Trash Inventory
// ──────────────────────────────────────

export interface TrashItem {
  id: number
  user_id: string
  guild_id: string
  trash_name: string
  trash_emoji: string
  disposal_cost: number
  pollution_amount: number
  picked_up_at: string
}

export function addTrash(
  userId: string,
  guildId: string,
  trash: {
    trash_name: string
    trash_emoji: string
    disposal_cost: number
    pollution_amount: number
  },
) {
  db.prepare(
    `INSERT INTO trash_inventory (user_id, guild_id, trash_name, trash_emoji, disposal_cost, pollution_amount)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(
    userId,
    guildId,
    trash.trash_name,
    trash.trash_emoji,
    trash.disposal_cost,
    trash.pollution_amount,
  )
}

export function getTrashInventory(
  userId: string,
  guildId: string,
): TrashItem[] {
  return db
    .prepare('SELECT * FROM trash_inventory WHERE user_id = ? AND guild_id = ?')
    .all(userId, guildId) as TrashItem[]
}

export function removeTrash(trashId: number) {
  db.prepare('DELETE FROM trash_inventory WHERE id = ?').run(trashId)
}

export function removeAllTrashByUser(userId: string, guildId: string) {
  db.prepare(
    'DELETE FROM trash_inventory WHERE user_id = ? AND guild_id = ?',
  ).run(userId, guildId)
}

// ──────────────────────────────────────
//  HP System helpers
// ──────────────────────────────────────

export function isPlayerDead(userId: string, guildId: string): boolean {
  const player = getOrCreatePlayer(userId, guildId, '')
  return player.hp <= 0
}

export function getHealCost(player: Player): number {
  // Cost scales with level: base 30G + 10G per level
  return 30 + player.level * 10
}
