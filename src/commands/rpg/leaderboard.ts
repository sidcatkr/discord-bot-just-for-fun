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

  const footerMemes = [
    '1등이 되면 뭐가 달라지냐고요? 아무것도요.',
    '순위표는 잔인합니다. 현실처럼.',
    '꼴등도 참가상은 있습니다. (없음)',
    '이 랭킹은 인생 랭킹과 무관합니다. 아마도.',
    '1등에게 주어지는 보상: 자기 만족',
  ]

  const embed = new EmbedBuilder()
    .setColor(0xffd700)
    .setTitle('🏆 서버 랭킹')
    .setDescription(lines.join('\n'))
    .setFooter({
      text: footerMemes[Math.floor(Math.random() * footerMemes.length)],
    })
    .setTimestamp()

  await interaction.reply({ embeds: [embed] })
}
