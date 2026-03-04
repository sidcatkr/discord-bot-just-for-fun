import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js'

export const data = new SlashCommandBuilder()
  .setName('tierlist')
  .setDescription('📊 서버 멤버 랜덤 티어 분류!')

const tiers = ['S', 'A', 'B', 'C', 'D', 'F', 'SSS', '???']
const tierEmojis: Record<string, string> = {
  SSS: '🌟',
  S: '👑',
  A: '⭐',
  B: '✅',
  C: '😐',
  D: '😬',
  F: '💀',
  '???': '👽',
}
const tierColors: Record<string, string> = {
  SSS: '🟥',
  S: '🟧',
  A: '🟨',
  B: '🟩',
  C: '🟦',
  D: '🟪',
  F: '⬛',
  '???': '⬜',
}

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply()

  const guild = interaction.guild!
  const humanMembers = guild.members.cache.filter((m) => !m.user.bot)

  const tierMap: Record<string, string[]> = {}
  for (const tier of tiers) {
    tierMap[tier] = []
  }

  humanMembers.forEach((member) => {
    const tier = tiers[Math.floor(Math.random() * tiers.length)]
    tierMap[tier].push(member.user.username)
  })

  const lines = tiers
    .filter((t) => tierMap[t].length > 0)
    .map((tier) => {
      const emoji = tierEmojis[tier]
      const color = tierColors[tier]
      const members = tierMap[tier].join(', ')
      return `${color} **${emoji} ${tier} 티어**: ${members}`
    })

  const embed = new EmbedBuilder()
    .setColor(0xff6b6b)
    .setTitle('📊 서버 티어 리스트')
    .setDescription(lines.join('\n\n') || '멤버가 없습니다!')
    .setFooter({
      text: '⚠️ 이 티어는 매번 랜덤입니다. 진지하게 받아들이지 마세요!',
    })
    .setTimestamp()

  await interaction.editReply({ embeds: [embed] })
}
