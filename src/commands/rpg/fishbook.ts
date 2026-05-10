import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from 'discord.js'
import { getCollectedFishIds } from '../../db/helpers.js'
import { fishPool, RARITIES, type FishRarity } from '../../data/fish-data.js'
import {
  renderCodexPage,
  type CodexEntry,
} from '../../render/cards/fish-codex-page.js'
import type { CardTier } from '../../render/theme.js'

const PAGE_SIZE = 12 // 4 cols × 3 rows

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
  .addIntegerOption((opt) =>
    opt
      .setName('page')
      .setDescription('도감 페이지 번호 (1부터)')
      .setMinValue(1),
  )

export async function execute(interaction: ChatInputCommandInteraction) {
  const user = interaction.user
  const guildId = interaction.guildId!
  const rarityFilter = interaction.options.getString('rarity') as
    | FishRarity
    | null
  const requestedPage = interaction.options.getInteger('page') ?? 1

  const { ids: collectedIds, legacyNames } = getCollectedFishIds(
    user.id,
    guildId,
  )

  // Filter + sort the catalogue (rarity grouping for stable order)
  const catalogue = fishPool.filter((f) =>
    rarityFilter ? f.rarity === rarityFilter : true,
  )
  catalogue.sort((a, b) => {
    const ra = RARITIES.indexOf(a.rarity)
    const rb = RARITIES.indexOf(b.rarity)
    if (ra !== rb) return ra - rb
    return a.name.localeCompare(b.name, 'ko')
  })

  // Completion stats use the unfiltered pool
  const totalAll = fishPool.length
  const totalCollected = fishPool.filter(
    (f) => collectedIds.has(f.id) || legacyNames.has(f.name),
  ).length

  const totalPages = Math.max(1, Math.ceil(catalogue.length / PAGE_SIZE))
  const page = Math.min(Math.max(1, requestedPage), totalPages)

  const start = (page - 1) * PAGE_SIZE
  const slice = catalogue.slice(start, start + PAGE_SIZE)

  const entries: CodexEntry[] = slice.map((f) => ({
    tier: f.rarity as CardTier,
    emoji: f.emoji,
    name: f.name,
    found: collectedIds.has(f.id) || legacyNames.has(f.name),
  }))

  const card = renderCodexPage({
    username: user.username,
    page,
    totalPages,
    collected: totalCollected,
    total: totalAll,
    entries,
  })

  const navHint =
    totalPages > 1
      ? `\n페이지 ${page}/${totalPages} — \`/fishbook page:${Math.min(page + 1, totalPages)}\` 로 다음 페이지`
      : ''

  await interaction.reply({
    content: `🐟 ${totalCollected}/${totalAll} 수집 완료${navHint}`,
    files: [card],
  })
}
