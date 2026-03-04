import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js'
import { getGoldRanking } from '../../db/helpers.js'

export const data = new SlashCommandBuilder()
  .setName('goldranking')
  .setDescription('💰 골드 랭킹을 확인합니다')

const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']

export async function execute(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId!
  const ranking = getGoldRanking(guildId, 10)

  if (ranking.length === 0) {
    await interaction.reply({
      content: '📊 아직 랭킹 데이터가 없습니다!',
      ephemeral: true,
    })
    return
  }

  const lines = ranking.map((player, i) => {
    const medal = medals[i] ?? `${i + 1}.`
    return `${medal} **${player.username}** — ${player.gold.toLocaleString()}G (Lv.${player.level})`
  })

  const embed = new EmbedBuilder()
    .setColor(0xffd700)
    .setTitle('💰 골드 랭킹 TOP 10')
    .setDescription(lines.join('\n'))
    .setFooter({ text: '낚시, 전투, 섬에서 골드를 벌어보세요!' })
    .setTimestamp()

  await interaction.reply({ embeds: [embed] })
}
