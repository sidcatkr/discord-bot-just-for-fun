import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js'
import { getLeaderboard } from '../../db/helpers.js'

export const data = new SlashCommandBuilder()
  .setName('leaderboard')
  .setDescription('🏆 서버 레벨 랭킹을 확인합니다')

export async function execute(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId!
  const top = getLeaderboard(guildId)

  if (top.length === 0) {
    await interaction.reply({ content: '아직 플레이어가 없습니다!' })
    return
  }

  const lines = top.map((p, i) => {
    const medal =
      i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**${i + 1}.**`
    return `${medal} **${p.username}** — Lv.${p.level} (XP: ${p.xp}) | 💰 ${p.gold}G | ❤️ ${p.hp}/${p.max_hp}`
  })

  const embed = new EmbedBuilder()
    .setColor(0xffd700)
    .setTitle('🏆 서버 랭킹')
    .setDescription(lines.join('\n'))
    .setTimestamp()

  await interaction.reply({ embeds: [embed] })
}
