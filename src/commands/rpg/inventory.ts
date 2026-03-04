import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js'
import {
  getInventory,
  getOrCreatePlayer,
  getEffectiveStats,
} from '../../db/helpers.js'

const rarityLabels: Record<string, string> = {
  common: '⬜ 일반',
  uncommon: '🟩 고급',
  rare: '🟦 희귀',
  epic: '🟪 영웅',
  legendary: '🟨 전설',
  mythic: '🟥 신화',
}

const rarityOrder: Record<string, number> = {
  mythic: 0,
  legendary: 1,
  epic: 2,
  rare: 3,
  uncommon: 4,
  common: 5,
}

export const data = new SlashCommandBuilder()
  .setName('inventory')
  .setDescription('🎒 인벤토리를 확인합니다 (모든 아이템 자동 장착!)')

export async function execute(interaction: ChatInputCommandInteraction) {
  const user = interaction.user
  const guildId = interaction.guildId!

  getOrCreatePlayer(user.id, guildId, user.username)
  const items = getInventory(user.id)

  if (items.length === 0) {
    const emptyBagMessages = [
      '🎒 인벤토리가 비어있습니다! `/gacha`로 아이템을 획득하세요!',
      '🎒 가방이 텅 비었습니다. 먼지만 쌓여있네요.',
      '🎒 인벤토리: [ 공허함, 외로움, 먼지 ]',
      '🎒 아이템이 없습니다. 맨손으로 싸우시겠습니까? (Y/N)',
    ]
    await interaction.reply({
      content:
        emptyBagMessages[Math.floor(Math.random() * emptyBagMessages.length)],
      ephemeral: true,
    })
    return
  }

  // Sort by rarity (best first)
  items.sort(
    (a, b) =>
      (rarityOrder[a.item_rarity] ?? 99) - (rarityOrder[b.item_rarity] ?? 99),
  )

  const effective = getEffectiveStats(user.id, guildId)

  const lines = items.map((item) => {
    const stats: string[] = []
    if (item.attack_bonus > 0) stats.push(`⚔️+${item.attack_bonus}`)
    if (item.defense_bonus > 0) stats.push(`🛡️+${item.defense_bonus}`)
    if (item.hp_bonus > 0) stats.push(`❤️+${item.hp_bonus}`)
    if (item.crit_bonus > 0)
      stats.push(`🎯+${(item.crit_bonus * 100).toFixed(0)}%`)

    return `${item.item_emoji} **${item.item_name}** (${rarityLabels[item.item_rarity] ?? item.item_rarity})\n  ${stats.join(' | ')}`
  })

  // Paginate if too many
  const pageSize = 10
  const pages = Math.ceil(lines.length / pageSize)
  const page1 = lines.slice(0, pageSize)

  // Total bonus summary
  const bonusSummary = [
    `⚔️ 공격력 +${effective.totalAttackBonus}`,
    `🛡️ 방어력 +${effective.totalDefenseBonus}`,
    `❤️ HP +${effective.totalHpBonus}`,
    `🎯 크리티컬 +${(effective.totalCritBonus * 100).toFixed(0)}%`,
  ].join(' | ')

  const embed = new EmbedBuilder()
    .setColor(0xffd700)
    .setTitle(`🎒 ${user.username}의 인벤토리`)
    .setDescription(
      `📦 **보유 아이템: ${items.length}개** (전부 자동 장착!)\n` +
        `🔰 **총 보너스:** ${bonusSummary}\n\n` +
        `─────────────────────\n\n` +
        page1.join('\n\n'),
    )
    .setFooter({
      text: `모든 아이템이 자동으로 적용됩니다!${pages > 1 ? ` | 페이지 1/${pages}` : ''}`,
    })
    .setTimestamp()

  await interaction.reply({ embeds: [embed] })
}
