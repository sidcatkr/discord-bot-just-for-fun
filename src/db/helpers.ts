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
