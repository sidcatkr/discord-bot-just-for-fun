import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js'
import { getCollectedFishNames } from '../../db/helpers.js'
import {
  fishPool,
  fishRarityLabels,
  fishRarityColors,
} from '../../data/fish-data.js'

export const data = new SlashCommandBuilder()
  .setName('fishbook')
  .setDescription('📖 물고기 도감을 확인합니다')
  .addStringOption((opt) =>
    opt
      .setName('rarity')
      .setDescription('등급별 필터')
      .addChoices(
        { name: '⬜ 일반', value: 'common' },
        { name: '🟩 고급', value: 'uncommon' },
        { name: '🟦 희귀', value: 'rare' },
        { name: '🟪 영웅', value: 'epic' },
        { name: '🟨 전설', value: 'legendary' },
        { name: '🟥 신화', value: 'mythic' },
      ),
  )

export async function execute(interaction: ChatInputCommandInteraction) {
  const user = interaction.user
  const guildId = interaction.guildId!
  const rarityFilter = interaction.options.getString('rarity')

  const collected = new Set(getCollectedFishNames(user.id, guildId))
  const allFish = rarityFilter
    ? fishPool.filter((f) => f.rarity === rarityFilter)
    : fishPool

  const totalAll = fishPool.length
  const totalCollected = fishPool.filter((f) => collected.has(f.name)).length
  const completionRate = ((totalCollected / totalAll) * 100).toFixed(1)

  // Group by rarity
  const rarityOrder = [
    'common',
    'uncommon',
    'rare',
    'epic',
    'legendary',
    'mythic',
  ]
  const grouped: Record<string, typeof allFish> = {}
  for (const fish of allFish) {
    if (!grouped[fish.rarity]) grouped[fish.rarity] = []
    grouped[fish.rarity].push(fish)
  }

  const lines: string[] = []

  for (const rarity of rarityOrder) {
    const fishList = grouped[rarity]
    if (!fishList || fishList.length === 0) continue

    const rarityCollected = fishList.filter((f) => collected.has(f.name)).length
    lines.push(
      `\n**${fishRarityLabels[rarity]}** (${rarityCollected}/${fishList.length})`,
    )

    for (const fish of fishList) {
      const found = collected.has(fish.name)
      if (found) {
        lines.push(`${fish.emoji} ${fish.name} — *${fish.description}*`)
      } else {
        lines.push(`❓ ??? — *아직 발견하지 못했습니다*`)
      }
    }
  }

  // Paginate — embed description limit
  const fullText = lines.join('\n')
  const displayText =
    fullText.length > 3800
      ? fullText.slice(0, 3800) + '\n\n*...더 있습니다*'
      : fullText

  const embed = new EmbedBuilder()
    .setColor(0x1e90ff)
    .setTitle(`📖 ${user.username}의 물고기 도감`)
    .setDescription(
      `🐟 **도감 완성도:** ${totalCollected}/${totalAll} (${completionRate}%)\n` +
        `─────────────────────\n` +
        displayText,
    )
    .setFooter({ text: '낚시로 새로운 물고기를 발견하세요!' })
    .setTimestamp()

  await interaction.reply({ embeds: [embed] })
}
