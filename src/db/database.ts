import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Store DB in /app/data (Docker volume) or <project>/data locally
const dataDir = path.join(__dirname, '..', '..', 'data')
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

const dbPath = path.join(dataDir, 'bot.db')
const db = new Database(dbPath)

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL')

// ──────────────────────────────────────
//  SCHEMA
// ──────────────────────────────────────

db.exec(`
  -- Player stats (RPG)
  CREATE TABLE IF NOT EXISTS players (
    user_id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    username TEXT NOT NULL,
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    hp INTEGER DEFAULT 100,
    max_hp INTEGER DEFAULT 100,
    attack INTEGER DEFAULT 10,
    defense INTEGER DEFAULT 5,
    crit_rate REAL DEFAULT 0.1,
    evasion REAL DEFAULT 0.05,
    gold INTEGER DEFAULT 0,
    last_daily TEXT DEFAULT NULL
  );

  -- Inventory
  CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    item_name TEXT NOT NULL,
    item_rarity TEXT NOT NULL DEFAULT 'common',
    item_emoji TEXT DEFAULT '📦',
    attack_bonus INTEGER DEFAULT 0,
    defense_bonus INTEGER DEFAULT 0,
    hp_bonus INTEGER DEFAULT 0,
    crit_bonus REAL DEFAULT 0,
    equipped INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES players(user_id)
  );

  -- Status effects
  CREATE TABLE IF NOT EXISTS status_effects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    effect_type TEXT NOT NULL,
    applied_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL,
    applied_by TEXT,
    FOREIGN KEY (user_id) REFERENCES players(user_id)
  );

  -- Relationships (love/betray)
  CREATE TABLE IF NOT EXISTS relationships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user1_id TEXT NOT NULL,
    user2_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    affinity INTEGER DEFAULT 50,
    trust INTEGER DEFAULT 100,
    is_couple INTEGER DEFAULT 0,
    UNIQUE(user1_id, user2_id, guild_id)
  );

  -- Battle log
  CREATE TABLE IF NOT EXISTS battle_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    attacker_id TEXT NOT NULL,
    defender_id TEXT NOT NULL,
    winner_id TEXT,
    xp_gained INTEGER DEFAULT 0,
    gold_gained INTEGER DEFAULT 0,
    battle_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Titles/badges
  CREATE TABLE IF NOT EXISTS titles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    title TEXT NOT NULL,
    earned_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, guild_id, title)
  );
`)

export default db
