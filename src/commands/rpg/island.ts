import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js'
import {
  getOrCreatePlayer,
  getOrCreateIsland,
  getIslandBuildings,
  getIslandBuilding,
  buildOrUpgrade,
  updateIsland,
  addGold,
  addIslandXp,
  applyWaterTreatment,
  getOrCreatePollution,
  pick,
} from '../../db/helpers.js'

// ──────────────────────────────────────
//  Building definitions
// ──────────────────────────────────────

interface BuildingInfo {
  type: string
  name: string
  emoji: string
  description: string
  maxLevel: number
  baseCost: number // gold cost per level
  costMultiplier: number // cost *= this per level
  incomePerHour: number[] // gold per hour per level (index 0 = lvl 1)
  requiredIslandLevel: number
}

const BUILDINGS: BuildingInfo[] = [
  {
    type: 'fishing_spot',
    name: '낚시터',
    emoji: '🎣',
    description:
      '물고기를 낚을 수 있는 장소. 레벨이 높을수록 좋은 물고기가 나옵니다.',
    maxLevel: 5,
    baseCost: 200,
    costMultiplier: 2.5,
    incomePerHour: [0, 0, 0, 0, 0], // No passive income, but better fish
    requiredIslandLevel: 1,
  },
  {
    type: 'factory',
    name: '공장',
    emoji: '🏭',
    description: '자동으로 골드를 생산하는 공장.',
    maxLevel: 5,
    baseCost: 500,
    costMultiplier: 2,
    incomePerHour: [10, 25, 50, 100, 200],
    requiredIslandLevel: 1,
  },
  {
    type: 'amusement_park',
    name: '놀이공원',
    emoji: '🎡',
    description: '관광객이 찾아와 골드를 벌어다 줍니다.',
    maxLevel: 5,
    baseCost: 1000,
    costMultiplier: 2.5,
    incomePerHour: [20, 50, 100, 200, 400],
    requiredIslandLevel: 2,
  },
  {
    type: 'farm',
    name: '농장',
    emoji: '🌾',
    description: '농작물을 키워 골드를 법니다.',
    maxLevel: 5,
    baseCost: 300,
    costMultiplier: 2,
    incomePerHour: [8, 20, 40, 80, 160],
    requiredIslandLevel: 1,
  },
  {
    type: 'mine',
    name: '광산',
    emoji: '⛏️',
    description: '보석과 광물을 채굴합니다.',
    maxLevel: 5,
    baseCost: 800,
    costMultiplier: 2.5,
    incomePerHour: [15, 35, 75, 150, 300],
    requiredIslandLevel: 2,
  },
  {
    type: 'casino',
    name: '카지노',
    emoji: '🎰',
    description: '럭키한 방문객들이 돈을 쓰고 갑니다.',
    maxLevel: 5,
    baseCost: 2000,
    costMultiplier: 3,
    incomePerHour: [30, 80, 160, 320, 600],
    requiredIslandLevel: 3,
  },
  {
    type: 'resort',
    name: '리조트',
    emoji: '🏖️',
    description: '고급 리조트. 부자들의 휴양지.',
    maxLevel: 5,
    baseCost: 5000,
    costMultiplier: 3,
    incomePerHour: [50, 120, 250, 500, 1000],
    requiredIslandLevel: 4,
  },
  {
    type: 'space_station',
    name: '우주정거장',
    emoji: '🚀',
    description: '우주에서 관광수입이 들어옵니다. 최종 건물.',
    maxLevel: 5,
    baseCost: 10000,
    costMultiplier: 3,
    incomePerHour: [100, 250, 500, 1000, 2000],
    requiredIslandLevel: 5,
  },
  {
    type: 'water_treatment',
    name: '수질 관리 시설',
    emoji: '🚰',
    description:
      '오염된 바다를 정화합니다. 낚시할 때마다 오염도를 자동 감소시킵니다.',
    maxLevel: 5,
    baseCost: 600,
    costMultiplier: 2.5,
    incomePerHour: [0, 0, 0, 0, 0], // No gold income — reduces pollution instead
    requiredIslandLevel: 1,
  },
]

function getBuildingCost(info: BuildingInfo, targetLevel: number): number {
  return Math.round(
    info.baseCost * Math.pow(info.costMultiplier, targetLevel - 1),
  )
}

const islandEmojis = ['🏝️', '🌴', '🏖️', '🌋', '🌈']
const islandXpNeeded = (level: number) => level * 500

export const data = new SlashCommandBuilder()
  .setName('island')
  .setDescription('🏝️ 나의 섬을 관리합니다')
  .addSubcommand((sub) => sub.setName('view').setDescription('🏝️ 섬 현황 보기'))
  .addSubcommand((sub) =>
    sub
      .setName('build')
      .setDescription('🏗️ 건물 짓기/업그레이드')
      .addStringOption((opt) =>
        opt
          .setName('building')
          .setDescription('건물 종류')
          .setRequired(true)
          .addChoices(
            ...BUILDINGS.map((b) => ({
              name: `${b.emoji} ${b.name}`,
              value: b.type,
            })),
          ),
      ),
  )
  .addSubcommand((sub) =>
    sub.setName('collect').setDescription('💰 건물 수익 수거'),
  )
  .addSubcommand((sub) =>
    sub
      .setName('rename')
      .setDescription('✏️ 섬 이름 변경')
      .addStringOption((opt) =>
        opt.setName('name').setDescription('새 섬 이름').setRequired(true),
      ),
  )

export async function execute(interaction: ChatInputCommandInteraction) {
  const user = interaction.user
  const guildId = interaction.guildId!
  const sub = interaction.options.getSubcommand()

  getOrCreatePlayer(user.id, guildId, user.username)
  const island = getOrCreateIsland(user.id, guildId)

  if (sub === 'view') {
    await handleView(interaction, island, user.id, guildId)
  } else if (sub === 'build') {
    await handleBuild(interaction, island, user.id, guildId)
  } else if (sub === 'collect') {
    await handleCollect(interaction, island, user.id, guildId)
  } else if (sub === 'rename') {
    await handleRename(interaction, island, user.id, guildId)
  }
}

async function handleView(
  interaction: ChatInputCommandInteraction,
  island: ReturnType<typeof getOrCreateIsland>,
  userId: string,
  guildId: string,
) {
  const buildings = getIslandBuildings(userId, guildId)
  const islandEmoji =
    islandEmojis[Math.min(island.island_level - 1, islandEmojis.length - 1)]

  // Calculate total hourly income
  let totalIncome = 0
  const buildingLines: string[] = []

  for (const b of buildings) {
    const info = BUILDINGS.find((bi) => bi.type === b.building_type)
    if (!info) continue
    const income = info.incomePerHour[b.building_level - 1] ?? 0
    totalIncome += income
    const levelStars = '⭐'.repeat(b.building_level)
    if (info.type === 'water_treatment') {
      const reduction = (b.building_level * 0.3).toFixed(1)
      buildingLines.push(
        `${info.emoji} **${info.name}** ${levelStars}\n` +
          `  효과: 낚시 시 오염도 -${reduction}${b.building_level < info.maxLevel ? ` | 다음 레벨: ${getBuildingCost(info, b.building_level + 1)}G` : ' | **MAX**'}`,
      )
    } else {
      buildingLines.push(
        `${info.emoji} **${info.name}** ${levelStars}\n` +
          `  수입: ${income}G/시간${b.building_level < info.maxLevel ? ` | 다음 레벨: ${getBuildingCost(info, b.building_level + 1)}G` : ' | **MAX**'}`,
      )
    }
  }

  if (buildingLines.length === 0) {
    buildingLines.push(
      '*아직 건물이 없습니다. `/island build`로 건물을 지어보세요!*',
    )
  }

  // Available buildings to build
  const unbuilt = BUILDINGS.filter(
    (bi) =>
      !buildings.find((b) => b.building_type === bi.type) &&
      bi.requiredIslandLevel <= island.island_level,
  )
  const unbuiltLines = unbuilt.map(
    (bi) =>
      `${bi.emoji} ${bi.name} — ${getBuildingCost(bi, 1)}G (섬 레벨 ${bi.requiredIslandLevel}+)`,
  )

  const xpBar = makeBar(island.island_xp, islandXpNeeded(island.island_level))

  const embed = new EmbedBuilder()
    .setColor(0x00d4aa)
    .setTitle(`${islandEmoji} ${island.island_name}`)
    .setDescription(
      `**섬 레벨:** ${island.island_level}/5\n` +
        `**경험치:** ${xpBar} ${island.island_xp}/${islandXpNeeded(island.island_level)}\n` +
        `**시간당 총 수입:** ${totalIncome}G/시간\n\n` +
        `─────────────────────\n` +
        `**🏗️ 건물 목록**\n\n${buildingLines.join('\n\n')}`,
    )

  if (unbuiltLines.length > 0) {
    embed.addFields({
      name: '📋 건설 가능한 건물',
      value: unbuiltLines.join('\n'),
    })
  }

  // Show locked buildings
  const locked = BUILDINGS.filter(
    (bi) => bi.requiredIslandLevel > island.island_level,
  )
  if (locked.length > 0) {
    embed.addFields({
      name: '🔒 잠긴 건물',
      value: locked
        .map(
          (bi) =>
            `${bi.emoji} ${bi.name} — 섬 레벨 ${bi.requiredIslandLevel} 필요`,
        )
        .join('\n'),
    })
  }

  embed.setFooter({ text: '낚시로 경험치를 얻어 섬을 성장시키세요!' })
  embed.setTimestamp()

  await interaction.reply({ embeds: [embed] })
}

async function handleBuild(
  interaction: ChatInputCommandInteraction,
  island: ReturnType<typeof getOrCreateIsland>,
  userId: string,
  guildId: string,
) {
  const buildingType = interaction.options.getString('building', true)
  const info = BUILDINGS.find((bi) => bi.type === buildingType)

  if (!info) {
    await interaction.reply({
      content: '❌ 존재하지 않는 건물입니다.',
      ephemeral: true,
    })
    return
  }

  if (info.requiredIslandLevel > island.island_level) {
    await interaction.reply({
      content: `🔒 섬 레벨이 부족합니다! (필요: Lv.${info.requiredIslandLevel}, 현재: Lv.${island.island_level})`,
      ephemeral: true,
    })
    return
  }

  const existing = getIslandBuilding(userId, guildId, buildingType)
  const targetLevel = existing ? existing.building_level + 1 : 1

  if (targetLevel > info.maxLevel) {
    await interaction.reply({
      content: `🏗️ **${info.name}**은(는) 이미 최대 레벨입니다! (MAX Lv.${info.maxLevel})`,
      ephemeral: true,
    })
    return
  }

  const cost = getBuildingCost(info, targetLevel)
  const player = getOrCreatePlayer(userId, guildId, '')

  if (player.gold < cost) {
    await interaction.reply({
      content: `💰 골드가 부족합니다! (필요: ${cost}G, 보유: ${player.gold}G)`,
      ephemeral: true,
    })
    return
  }

  addGold(userId, guildId, -cost)
  const building = buildOrUpgrade(userId, guildId, buildingType)

  const income = info.incomePerHour[building.building_level - 1] ?? 0
  const levelStars = '⭐'.repeat(building.building_level)

  const embed = new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle(existing ? '🏗️ 건물 업그레이드!' : '🏗️ 건물 건설!')
    .setDescription(
      `${info.emoji} **${info.name}** ${levelStars}\n\n` +
        `${info.description}\n\n` +
        `시간당 수입: **${income}G/시간**\n` +
        `건설 비용: **${cost}G**`,
    )
    .setFooter({ text: `잔여 골드: ${player.gold - cost}G` })
    .setTimestamp()

  await interaction.reply({ embeds: [embed] })
}

async function handleCollect(
  interaction: ChatInputCommandInteraction,
  island: ReturnType<typeof getOrCreateIsland>,
  userId: string,
  guildId: string,
) {
  const buildings = getIslandBuildings(userId, guildId)

  if (buildings.length === 0) {
    await interaction.reply({
      content: '🏝️ 아직 건물이 없습니다! `/island build`로 건물을 지어보세요!',
      ephemeral: true,
    })
    return
  }

  const now = new Date()
  const lastCollect = island.last_collect
    ? new Date(island.last_collect + 'Z')
    : new Date(now.getTime() - 3600000)
  const hoursPassed = Math.min(
    24,
    (now.getTime() - lastCollect.getTime()) / 3600000,
  ) // Cap at 24h

  if (hoursPassed < 0.1) {
    // Less than 6 minutes
    await interaction.reply({
      content: '⏳ 아직 수거할 수익이 없습니다. 잠시 후 다시 시도하세요!',
      ephemeral: true,
    })
    return
  }

  let totalEarned = 0
  const earningsLines: string[] = []

  for (const b of buildings) {
    const info = BUILDINGS.find((bi) => bi.type === b.building_type)
    if (!info) continue
    const income = info.incomePerHour[b.building_level - 1] ?? 0
    const earned = Math.floor(income * hoursPassed)
    if (earned > 0) {
      totalEarned += earned
      earningsLines.push(`${info.emoji} ${info.name} → +${earned}G`)
    }
  }

  // Water treatment: passively reduce pollution on collect
  let pollutionReduced = 0
  const waterTreatment = buildings.find(
    (b) => b.building_type === 'water_treatment',
  )
  if (waterTreatment) {
    const reduceAmount =
      waterTreatment.building_level * 0.5 * Math.min(hoursPassed, 24)
    const pollution = getOrCreatePollution(userId, guildId)
    if (pollution.pollution_level > 0) {
      applyWaterTreatment(userId, guildId, waterTreatment.building_level)
      pollutionReduced = Math.min(reduceAmount, pollution.pollution_level)
    }
  }

  if (totalEarned === 0 && pollutionReduced === 0) {
    await interaction.reply({
      content: '💤 수익이 아직 쌓이지 않았습니다.',
      ephemeral: true,
    })
    return
  }

  addGold(userId, guildId, totalEarned)
  updateIsland(userId, guildId, {
    last_collect: now.toISOString().replace('T', ' ').split('.')[0],
  })

  let description =
    `**${Math.floor(hoursPassed)}시간 ${Math.floor((hoursPassed % 1) * 60)}분** 동안의 수익\n\n` +
    earningsLines.join('\n')
  if (totalEarned > 0) description += `\n\n**총 수익: ${totalEarned}G** 💰`
  if (pollutionReduced > 0)
    description += `\n\n🚰 수질 관리 시설이 오염도를 **${pollutionReduced.toFixed(1)}** 감소시켰습니다!`

  const embed = new EmbedBuilder()
    .setColor(0xffd700)
    .setTitle('💰 수익 수거!')
    .setDescription(description)
    .setFooter({ text: '최대 24시간까지 수익이 쌓입니다' })
    .setTimestamp()

  await interaction.reply({ embeds: [embed] })
}

async function handleRename(
  interaction: ChatInputCommandInteraction,
  island: ReturnType<typeof getOrCreateIsland>,
  userId: string,
  guildId: string,
) {
  const newName = interaction.options.getString('name', true).slice(0, 20)
  updateIsland(userId, guildId, { island_name: newName })

  await interaction.reply({
    content: `✅ 섬 이름이 **${newName}**(으)로 변경되었습니다!`,
  })
}

function makeBar(current: number, max: number): string {
  const ratio = Math.max(0, Math.min(1, current / max))
  const filled = Math.round(ratio * 10)
  const empty = 10 - filled
  return '█'.repeat(filled) + '░'.repeat(empty)
}
