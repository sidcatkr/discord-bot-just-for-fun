import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js'
import {
  getOrCreatePlayer,
  getOrCreateRelationship,
  updateRelationship,
  addTitle,
  chance,
  random,
  pick,
} from '../../db/helpers.js'

export const data = new SlashCommandBuilder()
  .setName('love')
  .setDescription('❤️ 누군가와의 궁합을 확인한다!')
  .addUserOption((opt) =>
    opt.setName('target').setDescription('궁합 상대').setRequired(true),
  )

const loveMessages = {
  high: [
    '💕 두 사람은 운명의 상대입니다!',
    '💝 전생에 연인이었을 확률 99%',
    '💗 하늘이 맺어준 인연!',
    '🥰 이미 양쪽 부모님이 결혼 허락하셨습니다',
  ],
  mid: [
    '💛 괜찮은 궁합! 노력하면 발전 가능!',
    '🤝 친구에서 연인으로? 가능성 있음!',
    '😊 나쁘지 않은 궁합이네요~',
  ],
  low: [
    '💔 이건... 좀 힘들 수도...',
    '😬 서로 다른 세계의 사람들...',
    '🚫 차단각입니다.',
    '💀 이 조합은 우주가 금지했습니다',
  ],
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const target = interaction.options.getUser('target', true)
  const user = interaction.user

  if (target.id === user.id) {
    await interaction.reply({
      content: '🪞 자기 자신과의 궁합? 100%! 나르시시스트!',
      ephemeral: true,
    })
    return
  }

  const guildId = interaction.guildId!
  getOrCreatePlayer(user.id, guildId, user.username)
  getOrCreatePlayer(target.id, guildId, target.username)

  const rel = getOrCreateRelationship(user.id, target.id, guildId)

  // Add some random variance each time but trend toward the stored affinity
  const variance = random(-10, 10)
  let newAffinity = Math.max(0, Math.min(100, rel.affinity + variance))

  // Small chance of massive shift
  if (chance(5)) {
    newAffinity = random(0, 100)
  }

  updateRelationship(user.id, target.id, guildId, { affinity: newAffinity })

  const score = newAffinity
  let category: 'high' | 'mid' | 'low'
  let color: number

  if (score >= 80) {
    category = 'high'
    color = 0xff69b4
  } else if (score >= 40) {
    category = 'mid'
    color = 0xffd700
  } else {
    category = 'low'
    color = 0x808080
  }

  const hearts = '❤️'.repeat(Math.ceil(score / 20)) || '💔'

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`💘 궁합 테스트`)
    .setDescription(
      `${user.toString()} ❤️ ${target.toString()}\n\n` +
        `**궁합 점수: ${score}%**\n` +
        `${hearts}\n\n` +
        `${pick(loveMessages[category])}`,
    )

  if (score >= 90) {
    if (!rel.is_couple) {
      updateRelationship(user.id, target.id, guildId, { is_couple: 1 })
      embed.addFields({
        name: '🎊 공식 커플 등극!',
        value: '축하합니다! 서버 공식 커플이 되었습니다!',
      })
      addTitle(user.id, guildId, '💑 공식 커플')
      addTitle(target.id, guildId, '💑 공식 커플')
    } else {
      embed.addFields({
        name: '💑 이미 공식 커플',
        value: '영원한 사랑~ 🥰',
      })
    }
  }

  if (score <= 10) {
    embed.addFields({
      name: '🚫 차단각',
      value: '서로 500m 이내 접근 금지를 권고합니다.',
    })
    addTitle(user.id, guildId, '💔 차단각 마스터')
  }

  embed.setTimestamp()
  await interaction.reply({ embeds: [embed] })
}
