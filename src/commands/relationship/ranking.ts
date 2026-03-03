import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js'
import { getTopRelationships, getMostHated } from '../../db/helpers.js'

export const data = new SlashCommandBuilder()
  .setName('ranking')
  .setDescription('👑 서버 관계 랭킹을 확인합니다')
  .addStringOption((opt) =>
    opt
      .setName('type')
      .setDescription('랭킹 종류')
      .setRequired(true)
      .addChoices(
        { name: '❤️ 호감도 TOP', value: 'love' },
        { name: '💔 혐오도 TOP', value: 'hate' },
      ),
  )

export async function execute(interaction: ChatInputCommandInteraction) {
  const type = interaction.options.getString('type', true)
  const guildId = interaction.guildId!

  if (type === 'love') {
    const top = getTopRelationships(guildId)
    if (top.length === 0) {
      await interaction.reply({ content: '아직 관계 데이터가 없습니다!' })
      return
    }

    const lines = top.map((r, i) => {
      const medal =
        i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`
      const couple = r.is_couple ? ' 💑' : ''
      return `${medal} <@${r.user1_id}> ❤️ <@${r.user2_id}> — **${r.affinity}%**${couple}`
    })

    const embed = new EmbedBuilder()
      .setColor(0xff69b4)
      .setTitle('❤️ 호감도 랭킹')
      .setDescription(lines.join('\n'))
      .setTimestamp()

    await interaction.reply({ embeds: [embed] })
  } else {
    const top = getMostHated(guildId)
    if (top.length === 0) {
      await interaction.reply({ content: '아직 관계 데이터가 없습니다!' })
      return
    }

    const lines = top.map((r, i) => {
      const medal =
        i === 0 ? '💀' : i === 1 ? '☠️' : i === 2 ? '👻' : `${i + 1}.`
      return `${medal} <@${r.user1_id}> 💔 <@${r.user2_id}> — 신뢰도 **${r.trust}%**`
    })

    const embed = new EmbedBuilder()
      .setColor(0x8b0000)
      .setTitle('💔 혐오도 랭킹 (신뢰도 최저)')
      .setDescription(lines.join('\n'))
      .setTimestamp()

    await interaction.reply({ embeds: [embed] })
  }
}
