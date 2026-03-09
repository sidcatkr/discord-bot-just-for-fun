import {
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js'
import {
  getOrCreatePlayer,
  isPlayerDead,
  addGold,
  addRelic,
  getOwnedRelics,
  getRelicsForCharacter,
  equipRelic,
  deleteRelic,
  getRelicById,
  levelUpRelic,
  getRelicLevelCost,
  formatStatValue,
  random,
  chance,
  pick,
  sleep,
  RELIC_MAX_LEVEL,
  RELIC_STAT_NAMES,
  type RelicSubStat,
  type RelicStatType,
  type OwnedRelic,
} from '../../db/helpers.js'
import {
  RELIC_SETS,
  relicSetMap,
  RELIC_SLOT_NAMES,
  RELIC_SLOT_EMOJI,
  SLOT_MAIN_STATS,
  QUALITY_NAMES,
  QUALITY_STARTING_SUBSTATS,
  QUALITY_COLORS,
  type RelicSlot,
  type RelicStatKey,
} from '../../data/relic-data.js'
import { getOwnedCharacters } from '../../db/helpers.js'
import { characterMap } from '../../data/characters.js'

export const data = new SlashCommandBuilder()
  .setName('relic')
  .setDescription('🔮 유물 관리 (스타레일 스타일)')
  .addSubcommand((sub) =>
    sub.setName('list').setDescription('보유 유물 목록 확인'),
  )
  .addSubcommand((sub) =>
    sub
      .setName('levelup')
      .setDescription('유물 강화 (골드 소모)')
      .addIntegerOption((opt) =>
        opt
          .setName('id')
          .setDescription('유물 ID')
          .setRequired(true)
          .setAutocomplete(true),
      )
      .addIntegerOption((opt) =>
        opt
          .setName('count')
          .setDescription('강화 횟수 (기본 1)')
          .setMinValue(1)
          .setMaxValue(15),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName('equip')
      .setDescription('유물을 캐릭터에 장착')
      .addIntegerOption((opt) =>
        opt
          .setName('id')
          .setDescription('유물 ID')
          .setRequired(true)
          .setAutocomplete(true),
      )
      .addStringOption((opt) =>
        opt
          .setName('character')
          .setDescription('캐릭터 ID')
          .setRequired(true)
          .setAutocomplete(true),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName('unequip')
      .setDescription('유물 장착 해제')
      .addIntegerOption((opt) =>
        opt
          .setName('id')
          .setDescription('유물 ID')
          .setRequired(true)
          .setAutocomplete(true),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName('discard')
      .setDescription('유물 분해 (골드 획득)')
      .addIntegerOption((opt) =>
        opt
          .setName('id')
          .setDescription('유물 ID')
          .setRequired(true)
          .setAutocomplete(true),
      ),
  )
  .addSubcommand((sub) =>
    sub.setName('farm').setDescription('유물 던전 (유물 파밍)'),
  )
  .addSubcommand((sub) =>
    sub
      .setName('detail')
      .setDescription('유물 상세 정보')
      .addIntegerOption((opt) =>
        opt
          .setName('id')
          .setDescription('유물 ID')
          .setRequired(true)
          .setAutocomplete(true),
      ),
  )

export async function autocomplete(interaction: AutocompleteInteraction) {
  const userId = interaction.user.id
  const focused = interaction.options.getFocused(true)

  if (focused.name === 'id') {
    const relics = getOwnedRelics(userId)
    const query = focused.value.toLowerCase()
    const choices = relics
      .map((r) => {
        const setInfo = relicSetMap.get(r.set_id)
        const slotName = RELIC_SLOT_NAMES[r.slot as RelicSlot] ?? r.slot
        const equipped = r.equipped_by
          ? ` [${characterMap.get(r.equipped_by)?.name ?? '장착중'}]`
          : ''
        const label = `#${r.id} ${setInfo?.name ?? r.set_id} [${slotName}] Lv.${r.level}${equipped}`
        return { name: label.slice(0, 100), value: r.id }
      })
      .filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          String(c.value).includes(query),
      )
      .slice(0, 25)
    await interaction.respond(choices)
  } else if (focused.name === 'character') {
    const owned = getOwnedCharacters(userId)
    const query = focused.value.toLowerCase()
    const choices = owned
      .map((o) => {
        const t = characterMap.get(o.character_id)
        if (!t) return null
        const label = `${'⭐'.repeat(t.rarity)} ${t.emoji} ${t.name} Lv.${o.level}`
        return { name: label.slice(0, 100), value: t.id }
      })
      .filter(
        (c): c is { name: string; value: string } =>
          c !== null &&
          (c.name.toLowerCase().includes(query) ||
            c.value.toLowerCase().includes(query)),
      )
      .slice(0, 25)
    await interaction.respond(choices)
  }
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const sub = interaction.options.getSubcommand()

  switch (sub) {
    case 'list':
      return handleList(interaction)
    case 'levelup':
      return handleLevelUp(interaction)
    case 'equip':
      return handleEquip(interaction)
    case 'unequip':
      return handleUnequip(interaction)
    case 'discard':
      return handleDiscard(interaction)
    case 'farm':
      return handleFarm(interaction)
    case 'detail':
      return handleDetail(interaction)
  }
}

function formatRelic(relic: OwnedRelic): string {
  const set = relicSetMap.get(relic.set_id)
  const slotName = RELIC_SLOT_NAMES[relic.slot as RelicSlot] ?? relic.slot
  const slotEmoji = RELIC_SLOT_EMOJI[relic.slot as RelicSlot] ?? '📦'
  const qualityName = QUALITY_NAMES[relic.quality] ?? relic.quality
  const mainStatName =
    RELIC_STAT_NAMES[relic.main_stat_type as RelicStatType] ??
    relic.main_stat_type
  const mainStatVal = formatStatValue(
    relic.main_stat_type,
    relic.main_stat_value,
  )
  const equippedText = relic.equipped_by
    ? ` 📌${characterMap.get(relic.equipped_by)?.name ?? relic.equipped_by}`
    : ''

  return `\`#${relic.id}\` ${slotEmoji} **${set?.name ?? relic.set_id}** (${slotName}) +${relic.level}\n> ${qualityName} | ${mainStatName}: ${mainStatVal}${equippedText}`
}

async function handleList(interaction: ChatInputCommandInteraction) {
  const user = interaction.user
  const relics = getOwnedRelics(user.id)

  if (relics.length === 0) {
    await interaction.reply({
      content: '📦 보유 유물이 없습니다. `/relic farm`으로 유물을 파밍하세요!',
      ephemeral: true,
    })
    return
  }

  const lines = relics.slice(0, 20).map(formatRelic)
  const embed = new EmbedBuilder()
    .setColor(0x9b59b6)
    .setTitle('🔮 보유 유물')
    .setDescription(lines.join('\n'))
    .setFooter({
      text: `총 ${relics.length}개 | /relic detail <ID>로 상세 확인`,
    })
    .setTimestamp()

  await interaction.reply({ embeds: [embed] })
}

async function handleDetail(interaction: ChatInputCommandInteraction) {
  const user = interaction.user
  const relicId = interaction.options.getInteger('id', true)
  const relic = getRelicById(user.id, relicId)

  if (!relic) {
    await interaction.reply({
      content: '❌ 유물을 찾을 수 없습니다.',
      ephemeral: true,
    })
    return
  }

  const set = relicSetMap.get(relic.set_id)
  const slotName = RELIC_SLOT_NAMES[relic.slot as RelicSlot] ?? relic.slot
  const slotEmoji = RELIC_SLOT_EMOJI[relic.slot as RelicSlot] ?? '📦'
  const qualityName = QUALITY_NAMES[relic.quality] ?? relic.quality
  const mainStatName =
    RELIC_STAT_NAMES[relic.main_stat_type as RelicStatType] ??
    relic.main_stat_type
  const mainStatVal = formatStatValue(
    relic.main_stat_type,
    relic.main_stat_value,
  )
  const subs: RelicSubStat[] = JSON.parse(relic.sub_stats)

  const subLines = subs
    .map(
      (s) =>
        `> ${RELIC_STAT_NAMES[s.type] ?? s.type}: +${formatStatValue(s.type, s.value)}`,
    )
    .join('\n')

  const equippedChar = relic.equipped_by
    ? (characterMap.get(relic.equipped_by)?.name ?? relic.equipped_by)
    : '없음'

  const embed = new EmbedBuilder()
    .setColor(QUALITY_COLORS[relic.quality] ?? 0x808080)
    .setTitle(`${slotEmoji} ${set?.name ?? relic.set_id} — ${slotName}`)
    .setDescription(
      `등급: ${qualityName}\n` +
        `레벨: **+${relic.level}** / ${RELIC_MAX_LEVEL}\n` +
        `장착: ${equippedChar}\n\n` +
        `**메인 스탯**\n> ${mainStatName}: +${mainStatVal}\n\n` +
        `**서브 스탯**\n${subLines || '> (없음)'}` +
        (set
          ? `\n\n**세트 효과**\n> 2세트: ${set.bonus2}\n> 4세트: ${set.bonus4}`
          : ''),
    )
    .setFooter({
      text: `ID: #${relic.id} | 강화 비용: ${getRelicLevelCost(relic.level)}G`,
    })
    .setTimestamp()

  await interaction.reply({ embeds: [embed] })
}

async function handleLevelUp(interaction: ChatInputCommandInteraction) {
  const user = interaction.user
  const guildId = interaction.guildId!
  const relicId = interaction.options.getInteger('id', true)
  const count = interaction.options.getInteger('count') ?? 1

  const relic = getRelicById(user.id, relicId)
  if (!relic) {
    await interaction.reply({
      content: '❌ 유물을 찾을 수 없습니다.',
      ephemeral: true,
    })
    return
  }

  const player = getOrCreatePlayer(user.id, guildId, user.username)

  // Calculate total cost
  let totalCost = 0
  let currentLevel = relic.level
  for (let i = 0; i < count; i++) {
    if (currentLevel >= RELIC_MAX_LEVEL) break
    totalCost += getRelicLevelCost(currentLevel)
    currentLevel++
  }

  if (player.gold < totalCost) {
    await interaction.reply({
      content: `💰 골드 부족! (필요: ${totalCost}G, 보유: ${player.gold}G)`,
      ephemeral: true,
    })
    return
  }

  addGold(user.id, guildId, -totalCost)

  const upgrades: string[] = []
  let finalLevel = relic.level

  for (let i = 0; i < count; i++) {
    const result = levelUpRelic(user.id, relicId)
    if (!result.success) {
      if (i === 0) {
        await interaction.reply({
          content: `❌ ${result.message}`,
          ephemeral: true,
        })
        return
      }
      break
    }
    finalLevel = result.newLevel
    if (result.upgradedStat) {
      const statName =
        RELIC_STAT_NAMES[result.upgradedStat.type] ?? result.upgradedStat.type
      const statVal = formatStatValue(
        result.upgradedStat.type,
        result.upgradedStat.value,
      )
      upgrades.push(`+${result.newLevel}: ✨ ${statName} → ${statVal}`)
    }
  }

  const updated = getRelicById(user.id, relicId)!
  const set = relicSetMap.get(updated.set_id)
  const mainStatName =
    RELIC_STAT_NAMES[updated.main_stat_type as RelicStatType] ??
    updated.main_stat_type
  const mainStatVal = formatStatValue(
    updated.main_stat_type,
    updated.main_stat_value,
  )

  const embed = new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle(`🔮 유물 강화 성공!`)
    .setDescription(
      `${set?.emoji ?? '📦'} **${set?.name ?? updated.set_id}** +${relic.level} → **+${finalLevel}**\n\n` +
        `메인 스탯: ${mainStatName} +${mainStatVal}\n\n` +
        (upgrades.length > 0
          ? `**서브 스탯 변화:**\n${upgrades.join('\n')}\n\n`
          : '') +
        `💰 사용: ${totalCost}G`,
    )
    .setTimestamp()

  await interaction.reply({ embeds: [embed] })
}

async function handleEquip(interaction: ChatInputCommandInteraction) {
  const user = interaction.user
  const relicId = interaction.options.getInteger('id', true)
  const characterId = interaction.options.getString('character', true)

  const relic = getRelicById(user.id, relicId)
  if (!relic) {
    await interaction.reply({
      content: '❌ 유물을 찾을 수 없습니다.',
      ephemeral: true,
    })
    return
  }

  const char = characterMap.get(characterId)
  if (!char) {
    await interaction.reply({
      content: '❌ 캐릭터를 찾을 수 없습니다.',
      ephemeral: true,
    })
    return
  }

  equipRelic(user.id, relicId, characterId)

  const set = relicSetMap.get(relic.set_id)
  const slotName = RELIC_SLOT_NAMES[relic.slot as RelicSlot] ?? relic.slot

  await interaction.reply({
    content: `✅ ${set?.emoji ?? '📦'} **${set?.name ?? relic.set_id}** (${slotName} +${relic.level})을(를) **${char.name}**에게 장착했습니다!`,
  })
}

async function handleUnequip(interaction: ChatInputCommandInteraction) {
  const user = interaction.user
  const relicId = interaction.options.getInteger('id', true)

  const relic = getRelicById(user.id, relicId)
  if (!relic) {
    await interaction.reply({
      content: '❌ 유물을 찾을 수 없습니다.',
      ephemeral: true,
    })
    return
  }

  equipRelic(user.id, relicId, null)
  await interaction.reply({ content: `✅ 유물 #${relicId} 장착 해제 완료!` })
}

async function handleDiscard(interaction: ChatInputCommandInteraction) {
  const user = interaction.user
  const guildId = interaction.guildId!
  const relicId = interaction.options.getInteger('id', true)

  const relic = getRelicById(user.id, relicId)
  if (!relic) {
    await interaction.reply({
      content: '❌ 유물을 찾을 수 없습니다.',
      ephemeral: true,
    })
    return
  }

  if (relic.equipped_by) {
    await interaction.reply({
      content:
        '❌ 장착 중인 유물은 분해할 수 없습니다. 먼저 `/relic unequip`하세요.',
      ephemeral: true,
    })
    return
  }

  const goldReward =
    20 +
    relic.level * 15 +
    (relic.quality === 'epic' ? 50 : relic.quality === 'rare' ? 25 : 0)
  deleteRelic(user.id, relicId)
  addGold(user.id, guildId, goldReward)

  await interaction.reply({
    content: `🗑️ 유물 #${relicId} 분해 완료! 💰 +${goldReward}G`,
  })
}

// ── Relic Farm ──
const FARM_COST = 30 // gold

async function handleFarm(interaction: ChatInputCommandInteraction) {
  const user = interaction.user
  const guildId = interaction.guildId!

  if (isPlayerDead(user.id, guildId)) {
    await interaction.reply({
      content: '💀 HP가 0입니다! `/heal`로 회복하세요.',
      ephemeral: true,
    })
    return
  }

  const player = getOrCreatePlayer(user.id, guildId, user.username)
  if (player.gold < FARM_COST) {
    await interaction.reply({
      content: `💰 골드 부족! (필요: ${FARM_COST}G, 보유: ${player.gold}G)`,
      ephemeral: true,
    })
    return
  }

  addGold(user.id, guildId, -FARM_COST)

  const loadEmbed = new EmbedBuilder()
    .setColor(0x9b59b6)
    .setTitle('🔮 유물 던전 탐색 중...')
    .setDescription('> ⚔️ 던전 깊은 곳으로 들어가는 중...')
  await interaction.reply({ embeds: [loadEmbed] })
  await sleep(2000)

  // Roll quality: 60% normal, 30% rare, 10% epic
  const qualityRoll = Math.random()
  const quality =
    qualityRoll < 0.1 ? 'epic' : qualityRoll < 0.4 ? 'rare' : 'normal'

  // Random set and slot
  const set = pick(RELIC_SETS)
  const slots: RelicSlot[] = ['head', 'hands', 'body', 'feet']
  const slot = pick(slots)

  // Roll main stat
  const mainStatPool = SLOT_MAIN_STATS[slot]
  const mainStatType = pick(mainStatPool)

  // Initial main stat value (level 0)
  const mainStatScaling: Record<string, { base: number }> = {
    hp_flat: { base: 100 },
    atk_flat: { base: 20 },
    hp_pct: { base: 0.03 },
    atk_pct: { base: 0.03 },
    def_pct: { base: 0.03 },
    crit_rate: { base: 0.02 },
    crit_dmg: { base: 0.04 },
  }
  const mainStatValue = mainStatScaling[mainStatType]?.base ?? 0

  // Roll substats
  const startingSubCount = QUALITY_STARTING_SUBSTATS[quality] ?? 2
  const allSubTypes: RelicStatKey[] = [
    'atk_flat',
    'atk_pct',
    'def_flat',
    'def_pct',
    'hp_flat',
    'hp_pct',
    'crit_rate',
    'crit_dmg',
  ]
  const availableSubs = allSubTypes.filter((s) => s !== mainStatType)

  const subStats: RelicSubStat[] = []
  const usedTypes = new Set<string>()
  for (let i = 0; i < Math.min(startingSubCount, availableSubs.length); i++) {
    const remaining = availableSubs.filter((s) => !usedTypes.has(s))
    if (remaining.length === 0) break
    const type = pick(remaining)
    usedTypes.add(type)

    const subStatRolls: Record<string, [number, number]> = {
      atk_flat: [10, 20],
      atk_pct: [0.02, 0.04],
      def_flat: [8, 15],
      def_pct: [0.02, 0.04],
      hp_flat: [20, 40],
      hp_pct: [0.02, 0.04],
      crit_rate: [0.01, 0.03],
      crit_dmg: [0.02, 0.06],
    }
    const [min, max] = subStatRolls[type] ?? [0, 0]
    const value = Number((min + Math.random() * (max - min)).toFixed(4))
    subStats.push({ type: type as RelicStatType, value })
  }

  const relicId = addRelic(
    user.id,
    set.id,
    slot,
    mainStatType,
    mainStatValue,
    subStats,
    quality,
  )

  // Build result embed
  const slotName = RELIC_SLOT_NAMES[slot]
  const slotEmoji = RELIC_SLOT_EMOJI[slot]
  const qualityName = QUALITY_NAMES[quality]
  const mainStatName =
    RELIC_STAT_NAMES[mainStatType as RelicStatType] ?? mainStatType
  const mainStatDisplay = formatStatValue(mainStatType, mainStatValue)

  const subLines = subStats
    .map(
      (s) =>
        `> ${RELIC_STAT_NAMES[s.type] ?? s.type}: +${formatStatValue(s.type, s.value)}`,
    )
    .join('\n')

  const embed = new EmbedBuilder()
    .setColor(QUALITY_COLORS[quality])
    .setTitle(`🔮 유물 획득!`)
    .setDescription(
      `${set.emoji} **${set.name}** — ${slotEmoji} ${slotName}\n` +
        `등급: ${qualityName}\n\n` +
        `**메인 스탯**\n> ${mainStatName}: +${mainStatDisplay}\n\n` +
        `**서브 스탯**\n${subLines || '> (없음)'}\n\n` +
        `**세트 효과**\n> 2세트: ${set.bonus2}\n> 4세트: ${set.bonus4}`,
    )
    .setFooter({
      text: `ID: #${relicId} | /relic levelup ${relicId} 로 강화 | -${FARM_COST}G`,
    })
    .setTimestamp()

  if (quality === 'epic') {
    embed.addFields({
      name: '🟪 영웅급!',
      value: '서브 스탯 4개! 완벽한 유물의 기회!',
    })
  }

  await interaction.editReply({ embeds: [embed] })
}
