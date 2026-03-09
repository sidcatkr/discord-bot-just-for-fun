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
    `INSERT INTO players (user_id, guild_id, username) VALUES (?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET guild_id = excluded.guild_id, username = excluded.username`,
  ).run(userId, guildId, username)

  return db
    .prepare('SELECT * FROM players WHERE user_id = ?')
    .get(userId) as Player
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
  if (island.island_level >= 10) return false // max level

  const newXp = island.island_xp + amount
  const xpNeeded = island.island_level * 500

  if (newXp >= xpNeeded) {
    db.prepare(
      `UPDATE islands SET island_xp = ?, island_level = MIN(10, island_level + 1) WHERE user_id = ? AND guild_id = ?`,
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

// Passive pollution increase (e.g. from fishing, factories) — does NOT increment trash_dumped
export function increasePassivePollution(
  userId: string,
  guildId: string,
  amount: number,
) {
  getOrCreatePollution(userId, guildId)
  db.prepare(
    `UPDATE island_pollution SET pollution_level = MIN(10, MAX(0, pollution_level + ?)) WHERE user_id = ? AND guild_id = ?`,
  ).run(amount, userId, guildId)
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

// ──────────────────────────────────────
//  Pet System
// ──────────────────────────────────────

export interface Pet {
  id: number
  user_id: string
  guild_id: string
  pet_name: string
  pet_emoji: string
  pet_rarity: string
  pet_type: string
  attack_bonus: number
  defense_bonus: number
  hp_bonus: number
  luck_bonus: number
  gold_bonus: number
  xp_bonus: number
  equipped: number
  obtained_at: string
}

export function addPet(
  userId: string,
  guildId: string,
  pet: Omit<Pet, 'id' | 'user_id' | 'guild_id' | 'equipped' | 'obtained_at'>,
) {
  db.prepare(
    `INSERT INTO pets (user_id, guild_id, pet_name, pet_emoji, pet_rarity, pet_type, attack_bonus, defense_bonus, hp_bonus, luck_bonus, gold_bonus, xp_bonus) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    userId,
    guildId,
    pet.pet_name,
    pet.pet_emoji,
    pet.pet_rarity,
    pet.pet_type,
    pet.attack_bonus,
    pet.defense_bonus,
    pet.hp_bonus,
    pet.luck_bonus,
    pet.gold_bonus,
    pet.xp_bonus,
  )
}

export function getPets(userId: string, guildId: string): Pet[] {
  return db
    .prepare('SELECT * FROM pets WHERE user_id = ? AND guild_id = ?')
    .all(userId, guildId) as Pet[]
}

export function getEquippedPet(
  userId: string,
  guildId: string,
): Pet | undefined {
  return db
    .prepare(
      'SELECT * FROM pets WHERE user_id = ? AND guild_id = ? AND equipped = 1',
    )
    .get(userId, guildId) as Pet | undefined
}

export function equipPet(userId: string, guildId: string, petId: number) {
  db.prepare(
    'UPDATE pets SET equipped = 0 WHERE user_id = ? AND guild_id = ?',
  ).run(userId, guildId)
  db.prepare(
    'UPDATE pets SET equipped = 1 WHERE id = ? AND user_id = ? AND guild_id = ?',
  ).run(petId, userId, guildId)
}

export function unequipAllPets(userId: string, guildId: string) {
  db.prepare(
    'UPDATE pets SET equipped = 0 WHERE user_id = ? AND guild_id = ?',
  ).run(userId, guildId)
}

export function getPetCount(userId: string, guildId: string): number {
  const row = db
    .prepare(
      'SELECT COUNT(*) as cnt FROM pets WHERE user_id = ? AND guild_id = ?',
    )
    .get(userId, guildId) as { cnt: number }
  return row.cnt
}

// ──────────────────────────────────────
//  Fortune (per-user hidden bonus)
// ──────────────────────────────────────

export interface UserFortune {
  user_id: string
  fish_bonus: number
  gacha_bonus: number
  gamble_bonus: number
  pet_bonus: number
  mine_bonus: number
  kick_bonus: number
  slot_rigged: number
  character_gacha_bonus: number
  weapon_gacha_bonus: number
  updated_at: string
}

export function getUserFortune(userId: string): UserFortune {
  const row = db
    .prepare('SELECT * FROM user_fortune WHERE user_id = ?')
    .get(userId) as UserFortune | undefined
  return (
    row ?? {
      user_id: userId,
      fish_bonus: 0,
      gacha_bonus: 0,
      gamble_bonus: 0,
      pet_bonus: 0,
      mine_bonus: 0,
      kick_bonus: 0,
      slot_rigged: 0,
      character_gacha_bonus: 0,
      weapon_gacha_bonus: 0,
      updated_at: '',
    }
  )
}

export function setUserFortune(
  userId: string,
  updates: Partial<Omit<UserFortune, 'user_id' | 'updated_at'>>,
) {
  const current = getUserFortune(userId)
  const merged = { ...current, ...updates }
  db.prepare(
    `INSERT INTO user_fortune (user_id, fish_bonus, gacha_bonus, gamble_bonus, pet_bonus, mine_bonus, kick_bonus, slot_rigged, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(user_id) DO UPDATE SET
       fish_bonus = excluded.fish_bonus,
       gacha_bonus = excluded.gacha_bonus,
       gamble_bonus = excluded.gamble_bonus,
       pet_bonus = excluded.pet_bonus,
       mine_bonus = excluded.mine_bonus,
       kick_bonus = excluded.kick_bonus,
       slot_rigged = excluded.slot_rigged,
       updated_at = excluded.updated_at`,
  ).run(
    userId,
    merged.fish_bonus,
    merged.gacha_bonus,
    merged.gamble_bonus,
    merged.pet_bonus,
    merged.mine_bonus,
    merged.kick_bonus,
    merged.slot_rigged,
  )
}

// ──────────────────────────────────────
//  Fun kick on massive damage
// ──────────────────────────────────────

import type { Guild } from 'discord.js'

const kickReasons = [
  '너무 세게 맞아서 서버 밖으로 날아갔습니다!',
  '크리티컬의 충격으로 서버 공간이 찢어졌습니다!',
  '데미지가 너무 강해서 차원이 붕괴했습니다!',
  '영혼이 서버를 떠났습니다... (강제)',
  '이 서버에서의 모험이 강제 종료되었습니다!',
  '게임 오버. 리스폰 지점: 서버 초대 링크',
]

const kickFieldMessages = [
  (t: string) =>
    `${t}은(는) 너무 세게 맞아서 **서버에서 추방**되었습니다!!! 🚪💨`,
  (t: string) => `${t}의 영혼이 서버를 떠났습니다... **추방 완료!** 👻`,
  (t: string) =>
    `${t}이(가) 크리티컬의 충격으로 **서버 밖으로 날아갔습니다!** 🌟`,
  (t: string) =>
    `${t}: 게임 오버! **서버에서 퇴장!** 다시 들어오려면 초대 링크를... 💀`,
]

const nearMissMessages = [
  (t: string) =>
    `${t}은(는) 서버에서 추방될 뻔했다...! (아슬아슬하게 살아남음)`,
  (t: string) => `${t}의 영혼이 서버를 떠나려다 돌아왔습니다... (위험했다!)`,
  (t: string) => `${t}이(가) 추방의 문턱에서 간신히 살아남았다...!`,
]

/**
 * Attempt a fun kick when massive damage is dealt.
 * Returns 'kicked' | 'near-miss' | null
 */
export async function tryFunKick(
  guild: Guild | null,
  targetId: string,
  kickChance: number, // base percentage (0–100)
): Promise<{ result: 'kicked' | 'near-miss' | null; message: string }> {
  const fortune = getUserFortune(targetId)
  const totalChance = kickChance + (fortune.kick_bonus ?? 0)
  if (!chance(totalChance)) return { result: null, message: '' }

  if (!guild) {
    return {
      result: 'near-miss',
      message: pick(nearMissMessages)('대상'),
    }
  }

  try {
    const member = await guild.members.fetch(targetId)
    if (!member.kickable) {
      return {
        result: 'near-miss',
        message: pick(nearMissMessages)(member.toString()),
      }
    }

    await member.kick(pick(kickReasons))
    addTitle(targetId, guild.id, '🚪 서버 추방 경험자')
    return {
      result: 'kicked',
      message: pick(kickFieldMessages)(member.toString()),
    }
  } catch {
    return {
      result: 'near-miss',
      message: pick(nearMissMessages)(`<@${targetId}>`),
    }
  }
}

// ──────────────────────────────────────
//  Gacha Pity (픽뚫)
// ──────────────────────────────────────

export function getGachaPity(userId: string, guildId: string): number {
  const row = db
    .prepare(
      'SELECT pity_count FROM gacha_pity WHERE user_id = ? AND guild_id = ?',
    )
    .get(userId, guildId) as { pity_count: number } | undefined
  return row?.pity_count ?? 0
}

export function incrementGachaPity(userId: string, guildId: string): number {
  db.prepare(
    `INSERT INTO gacha_pity (user_id, guild_id, pity_count) VALUES (?, ?, 1)
     ON CONFLICT(user_id, guild_id) DO UPDATE SET pity_count = pity_count + 1`,
  ).run(userId, guildId)
  return getGachaPity(userId, guildId)
}

export function resetGachaPity(userId: string, guildId: string): void {
  db.prepare(
    `INSERT INTO gacha_pity (user_id, guild_id, pity_count) VALUES (?, ?, 0)
     ON CONFLICT(user_id, guild_id) DO UPDATE SET pity_count = 0`,
  ).run(userId, guildId)
}

// ══════════════════════════════════════════════════════════
//  Season 2 — Character System Helpers
// ══════════════════════════════════════════════════════════

export interface OwnedCharacter {
  id: number
  user_id: string
  character_id: string
  level: number
  awakening: number
  experience: number
}

export function getOwnedCharacters(userId: string): OwnedCharacter[] {
  return db
    .prepare('SELECT * FROM owned_characters WHERE user_id = ?')
    .all(userId) as OwnedCharacter[]
}

export function getOwnedCharacter(
  userId: string,
  characterId: string,
): OwnedCharacter | undefined {
  return db
    .prepare(
      'SELECT * FROM owned_characters WHERE user_id = ? AND character_id = ?',
    )
    .get(userId, characterId) as OwnedCharacter | undefined
}

export function addCharacter(
  userId: string,
  characterId: string,
): { isNew: boolean; awakening: number } {
  const existing = getOwnedCharacter(userId, characterId)
  if (existing) {
    const newAwakening = Math.min(existing.awakening + 1, 6)
    db.prepare(
      'UPDATE owned_characters SET awakening = ? WHERE user_id = ? AND character_id = ?',
    ).run(newAwakening, userId, characterId)
    return { isNew: false, awakening: newAwakening }
  }
  db.prepare(
    'INSERT INTO owned_characters (user_id, character_id) VALUES (?, ?)',
  ).run(userId, characterId)
  return { isNew: true, awakening: 0 }
}

export function addCharacterXp(
  userId: string,
  characterId: string,
  amount: number,
): { leveled: boolean; newLevel: number } {
  const char = getOwnedCharacter(userId, characterId)
  if (!char) return { leveled: false, newLevel: 0 }

  const xpNeeded = char.level * 150
  const newXp = char.experience + amount
  if (newXp >= xpNeeded && char.level < 80) {
    const newLevel = char.level + 1
    db.prepare(
      'UPDATE owned_characters SET level = ?, experience = ? WHERE user_id = ? AND character_id = ?',
    ).run(newLevel, newXp - xpNeeded, userId, characterId)
    return { leveled: true, newLevel }
  }
  db.prepare(
    'UPDATE owned_characters SET experience = ? WHERE user_id = ? AND character_id = ?',
  ).run(newXp, userId, characterId)
  return { leveled: false, newLevel: char.level }
}

// ══════════════════════════════════════════════════════════
//  Season 2 — Weapon System Helpers
// ══════════════════════════════════════════════════════════

export interface OwnedWeapon {
  id: number
  user_id: string
  weapon_id: string
  level: number
  refinement: number
  equipped_by: string | null
}

export function getOwnedWeapons(userId: string): OwnedWeapon[] {
  return db
    .prepare('SELECT * FROM owned_weapons WHERE user_id = ?')
    .all(userId) as OwnedWeapon[]
}

export function getOwnedWeapon(
  userId: string,
  weaponId: string,
): OwnedWeapon | undefined {
  return db
    .prepare('SELECT * FROM owned_weapons WHERE user_id = ? AND weapon_id = ?')
    .get(userId, weaponId) as OwnedWeapon | undefined
}

export function addWeapon(
  userId: string,
  weaponId: string,
): { isNew: boolean; refinement: number } {
  const existing = getOwnedWeapon(userId, weaponId)
  if (existing) {
    const newRef = Math.min(existing.refinement + 1, 5)
    db.prepare(
      'UPDATE owned_weapons SET refinement = ? WHERE user_id = ? AND weapon_id = ?',
    ).run(newRef, userId, weaponId)
    return { isNew: false, refinement: newRef }
  }
  db.prepare(
    'INSERT INTO owned_weapons (user_id, weapon_id) VALUES (?, ?)',
  ).run(userId, weaponId)
  return { isNew: true, refinement: 1 }
}

export function equipWeaponToCharacter(
  userId: string,
  weaponId: string,
  characterId: string | null,
): void {
  // Unequip from any character currently using this weapon
  db.prepare(
    'UPDATE owned_weapons SET equipped_by = NULL WHERE user_id = ? AND weapon_id = ?',
  ).run(userId, weaponId)
  if (characterId) {
    // Unequip any weapon currently on target character
    db.prepare(
      'UPDATE owned_weapons SET equipped_by = NULL WHERE user_id = ? AND equipped_by = ?',
    ).run(userId, characterId)
    db.prepare(
      'UPDATE owned_weapons SET equipped_by = ? WHERE user_id = ? AND weapon_id = ?',
    ).run(characterId, userId, weaponId)
  }
}

export function getWeaponEquippedBy(
  userId: string,
  characterId: string,
): OwnedWeapon | undefined {
  return db
    .prepare(
      'SELECT * FROM owned_weapons WHERE user_id = ? AND equipped_by = ?',
    )
    .get(userId, characterId) as OwnedWeapon | undefined
}

// ══════════════════════════════════════════════════════════
//  Season 2 — Relic System Helpers
// ══════════════════════════════════════════════════════════

export interface OwnedRelic {
  id: number
  user_id: string
  set_id: string
  slot: string
  main_stat_type: string
  main_stat_value: number
  sub_stats: string // JSON string
  quality: string
  equipped_by: string | null
  obtained_at: string
}

export function getOwnedRelics(userId: string): OwnedRelic[] {
  return db
    .prepare('SELECT * FROM owned_relics WHERE user_id = ?')
    .all(userId) as OwnedRelic[]
}

export function getRelicsForCharacter(
  userId: string,
  characterId: string,
): OwnedRelic[] {
  return db
    .prepare('SELECT * FROM owned_relics WHERE user_id = ? AND equipped_by = ?')
    .all(userId, characterId) as OwnedRelic[]
}

export function addRelic(
  userId: string,
  setId: string,
  slot: string,
  mainStatType: string,
  mainStatValue: number,
  subStats: object[],
  quality: string,
): number {
  const result = db
    .prepare(
      'INSERT INTO owned_relics (user_id, set_id, slot, main_stat_type, main_stat_value, sub_stats, quality) VALUES (?, ?, ?, ?, ?, ?, ?)',
    )
    .run(
      userId,
      setId,
      slot,
      mainStatType,
      mainStatValue,
      JSON.stringify(subStats),
      quality,
    )
  return Number(result.lastInsertRowid)
}

export function equipRelic(
  userId: string,
  relicId: number,
  characterId: string | null,
): void {
  if (characterId) {
    // Unequip any relic in the same slot on this character
    const relic = db
      .prepare('SELECT slot FROM owned_relics WHERE id = ? AND user_id = ?')
      .get(relicId, userId) as { slot: string } | undefined
    if (relic) {
      db.prepare(
        'UPDATE owned_relics SET equipped_by = NULL WHERE user_id = ? AND equipped_by = ? AND slot = ?',
      ).run(userId, characterId, relic.slot)
    }
  }
  db.prepare(
    'UPDATE owned_relics SET equipped_by = ? WHERE id = ? AND user_id = ?',
  ).run(characterId, relicId, userId)
}

export function deleteRelic(userId: string, relicId: number): boolean {
  const result = db
    .prepare(
      'DELETE FROM owned_relics WHERE id = ? AND user_id = ? AND equipped_by IS NULL',
    )
    .run(relicId, userId)
  return result.changes > 0
}

// ══════════════════════════════════════════════════════════
//  Season 2 — Party System Helpers
// ══════════════════════════════════════════════════════════

export function getParty(userId: string): string[] {
  const rows = db
    .prepare(
      'SELECT character_id FROM parties WHERE user_id = ? ORDER BY slot ASC',
    )
    .all(userId) as { character_id: string }[]
  return rows.map((r) => r.character_id)
}

export function setPartySlot(
  userId: string,
  slot: number,
  characterId: string,
): void {
  db.prepare(
    'INSERT INTO parties (user_id, slot, character_id) VALUES (?, ?, ?) ON CONFLICT(user_id, slot) DO UPDATE SET character_id = ?',
  ).run(userId, slot, characterId, characterId)
}

export function removePartySlot(userId: string, slot: number): void {
  db.prepare('DELETE FROM parties WHERE user_id = ? AND slot = ?').run(
    userId,
    slot,
  )
}

export function clearParty(userId: string): void {
  db.prepare('DELETE FROM parties WHERE user_id = ?').run(userId)
}

// ══════════════════════════════════════════════════════════
//  Season 2 — Gacha Currency Helpers
// ══════════════════════════════════════════════════════════

export interface GachaCurrency {
  stellarite: number
  standard_pass: number
  fate_pass: number
}

export function getGachaCurrency(userId: string): GachaCurrency {
  const row = db
    .prepare('SELECT * FROM gacha_currency WHERE user_id = ?')
    .get(userId) as GachaCurrency | undefined
  if (row) return row
  db.prepare('INSERT INTO gacha_currency (user_id) VALUES (?)').run(userId)
  return { stellarite: 0, standard_pass: 0, fate_pass: 0 }
}

export function addStellarite(userId: string, amount: number): void {
  db.prepare(
    'INSERT INTO gacha_currency (user_id, stellarite) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET stellarite = stellarite + ?',
  ).run(userId, amount, amount)
}

export function addStandardPass(userId: string, amount: number): void {
  db.prepare(
    'INSERT INTO gacha_currency (user_id, standard_pass) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET standard_pass = standard_pass + ?',
  ).run(userId, amount, amount)
}

export function addFatePass(userId: string, amount: number): void {
  db.prepare(
    'INSERT INTO gacha_currency (user_id, fate_pass) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET fate_pass = fate_pass + ?',
  ).run(userId, amount, amount)
}

export function spendCurrency(
  userId: string,
  field: 'stellarite' | 'standard_pass' | 'fate_pass',
  amount: number,
): boolean {
  const cur = getGachaCurrency(userId)
  if (cur[field] < amount) return false
  db.prepare(
    `UPDATE gacha_currency SET ${field} = ${field} - ? WHERE user_id = ?`,
  ).run(amount, userId)
  return true
}

// ══════════════════════════════════════════════════════════
//  Season 2 — Banner Pity Helpers (per banner)
// ══════════════════════════════════════════════════════════

export interface BannerPity {
  pity_count: number
  guaranteed: boolean // 50/50 lost → next is guaranteed featured
}

export function getBannerPity(userId: string, bannerType: string): BannerPity {
  const row = db
    .prepare(
      'SELECT pity_count, guaranteed FROM banner_pity WHERE user_id = ? AND banner_type = ?',
    )
    .get(userId, bannerType) as
    | { pity_count: number; guaranteed: number }
    | undefined
  return {
    pity_count: row?.pity_count ?? 0,
    guaranteed: (row?.guaranteed ?? 0) === 1,
  }
}

export function incrementBannerPity(
  userId: string,
  bannerType: string,
): number {
  db.prepare(
    `INSERT INTO banner_pity (user_id, banner_type, pity_count) VALUES (?, ?, 1)
     ON CONFLICT(user_id, banner_type) DO UPDATE SET pity_count = pity_count + 1`,
  ).run(userId, bannerType)
  return getBannerPity(userId, bannerType).pity_count
}

export function resetBannerPity(userId: string, bannerType: string): void {
  db.prepare(
    `INSERT INTO banner_pity (user_id, banner_type, pity_count, guaranteed) VALUES (?, ?, 0, 0)
     ON CONFLICT(user_id, banner_type) DO UPDATE SET pity_count = 0`,
  ).run(userId, bannerType)
}

export function setGuaranteed(
  userId: string,
  bannerType: string,
  val: boolean,
): void {
  db.prepare(
    `INSERT INTO banner_pity (user_id, banner_type, guaranteed) VALUES (?, ?, ?)
     ON CONFLICT(user_id, banner_type) DO UPDATE SET guaranteed = ?`,
  ).run(userId, bannerType, val ? 1 : 0, val ? 1 : 0)
}

// ══════════════════════════════════════════════════════════
//  Season 2 — Active Banner Helpers
// ══════════════════════════════════════════════════════════

export interface ActiveBanner {
  banner_type: string
  featured_id: string
  featured_4star_ids: string[]
}

export function getActiveBanner(bannerType: string): ActiveBanner | undefined {
  const row = db
    .prepare('SELECT * FROM active_banners WHERE banner_type = ?')
    .get(bannerType) as
    | { banner_type: string; featured_id: string; featured_4star_ids: string }
    | undefined
  if (!row) return undefined
  return {
    banner_type: row.banner_type,
    featured_id: row.featured_id,
    featured_4star_ids: JSON.parse(row.featured_4star_ids),
  }
}

export function setActiveBanner(
  bannerType: string,
  featuredId: string,
  featured4StarIds: string[] = [],
): void {
  db.prepare(
    `INSERT INTO active_banners (banner_type, featured_id, featured_4star_ids)
     VALUES (?, ?, ?) ON CONFLICT(banner_type) DO UPDATE SET featured_id = ?, featured_4star_ids = ?, started_at = datetime('now')`,
  ).run(
    bannerType,
    featuredId,
    JSON.stringify(featured4StarIds),
    featuredId,
    JSON.stringify(featured4StarIds),
  )
}

// ══════════════════════════════════════════════════════════
//  Season 2 — Stamina Helpers
// ══════════════════════════════════════════════════════════

const MAX_STAMINA = 180
const STAMINA_REGEN_MINUTES = 6

export function getStamina(userId: string): number {
  const row = db
    .prepare(
      'SELECT current_stamina, last_update FROM stamina WHERE user_id = ?',
    )
    .get(userId) as { current_stamina: number; last_update: string } | undefined
  if (!row) {
    db.prepare('INSERT INTO stamina (user_id) VALUES (?)').run(userId)
    return MAX_STAMINA
  }
  const elapsed =
    (Date.now() - new Date(row.last_update + 'Z').getTime()) / 60000
  const regen = Math.floor(elapsed / STAMINA_REGEN_MINUTES)
  const updated = Math.min(MAX_STAMINA, row.current_stamina + regen)
  if (regen > 0) {
    db.prepare(
      "UPDATE stamina SET current_stamina = ?, last_update = datetime('now') WHERE user_id = ?",
    ).run(updated, userId)
  }
  return updated
}

export function spendStamina(userId: string, amount: number): boolean {
  const current = getStamina(userId)
  if (current < amount) return false
  db.prepare(
    "UPDATE stamina SET current_stamina = current_stamina - ?, last_update = datetime('now') WHERE user_id = ?",
  ).run(amount, userId)
  return true
}

// ══════════════════════════════════════════════════════════
//  Season 2 — Materials Helpers
// ══════════════════════════════════════════════════════════

export interface Materials {
  char_xp_material: number
  weapon_xp_material: number
}

export function getMaterials(userId: string): Materials {
  const row = db
    .prepare('SELECT * FROM materials WHERE user_id = ?')
    .get(userId) as Materials | undefined
  if (row) return row
  db.prepare('INSERT INTO materials (user_id) VALUES (?)').run(userId)
  return { char_xp_material: 0, weapon_xp_material: 0 }
}

export function addMaterial(
  userId: string,
  type: 'char_xp_material' | 'weapon_xp_material',
  amount: number,
): void {
  db.prepare(
    `INSERT INTO materials (user_id, ${type}) VALUES (?, ?)
     ON CONFLICT(user_id) DO UPDATE SET ${type} = ${type} + ?`,
  ).run(userId, amount, amount)
}

export function spendMaterial(
  userId: string,
  type: 'char_xp_material' | 'weapon_xp_material',
  amount: number,
): boolean {
  const mats = getMaterials(userId)
  if (mats[type] < amount) return false
  db.prepare(
    `UPDATE materials SET ${type} = ${type} - ? WHERE user_id = ?`,
  ).run(amount, userId)
  return true
}
