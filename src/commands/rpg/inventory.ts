import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js'
import { getInventory, equipItem, getOrCreatePlayer } from '../../db/helpers.js'

const rarityLabels: Record<string, string> = {
  common: '⬜ 일반',
  uncommon: '🟩 고급',
  rare: '🟦 희귀',
  epic: '🟪 영웅',
  legendary: '🟨 전설',
  mythic: '🟥 신화',
}

export const data = new SlashCommandBuilder()
  .setName('inventory')
  .setDescription('🎒 인벤토리를 확인합니다')
  .addStringOption((opt) =>
    opt
      .setName('action')
      .setDescription('행동')
      .addChoices(
        { name: '📋 목록 보기', value: 'list' },
        { name: '⚔️ 장착하기', value: 'equip' },
      ),
  )
  .addIntegerOption((opt) =>
    opt.setName('item_id').setDescription('장착할 아이템 ID (equip 시)'),
  )

export async function execute(interaction: ChatInputCommandInteraction) {
  const user = interaction.user
  const guildId = interaction.guildId!
  const action = interaction.options.getString('action') ?? 'list'
  const itemId = interaction.options.getInteger('item_id')

  getOrCreatePlayer(user.id, guildId, user.username)

  if (action === 'equip' && itemId) {
    const items = getInventory(user.id)
    const item = items.find((i) => i.id === itemId)
    if (!item) {
      await interaction.reply({
        content: '❌ 해당 아이템을 찾을 수 없습니다!',
        ephemeral: true,
      })
      return
    }
    equipItem(user.id, itemId)
    await interaction.reply({
      content: `✅ **${item.item_emoji} ${item.item_name}** 을(를) 장착했습니다!`,
    })
    return
  }

  // List inventory
  const items = getInventory(user.id)

  if (items.length === 0) {
    await interaction.reply({
      content: '🎒 인벤토리가 비어있습니다! `/gacha`로 아이템을 획득하세요!',
      ephemeral: true,
    })
    return
  }

  const lines = items.map((item) => {
    const equipped = item.equipped ? ' **[장착중]**' : ''
    const stats: string[] = []
    if (item.attack_bonus > 0) stats.push(`⚔️+${item.attack_bonus}`)
    if (item.defense_bonus > 0) stats.push(`🛡️+${item.defense_bonus}`)
    if (item.hp_bonus > 0) stats.push(`❤️+${item.hp_bonus}`)
    if (item.crit_bonus > 0)
      stats.push(`🎯+${(item.crit_bonus * 100).toFixed(0)}%`)

    return `${item.item_emoji} **${item.item_name}** (${rarityLabels[item.item_rarity] ?? item.item_rarity}) [ID:${item.id}]${equipped}\n  ${stats.join(' | ')}`
  })

  // Paginate if too many
  const pageSize = 10
  const pages = Math.ceil(lines.length / pageSize)
  const page1 = lines.slice(0, pageSize)

  const embed = new EmbedBuilder()
    .setColor(0xffd700)
    .setTitle(`🎒 ${user.username}의 인벤토리`)
    .setDescription(page1.join('\n\n'))
    .setFooter({
      text: `총 ${items.length}개 아이템 | 장착: /inventory action:장착하기 item_id:[ID]${pages > 1 ? ` | 페이지 1/${pages}` : ''}`,
    })
    .setTimestamp()

  await interaction.reply({ embeds: [embed] })
}
