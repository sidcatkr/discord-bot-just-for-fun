import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js'
import { getCollectedItemNames } from '../../db/helpers.js'
import {
  gachaPool,
  rarityLabels,
  rarityColors,
} from '../../data/gacha-items.js'

export const data = new SlashCommandBuilder()
  .setName('itembook')
  .setDescription('📖 아이템 도감을 확인합니다')
  .addStringOption((opt) =>
    opt
      .setName('rarity')
      .setDescription('등급별 필터')
      .setRequired(true)
      .addChoices(
        { name: '⬜ 일반', value: 'common' },
        { name: '🟩 고급', value: 'uncommon' },
        { name: '🟦 희귀', value: 'rare' },
        { name: '🟪 영웅', value: 'epic' },
        { name: '🟨 전설', value: 'legendary' },
        { name: '🟥 신화', value: 'mythic' },
      ),
  )
  .addIntegerOption((opt) =>
    opt.setName('page').setDescription('페이지 번호 (기본: 1)'),
  )

export async function execute(interaction: ChatInputCommandInteraction) {
  const user = interaction.user
  const rarityFilter = interaction.options.getString('rarity', true)
  const page = Math.max(1, interaction.options.getInteger('page') ?? 1)

  const collected = new Set(getCollectedItemNames(user.id))

  const filteredItems = gachaPool.filter((i) => i.rarity === rarityFilter)
  const totalAll = gachaPool.length
  const totalCollected = gachaPool.filter((i) => collected.has(i.name)).length
  const completionRate = ((totalCollected / totalAll) * 100).toFixed(1)

  const rarityCollected = filteredItems.filter((i) =>
    collected.has(i.name),
  ).length

  // Paginate
  const pageSize = 20
  const totalPages = Math.ceil(filteredItems.length / pageSize)
  const safePage = Math.min(page, totalPages)
  const startIdx = (safePage - 1) * pageSize
  const pageItems = filteredItems.slice(startIdx, startIdx + pageSize)

  const lines: string[] = []
  for (const item of pageItems) {
    const found = collected.has(item.name)
    if (found) {
      const stats: string[] = []
      if (item.attack > 0) stats.push(`⚔️${item.attack}`)
      if (item.defense > 0) stats.push(`🛡️${item.defense}`)
      if (item.hp > 0) stats.push(`❤️${item.hp}`)
      if (item.crit > 0) stats.push(`🎯${(item.crit * 100).toFixed(0)}%`)
      lines.push(`${item.emoji} **${item.name}** — ${stats.join(' ')}`)
    } else {
      lines.push(`❓ ??? — *아직 획득하지 못했습니다*`)
    }
  }

  const embed = new EmbedBuilder()
    .setColor(rarityColors[rarityFilter] ?? 0x808080)
    .setTitle(`📖 아이템 도감 — ${rarityLabels[rarityFilter]}`)
    .setDescription(
      `📦 **전체 도감 완성도:** ${totalCollected}/${totalAll} (${completionRate}%)\n` +
        `${rarityLabels[rarityFilter]} **수집:** ${rarityCollected}/${filteredItems.length}\n` +
        `─────────────────────\n\n` +
        lines.join('\n'),
    )
    .setFooter({
      text: `페이지 ${safePage}/${totalPages} | /itembook rarity:[등급] page:[번호]`,
    })
    .setTimestamp()

  await interaction.reply({ embeds: [embed] })
}
