import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js'
import {
  getOrCreatePlayer,
  addGold,
  addItem,
  isPlayerDead,
  pick,
  sleep,
  random,
  chance,
} from '../../db/helpers.js'
import {
  gachaPool,
  rarityColors,
  rarityLabels,
  type GachaItem,
} from '../../data/gacha-items.js'

// ── Rarity weights ──
const RARITY_WEIGHTS: Record<string, number> = {
  common: 45,
  uncommon: 25,
  rare: 15,
  epic: 9,
  legendary: 4.5,
  mythic: 1.5,
}

const SINGLE_COST = 50
const TEN_PULL_COST = 450 // 10% discount

function rollItemRarity(): string {
  const roll = Math.random() * 100
  let cumulative = 0
  for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
    cumulative += weight
    if (roll < cumulative) return rarity
  }
  return 'common'
}

function rollItem(): GachaItem {
  const rarity = rollItemRarity()
  const pool = gachaPool.filter((i) => i.rarity === rarity)
  if (pool.length === 0) return pick(gachaPool)
  return pick(pool)
}

export const data = new SlashCommandBuilder()
  .setName('itemgacha')
  .setDescription('🎲 골드로 아이템 가챠! 전투용 장비를 뽑습니다.')
  .addIntegerOption((opt) =>
    opt
      .setName('count')
      .setDescription('뽑기 횟수')
      .addChoices(
        { name: `1회 (${SINGLE_COST}G)`, value: 1 },
        { name: `10연차 (${TEN_PULL_COST}G, 10% 할인)`, value: 10 },
      ),
  )

export async function execute(interaction: ChatInputCommandInteraction) {
  const user = interaction.user
  const guildId = interaction.guildId!
  const count = interaction.options.getInteger('count') ?? 1
  const totalCost = count === 10 ? TEN_PULL_COST : SINGLE_COST * count

  if (isPlayerDead(user.id, guildId)) {
    await interaction.reply({
      content: '💀 HP가 0입니다! `/heal`로 회복하세요.',
      ephemeral: true,
    })
    return
  }

  const player = getOrCreatePlayer(user.id, guildId, user.username)
  if (player.gold < totalCost) {
    await interaction.reply({
      content: `💰 골드가 부족합니다! (필요: ${totalCost}G, 보유: ${player.gold}G)`,
      ephemeral: true,
    })
    return
  }

  addGold(user.id, guildId, -totalCost)

  if (count === 10) {
    const loadEmbed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle('🎲 아이템 가챠 — 10연차')
      .setDescription('> 🎰🎰🎰🎰🎰🎰🎰🎰🎰🎰\n\n**뽑는 중...**')
    await interaction.reply({ embeds: [loadEmbed] })
    await sleep(2000)

    const results: GachaItem[] = []
    for (let i = 0; i < 10; i++) {
      results.push(rollItem())
    }

    // Add to inventory
    for (const item of results) {
      if (item.type === 'equipment') {
        addItem(user.id, {
          item_name: item.name,
          item_rarity: item.rarity,
          item_emoji: item.emoji,
          attack_bonus: item.attack,
          defense_bonus: item.defense,
          hp_bonus: item.hp,
          crit_bonus: item.crit,
        })
      }
    }

    const bestRarity = results.reduce((best, r) => {
      const order = [
        'common',
        'uncommon',
        'rare',
        'epic',
        'legendary',
        'mythic',
      ]
      return order.indexOf(r.rarity) > order.indexOf(best) ? r.rarity : best
    }, 'common')

    const resultLines = results
      .map((r, i) => {
        const stats = []
        if (r.attack > 0) stats.push(`⚔️+${r.attack}`)
        if (r.defense > 0) stats.push(`🛡️+${r.defense}`)
        if (r.hp > 0) stats.push(`❤️+${r.hp}`)
        if (r.crit > 0) stats.push(`🎯+${(r.crit * 100).toFixed(0)}%`)
        const statStr = stats.length > 0 ? ` (${stats.join(' ')})` : ''
        return `${i + 1}. ${r.emoji} **${r.name}** ${rarityLabels[r.rarity]}${statStr}`
      })
      .join('\n')

    const rarityCount = Object.entries(RARITY_WEIGHTS)
      .map(([r]) => {
        const cnt = results.filter((i) => i.rarity === r).length
        return cnt > 0 ? `${rarityLabels[r]} ×${cnt}` : ''
      })
      .filter(Boolean)
      .join(' | ')

    const finalEmbed = new EmbedBuilder()
      .setColor(rarityColors[bestRarity])
      .setTitle('🎲 아이템 가챠 — 10연차 결과!')
      .setDescription(resultLines)
      .addFields({ name: '📊 등급 요약', value: rarityCount })
      .setFooter({
        text: `사용: ${totalCost}G | 잔여: ${player.gold - totalCost}G`,
      })
      .setTimestamp()

    if (
      results.some((r) => r.rarity === 'legendary' || r.rarity === 'mythic')
    ) {
      finalEmbed.addFields({
        name: '🎊 대박!',
        value: results.some((r) => r.rarity === 'mythic')
          ? '🟥 **신화급 아이템 등장!!!**'
          : '🟨 **전설급 아이템!**',
      })
    }

    await interaction.editReply({ embeds: [finalEmbed] })
  } else {
    // Single pull
    const loadEmbed = new EmbedBuilder()
      .setColor(0x2c2f33)
      .setTitle('🎲 아이템 가챠')
      .setDescription('> 🎰 🎲 🃏\n\n**뽑는 중...**')
    await interaction.reply({ embeds: [loadEmbed] })
    await sleep(1500)

    const item = rollItem()

    if (item.type === 'equipment') {
      addItem(user.id, {
        item_name: item.name,
        item_rarity: item.rarity,
        item_emoji: item.emoji,
        attack_bonus: item.attack,
        defense_bonus: item.defense,
        hp_bonus: item.hp,
        crit_bonus: item.crit,
      })
    }

    const stats = []
    if (item.attack > 0) stats.push(`⚔️ 공격력 +${item.attack}`)
    if (item.defense > 0) stats.push(`🛡️ 방어력 +${item.defense}`)
    if (item.hp > 0) stats.push(`❤️ HP +${item.hp}`)
    if (item.crit > 0) stats.push(`🎯 치명타 +${(item.crit * 100).toFixed(1)}%`)

    const finalEmbed = new EmbedBuilder()
      .setColor(rarityColors[item.rarity])
      .setTitle('🎲 아이템 가챠 — 결과!')
      .setDescription(
        `${item.emoji} **${item.name}**\n` +
          `등급: ${rarityLabels[item.rarity]}\n` +
          `타입: ${item.type === 'equipment' ? '장비' : item.type === 'consumable' ? '소모품' : '재료'}\n\n` +
          (stats.length > 0 ? stats.join('\n') : '*(스탯 없음)*'),
      )
      .setFooter({
        text: `사용: ${SINGLE_COST}G | 잔여: ${player.gold - SINGLE_COST}G`,
      })
      .setTimestamp()

    if (item.rarity === 'mythic') {
      finalEmbed.addFields({
        name: '🟥 신화급!!!',
        value: '축하합니다! 신화급 아이템을 뽑았습니다!',
      })
    } else if (item.rarity === 'legendary') {
      finalEmbed.addFields({
        name: '🟨 전설급!',
        value: '전설급 아이템! 운이 좋군요!',
      })
    } else if (item.rarity === 'common') {
      const sadMsgs = [
        '🗑️ ...이걸 50G 주고 뽑았다고?',
        '📉 골드가 아깝다...',
        '🤡 확률은 거짓말을 하지 않습니다.',
      ]
      finalEmbed.addFields({ name: '😢', value: pick(sadMsgs) })
    }

    await interaction.editReply({ embeds: [finalEmbed] })
  }
}
