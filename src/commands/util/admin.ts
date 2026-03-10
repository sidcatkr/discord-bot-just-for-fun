import {
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js'
import db from '../../db/database.js'
import {
  getOrCreatePlayer,
  getUserFortune,
  setUserFortune,
  setActiveBanner,
  getActiveBanner,
  addStellarite,
  addStandardPass,
  addFatePass,
  getGachaCurrency,
  addCharacter,
  addCharacterXp,
  setPartySlot,
  addWeapon,
  equipWeaponToCharacter,
  clearParty,
  addMaterial,
} from '../../db/helpers.js'
import { characterMap, allCharacters } from '../../data/characters.js'
import { weaponMap, allWeapons } from '../../data/weapons.js'

const BOT_OWNER_ID = process.env.BOT_OWNER_ID ?? ''

export const data = new SlashCommandBuilder()
  .setName('admin')
  .setDescription('🔧 관리자 전용 데이터베이스 관리 명령어')
  .addSubcommand((sub) =>
    sub
      .setName('gold')
      .setDescription('유저의 골드를 조정합니다')
      .addUserOption((opt) =>
        opt.setName('user').setDescription('대상 유저').setRequired(true),
      )
      .addStringOption((opt) =>
        opt
          .setName('action')
          .setDescription('수행할 작업')
          .setRequired(true)
          .addChoices(
            { name: '설정 (set)', value: 'set' },
            { name: '추가 (add)', value: 'add' },
            { name: '차감 (subtract)', value: 'subtract' },
          ),
      )
      .addIntegerOption((opt) =>
        opt.setName('amount').setDescription('골드 양').setRequired(true),
      )
      .addStringOption((opt) =>
        opt.setName('reason').setDescription('사유 (로그용)'),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName('lookup')
      .setDescription('유저의 현재 스탯을 조회합니다')
      .addUserOption((opt) =>
        opt.setName('user').setDescription('대상 유저').setRequired(true),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName('setstat')
      .setDescription('유저의 스탯을 직접 수정합니다')
      .addUserOption((opt) =>
        opt.setName('user').setDescription('대상 유저').setRequired(true),
      )
      .addStringOption((opt) =>
        opt
          .setName('stat')
          .setDescription('수정할 스탯')
          .setRequired(true)
          .addChoices(
            { name: 'HP', value: 'hp' },
            { name: '최대 HP', value: 'max_hp' },
            { name: '공격력', value: 'attack' },
            { name: '방어력', value: 'defense' },
            { name: '레벨', value: 'level' },
            { name: 'XP', value: 'xp' },
          ),
      )
      .addIntegerOption((opt) =>
        opt.setName('value').setDescription('설정할 값').setRequired(true),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName('query')
      .setDescription('SQL SELECT 쿼리를 실행합니다 (읽기 전용)')
      .addStringOption((opt) =>
        opt.setName('sql').setDescription('SELECT 쿼리').setRequired(true),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName('exec')
      .setDescription('SQL 쿼리를 직접 실행합니다 (INSERT/UPDATE/DELETE)')
      .addStringOption((opt) =>
        opt.setName('sql').setDescription('실행할 SQL 쿼리').setRequired(true),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName('sqlhelp')
      .setDescription('데이터베이스 스키마 및 SQL 도움말을 표시합니다'),
  )
  .addSubcommand((sub) =>
    sub
      .setName('fortune')
      .setDescription('유저의 가중치(히든 보너스)를 조회/수정합니다')
      .addUserOption((opt) =>
        opt.setName('user').setDescription('대상 유저').setRequired(true),
      )
      .addStringOption((opt) =>
        opt
          .setName('type')
          .setDescription('보너스 종류 (비워두면 조회만)')
          .addChoices(
            { name: '🐟 낚시 보너스', value: 'fish_bonus' },
            { name: '🎰 가챠 보너스', value: 'gacha_bonus' },
            { name: '🎲 도박 보너스', value: 'gamble_bonus' },
            { name: '🐾 펫 보너스', value: 'pet_bonus' },
            { name: '⛏️ 채굴 보너스', value: 'mine_bonus' },
            { name: '🚪 추방 확률 보너스', value: 'kick_bonus' },
            { name: '🎰 슬롯 조작', value: 'slot_rigged' },
            { name: '🎭 캐릭터 가챠 보너스', value: 'character_gacha_bonus' },
            { name: '⚔️ 무기 가챠 보너스', value: 'weapon_gacha_bonus' },
          ),
      )
      .addNumberOption((opt) =>
        opt.setName('value').setDescription('설정할 값 (0 = 비활성화)'),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName('banner')
      .setDescription('픽업 배너를 설정합니다')
      .addStringOption((opt) =>
        opt
          .setName('type')
          .setDescription('배너 종류')
          .setRequired(true)
          .addChoices(
            { name: '🔥 캐릭터 픽업', value: 'character' },
            { name: '⚔️ 무기 픽업', value: 'weapon' },
          ),
      )
      .addStringOption((opt) =>
        opt
          .setName('featured_id')
          .setDescription('픽업 대상 ID')
          .setRequired(true)
          .setAutocomplete(true),
      )
      .addStringOption((opt) =>
        opt
          .setName('featured_4stars')
          .setDescription('픽업 4성 ID들 (쉼표 구분)')
          .setAutocomplete(true),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName('currency')
      .setDescription('유저의 가챠 재화를 지급합니다')
      .addUserOption((opt) =>
        opt.setName('user').setDescription('대상 유저').setRequired(true),
      )
      .addStringOption((opt) =>
        opt
          .setName('type')
          .setDescription('재화 종류')
          .setRequired(true)
          .addChoices(
            { name: '💎 성광석', value: 'stellarite' },
            { name: '🎫 별빛의 인연', value: 'standard_pass' },
            { name: '🌟 운명의 인연', value: 'fate_pass' },
          ),
      )
      .addIntegerOption((opt) =>
        opt.setName('amount').setDescription('수량').setRequired(true),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName('testsetup')
      .setDescription('테스트용 가상 유저 생성 (캐릭터+무기+파티+레벨+골드)')
      .addStringOption((opt) =>
        opt
          .setName('name')
          .setDescription('가상 유저 이름 (기본: TestUser)')
          .setMaxLength(32),
      )
      .addIntegerOption((opt) =>
        opt
          .setName('level')
          .setDescription('캐릭터 레벨 (기본: 60)')
          .setMinValue(1)
          .setMaxValue(80),
      ),
  )

function isOwner(userId: string): boolean {
  return userId === BOT_OWNER_ID
}

export async function autocomplete(interaction: AutocompleteInteraction) {
  if (!isOwner(interaction.user.id)) return

  const focused = interaction.options.getFocused(true)
  const bannerType = interaction.options.getString('type')

  if (focused.name === 'featured_id') {
    const query = focused.value.toLowerCase()
    const choices: { name: string; value: string }[] = []

    if (bannerType === 'character' || !bannerType) {
      for (const c of allCharacters.filter((c) => c.rarity === 5)) {
        const label = `⭐5 ${c.emoji} ${c.name} (캐릭터)`
        choices.push({ name: label.slice(0, 100), value: c.id })
      }
    }
    if (bannerType === 'weapon' || !bannerType) {
      for (const w of allWeapons.filter((w) => w.rarity === 5)) {
        const label = `⭐5 ${w.emoji} ${w.name} (무기)`
        choices.push({ name: label.slice(0, 100), value: w.id })
      }
    }

    const filtered = choices
      .filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.value.toLowerCase().includes(query),
      )
      .slice(0, 25)
    await interaction.respond(filtered)
  } else if (focused.name === 'featured_4stars') {
    const query = focused.value.toLowerCase()
    // Get the last ID being typed (after last comma)
    const parts = focused.value.split(',')
    const current = parts[parts.length - 1].trim().toLowerCase()
    const prefix = parts.length > 1 ? parts.slice(0, -1).join(',') + ',' : ''

    const choices: { name: string; value: string }[] = []

    if (bannerType === 'character' || !bannerType) {
      for (const c of allCharacters.filter((c) => c.rarity === 4)) {
        const label = `⭐4 ${c.emoji} ${c.name}`
        choices.push({ name: label.slice(0, 100), value: prefix + c.id })
      }
    }
    if (bannerType === 'weapon' || !bannerType) {
      for (const w of allWeapons.filter((w) => w.rarity === 4)) {
        const label = `⭐4 ${w.emoji} ${w.name}`
        choices.push({ name: label.slice(0, 100), value: prefix + w.id })
      }
    }

    const filtered = choices
      .filter(
        (c) =>
          c.name.toLowerCase().includes(current) ||
          c.value.toLowerCase().includes(current),
      )
      .slice(0, 25)
    await interaction.respond(filtered)
  }
}

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!isOwner(interaction.user.id)) {
    await interaction.reply({
      content: '❌ 이 명령어는 봇 소유자만 사용할 수 있습니다.',
      ephemeral: true,
    })
    return
  }

  const sub = interaction.options.getSubcommand()
  const guildId = interaction.guildId!

  // ── gold ──
  if (sub === 'gold') {
    const target = interaction.options.getUser('user', true)
    const action = interaction.options.getString('action', true)
    const amount = interaction.options.getInteger('amount', true)
    const reason = interaction.options.getString('reason') ?? '사유 없음'

    const player = getOrCreatePlayer(target.id, guildId, target.username)
    let newGold: number

    switch (action) {
      case 'set':
        newGold = Math.max(0, amount)
        db.prepare(
          'UPDATE players SET gold = ? WHERE user_id = ? AND guild_id = ?',
        ).run(newGold, target.id, guildId)
        break
      case 'add':
        newGold = player.gold + amount
        db.prepare(
          'UPDATE players SET gold = gold + ? WHERE user_id = ? AND guild_id = ?',
        ).run(amount, target.id, guildId)
        break
      case 'subtract':
        newGold = Math.max(0, player.gold - amount)
        db.prepare(
          'UPDATE players SET gold = MAX(0, gold - ?) WHERE user_id = ? AND guild_id = ?',
        ).run(amount, target.id, guildId)
        break
      default:
        newGold = player.gold
    }

    const actionLabel =
      action === 'set' ? '설정' : action === 'add' ? '추가' : '차감'

    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle('🔧 골드 조정 완료')
      .setDescription(
        `**대상:** ${target}\n` +
          `**작업:** ${actionLabel}\n` +
          `**변경 전:** ${player.gold.toLocaleString()}G\n` +
          `**변경 후:** ${newGold.toLocaleString()}G\n` +
          `**사유:** ${reason}`,
      )
      .setTimestamp()

    await interaction.reply({ embeds: [embed], ephemeral: true })
    return
  }

  // ── lookup ──
  if (sub === 'lookup') {
    const target = interaction.options.getUser('user', true)
    const player = db
      .prepare('SELECT * FROM players WHERE user_id = ? AND guild_id = ?')
      .get(target.id, guildId) as Record<string, any> | undefined

    if (!player) {
      await interaction.reply({
        content: `❌ ${target}의 데이터가 없습니다.`,
        ephemeral: true,
      })
      return
    }

    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle(`🔍 ${target.username} 스탯 조회`)
      .addFields(
        {
          name: '기본 정보',
          value:
            `레벨: **${player.level}** (XP: ${player.xp})\n` +
            `HP: **${player.hp}/${player.max_hp}**\n` +
            `골드: **${Number(player.gold).toLocaleString()}G**`,
          inline: true,
        },
        {
          name: '전투 스탯',
          value:
            `공격력: **${player.attack}**\n` +
            `방어력: **${player.defense}**\n` +
            `치명타: **${(Number(player.crit_rate) * 100).toFixed(1)}%**\n` +
            `회피율: **${(Number(player.evasion) * 100).toFixed(1)}%**`,
          inline: true,
        },
      )
      .setTimestamp()

    // Fish count
    const fishCount = db
      .prepare(
        'SELECT COUNT(*) as cnt FROM fish_collection WHERE user_id = ? AND guild_id = ?',
      )
      .get(target.id, guildId) as { cnt: number }
    const fishTotal = db
      .prepare(
        'SELECT COALESCE(SUM(fish_value), 0) as total FROM fish_collection WHERE user_id = ? AND guild_id = ?',
      )
      .get(target.id, guildId) as { total: number }

    embed.addFields({
      name: '낚시 기록',
      value: `잡은 물고기: **${fishCount.cnt}**마리\n총 물고기 가치: **${Number(fishTotal.total).toLocaleString()}G**`,
    })

    await interaction.reply({ embeds: [embed], ephemeral: true })
    return
  }

  // ── setstat ──
  if (sub === 'setstat') {
    const target = interaction.options.getUser('user', true)
    const stat = interaction.options.getString('stat', true)
    const value = interaction.options.getInteger('value', true)

    const player = getOrCreatePlayer(target.id, guildId, target.username)

    const allowedStats = ['hp', 'max_hp', 'attack', 'defense', 'level', 'xp']
    if (!allowedStats.includes(stat)) {
      await interaction.reply({
        content: '❌ 유효하지 않은 스탯입니다.',
        ephemeral: true,
      })
      return
    }

    const oldValue = (player as any)[stat]
    db.prepare(
      `UPDATE players SET ${stat} = ? WHERE user_id = ? AND guild_id = ?`,
    ).run(value, target.id, guildId)

    const embed = new EmbedBuilder()
      .setColor(0xe67e22)
      .setTitle('🔧 스탯 수정 완료')
      .setDescription(
        `**대상:** ${target}\n` +
          `**스탯:** ${stat}\n` +
          `**변경 전:** ${oldValue}\n` +
          `**변경 후:** ${value}`,
      )
      .setTimestamp()

    await interaction.reply({ embeds: [embed], ephemeral: true })
    return
  }

  // ── query (read-only SQL) ──
  if (sub === 'query') {
    const sql = interaction.options.getString('sql', true).trim()

    // Only allow SELECT statements
    if (!sql.toUpperCase().startsWith('SELECT')) {
      await interaction.reply({
        content: '❌ SELECT 쿼리만 허용됩니다.',
        ephemeral: true,
      })
      return
    }

    // Block dangerous keywords
    const dangerous =
      /\b(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|ATTACH|DETACH|PRAGMA)\b/i
    if (dangerous.test(sql)) {
      await interaction.reply({
        content: '❌ 위험한 키워드가 포함되어 있습니다.',
        ephemeral: true,
      })
      return
    }

    try {
      const rows = db.prepare(sql).all()
      const result = JSON.stringify(rows, null, 2)
      const truncated =
        result.length > 1800
          ? result.slice(0, 1800) + '\n... (결과 잘림)'
          : result

      const embed = new EmbedBuilder()
        .setColor(0x9b59b6)
        .setTitle('📊 쿼리 결과')
        .setDescription(`\`\`\`json\n${truncated}\n\`\`\``)
        .setFooter({ text: `${rows.length}개 행 반환` })
        .setTimestamp()

      await interaction.reply({ embeds: [embed], ephemeral: true })
    } catch (err: any) {
      await interaction.reply({
        content: `❌ 쿼리 오류: ${err.message}`,
        ephemeral: true,
      })
    }
    return
  }

  // ── exec (direct SQL write) ──
  if (sub === 'exec') {
    const sql = interaction.options.getString('sql', true).trim()

    // Block truly destructive DDL
    const blocked = /\b(DROP\s+TABLE|ALTER\s+TABLE|ATTACH|DETACH)\b/i
    if (blocked.test(sql)) {
      await interaction.reply({
        content: '❌ DROP TABLE, ALTER TABLE, ATTACH, DETACH는 차단됩니다.',
        ephemeral: true,
      })
      return
    }

    try {
      const result = db.prepare(sql).run()
      const embed = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle('⚡ SQL 실행 완료')
        .setDescription(
          `\`\`\`sql\n${sql.length > 500 ? sql.slice(0, 500) + '...' : sql}\n\`\`\``,
        )
        .addFields(
          {
            name: '변경된 행',
            value: `${result.changes}`,
            inline: true,
          },
          {
            name: 'Last Insert ID',
            value: `${result.lastInsertRowid}`,
            inline: true,
          },
        )
        .setTimestamp()

      await interaction.reply({ embeds: [embed], ephemeral: true })
    } catch (err: any) {
      await interaction.reply({
        content: `❌ SQL 오류: ${err.message}`,
        ephemeral: true,
      })
    }
    return
  }

  // ── sqlhelp ──
  if (sub === 'sqlhelp') {
    const schemaHelp = `## 📋 데이터베이스 스키마

**players** — 플레이어 기본 정보
\`user_id\` TEXT PK, \`guild_id\` TEXT, \`username\` TEXT, \`level\` INT, \`xp\` INT, \`hp\` INT, \`max_hp\` INT, \`attack\` INT, \`defense\` INT, \`crit_rate\` REAL, \`evasion\` REAL, \`gold\` INT, \`last_daily\` TEXT

**inventory** — 아이템 인벤토리
\`id\` INT PK, \`user_id\` TEXT, \`item_name\` TEXT, \`item_rarity\` TEXT, \`item_emoji\` TEXT, \`attack_bonus\` INT, \`defense_bonus\` INT, \`hp_bonus\` INT, \`crit_bonus\` REAL, \`equipped\` INT

**fish_collection** — 낚시 도감
\`id\` INT PK, \`user_id\` TEXT, \`guild_id\` TEXT, \`fish_name\` TEXT, \`fish_rarity\` TEXT, \`fish_emoji\` TEXT, \`fish_size\` REAL, \`fish_value\` INT, \`caught_at\` TEXT

**pets** — 펫
\`id\` INT PK, \`user_id\` TEXT, \`guild_id\` TEXT, \`pet_name\` TEXT, \`pet_emoji\` TEXT, \`pet_rarity\` TEXT, \`pet_type\` TEXT, \`attack_bonus\` INT, \`defense_bonus\` INT, \`hp_bonus\` INT, \`luck_bonus\` REAL, \`gold_bonus\` REAL, \`xp_bonus\` REAL, \`equipped\` INT

**user_fortune** — 히든 보너스
\`user_id\` TEXT PK, \`fish_bonus\` REAL, \`gacha_bonus\` REAL, \`gamble_bonus\` REAL, \`pet_bonus\` REAL, \`mine_bonus\` REAL, \`slot_rigged\` INT, \`updated_at\` TEXT

**기타:** relationships, status_effects, battle_log, titles, islands, island_buildings, island_pollution, trash_inventory`

    const queryHelp = `## 🔍 유용한 쿼리 예시

**유저 조회:**
\`SELECT * FROM players WHERE user_id = '...' \`
\`SELECT * FROM players ORDER BY gold DESC LIMIT 10\`

**아이템 조회:**
\`SELECT * FROM inventory WHERE user_id = '...' ORDER BY item_rarity\`

**물고기 통계:**
\`SELECT fish_rarity, COUNT(*) as cnt, SUM(fish_value) as total FROM fish_collection GROUP BY fish_rarity\`

**직접 수정 (exec 사용):**
\`UPDATE players SET gold = 1000 WHERE user_id = '...'\`
\`DELETE FROM inventory WHERE id = 123\`
\`INSERT INTO titles (user_id, guild_id, title) VALUES ('...', '...', '칭호')\``

    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle('📖 SQL 도움말')
      .setDescription(schemaHelp)

    const embed2 = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle('📖 쿼리 예시')
      .setDescription(queryHelp)
      .setFooter({
        text: 'query = SELECT 전용 | exec = INSERT/UPDATE/DELETE',
      })

    await interaction.reply({
      embeds: [embed, embed2],
      ephemeral: true,
    })
    return
  }

  // ── fortune (per-user hidden bonus) ──
  if (sub === 'fortune') {
    const target = interaction.options.getUser('user', true)
    const type = interaction.options.getString('type')
    const value = interaction.options.getNumber('value')

    const fortune = getUserFortune(target.id)

    // View only — no type specified
    if (!type) {
      const embed = new EmbedBuilder()
        .setColor(0xff69b4)
        .setTitle(`🎲 ${target.username} 가중치 현황`)
        .setDescription(
          `🐟 낚시 보너스: **${fortune.fish_bonus}**\n` +
            `🎰 가챠 보너스: **${fortune.gacha_bonus}**\n` +
            `🎲 도박 보너스: **${fortune.gamble_bonus > 0 ? '활성' : '비활성'}**\n` +
            `🐾 펫 보너스: **${fortune.pet_bonus}**\n` +
            `⛏️ 채굴 보너스: **${fortune.mine_bonus}**\n` +
            `🚪 추방 확률 보너스: **${fortune.kick_bonus}%**\n` +
            `🎰 슬롯 조작: **${fortune.slot_rigged ? '활성' : '비활성'}**\n` +
            `🎭 캐릭터 가챠 보너스: **${(fortune as any).character_gacha_bonus ?? 0}**\n` +
            `⚔️ 무기 가챠 보너스: **${(fortune as any).weapon_gacha_bonus ?? 0}**`,
        )
        .setFooter({
          text: fortune.updated_at
            ? `마지막 수정: ${fortune.updated_at}`
            : '설정된 적 없음',
        })
        .setTimestamp()

      await interaction.reply({ embeds: [embed], ephemeral: true })
      return
    }

    if (value === null || value === undefined) {
      await interaction.reply({
        content: '❌ 값(value)을 입력해주세요.',
        ephemeral: true,
      })
      return
    }

    const typeLabels: Record<string, string> = {
      fish_bonus: '🐟 낚시 보너스',
      gacha_bonus: '🎰 가챠 보너스',
      gamble_bonus: '🎲 도박 보너스',
      pet_bonus: '🐾 펫 보너스',
      mine_bonus: '⛏️ 채굴 보너스',
      kick_bonus: '🚪 추방 확률 보너스',
      slot_rigged: '🎰 슬롯 조작',
      character_gacha_bonus: '🎭 캐릭터 가챠 보너스',
      weapon_gacha_bonus: '⚔️ 무기 가챠 보너스',
    }

    const oldValue = (fortune as any)[type] ?? 0
    setUserFortune(target.id, {
      [type]: type === 'slot_rigged' ? (value ? 1 : 0) : value,
    })

    const embed = new EmbedBuilder()
      .setColor(0xff69b4)
      .setTitle('🎲 가중치 수정 완료')
      .setDescription(
        `**대상:** ${target}\n` +
          `**항목:** ${typeLabels[type] ?? type}\n` +
          `**변경 전:** ${type === 'slot_rigged' ? (oldValue ? '활성' : '비활성') : oldValue}\n` +
          `**변경 후:** ${type === 'slot_rigged' ? (value ? '활성' : '비활성') : value}`,
      )
      .setTimestamp()

    await interaction.reply({ embeds: [embed], ephemeral: true })
    return
  }

  // ── banner (set featured pickup) ──
  if (sub === 'banner') {
    const type = interaction.options.getString('type', true)
    const featuredId = interaction.options.getString('featured_id', true)
    const featured4StarsStr =
      interaction.options.getString('featured_4stars') ?? ''
    const featured4Stars = featured4StarsStr
      ? featured4StarsStr
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : []

    // Validate featured ID
    if (type === 'character') {
      if (!characterMap.has(featuredId)) {
        await interaction.reply({
          content: `❌ 캐릭터 ID '${featuredId}'를 찾을 수 없습니다.`,
          ephemeral: true,
        })
        return
      }
    } else {
      if (!weaponMap.has(featuredId)) {
        await interaction.reply({
          content: `❌ 무기 ID '${featuredId}'를 찾을 수 없습니다.`,
          ephemeral: true,
        })
        return
      }
    }

    setActiveBanner(type, featuredId, featured4Stars)

    const name =
      type === 'character'
        ? (characterMap.get(featuredId)?.name ?? featuredId)
        : (weaponMap.get(featuredId)?.name ?? featuredId)

    const embed = new EmbedBuilder()
      .setColor(0xff4500)
      .setTitle('🔧 배너 설정 완료')
      .setDescription(
        `**배너:** ${type === 'character' ? '🔥 캐릭터 픽업' : '⚔️ 무기 픽업'}\n` +
          `**픽업 대상:** ${name}\n` +
          (featured4Stars.length > 0
            ? `**4성 픽업:** ${featured4Stars.join(', ')}`
            : ''),
      )
      .setTimestamp()

    await interaction.reply({ embeds: [embed], ephemeral: true })
    return
  }

  // ── currency (give gacha currency) ──
  if (sub === 'currency') {
    const target = interaction.options.getUser('user', true)
    const type = interaction.options.getString('type', true) as
      | 'stellarite'
      | 'standard_pass'
      | 'fate_pass'
    const amount = interaction.options.getInteger('amount', true)

    if (type === 'stellarite') addStellarite(target.id, amount)
    else if (type === 'standard_pass') addStandardPass(target.id, amount)
    else addFatePass(target.id, amount)

    const labels: Record<string, string> = {
      stellarite: '💎 성광석',
      standard_pass: '🎫 별빛의 인연',
      fate_pass: '🌟 운명의 인연',
    }
    const cur = getGachaCurrency(target.id)

    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle('🔧 재화 지급 완료')
      .setDescription(
        `**대상:** ${target}\n` +
          `**항목:** ${labels[type]}\n` +
          `**지급량:** +${amount}\n` +
          `**현재 잔고:** 💎 성광석 ${cur.stellarite} | 🎫 별빛의 인연 ${cur.standard_pass} | 🌟 운명의 인연 ${cur.fate_pass}`,
      )
      .setTimestamp()

    await interaction.reply({ embeds: [embed], ephemeral: true })
    return
  }

  // ── testsetup (create virtual test user with party) ──
  if (sub === 'testsetup') {
    const testName = interaction.options.getString('name') ?? 'TestUser'
    const targetLevel = interaction.options.getInteger('level') ?? 60
    const guildId = interaction.guildId ?? ''

    // Generate a fake user ID (prefix with 'test_' to distinguish)
    const fakeId = `test_${Date.now()}`

    // Create virtual player profile
    getOrCreatePlayer(fakeId, guildId, testName)

    // Test party: 4 characters covering different roles
    const testCharacters = [
      { charId: 'baekho', weaponId: 'w5_baekho_fang' }, // 5★ destruction
      { charId: 'cheongryong', weaponId: 'w5_cheongryong_horn' }, // 5★ hunt
      { charId: 'seolhwa', weaponId: 'w5_seolhwa_branch' }, // 5★ abundance
      { charId: 'gumiho', weaponId: 'w5_gumiho_orb' }, // 5★ nihility
    ]

    // XP needed: sum of (level * 150) for levels 1..(targetLevel-1)
    const totalXp =
      targetLevel > 1 ? (150 * ((targetLevel - 1) * targetLevel)) / 2 : 0

    clearParty(fakeId)

    const results: string[] = []
    for (let i = 0; i < testCharacters.length; i++) {
      const { charId, weaponId } = testCharacters[i]

      addCharacter(fakeId, charId)
      if (totalXp > 0) addCharacterXp(fakeId, charId, totalXp)
      addWeapon(fakeId, weaponId)
      equipWeaponToCharacter(fakeId, weaponId, charId)
      setPartySlot(fakeId, i + 1, charId)

      const cData = characterMap.get(charId)
      const wData = weaponMap.get(weaponId)
      results.push(
        `${i + 1}. ${cData?.emoji ?? ''} ${cData?.name ?? charId} Lv.${targetLevel} + ${wData?.emoji ?? ''} ${wData?.name ?? weaponId}`,
      )
    }

    // Give gold and materials
    const goldStmt = db.prepare(
      'UPDATE players SET gold = gold + ? WHERE user_id = ?',
    )
    goldStmt.run(100000, fakeId)
    addMaterial(fakeId, 'char_xp_material', 500)
    addMaterial(fakeId, 'weapon_xp_material', 500)

    const embed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle('🔧 테스트 유저 생성 완료')
      .setDescription(
        `**유저명:** ${testName}\n` +
          `**ID:** \`${fakeId}\`\n` +
          `**레벨:** ${targetLevel}\n\n` +
          `**파티 구성:**\n${results.join('\n')}\n\n` +
          `**지급:** 💰 100,000G · 📖 경험서 500 · ⚒️ 무기경험석 500`,
      )
      .setTimestamp()

    await interaction.reply({ embeds: [embed], ephemeral: true })
    return
  }
}
