import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js'
import {
  getOrCreatePlayer,
  addGold,
  addXp,
  addTitle,
  isPlayerDead,
  damagePlayer,
  pick,
  sleep,
  random,
  chance,
  getUserFortune,
} from '../../db/helpers.js'

export const data = new SlashCommandBuilder()
  .setName('mine')
  .setDescription('⛏️ 광산에서 광물을 채굴합니다!')

interface MineralType {
  name: string
  emoji: string
  rarity: string
  minValue: number
  maxValue: number
}

const minerals: MineralType[] = [
  { name: '돌멩이', emoji: '🪨', rarity: 'common', minValue: 1, maxValue: 5 },
  { name: '석탄', emoji: '⬛', rarity: 'common', minValue: 3, maxValue: 10 },
  {
    name: '구리 광석',
    emoji: '🟤',
    rarity: 'common',
    minValue: 5,
    maxValue: 15,
  },
  {
    name: '철 광석',
    emoji: '⚙️',
    rarity: 'uncommon',
    minValue: 15,
    maxValue: 40,
  },
  {
    name: '은 광석',
    emoji: '🩶',
    rarity: 'uncommon',
    minValue: 25,
    maxValue: 60,
  },
  { name: '금 광석', emoji: '🥇', rarity: 'rare', minValue: 50, maxValue: 150 },
  {
    name: '백금 원석',
    emoji: '💎',
    rarity: 'rare',
    minValue: 80,
    maxValue: 200,
  },
  {
    name: '에메랄드',
    emoji: '💚',
    rarity: 'epic',
    minValue: 200,
    maxValue: 500,
  },
  { name: '루비', emoji: '❤️', rarity: 'epic', minValue: 250, maxValue: 600 },
  {
    name: '다이아몬드',
    emoji: '💎',
    rarity: 'legendary',
    minValue: 500,
    maxValue: 2000,
  },
  {
    name: '용의 심장석',
    emoji: '🐉',
    rarity: 'mythic',
    minValue: 2000,
    maxValue: 10000,
  },
  {
    name: '세계수의 결정',
    emoji: '🌳',
    rarity: 'mythic',
    minValue: 5000,
    maxValue: 20000,
  },
]

function rollMineral(userId?: string): MineralType {
  const fortune = userId ? getUserFortune(userId) : null
  const mb = fortune?.mine_bonus ?? 0
  const roll = Math.random() * 100
  let rarity: string
  if (roll < 0.5 + mb) rarity = 'mythic'
  else if (roll < 2 + mb * 1.5) rarity = 'legendary'
  else if (roll < 7 + mb * 1.2) rarity = 'epic'
  else if (roll < 18 + mb) rarity = 'rare'
  else if (roll < 38) rarity = 'uncommon'
  else rarity = 'common'
  const pool = minerals.filter((m) => m.rarity === rarity)
  return pick(pool)
}

const miningMessages = [
  '곡괭이를 휘두른다...',
  '캐낸다! 캐낸다!! ⛏️',
  '어두운 광산 깊은 곳...',
  '뭔가 반짝이는 게 보인다...',
  '거미줄을 뚫고 진입 중...',
  '석탄 가루로 얼굴이 새까매졌다...',
  '다이나마이트를 설치하고... 아 안 되겠다. 곡괭이로 간다.',
  '다른 광부가 "거기 금 나온다!" 라고 했다 (거짓말)',
  '유튜브에서 본 채굴법을 시전한다...',
  '"이 광산에서 전설을 찾겠어!!" 라고 외쳤다 (메아리만 돌아옴)',
]

const hazardMessages = [
  {
    msg: '⚠️ 낙석이다!! 돌이 머리 위로 떨어진다!',
    damage: [5, 20] as [number, number],
  },
  { msg: '🦇 박쥐 떼가 습격했다!!', damage: [3, 12] as [number, number] },
  { msg: '💨 유독 가스가 분출했다!', damage: [8, 25] as [number, number] },
  { msg: '🕷️ 거대 거미에게 물렸다!', damage: [5, 15] as [number, number] },
  { msg: '💥 폭발물을 실수로 건드렸다!', damage: [15, 35] as [number, number] },
  {
    msg: '🌊 지하수가 터졌다! 빠져나가느라 체력 소모!',
    damage: [10, 20] as [number, number],
  },
]

const miningUsers = new Set<string>()

const rarityColors: Record<string, number> = {
  common: 0x808080,
  uncommon: 0x2ecc71,
  rare: 0x3498db,
  epic: 0x9b59b6,
  legendary: 0xf39c12,
  mythic: 0xff0000,
}

const rarityLabels: Record<string, string> = {
  common: '⬜ 일반',
  uncommon: '🟩 고급',
  rare: '🟦 희귀',
  epic: '🟪 영웅',
  legendary: '🟨 전설',
  mythic: '🟥 신화',
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const user = interaction.user
  const guildId = interaction.guildId!

  const userKey = `${user.id}:${guildId}`
  if (miningUsers.has(userKey)) {
    await interaction.reply({
      content: '⛏️ 이미 채굴 중입니다! 결과를 기다려주세요.',
      ephemeral: true,
    })
    return
  }

  if (isPlayerDead(user.id, guildId)) {
    const deathMessages = [
      '💀 HP가 0입니다! 광산에 들어갈 수 없습니다.\n`/heal`로 회복하세요.',
      '💀 시체가 광산에 들어가면 유령 광부가 됩니다.\n`/heal`로 부활하세요.',
      '💀 죽은 상태로 곡괭이를 들 수 없습니다.\n`/heal`로 회복하세요.',
    ]
    await interaction.reply({ content: pick(deathMessages), ephemeral: true })
    return
  }

  miningUsers.add(userKey)
  const player = getOrCreatePlayer(user.id, guildId, user.username)

  // Phase 1: Mining animation
  const embed1 = new EmbedBuilder()
    .setColor(0x8b4513)
    .setTitle('⛏️ 광산 진입!')
    .setDescription(`> ${pick(miningMessages)}\n\n**채굴 중...**`)
  await interaction.reply({ embeds: [embed1] })
  await sleep(1500)

  // Phase 2: Mining progress
  const embed2 = new EmbedBuilder()
    .setColor(0x8b4513)
    .setTitle('⛏️ 광산 채굴 중...')
    .setDescription(`> ${pick(miningMessages)}\n\n⛏️⛏️⛏️ **쾅! 쾅! 쾅!**`)
  await interaction.editReply({ embeds: [embed2] })
  await sleep(1500)

  // Check for hazard (20% chance)
  const isHazard = chance(20)
  let hazardDamage = 0
  let hazardText = ''

  if (isHazard) {
    const hazard = pick(hazardMessages)
    hazardDamage = random(hazard.damage[0], hazard.damage[1])
    damagePlayer(user.id, guildId, hazardDamage)
    hazardText = `\n\n${hazard.msg}\n💔 HP -${hazardDamage}`
  }

  // Roll minerals (1-3 minerals per mine)
  const mineralCount = chance(10) ? 3 : chance(30) ? 2 : 1
  const results: { mineral: MineralType; value: number }[] = []

  for (let i = 0; i < mineralCount; i++) {
    const mineral = rollMineral(user.id)
    const value = random(mineral.minValue, mineral.maxValue)
    results.push({ mineral, value })
  }

  const totalGold = results.reduce((sum, r) => sum + r.value, 0)
  const xpGain = random(10, 30) + Math.floor(totalGold / 20)

  addGold(user.id, guildId, totalGold)
  const leveledUp = addXp(user.id, guildId, xpGain)

  // Check for special titles
  if (results.some((r) => r.mineral.rarity === 'mythic')) {
    addTitle(user.id, guildId, '⛏️ 전설의 광부')
  }

  // Build result text
  const mineralLines = results
    .map(
      (r) =>
        `${r.mineral.emoji} **${r.mineral.name}** ${rarityLabels[r.mineral.rarity]} — 💰 ${r.value}G`,
    )
    .join('\n')

  const bestRarity = results.reduce((best, r) => {
    const order = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic']
    return order.indexOf(r.mineral.rarity) > order.indexOf(best)
      ? r.mineral.rarity
      : best
  }, 'common')

  const finalEmbed = new EmbedBuilder()
    .setColor(rarityColors[bestRarity])
    .setTitle('⛏️ 채굴 결과!')
    .setDescription(
      `${mineralLines}\n\n` +
        `💰 총 수입: **${totalGold}G**\n` +
        `✨ XP: **+${xpGain}**` +
        (leveledUp ? '\n🎉 **레벨 업!!!**' : '') +
        hazardText,
    )
    .setFooter({
      text: `잔여 골드: ${player.gold + totalGold}G | HP: ${Math.max(0, player.hp - hazardDamage)}`,
    })
    .setTimestamp()

  if (
    results.some(
      (r) => r.mineral.rarity === 'legendary' || r.mineral.rarity === 'mythic',
    )
  ) {
    finalEmbed.addFields({
      name: '🎊 대박!!!',
      value: results.some((r) => r.mineral.rarity === 'mythic')
        ? '🌟 **신화급 광물 발견!!!** 광산의 전설이 되었습니다!'
        : '✨ **전설급 광물 발견!** 축하합니다!',
    })
  }

  await interaction.editReply({ embeds: [finalEmbed] })
  miningUsers.delete(userKey)
}
