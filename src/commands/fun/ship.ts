import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js'
import { pick, random } from '../../db/helpers.js'

export const data = new SlashCommandBuilder()
  .setName('ship')
  .setDescription('🚢 서버에서 랜덤 커플을 매칭한다!')

const shipComments = {
  high: [
    '이 조합... 실화인가요?! 💕',
    '우주가 이 만남을 원했습니다 🌌',
    '당장 결혼하세요 💍',
    '소설보다 더 소설 같은 조합! 📖',
  ],
  mid: [
    '나쁘지 않은데...? 🤔',
    '한 번쯤 만나볼 만한 조합 ☕',
    '서로 맞는 부분이 있을 수도! ✨',
  ],
  low: [
    '이건... 좀 아닌 것 같은데... 😬',
    '우주가 반대합니다 🚫',
    '서로 500m 이내 접근 금지 🚷',
    '이 조합은 법적으로 금지해야 합니다 ⚖️',
  ],
}

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply()

  const guild = interaction.guild!
  const humanMembers = [
    ...guild.members.cache.filter((m) => !m.user.bot).values(),
  ]

  if (humanMembers.length < 2) {
    await interaction.editReply({
      content: '매칭할 사람이 부족합니다! 최소 2명 필요!',
    })
    return
  }

  // Pick two random different members
  const idx1 = Math.floor(Math.random() * humanMembers.length)
  let idx2 = Math.floor(Math.random() * humanMembers.length)
  while (idx2 === idx1) {
    idx2 = Math.floor(Math.random() * humanMembers.length)
  }

  const member1 = humanMembers[idx1]
  const member2 = humanMembers[idx2]
  const score = random(0, 100)

  // Combine names
  const name1 = member1.user.username
  const name2 = member2.user.username
  const splitPoint1 = Math.ceil(name1.length / 2)
  const splitPoint2 = Math.floor(name2.length / 2)
  const shipName = name1.slice(0, splitPoint1) + name2.slice(splitPoint2)

  let category: 'high' | 'mid' | 'low'
  let color: number
  if (score >= 70) {
    category = 'high'
    color = 0xff69b4
  } else if (score >= 40) {
    category = 'mid'
    color = 0xffd700
  } else {
    category = 'low'
    color = 0x808080
  }

  const hearts = score >= 70 ? '❤️🧡💛💚💙💜' : score >= 40 ? '💛💛💛' : '💔'

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle('🚢 랜덤 커플 매칭!')
    .setDescription(
      `${hearts}\n\n` +
        `**${member1.toString()}** ❤️ **${member2.toString()}**\n\n` +
        `커플명: **"${shipName}"**\n` +
        `궁합: **${score}%**\n\n` +
        `*${pick(shipComments[category])}*`,
    )
    .setFooter({
      text: '이 매칭은 100% 랜덤입니다. 진지하게 받아들이지 마세요!',
    })
    .setTimestamp()

  await interaction.editReply({ embeds: [embed] })
}
