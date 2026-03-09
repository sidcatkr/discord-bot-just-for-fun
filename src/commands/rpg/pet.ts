import {
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from 'discord.js'
import {
  getOrCreatePlayer,
  addGold,
  addTitle,
  addPet,
  getPets,
  getEquippedPet,
  equipPet,
  unequipAllPets,
  getPetCount,
  isPlayerDead,
  pick,
  sleep,
  random,
  chance,
  getUserFortune,
} from '../../db/helpers.js'

export const data = new SlashCommandBuilder()
  .setName('pet')
  .setDescription('🐾 펫 시스템!')
  .addSubcommand((sub) =>
    sub.setName('gacha').setDescription('🎰 펫 가챠! (비용: 500G)'),
  )
  .addSubcommand((sub) => sub.setName('list').setDescription('📋 보유 펫 목록'))
  .addSubcommand((sub) =>
    sub
      .setName('equip')
      .setDescription('🐾 펫 장착')
      .addIntegerOption((opt) =>
        opt
          .setName('id')
          .setDescription('펫 ID 번호')
          .setRequired(true)
          .setAutocomplete(true),
      ),
  )
  .addSubcommand((sub) => sub.setName('unequip').setDescription('🚫 펫 해제'))
  .addSubcommand((sub) =>
    sub.setName('info').setDescription('ℹ️ 현재 장착된 펫 정보'),
  )

// ── Pet Data ──

interface PetTemplate {
  name: string
  emoji: string
  rarity: string
  type: string
  attack: number
  defense: number
  hp: number
  luck: number
  gold: number
  xp: number
}

const petPool: PetTemplate[] = [
  // Common
  {
    name: '아기 고양이',
    emoji: '🐱',
    rarity: 'common',
    type: 'cute',
    attack: 1,
    defense: 0,
    hp: 5,
    luck: 0,
    gold: 0.02,
    xp: 0,
  },
  {
    name: '강아지',
    emoji: '🐶',
    rarity: 'common',
    type: 'cute',
    attack: 2,
    defense: 0,
    hp: 0,
    luck: 0,
    gold: 0,
    xp: 0.03,
  },
  {
    name: '햄스터',
    emoji: '🐹',
    rarity: 'common',
    type: 'cute',
    attack: 0,
    defense: 0,
    hp: 3,
    luck: 0.01,
    gold: 0.01,
    xp: 0.01,
  },
  {
    name: '토끼',
    emoji: '🐰',
    rarity: 'common',
    type: 'cute',
    attack: 0,
    defense: 1,
    hp: 5,
    luck: 0,
    gold: 0,
    xp: 0.02,
  },
  {
    name: '병아리',
    emoji: '🐣',
    rarity: 'common',
    type: 'cute',
    attack: 0,
    defense: 0,
    hp: 0,
    luck: 0.02,
    gold: 0.03,
    xp: 0,
  },
  {
    name: '금붕어',
    emoji: '🐠',
    rarity: 'common',
    type: 'aquatic',
    attack: 0,
    defense: 0,
    hp: 0,
    luck: 0,
    gold: 0.05,
    xp: 0,
  },
  {
    name: '거북이',
    emoji: '🐢',
    rarity: 'common',
    type: 'aquatic',
    attack: 0,
    defense: 3,
    hp: 10,
    luck: 0,
    gold: 0,
    xp: 0,
  },
  {
    name: '달팽이',
    emoji: '🐌',
    rarity: 'common',
    type: 'bug',
    attack: 0,
    defense: 2,
    hp: 0,
    luck: 0,
    gold: 0.01,
    xp: 0.01,
  },

  // Uncommon
  {
    name: '앵무새',
    emoji: '🦜',
    rarity: 'uncommon',
    type: 'cute',
    attack: 3,
    defense: 0,
    hp: 0,
    luck: 0.02,
    gold: 0.03,
    xp: 0.02,
  },
  {
    name: '고슴도치',
    emoji: '🦔',
    rarity: 'uncommon',
    type: 'cute',
    attack: 2,
    defense: 3,
    hp: 5,
    luck: 0,
    gold: 0,
    xp: 0.02,
  },
  {
    name: '여우',
    emoji: '🦊',
    rarity: 'uncommon',
    type: 'wild',
    attack: 4,
    defense: 1,
    hp: 0,
    luck: 0.03,
    gold: 0,
    xp: 0.03,
  },
  {
    name: '펭귄',
    emoji: '🐧',
    rarity: 'uncommon',
    type: 'cute',
    attack: 1,
    defense: 2,
    hp: 10,
    luck: 0.01,
    gold: 0.02,
    xp: 0.01,
  },
  {
    name: '수달',
    emoji: '🦦',
    rarity: 'uncommon',
    type: 'aquatic',
    attack: 3,
    defense: 1,
    hp: 5,
    luck: 0.02,
    gold: 0.02,
    xp: 0,
  },
  {
    name: '부엉이',
    emoji: '🦉',
    rarity: 'uncommon',
    type: 'wild',
    attack: 2,
    defense: 0,
    hp: 0,
    luck: 0.04,
    gold: 0,
    xp: 0.05,
  },

  // Rare
  {
    name: '늑대',
    emoji: '🐺',
    rarity: 'rare',
    type: 'wild',
    attack: 8,
    defense: 3,
    hp: 15,
    luck: 0.02,
    gold: 0,
    xp: 0.05,
  },
  {
    name: '독수리',
    emoji: '🦅',
    rarity: 'rare',
    type: 'wild',
    attack: 10,
    defense: 1,
    hp: 0,
    luck: 0.05,
    gold: 0.03,
    xp: 0.03,
  },
  {
    name: '백호',
    emoji: '🐅',
    rarity: 'rare',
    type: 'mythical',
    attack: 12,
    defense: 5,
    hp: 20,
    luck: 0.03,
    gold: 0,
    xp: 0.04,
  },
  {
    name: '돌고래',
    emoji: '🐬',
    rarity: 'rare',
    type: 'aquatic',
    attack: 5,
    defense: 3,
    hp: 15,
    luck: 0.04,
    gold: 0.05,
    xp: 0.03,
  },
  {
    name: '판다',
    emoji: '🐼',
    rarity: 'rare',
    type: 'cute',
    attack: 3,
    defense: 8,
    hp: 25,
    luck: 0.02,
    gold: 0.04,
    xp: 0.02,
  },

  // Epic
  {
    name: '유니콘',
    emoji: '🦄',
    rarity: 'epic',
    type: 'mythical',
    attack: 10,
    defense: 8,
    hp: 30,
    luck: 0.08,
    gold: 0.08,
    xp: 0.06,
  },
  {
    name: '피닉스',
    emoji: '🔥',
    rarity: 'epic',
    type: 'mythical',
    attack: 18,
    defense: 5,
    hp: 20,
    luck: 0.05,
    gold: 0.05,
    xp: 0.08,
  },
  {
    name: '그리폰',
    emoji: '🦁',
    rarity: 'epic',
    type: 'mythical',
    attack: 15,
    defense: 10,
    hp: 35,
    luck: 0.04,
    gold: 0.03,
    xp: 0.05,
  },
  {
    name: '정령',
    emoji: '✨',
    rarity: 'epic',
    type: 'mythical',
    attack: 5,
    defense: 5,
    hp: 15,
    luck: 0.1,
    gold: 0.1,
    xp: 0.1,
  },
  {
    name: '사이버 고양이',
    emoji: '🤖',
    rarity: 'epic',
    type: 'cyber',
    attack: 12,
    defense: 12,
    hp: 25,
    luck: 0.06,
    gold: 0.06,
    xp: 0.06,
  },

  // Legendary
  {
    name: '용',
    emoji: '🐉',
    rarity: 'legendary',
    type: 'mythical',
    attack: 25,
    defense: 15,
    hp: 50,
    luck: 0.08,
    gold: 0.1,
    xp: 0.1,
  },
  {
    name: '케르베로스',
    emoji: '👹',
    rarity: 'legendary',
    type: 'mythical',
    attack: 30,
    defense: 20,
    hp: 40,
    luck: 0.05,
    gold: 0.05,
    xp: 0.08,
  },
  {
    name: '레비아탄',
    emoji: '🌊',
    rarity: 'legendary',
    type: 'mythical',
    attack: 20,
    defense: 25,
    hp: 60,
    luck: 0.06,
    gold: 0.08,
    xp: 0.06,
  },
  {
    name: '황금 두꺼비',
    emoji: '🐸',
    rarity: 'legendary',
    type: 'fortune',
    attack: 5,
    defense: 5,
    hp: 20,
    luck: 0.15,
    gold: 0.2,
    xp: 0.05,
  },

  // Mythic
  {
    name: '세계수의 정령',
    emoji: '🌳',
    rarity: 'mythic',
    type: 'mythical',
    attack: 30,
    defense: 30,
    hp: 80,
    luck: 0.12,
    gold: 0.15,
    xp: 0.15,
  },
  {
    name: '시간의 수호자',
    emoji: '⏳',
    rarity: 'mythic',
    type: 'mythical',
    attack: 25,
    defense: 25,
    hp: 60,
    luck: 0.2,
    gold: 0.2,
    xp: 0.2,
  },
  {
    name: '무한의 슬라임',
    emoji: '🫧',
    rarity: 'mythic',
    type: 'mythical',
    attack: 40,
    defense: 40,
    hp: 100,
    luck: 0.1,
    gold: 0.1,
    xp: 0.1,
  },
  {
    name: '신수 해태',
    emoji: '🦁',
    rarity: 'mythic',
    type: 'mythical',
    attack: 35,
    defense: 35,
    hp: 70,
    luck: 0.15,
    gold: 0.12,
    xp: 0.12,
  },
]

function rollPetGacha(_u?: string): PetTemplate {
  const _fortune = _u ? getUserFortune(_u) : null
  const _pb = _fortune?.pet_bonus ?? 0
  const _p = _pb > 0
  const roll = Math.random() * 100
  let rarity: string
  if (roll < 0.5 + _pb) rarity = 'mythic'
  else if (roll < 2.5 + _pb * 1.5) rarity = 'legendary'
  else if (roll < 8 + _pb * 1.2) rarity = 'epic'
  else if (roll < 20 + _pb) rarity = 'rare'
  else if (roll < 45) rarity = 'uncommon'
  else rarity = 'common'
  const pool = petPool.filter((p) => p.rarity === rarity)
  return pick(pool)
}

const rarityLabels: Record<string, string> = {
  common: '⬜ 일반',
  uncommon: '🟩 고급',
  rare: '🟦 희귀',
  epic: '🟪 영웅',
  legendary: '🟨 전설',
  mythic: '🟥 신화',
}

const rarityColors: Record<string, number> = {
  common: 0x808080,
  uncommon: 0x2ecc71,
  rare: 0x3498db,
  epic: 0x9b59b6,
  legendary: 0xf39c12,
  mythic: 0xff0000,
}

const gachaUsers = new Set<string>()

export async function autocomplete(interaction: AutocompleteInteraction) {
  const guildId = interaction.guildId!
  const userId = interaction.user.id
  const focused = interaction.options.getFocused(true)

  if (focused.name === 'id') {
    const pets = getPets(userId, guildId)
    const query = focused.value.toLowerCase()
    const choices = pets
      .map((p) => {
        const equipped = p.equipped ? ' [장착중]' : ''
        const label = `#${p.id} ${p.pet_emoji} ${p.pet_name} (${rarityLabels[p.pet_rarity]})${equipped}`
        return { name: label.slice(0, 100), value: p.id }
      })
      .filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          String(c.value).includes(query),
      )
      .slice(0, 25)
    await interaction.respond(choices)
  }
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const sub = interaction.options.getSubcommand()

  if (sub === 'gacha') await handleGacha(interaction)
  else if (sub === 'list') await handleList(interaction)
  else if (sub === 'equip') await handleEquip(interaction)
  else if (sub === 'unequip') await handleUnequip(interaction)
  else if (sub === 'info') await handleInfo(interaction)
}

async function handleGacha(interaction: ChatInputCommandInteraction) {
  const user = interaction.user
  const guildId = interaction.guildId!

  const userKey = `${user.id}:${guildId}`
  if (gachaUsers.has(userKey)) {
    await interaction.reply({
      content: '🐾 이미 펫 가챠 중입니다!',
      ephemeral: true,
    })
    return
  }

  if (isPlayerDead(user.id, guildId)) {
    await interaction.reply({
      content: '💀 HP가 0입니다! 펫을 뽑을 수 없습니다.\n`/heal`로 회복하세요.',
      ephemeral: true,
    })
    return
  }

  const player = getOrCreatePlayer(user.id, guildId, user.username)

  if (player.gold < 500) {
    await interaction.reply({
      content: `💰 골드가 부족합니다! (현재: ${player.gold}G / 필요: 500G)`,
      ephemeral: true,
    })
    return
  }

  gachaUsers.add(userKey)
  addGold(user.id, guildId, -500)

  const pet = rollPetGacha(user.id)

  // Animation
  const embed1 = new EmbedBuilder()
    .setColor(0x2c2f33)
    .setTitle('🐾 펫 가챠 돌리는 중...')
    .setDescription('> 🥚 🥚 🥚\n\n**알이 흔들리고 있습니다...**')
  await interaction.reply({ embeds: [embed1] })
  await sleep(1500)

  const glowColor =
    pet.rarity === 'mythic' || pet.rarity === 'legendary'
      ? 0xffd700
      : pet.rarity === 'epic'
        ? 0x9b59b6
        : 0x808080
  const embed2 = new EmbedBuilder()
    .setColor(glowColor)
    .setTitle('🐾 펫 가챠 돌리는 중...')
    .setDescription('> 🥚✨🥚\n\n**알에서 빛이 나기 시작합니다...!**')
  await interaction.editReply({ embeds: [embed2] })
  await sleep(1500)

  const embed3 = new EmbedBuilder()
    .setColor(rarityColors[pet.rarity])
    .setTitle('🐾 펫 가챠!')
    .setDescription(
      `> 등급이 보인다...!\n\n## ${rarityLabels[pet.rarity]}\n\n*펫이 나타나는 중...*`,
    )
  await interaction.editReply({ embeds: [embed3] })
  await sleep(2000)

  addPet(user.id, guildId, {
    pet_name: pet.name,
    pet_emoji: pet.emoji,
    pet_rarity: pet.rarity,
    pet_type: pet.type,
    attack_bonus: pet.attack,
    defense_bonus: pet.defense,
    hp_bonus: pet.hp,
    luck_bonus: pet.luck,
    gold_bonus: pet.gold,
    xp_bonus: pet.xp,
  })

  const stats: string[] = []
  if (pet.attack > 0) stats.push(`⚔️ 공격력 +${pet.attack}`)
  if (pet.defense > 0) stats.push(`🛡️ 방어력 +${pet.defense}`)
  if (pet.hp > 0) stats.push(`❤️ HP +${pet.hp}`)
  if (pet.luck > 0) stats.push(`🍀 행운 +${(pet.luck * 100).toFixed(0)}%`)
  if (pet.gold > 0)
    stats.push(`💰 골드 보너스 +${(pet.gold * 100).toFixed(0)}%`)
  if (pet.xp > 0) stats.push(`✨ XP 보너스 +${(pet.xp * 100).toFixed(0)}%`)

  const finalEmbed = new EmbedBuilder()
    .setColor(rarityColors[pet.rarity])
    .setTitle('🐾 펫 가챠 결과!')
    .setDescription(
      `${pet.emoji} **${pet.name}**\n등급: ${rarityLabels[pet.rarity]}\n유형: ${pet.type}\n\n` +
        (stats.length > 0 ? stats.join(' | ') : '특수 능력 없음') +
        `\n\n\`/pet equip\`으로 장착하세요!`,
    )

  if (pet.rarity === 'legendary' || pet.rarity === 'mythic') {
    finalEmbed.addFields({
      name: '🎊 대박!!!',
      value:
        pet.rarity === 'mythic'
          ? '🌟 **신화급 펫 획득!!!** 전설의 동반자입니다!'
          : '✨ **전설급 펫 획득!** 축하합니다!',
    })
    if (pet.rarity === 'mythic') addTitle(user.id, guildId, '🐾 신화 펫 수집가')
  }

  if (pet.rarity === 'common') {
    const sadMessages = [
      '🐱 ...그냥 길고양이네요.',
      '🥲 500G가 다소 아깝습니다...',
      '📉 펫 가챠도 확률의 벽이 있습니다.',
      '🐌 달팽이라도 사랑해 주세요...',
      '🪙 500G면 낚시 미끼 50개 살 수 있었는데...',
    ]
    finalEmbed.addFields({ name: '😢', value: pick(sadMessages) })
  }

  finalEmbed.setFooter({
    text: `잔여 골드: ${player.gold - 500}G | 보유 펫: ${getPetCount(user.id, guildId)}마리`,
  })
  finalEmbed.setTimestamp()
  await interaction.editReply({ embeds: [finalEmbed] })
  gachaUsers.delete(userKey)
}

async function handleList(interaction: ChatInputCommandInteraction) {
  const user = interaction.user
  const guildId = interaction.guildId!
  getOrCreatePlayer(user.id, guildId, user.username)

  const pets = getPets(user.id, guildId)

  if (pets.length === 0) {
    await interaction.reply({
      content: '🐾 보유한 펫이 없습니다! `/pet gacha`로 펫을 뽑아보세요!',
      ephemeral: true,
    })
    return
  }

  const lines = pets.map((p, i) => {
    const equipped = p.equipped ? ' **[장착중]**' : ''
    return `\`#${p.id}\` ${p.pet_emoji} **${p.pet_name}** ${rarityLabels[p.pet_rarity]}${equipped}`
  })

  // Paginate if too many
  const pageSize = 15
  const page1 = lines.slice(0, pageSize)

  const embed = new EmbedBuilder()
    .setColor(0x9b59b6)
    .setTitle('🐾 보유 펫 목록')
    .setDescription(
      page1.join('\n') +
        (lines.length > pageSize
          ? `\n\n... 외 ${lines.length - pageSize}마리`
          : ''),
    )
    .setFooter({ text: `총 ${pets.length}마리 | /pet equip <ID>로 장착` })
    .setTimestamp()

  await interaction.reply({ embeds: [embed] })
}

async function handleEquip(interaction: ChatInputCommandInteraction) {
  const user = interaction.user
  const guildId = interaction.guildId!
  const petId = interaction.options.getInteger('id', true)

  getOrCreatePlayer(user.id, guildId, user.username)
  const pets = getPets(user.id, guildId)
  const target = pets.find((p) => p.id === petId)

  if (!target) {
    await interaction.reply({
      content: `❌ ID #${petId} 펫을 찾을 수 없습니다! \`/pet list\`로 확인하세요.`,
      ephemeral: true,
    })
    return
  }

  equipPet(user.id, guildId, petId)

  const stats: string[] = []
  if (target.attack_bonus > 0) stats.push(`⚔️ +${target.attack_bonus}`)
  if (target.defense_bonus > 0) stats.push(`🛡️ +${target.defense_bonus}`)
  if (target.hp_bonus > 0) stats.push(`❤️ +${target.hp_bonus}`)
  if (target.luck_bonus > 0)
    stats.push(`🍀 +${(target.luck_bonus * 100).toFixed(0)}%`)
  if (target.gold_bonus > 0)
    stats.push(`💰 +${(target.gold_bonus * 100).toFixed(0)}%`)
  if (target.xp_bonus > 0)
    stats.push(`✨ +${(target.xp_bonus * 100).toFixed(0)}%`)

  const embed = new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle('🐾 펫 장착 완료!')
    .setDescription(
      `${target.pet_emoji} **${target.pet_name}** ${rarityLabels[target.pet_rarity]}\n\n` +
        (stats.length > 0 ? `보너스: ${stats.join(' | ')}` : '특수 능력 없음'),
    )
    .setTimestamp()

  await interaction.reply({ embeds: [embed] })
}

async function handleUnequip(interaction: ChatInputCommandInteraction) {
  const user = interaction.user
  const guildId = interaction.guildId!
  getOrCreatePlayer(user.id, guildId, user.username)

  unequipAllPets(user.id, guildId)

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(0x808080)
        .setTitle('🚫 펫 해제')
        .setDescription('모든 펫이 해제되었습니다.'),
    ],
  })
}

async function handleInfo(interaction: ChatInputCommandInteraction) {
  const user = interaction.user
  const guildId = interaction.guildId!
  getOrCreatePlayer(user.id, guildId, user.username)

  const pet = getEquippedPet(user.id, guildId)

  if (!pet) {
    await interaction.reply({
      content: '🐾 장착된 펫이 없습니다! `/pet equip <ID>`로 장착하세요.',
      ephemeral: true,
    })
    return
  }

  const stats: string[] = []
  if (pet.attack_bonus > 0) stats.push(`⚔️ 공격력 +${pet.attack_bonus}`)
  if (pet.defense_bonus > 0) stats.push(`🛡️ 방어력 +${pet.defense_bonus}`)
  if (pet.hp_bonus > 0) stats.push(`❤️ HP +${pet.hp_bonus}`)
  if (pet.luck_bonus > 0)
    stats.push(`🍀 행운 +${(pet.luck_bonus * 100).toFixed(0)}%`)
  if (pet.gold_bonus > 0)
    stats.push(`💰 골드 보너스 +${(pet.gold_bonus * 100).toFixed(0)}%`)
  if (pet.xp_bonus > 0)
    stats.push(`✨ XP 보너스 +${(pet.xp_bonus * 100).toFixed(0)}%`)

  const embed = new EmbedBuilder()
    .setColor(rarityColors[pet.pet_rarity])
    .setTitle(`🐾 ${pet.pet_emoji} ${pet.pet_name}`)
    .setDescription(
      `등급: ${rarityLabels[pet.pet_rarity]}\n` +
        `유형: ${pet.pet_type}\n` +
        `ID: #${pet.id}\n\n` +
        `**보너스:**\n${stats.length > 0 ? stats.join('\n') : '없음'}`,
    )
    .setTimestamp()

  await interaction.reply({ embeds: [embed] })
}
