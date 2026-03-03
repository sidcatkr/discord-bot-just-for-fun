import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js'
import {
  getOrCreatePlayer,
  addGold,
  addItem,
  addTitle,
  pick,
  sleep,
} from '../../db/helpers.js'

export const data = new SlashCommandBuilder()
  .setName('gacha')
  .setDescription('🎰 가챠를 돌린다! (비용: 100G)')

interface GachaItem {
  name: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic'
  emoji: string
  attack: number
  defense: number
  hp: number
  crit: number
}

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

const gachaPool: GachaItem[] = [
  // Common (45%)
  {
    name: '고무장갑',
    rarity: 'common',
    emoji: '🧤',
    attack: 1,
    defense: 0,
    hp: 0,
    crit: 0,
  },
  {
    name: '감자',
    rarity: 'common',
    emoji: '🥔',
    attack: 0,
    defense: 0,
    hp: 5,
    crit: 0,
  },
  {
    name: '나무 막대기',
    rarity: 'common',
    emoji: '🪵',
    attack: 2,
    defense: 0,
    hp: 0,
    crit: 0,
  },
  {
    name: '비닐봉지',
    rarity: 'common',
    emoji: '🛍️',
    attack: 0,
    defense: 1,
    hp: 0,
    crit: 0,
  },
  {
    name: '양말 한 짝',
    rarity: 'common',
    emoji: '🧦',
    attack: 0,
    defense: 0,
    hp: 3,
    crit: 0,
  },
  {
    name: '돌멩이',
    rarity: 'common',
    emoji: '🪨',
    attack: 3,
    defense: 0,
    hp: 0,
    crit: 0,
  },
  {
    name: '삶은 달걀',
    rarity: 'common',
    emoji: '🥚',
    attack: 1,
    defense: 0,
    hp: 5,
    crit: 0,
  },
  {
    name: '깨진 안경',
    rarity: 'common',
    emoji: '👓',
    attack: 0,
    defense: 0,
    hp: 0,
    crit: 0.01,
  },

  // Uncommon (25%)
  {
    name: '녹슨 칼',
    rarity: 'uncommon',
    emoji: '🗡️',
    attack: 5,
    defense: 0,
    hp: 0,
    crit: 0.02,
  },
  {
    name: '가죽 갑옷',
    rarity: 'uncommon',
    emoji: '🦺',
    attack: 0,
    defense: 5,
    hp: 10,
    crit: 0,
  },
  {
    name: '마법 반지',
    rarity: 'uncommon',
    emoji: '💍',
    attack: 3,
    defense: 3,
    hp: 0,
    crit: 0.01,
  },
  {
    name: '치킨 뼈다귀',
    rarity: 'uncommon',
    emoji: '🍗',
    attack: 4,
    defense: 0,
    hp: 5,
    crit: 0,
  },
  {
    name: '쿠션 방패',
    rarity: 'uncommon',
    emoji: '🛡️',
    attack: 0,
    defense: 7,
    hp: 0,
    crit: 0,
  },

  // Rare (15%)
  {
    name: '불꽃 검',
    rarity: 'rare',
    emoji: '🔥',
    attack: 10,
    defense: 0,
    hp: 0,
    crit: 0.05,
  },
  {
    name: '얼음 갑옷',
    rarity: 'rare',
    emoji: '🧊',
    attack: 0,
    defense: 12,
    hp: 20,
    crit: 0,
  },
  {
    name: '번개 지팡이',
    rarity: 'rare',
    emoji: '⚡',
    attack: 12,
    defense: 0,
    hp: 0,
    crit: 0.03,
  },
  {
    name: '힐링 오브',
    rarity: 'rare',
    emoji: '💚',
    attack: 0,
    defense: 5,
    hp: 50,
    crit: 0,
  },

  // Epic (10%)
  {
    name: '용의 발톱',
    rarity: 'epic',
    emoji: '🐉',
    attack: 18,
    defense: 5,
    hp: 10,
    crit: 0.08,
  },
  {
    name: '암흑 로브',
    rarity: 'epic',
    emoji: '🌑',
    attack: 10,
    defense: 15,
    hp: 0,
    crit: 0.05,
  },
  {
    name: '성스러운 방패',
    rarity: 'epic',
    emoji: '✨',
    attack: 0,
    defense: 25,
    hp: 30,
    crit: 0,
  },

  // Legendary (4%)
  {
    name: '엑스칼리버',
    rarity: 'legendary',
    emoji: '⚔️',
    attack: 30,
    defense: 10,
    hp: 20,
    crit: 0.15,
  },
  {
    name: '무적의 갑옷',
    rarity: 'legendary',
    emoji: '🏰',
    attack: 5,
    defense: 40,
    hp: 50,
    crit: 0,
  },

  // Mythic (1%)
  {
    name: '세계를 멸망시키는 고무 오리',
    rarity: 'mythic',
    emoji: '🦆',
    attack: 50,
    defense: 30,
    hp: 100,
    crit: 0.25,
  },
  {
    name: '시간을 되돌리는 감자',
    rarity: 'mythic',
    emoji: '🥔✨',
    attack: 40,
    defense: 40,
    hp: 50,
    crit: 0.2,
  },
]

function rollGacha(): GachaItem {
  const roll = Math.random() * 100
  let rarity: string

  if (roll < 1) rarity = 'mythic'
  else if (roll < 5) rarity = 'legendary'
  else if (roll < 15) rarity = 'epic'
  else if (roll < 30) rarity = 'rare'
  else if (roll < 55) rarity = 'uncommon'
  else rarity = 'common'

  const pool = gachaPool.filter((i) => i.rarity === rarity)
  return pick(pool)
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const user = interaction.user
  const guildId = interaction.guildId!

  const player = getOrCreatePlayer(user.id, guildId, user.username)

  if (player.gold < 100) {
    await interaction.reply({
      content: `💰 골드가 부족합니다! (현재: ${player.gold}G / 필요: 100G)\n\`/daily\`로 골드를 모으세요!`,
      ephemeral: true,
    })
    return
  }

  addGold(user.id, guildId, -100)
  const item = rollGacha()

  // ── Phase 1: 돌리는 중 ──
  const embed1 = new EmbedBuilder()
    .setColor(0x2c2f33)
    .setTitle('🎰 가챠 돌리는 중...')
    .setDescription(
      '```\n' +
        '  ╔══════════════╗\n' +
        '  ║  🎰 🎰 🎰   ║\n' +
        '  ║   돌리는 중...  ║\n' +
        '  ╚══════════════╝\n' +
        '```',
    )
  await interaction.reply({ embeds: [embed1] })

  await sleep(1500)

  // ── Phase 2: 빛이 난다 ──
  const glowColor =
    item.rarity === 'mythic' || item.rarity === 'legendary'
      ? 0xffd700
      : item.rarity === 'epic'
        ? 0x9b59b6
        : item.rarity === 'rare'
          ? 0x3498db
          : 0x808080

  const embed2 = new EmbedBuilder()
    .setColor(glowColor)
    .setTitle('🎰 가챠 돌리는 중...')
    .setDescription(
      '```\n' +
        '  ╔══════════════╗\n' +
        '  ║  ✨ ✨ ✨   ║\n' +
        '  ║   빛이 난다...  ║\n' +
        '  ╚══════════════╝\n' +
        '```',
    )
  await interaction.editReply({ embeds: [embed2] })

  await sleep(1500)

  // ── Phase 3: 등급 공개 ──
  const embed3 = new EmbedBuilder()
    .setColor(rarityColors[item.rarity])
    .setTitle('🎰 가챠!')
    .setDescription(
      `등급이 보인다...!\n\n## ${rarityLabels[item.rarity]}\n\n*아이템이 나타나는 중...*`,
    )
  await interaction.editReply({ embeds: [embed3] })

  await sleep(2000)

  // ── Phase 4: 최종 결과 ──
  addItem(user.id, {
    item_name: item.name,
    item_rarity: item.rarity,
    item_emoji: item.emoji,
    attack_bonus: item.attack,
    defense_bonus: item.defense,
    hp_bonus: item.hp,
    crit_bonus: item.crit,
  })

  const stats: string[] = []
  if (item.attack > 0) stats.push(`⚔️ 공격력 +${item.attack}`)
  if (item.defense > 0) stats.push(`🛡️ 방어력 +${item.defense}`)
  if (item.hp > 0) stats.push(`❤️ HP +${item.hp}`)
  if (item.crit > 0) stats.push(`🎯 크리티컬 +${(item.crit * 100).toFixed(0)}%`)

  const finalEmbed = new EmbedBuilder()
    .setColor(rarityColors[item.rarity])
    .setTitle('🎰 가챠 결과!')
    .setDescription(
      `${item.emoji} **${item.name}**\n` +
        `등급: ${rarityLabels[item.rarity]}\n\n` +
        (stats.length > 0 ? stats.join(' | ') : '특수 능력 없음'),
    )

  if (item.rarity === 'legendary' || item.rarity === 'mythic') {
    finalEmbed.addFields({
      name: '🎊 대박!!!',
      value:
        item.rarity === 'mythic'
          ? '🌟 **신화급 아이템 획득!!!** 서버 전체가 부러워합니다!'
          : '✨ **전설급 아이템 획득!** 축하합니다!',
    })
    if (item.rarity === 'mythic') {
      addTitle(user.id, guildId, '🦆 신화 수집가')
    }
  }

  if (item.rarity === 'common') {
    const sadMessages = [
      '😐 ...뭐, 세상이 다 그런 거지.',
      '🗑️ 이거 환불 안 되나요?',
      '💀 100G가 아깝다...',
      '😭 다음에는 전설이 나올 거야... 아마...',
    ]
    finalEmbed.addFields({
      name: '😢',
      value: pick(sadMessages),
    })
  }

  finalEmbed.setFooter({ text: `잔여 골드: ${player.gold - 100}G` })
  finalEmbed.setTimestamp()

  await interaction.editReply({ embeds: [finalEmbed] })
}
