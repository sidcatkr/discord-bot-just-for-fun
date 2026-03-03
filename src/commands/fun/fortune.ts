import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js'
import { pick, random, chance } from '../../db/helpers.js'

export const data = new SlashCommandBuilder()
  .setName('fortune')
  .setDescription('🔮 오늘의 운세를 확인한다!')

const categories = [
  { name: '💰 금전운', key: 'money' },
  { name: '❤️ 연애운', key: 'love' },
  { name: '💼 직장/학업운', key: 'work' },
  { name: '🍀 행운', key: 'luck' },
  { name: '⚔️ 전투운', key: 'battle' },
]

const fortunes: Record<string, Record<string, string[]>> = {
  money: {
    good: ['로또 당첨될 기운!', '지갑이 두둑해지는 날!', '투자 대박 예감!'],
    mid: ['용돈은 나올 듯', '적금이나 해봅시다', '커피값은 벌 수 있을 듯'],
    bad: [
      '통장 잔고 확인 금지',
      '지갑을 잃어버릴 수도...',
      '오늘은 돈 쓰지 마세요',
    ],
  },
  love: {
    good: ['오늘 고백하면 성공!', 'DM이 올 수도?!', '연애 플래그 발동!'],
    mid: ['그냥 평범한 하루', '짝사랑은 계속됩니다...', '마음의 준비를 하세요'],
    bad: ['차일 확률 200%', '읽씹 당할 운명', '솔로 유지 확정'],
  },
  work: {
    good: ['승진/합격 기운!', '과제 A+ 확정!', '상사가 칭찬해줄 날!'],
    mid: ['무난한 하루', '야근은 없을 듯', '커피 3잔은 필요'],
    bad: ['버그 30개 발생 예정', '교수님이 호출합니다...', '퇴사 충동 주의'],
  },
  luck: {
    good: [
      '사건사고 없는 평화로운 날!',
      '길에서 돈 주울 수도!',
      '모든 일이 술술 풀림!',
    ],
    mid: ['평범한 운세', '큰 일은 없을 듯', '소소한 행운 예감'],
    bad: [
      '발에 걸려 넘어질 수도',
      '비 올 확률 높음 (우산 챙기세요)',
      '오늘은 집에 있으세요',
    ],
  },
  battle: {
    good: ['크리티컬 잘 터지는 날!', '전투 승률 90%!', '보스도 원펀치!'],
    mid: [
      '평범한 전투력',
      '한 번은 이기고 한 번은 질 듯',
      '방어 위주로 플레이하세요',
    ],
    bad: [
      '회피 0%, 피격 100%',
      '나무 검으로 싸우는 기분',
      '오늘은 전투를 피하세요',
    ],
  },
}

const luckyItems = [
  '🥔 감자',
  '🦆 고무 오리',
  '🧦 빨간 양말',
  '☕ 아메리카노',
  '🍕 피자 한 조각',
  '📎 클립',
  '🎸 기타 픽',
  '🌂 우산',
  '🎲 주사위',
  '💎 다이아몬드 (가짜)',
  '🧸 곰인형',
  '🍜 라면',
]

export async function execute(interaction: ChatInputCommandInteraction) {
  const user = interaction.user

  // Use date + user ID as seed for consistency per day
  const today = new Date().toISOString().split('T')[0]
  const seed = hashCode(`${today}-${user.id}`)

  const embed = new EmbedBuilder()
    .setColor(0x9b59b6)
    .setTitle(`🔮 ${user.username}의 오늘의 운세`)
    .setThumbnail(user.displayAvatarURL())

  let totalScore = 0

  for (const cat of categories) {
    const catSeed = hashCode(`${seed}-${cat.key}`)
    const score = ((catSeed % 100) + 100) % 100
    totalScore += score

    let level: 'good' | 'mid' | 'bad'
    let stars: string
    if (score >= 70) {
      level = 'good'
      stars = '⭐'.repeat(5)
    } else if (score >= 40) {
      level = 'mid'
      stars = '⭐'.repeat(3) + '☆☆'
    } else {
      level = 'bad'
      stars = '⭐' + '☆☆☆☆'
    }

    const msg =
      fortunes[cat.key][level][
        (((catSeed >> 8) % fortunes[cat.key][level].length) +
          fortunes[cat.key][level].length) %
          fortunes[cat.key][level].length
      ]

    embed.addFields({
      name: `${cat.name} ${stars}`,
      value: msg,
      inline: false,
    })
  }

  const avgScore = Math.floor(totalScore / categories.length)
  const luckyItem =
    luckyItems[
      (((seed >> 4) % luckyItems.length) + luckyItems.length) %
        luckyItems.length
    ]

  embed.addFields(
    {
      name: '📊 종합 점수',
      value: `**${avgScore}점 / 100점**`,
      inline: true,
    },
    {
      name: '🍀 오늘의 행운 아이템',
      value: luckyItem,
      inline: true,
    },
  )

  embed.setFooter({ text: '같은 날에는 같은 운세가 나옵니다!' })
  embed.setTimestamp()

  await interaction.reply({ embeds: [embed] })
}

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  return hash
}
