import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js'
import { getOrCreatePlayer, getTitles } from '../../db/helpers.js'

export const data = new SlashCommandBuilder()
  .setName('profile')
  .setDescription('👤 프로필 카드를 확인합니다')
  .addUserOption((opt) =>
    opt.setName('target').setDescription('확인할 대상 (비워두면 본인)'),
  )

export async function execute(interaction: ChatInputCommandInteraction) {
  const target = interaction.options.getUser('target') ?? interaction.user
  const guildId = interaction.guildId!

  const player = getOrCreatePlayer(target.id, guildId, target.username)
  const titles = getTitles(target.id, guildId)

  const hpBar = makeBar(player.hp, player.max_hp, '❤️', '🖤')
  const xpBar = makeBar(player.xp, player.level * 100, '⭐', '☆')

  const embed = new EmbedBuilder()
    .setColor(0x3498db)
    .setTitle(`👤 ${target.username}의 프로필`)
    .setThumbnail(target.displayAvatarURL())
    .addFields(
      {
        name: '📊 기본 정보',
        value:
          `⭐ 레벨: **${player.level}**\n` +
          `❤️ HP: ${hpBar} **${player.hp}/${player.max_hp}**\n` +
          `✨ XP: ${xpBar} **${player.xp}/${player.level * 100}**\n` +
          `💰 골드: **${player.gold}G**`,
        inline: false,
      },
      {
        name: '⚔️ 전투 스탯',
        value:
          `공격력: **${player.attack}** | 방어력: **${player.defense}**\n` +
          `크리티컬: **${(player.crit_rate * 100).toFixed(0)}%** | 회피: **${(player.evasion * 100).toFixed(0)}%**`,
        inline: false,
      },
    )

  if (titles.length > 0) {
    embed.addFields({
      name: '🏷️ 칭호',
      value: titles.join(', '),
    })
  }

  embed.setTimestamp()
  await interaction.reply({ embeds: [embed] })
}

function makeBar(
  current: number,
  max: number,
  filledEmoji: string,
  emptyEmoji: string,
): string {
  const ratio = Math.max(0, Math.min(1, current / max))
  const filled = Math.round(ratio * 5)
  const empty = 5 - filled
  return filledEmoji.repeat(filled) + emptyEmoji.repeat(empty)
}
