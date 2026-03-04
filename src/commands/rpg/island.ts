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
  healPlayer,
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
  // ── Tier 1: Island Level 1 ──
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
    type: 'factory',
    name: '공장',
    emoji: '🏭',
    description:
      '자동으로 골드를 생산하지만 환경을 오염시킵니다. 레벨 당 낚시 시 오염 +0.08.',
    maxLevel: 5,
    baseCost: 500,
    costMultiplier: 2,
    incomePerHour: [15, 35, 70, 140, 280],
    requiredIslandLevel: 1,
  },
  {
    type: 'water_treatment',
    name: '수질 관리 시설',
    emoji: '🚰',
    description:
      '오염된 바다를 정화합니다. 없으면 낚시할 때마다 수질이 나빠집니다! 공장 오염도 처리합니다.',
    maxLevel: 5,
    baseCost: 600,
    costMultiplier: 2.5,
    incomePerHour: [0, 0, 0, 0, 0], // No gold income — reduces pollution instead
    requiredIslandLevel: 1,
  },
  {
    type: 'library',
    name: '도서관',
    emoji: '📚',
    description: '주민 교육을 위해 골드를 소비합니다. 문화 수준이 올라갑니다.',
    maxLevel: 5,
    baseCost: 400,
    costMultiplier: 2,
    incomePerHour: [-5, -12, -25, -50, -100], // Consumes gold
    requiredIslandLevel: 1,
  },
  // ── Tier 2: Island Level 2 ──
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
    type: 'hospital',
    name: '병원',
    emoji: '🏥',
    description:
      '주민 건강을 위해 운영 비용이 듭니다. 수익 수거 시 HP를 회복합니다.',
    maxLevel: 5,
    baseCost: 1200,
    costMultiplier: 2.5,
    incomePerHour: [-10, -25, -50, -100, -200], // Consumes gold, heals HP
    requiredIslandLevel: 2,
  },
  {
    type: 'zoo',
    name: '동물원',
    emoji: '🐘',
    description: '동물들을 관리하며 관광 수입을 얻습니다.',
    maxLevel: 5,
    baseCost: 1500,
    costMultiplier: 2.5,
    incomePerHour: [12, 30, 65, 130, 260],
    requiredIslandLevel: 2,
  },
  // ── Tier 3: Island Level 3 ──
  {
    type: 'casino',
    name: '카지노',
    emoji: '🎰',
    description: '럭키한 방문객들이 돈을 쓰고 갑니다.',
    maxLevel: 5,
    baseCost: 3000,
    costMultiplier: 3,
    incomePerHour: [30, 80, 160, 320, 600],
    requiredIslandLevel: 3,
  },
  {
    type: 'university',
    name: '대학교',
    emoji: '🎓',
    description: '연구와 교육에 막대한 비용이 듭니다. 섬 발전의 핵심 시설.',
    maxLevel: 5,
    baseCost: 5000,
    costMultiplier: 3,
    incomePerHour: [-30, -70, -150, -300, -600], // Consumes gold
    requiredIslandLevel: 3,
  },
  {
    type: 'stadium',
    name: '경기장',
    emoji: '🏟️',
    description: '스포츠 경기로 관광 수입을 얻습니다.',
    maxLevel: 5,
    baseCost: 8000,
    costMultiplier: 2.5,
    incomePerHour: [40, 100, 200, 400, 800],
    requiredIslandLevel: 3,
  },
  // ── Tier 4: Island Level 4 ──
  {
    type: 'resort',
    name: '리조트',
    emoji: '🏖️',
    description: '고급 리조트. 부자들의 휴양지.',
    maxLevel: 5,
    baseCost: 50_000,
    costMultiplier: 3,
    incomePerHour: [80, 200, 400, 800, 1500],
    requiredIslandLevel: 4,
  },
  {
    type: 'military_base',
    name: '군사기지',
    emoji: '⚔️',
    description: '섬 방위를 위한 군사 시설. 막대한 유지비가 듭니다.',
    maxLevel: 5,
    baseCost: 100_000,
    costMultiplier: 3,
    incomePerHour: [-80, -200, -500, -1000, -2000], // Consumes gold
    requiredIslandLevel: 4,
  },
  {
    type: 'nuclear_plant',
    name: '원자력 발전소',
    emoji: '☢️',
    description:
      '엄청난 에너지를 생산하여 수입을 올립니다. 건설비가 매우 비쌉니다.',
    maxLevel: 5,
    baseCost: 200_000,
    costMultiplier: 3,
    incomePerHour: [200, 500, 1000, 2000, 4000],
    requiredIslandLevel: 4,
  },
  // ── Tier 5: Island Level 5 (Endgame) ──
  {
    type: 'space_station',
    name: '우주정거장',
    emoji: '🚀',
    description: '우주에서 관광수입이 들어옵니다.',
    maxLevel: 5,
    baseCost: 1_000_000, // 100만
    costMultiplier: 3,
    incomePerHour: [300, 800, 1500, 3000, 6000],
    requiredIslandLevel: 5,
  },
  {
    type: 'castle',
    name: '성',
    emoji: '🏰',
    description: '왕의 거처. 위엄있는 관광 명소입니다.',
    maxLevel: 5,
    baseCost: 5_000_000, // 500만
    costMultiplier: 3,
    incomePerHour: [500, 1200, 2500, 5000, 10000],
    requiredIslandLevel: 5,
  },
  {
    type: 'luxury_hotel',
    name: '초호화 호텔',
    emoji: '🌟',
    description: '최상류층만 출입 가능한 호텔. 1박에 수백만 골드.',
    maxLevel: 5,
    baseCost: 10_000_000, // 1000만
    costMultiplier: 3.5,
    incomePerHour: [1000, 2500, 5000, 10000, 20000],
    requiredIslandLevel: 5,
  },
  {
    type: 'underwater_city',
    name: '해저 도시',
    emoji: '🌊',
    description: '바다 밑에 건설한 미래 도시. 천문학적 비용이 듭니다.',
    maxLevel: 5,
    baseCost: 50_000_000, // 5000만
    costMultiplier: 3.5,
    incomePerHour: [2000, 5000, 10000, 20000, 50000],
    requiredIslandLevel: 5,
  },
  {
    type: 'space_colony',
    name: '우주 식민지',
    emoji: '🪐',
    description: '다른 행성에 건설한 식민지. 인류 최후의 프로젝트.',
    maxLevel: 5,
    baseCost: 100_000_000, // 1억
    costMultiplier: 4,
    incomePerHour: [5000, 12000, 25000, 50000, 100000],
    requiredIslandLevel: 5,
  },
]

function getBuildingCost(info: BuildingInfo, targetLevel: number): number {
  return Math.round(
    info.baseCost * Math.pow(info.costMultiplier, targetLevel - 1),
  )
}

function formatGold(gold: number): string {
  const abs = Math.abs(gold)
  const sign = gold < 0 ? '-' : ''
  if (abs >= 100_000_000) {
    const v = abs / 100_000_000
    return `${sign}${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}억`
  }
  if (abs >= 10_000) {
    const v = abs / 10_000
    return `${sign}${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}만`
  }
  return `${sign}${abs}`
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
  let totalMaintenance = 0
  const buildingLines: string[] = []

  for (const b of buildings) {
    const info = BUILDINGS.find((bi) => bi.type === b.building_type)
    if (!info) continue
    const income = info.incomePerHour[b.building_level - 1] ?? 0
    if (income >= 0) totalIncome += income
    else totalMaintenance += Math.abs(income)
    const levelStars = '⭐'.repeat(b.building_level)
    const nextLevelText =
      b.building_level < info.maxLevel
        ? ` | 다음 레벨: ${formatGold(getBuildingCost(info, b.building_level + 1))}G`
        : ' | **MAX**'

    if (info.type === 'water_treatment') {
      const reduction = (b.building_level * 0.06).toFixed(2)
      buildingLines.push(
        `${info.emoji} **${info.name}** ${levelStars}\n` +
          `  효과: 낚시 시 오염 정화 -${reduction}/회${nextLevelText}`,
      )
    } else if (info.type === 'factory') {
      const pollutionAdd = (b.building_level * 0.08).toFixed(2)
      buildingLines.push(
        `${info.emoji} **${info.name}** ${levelStars}\n` +
          `  수입: ${income}G/시간 | ⚠️ 오염 +${pollutionAdd}/회${nextLevelText}`,
      )
    } else if (info.type === 'hospital') {
      buildingLines.push(
        `${info.emoji} **${info.name}** ${levelStars}\n` +
          `  유지비: ${Math.abs(income)}G/시간 | HP 회복${nextLevelText}`,
      )
    } else if (income < 0) {
      buildingLines.push(
        `${info.emoji} **${info.name}** ${levelStars}\n` +
          `  유지비: ${Math.abs(income)}G/시간${nextLevelText}`,
      )
    } else {
      buildingLines.push(
        `${info.emoji} **${info.name}** ${levelStars}\n` +
          `  수입: ${income}G/시간${nextLevelText}`,
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
      `${bi.emoji} ${bi.name} — ${formatGold(getBuildingCost(bi, 1))}G (섬 레벨 ${bi.requiredIslandLevel}+)`,
  )

  const xpBar = makeBar(island.island_xp, islandXpNeeded(island.island_level))

  const embed = new EmbedBuilder()
    .setColor(0x00d4aa)
    .setTitle(`${islandEmoji} ${island.island_name}`)
    .setDescription(
      `**섬 레벨:** ${island.island_level}/5\n` +
        `**경험치:** ${xpBar} ${island.island_xp}/${islandXpNeeded(island.island_level)}\n` +
        `**시간당 수입:** ${totalIncome}G/시간` +
        `${totalMaintenance > 0 ? ` | **유지비:** ${totalMaintenance}G/시간` : ''}\n` +
        `**순수입:** ${totalIncome - totalMaintenance}G/시간\n\n` +
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

  const islandQuotes = [
    '낚시로 경험치를 얻어 섬을 성장시키세요!',
    '건물 유지비 미납 시 철거될 수 있습니다. (거짓말)',
    '이 섬의 부동산 가격이 상승 중입니다.',
    '주민 만족도: 측정 불가 (주민이 없음)',
    '섬 관광 리뷰: ★★☆☆☆ "볼 게 없음"',
    '건축 허가 없이 짓고 있습니다. 쉿.',
    '섬 통계: 공장 오염 > 관광 수입. 자본주의.',
    '수질 관리 시설이 없으면 물고기가 이사갑니다.',
    '이 섬의 유일한 주민은 당신입니다. 외롭지 않으세요?',
    '건물 레벨을 올리면 행복해질 수 있습니다. (보장 안 됨)',
    '섬 경찰 보고서: 불법 투기 혐의자 1명 (당신)',
    '오늘의 섬 뉴스: "주민, 또 낚시만 함"',
    '환경부 경고: 오염도 관리 안 하면 벌금 부과 (예정)',
    '부동산 시세: 감정 불가. 감정사가 안 옴.',
    '이 섬에서 가장 비싼 것: 수질 관리 시설 유지비',
  ]
  embed.setFooter({ text: pick(islandQuotes) })
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
      content: `💰 골드가 부족합니다! (필요: ${formatGold(cost)}G, 보유: ${formatGold(player.gold)}G)`,
      ephemeral: true,
    })
    return
  }

  addGold(userId, guildId, -cost)
  const building = buildOrUpgrade(userId, guildId, buildingType)

  const income = info.incomePerHour[building.building_level - 1] ?? 0
  const levelStars = '⭐'.repeat(building.building_level)

  const incomeText =
    info.type === 'water_treatment'
      ? `효과: 낚시 시 오염 정화 **-${(building.building_level * 0.06).toFixed(2)}/회**`
      : info.type === 'factory'
        ? `시간당 수입: **${income}G/시간** | ⚠️ 오염 +${(building.building_level * 0.08).toFixed(2)}/회`
        : info.type === 'hospital'
          ? `유지비: **${Math.abs(income)}G/시간** | HP 회복`
          : income < 0
            ? `시간당 유지비: **${Math.abs(income)}G/시간**`
            : `시간당 수입: **${income}G/시간**`

  const embed = new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle(existing ? '🏗️ 건물 업그레이드!' : '🏗️ 건물 건설!')
    .setDescription(
      `${info.emoji} **${info.name}** ${levelStars}\n\n` +
        `${info.description}\n\n` +
        `${incomeText}\n` +
        `건설 비용: **${formatGold(cost)}G**`,
    )
    .setFooter({ text: `잔여 골드: ${formatGold(player.gold - cost)}G` })
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
  let totalSpent = 0
  const earningsLines: string[] = []
  const spendingLines: string[] = []

  for (const b of buildings) {
    const info = BUILDINGS.find((bi) => bi.type === b.building_type)
    if (!info) continue
    const income = info.incomePerHour[b.building_level - 1] ?? 0
    if (income > 0) {
      const earned = Math.floor(income * hoursPassed)
      if (earned > 0) {
        totalEarned += earned
        earningsLines.push(
          `${info.emoji} ${info.name} → +${formatGold(earned)}G`,
        )
      }
    } else if (income < 0) {
      const spent = Math.floor(Math.abs(income) * hoursPassed)
      if (spent > 0) {
        totalSpent += spent
        spendingLines.push(
          `${info.emoji} ${info.name} → -${formatGold(spent)}G`,
        )
      }
    }
  }

  // Hospital HP healing on collect
  let healedHp = 0
  const hospitalBuilding = buildings.find((b) => b.building_type === 'hospital')
  if (hospitalBuilding) {
    healedHp =
      hospitalBuilding.building_level *
      5 *
      Math.min(Math.floor(hoursPassed), 24)
    if (healedHp > 0) {
      healPlayer(userId, guildId, healedHp)
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

  if (
    totalEarned === 0 &&
    pollutionReduced === 0 &&
    totalSpent === 0 &&
    healedHp === 0
  ) {
    await interaction.reply({
      content: '💤 수익이 아직 쌓이지 않았습니다.',
      ephemeral: true,
    })
    return
  }

  const netGold = totalEarned - totalSpent
  addGold(userId, guildId, netGold)
  updateIsland(userId, guildId, {
    last_collect: now.toISOString().replace('T', ' ').split('.')[0],
  })

  let description = `**${Math.floor(hoursPassed)}시간 ${Math.floor((hoursPassed % 1) * 60)}분** 동안의 수익\n\n`

  if (earningsLines.length > 0) {
    description += `💰 **수입**\n${earningsLines.join('\n')}\n\n`
  }
  if (spendingLines.length > 0) {
    description += `💸 **유지비**\n${spendingLines.join('\n')}\n\n`
  }
  if (totalEarned > 0 || totalSpent > 0) {
    description += `**순수익: ${netGold >= 0 ? '+' : ''}${formatGold(netGold)}G** ${netGold >= 0 ? '💰' : '💸'}\n`
  }
  if (healedHp > 0) {
    description += `\n🏥 병원이 HP를 **${healedHp}** 회복시켰습니다!`
  }
  if (pollutionReduced > 0)
    description += `\n🚰 수질 관리 시설이 오염도를 **${pollutionReduced.toFixed(1)}** 감소시켰습니다!`

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
