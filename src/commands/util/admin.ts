import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js'
import db from '../../db/database.js'
import {
  getOrCreatePlayer,
  getUserFortune,
  setUserFortune,
} from '../../db/helpers.js'

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
            { name: '🎰 슬롯 조작', value: 'slot_rigged' },
          ),
      )
      .addNumberOption((opt) =>
        opt.setName('value').setDescription('설정할 값 (0 = 비활성화)'),
      ),
  )

function isOwner(userId: string): boolean {
  return userId === BOT_OWNER_ID
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
            `🎰 슬롯 조작: **${fortune.slot_rigged ? '활성' : '비활성'}**`,
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
      slot_rigged: '🎰 슬롯 조작',
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
}
