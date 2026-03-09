import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js'
import {
  getOrCreatePlayer,
  addGold,
  addItem,
  addTitle,
  isPlayerDead,
  pick,
  sleep,
  getUserFortune,
  getGachaPity,
  incrementGachaPity,
  resetGachaPity,
} from '../../db/helpers.js'
import {
  gachaPool,
  rarityColors,
  rarityLabels,
  type GachaItem,
} from '../../data/gacha-items.js'

// Track users currently rolling gacha
const rollingUsers = new Set<string>()

export const data = new SlashCommandBuilder()
  .setName('gacha')
  .setDescription('🎰 가챠를 돌린다! (비용: 300G)')
  .addIntegerOption((opt) =>
    opt
      .setName('count')
      .setDescription('뽑기 횟수 (1 또는 10)')
      .addChoices(
        { name: '1연차 (300G)', value: 1 },
        { name: '10연차 (2700G, 10% 할인!)', value: 10 },
      ),
  )

function rollGacha(_u?: string): GachaItem {
  const _fortune = _u ? getUserFortune(_u) : null
  const _gb = _fortune?.gacha_bonus ?? 0
  const _g = _gb > 0
  const roll = Math.random() * 100
  let rarity: string

  if (roll < 1 + _gb) rarity = 'mythic'
  else if (roll < 5 + _gb * 1.5) rarity = 'legendary'
  else if (roll < 15 + _gb * 1.2) rarity = 'epic'
  else if (roll < 30 + _gb) rarity = 'rare'
  else if (roll < 55) rarity = 'uncommon'
  else rarity = 'common'

  const pool = gachaPool.filter((i) => i.rarity === rarity)
  return pick(pool)
}

// ── 픽뚫 (Pity) constants ──
const PITY_THRESHOLD = 90 // 90연차 천장: 전설급 보장
const PITY_GOLD_REFUND = 150 // 픽뚫 시 골드 반환량

function rollWithPity(
  userId: string,
  guildId: string,
): { item: GachaItem; pitied: boolean } {
  const newCount = incrementGachaPity(userId, guildId)
  if (newCount >= PITY_THRESHOLD) {
    // Force legendary
    const pool = gachaPool.filter((i) => i.rarity === 'legendary')
    const item = pick(pool)
    resetGachaPity(userId, guildId)
    return { item, pitied: true }
  }
  const item = rollGacha(userId)
  if (item.rarity === 'legendary' || item.rarity === 'mythic') {
    resetGachaPity(userId, guildId)
  }
  return { item, pitied: false }
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const user = interaction.user
  const guildId = interaction.guildId!
  const count = interaction.options.getInteger('count') ?? 1
  const cost = count === 10 ? 2700 : 300

  const player = getOrCreatePlayer(user.id, guildId, user.username)

  // Prevent concurrent gacha rolls
  const userKey = `${user.id}:${guildId}`
  if (rollingUsers.has(userKey)) {
    await interaction.reply({
      content:
        '🎰 이미 가챠를 돌리는 중입니다! 결과가 나올 때까지 기다려주세요.',
      ephemeral: true,
    })
    return
  }

  // HP=0 death check
  if (isPlayerDead(user.id, guildId)) {
    const deathGachaMessages = [
      '💀 HP가 0입니다! 활동할 수 없습니다.\n`/heal`로 회복하거나 `/daily`로 보상을 받으세요.',
      '💀 죽어서 가챠를 돌리면... 저승에서 씀 수 있나요?\n`/heal`로 부활하세요.',
      '💀 죽은 사람의 돈을 쓰려는 것은 범죄입니다. (HP 0)\n`/heal`로 회복하세요.',
      '💀 유언장에 "가챠 300G 환불해주세요" 라고 적을까요?\n`/heal`로 부활하세요.',
      '💀 이승에서 못 뽑은 전설을 저승에서 뽑으려고요?\n`/heal`로 회복하세요.',
      '💀 가챠 중독은 죽어서도 못 고치는군요...\n`/heal`로 부활하세요.',
    ]
    await interaction.reply({
      content: pick(deathGachaMessages),
      ephemeral: true,
    })
    return
  }

  if (player.gold < cost) {
    await interaction.reply({
      content: `💰 골드가 부족합니다! (현재: ${player.gold}G / 필요: ${cost}G)\n\`/daily\`로 골드를 모으세요!`,
      ephemeral: true,
    })
    return
  }

  rollingUsers.add(userKey)
  addGold(user.id, guildId, -cost)

  if (count === 10) {
    // ══════════ 10-pull gacha ══════════
    const embed1 = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle('🎰 10연차 돌리는 중...')
      .setDescription(
        `> 🎰🎰🎰🎰🎰🎰🎰🎰🎰🎰\n\n**슬롯 10개가 동시에 돌아갑니다...!**`,
      )
    await interaction.reply({ embeds: [embed1] })
    await sleep(2000)

    // Roll all 10
    const items: GachaItem[] = []
    const pitiedIndices: number[] = []
    let totalPityRefund = 0
    for (let i = 0; i < 10; i++) {
      const { item, pitied } = rollWithPity(user.id, guildId)
      items.push(item)
      if (pitied) {
        pitiedIndices.push(i)
        totalPityRefund += PITY_GOLD_REFUND
        addGold(user.id, guildId, PITY_GOLD_REFUND)
      }
    }

    // Add items to inventory
    for (const item of items) {
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

    // Count by rarity
    const rarityCounts: Record<string, number> = {}
    for (const item of items) {
      rarityCounts[item.rarity] = (rarityCounts[item.rarity] ?? 0) + 1
    }

    // Build result lines
    const resultLines = items
      .map((item, i) => {
        const stats: string[] = []
        if (item.attack > 0) stats.push(`⚔️+${item.attack}`)
        if (item.defense > 0) stats.push(`🛡️+${item.defense}`)
        if (item.hp > 0) stats.push(`❤️+${item.hp}`)
        if (item.crit > 0) stats.push(`🎯+${(item.crit * 100).toFixed(0)}%`)
        const statStr = stats.length > 0 ? ` (${stats.join(' ')})` : ''
        const pityTag = pitiedIndices.includes(i) ? ' 🛡️픽뚫' : ''
        return `${i + 1}. ${item.emoji} **${item.name}** ${rarityLabels[item.rarity]}${statStr}${pityTag}`
      })
      .join('\n')

    // Check for titles
    if (items.some((i) => i.rarity === 'mythic')) {
      addTitle(user.id, guildId, '🦆 신화 수집가')
    }

    // Best rarity for embed color
    const rarityOrder = [
      'common',
      'uncommon',
      'rare',
      'epic',
      'legendary',
      'mythic',
    ]
    const bestRarity = items.reduce((best, item) =>
      rarityOrder.indexOf(item.rarity) > rarityOrder.indexOf(best.rarity)
        ? item
        : best,
    )

    // Glow animation
    const embed2 = new EmbedBuilder()
      .setColor(rarityColors[bestRarity.rarity])
      .setTitle('🎰 10연차!')
      .setDescription(
        `> ✨✨✨ 빛이 쏟아진다...!\n\n*10개의 아이템이 나타나는 중...*`,
      )
    await interaction.editReply({ embeds: [embed2] })
    await sleep(2000)

    // Final result
    const finalEmbed = new EmbedBuilder()
      .setColor(rarityColors[bestRarity.rarity])
      .setTitle('🎰 10연차 결과!')
      .setDescription(resultLines)

    // Summary line
    const summaryParts: string[] = []
    for (const r of rarityOrder.reverse()) {
      if (rarityCounts[r]) {
        summaryParts.push(`${rarityLabels[r]} ×${rarityCounts[r]}`)
      }
    }
    finalEmbed.addFields({
      name: '📊 등급 요약',
      value: summaryParts.join(' | ') || '없음',
    })

    if (items.some((i) => i.rarity === 'mythic')) {
      finalEmbed.addFields({
        name: '🎊 대박!!!',
        value: '🌟 **신화급 아이템이 10연차에서 나왔습니다!!!**',
      })
    } else if (items.some((i) => i.rarity === 'legendary')) {
      finalEmbed.addFields({
        name: '🎊 대박!',
        value: '✨ **전설급 아이템 발견!** 축하합니다!',
      })
    } else if (items.every((i) => i.rarity === 'common')) {
      finalEmbed.addFields({
        name: '😭',
        value: '2700G로 꽝 10개를 뽑았습니다. 축하합니다... 아니, 위로합니다.',
      })
    }

    if (pitiedIndices.length > 0) {
      finalEmbed.addFields({
        name: '🛡️ 픽뚫 발동!',
        value: `**${pitiedIndices.length}회 천장(${PITY_THRESHOLD}연차) 도달!** 전설급 보장 + ${totalPityRefund}G 반환`,
      })
    }

    const currentPity10 = getGachaPity(user.id, guildId)
    finalEmbed
      .setFooter({
        text: `잔여 골드: ${player.gold - cost + totalPityRefund}G | 픽뚫: ${currentPity10}/${PITY_THRESHOLD} | 비용: ${cost}G (10% 할인)`,
      })
      .setTimestamp()

    await interaction.editReply({ embeds: [finalEmbed] })
    rollingUsers.delete(userKey)
    return
  }

  // ══════════ Single pull (original) ══════════
  const { item, pitied } = rollWithPity(user.id, guildId)
  if (pitied) {
    addGold(user.id, guildId, PITY_GOLD_REFUND)
  }

  // ── Phase 1: 돌리는 중 ──
  const embed1 = new EmbedBuilder()
    .setColor(0x2c2f33)
    .setTitle('🎰 가챠 돌리는 중...')
    .setDescription(`> 🎰 🎲 🃏 ✨\n\n` + `**슬롯이 돌아가고 있습니다...**`)
  await interaction.reply({ embeds: [embed1] })

  await sleep(1500)

  // ── Phase 2: 빛이 난다 ──
  const glowColor =
    item.rarity === 'mythic' || item.rarity === 'legendary'
      ? 0xffd700
      : item.rarity === 'epic'
        ? 0x9b59b6
        : item.rarity === 'rare'
          ? 0x3498db
          : 0x808080

  const glowEmoji =
    item.rarity === 'mythic'
      ? '🌟🌟🌟'
      : item.rarity === 'legendary'
        ? '✨✨✨'
        : item.rarity === 'epic'
          ? '💜💜💜'
          : item.rarity === 'rare'
            ? '💙💙💙'
            : item.rarity === 'uncommon'
              ? '💚💚💚'
              : '⬜⬜⬜'

  const embed2 = new EmbedBuilder()
    .setColor(glowColor)
    .setTitle('🎰 가챠 돌리는 중...')
    .setDescription(`> ${glowEmoji}\n\n` + `**뭔가 빛이 나기 시작합니다...!**`)
  await interaction.editReply({ embeds: [embed2] })

  await sleep(1500)

  // ── Phase 3: 등급 공개 ──
  const embed3 = new EmbedBuilder()
    .setColor(rarityColors[item.rarity])
    .setTitle('🎰 가챠!')
    .setDescription(
      `> 등급이 보인다...!\n\n## ${rarityLabels[item.rarity]}\n\n*아이템이 나타나는 중...*`,
    )
  await interaction.editReply({ embeds: [embed3] })

  await sleep(2000)

  // ── Phase 4: 최종 결과 ──
  addItem(user.id, {
    item_name: item.name,
    item_rarity: item.rarity,
    item_emoji: item.emoji,
    attack_bonus: item.attack,
    defense_bonus: item.defense,
    hp_bonus: item.hp,
    crit_bonus: item.crit,
  })

  const stats: string[] = []
  if (item.attack > 0) stats.push(`⚔️ 공격력 +${item.attack}`)
  if (item.defense > 0) stats.push(`🛡️ 방어력 +${item.defense}`)
  if (item.hp > 0) stats.push(`❤️ HP +${item.hp}`)
  if (item.crit > 0) stats.push(`🎯 크리티컬 +${(item.crit * 100).toFixed(0)}%`)

  const finalEmbed = new EmbedBuilder()
    .setColor(rarityColors[item.rarity])
    .setTitle('🎰 가챠 결과!')
    .setDescription(
      `${item.emoji} **${item.name}**\n` +
        `등급: ${rarityLabels[item.rarity]}\n\n` +
        (stats.length > 0 ? stats.join(' | ') : '특수 능력 없음'),
    )

  if (item.rarity === 'legendary' || item.rarity === 'mythic') {
    finalEmbed.addFields({
      name: '🎊 대박!!!',
      value:
        item.rarity === 'mythic'
          ? '🌟 **신화급 아이템 획득!!!** 서버 전체가 부러워합니다!'
          : '✨ **전설급 아이템 획득!** 축하합니다!',
    })
    if (item.rarity === 'mythic') {
      addTitle(user.id, guildId, '🦆 신화 수집가')
    }
  }

  if (pitied) {
    finalEmbed.addFields({
      name: '🛡️ 픽뚫 발동!',
      value: `**${PITY_THRESHOLD}연차 천장 도달!** 전설급 보장 + ${PITY_GOLD_REFUND}G 반환`,
    })
  }

  if (item.rarity === 'common') {
    const sadMessages = [
      '😐 ...뭐, 세상이 다 그런 거지.',
      '🗑️ 이거 환불 안 되나요?',
      '💀 300G가 아깝다...',
      '😭 다음에는 전설이 나올 거야... 아마...',
      '📉 가챠는 도박이고 도박은 패가망신입니다.',
      '🎰 300G로 밥을 사먹었으면 배라도 불렀을 텐데...',
      '🪙 이 아이템의 시가는 약 3G입니다. 축하합니다.',
      '💸 매몰비용의 오류에 빠지지 마세요. 그만 돌리세요.',
      '🤡 확률은 거짓말을 하지 않습니다. 당신이 운이 없을 뿐.',
      '📱 이 확률은 로또보다 높은데요... 그래도 꽝은 꽝입니다.',
      '🕳️ 가챠는 함정이고 당신은 함정에 빠졌습니다. 축하합니다.',
      '🏧 300G면 편의점 삼각김밥 100개 사먹었습니다.',
      '💳 "한 번만 더..." 라고 말한 지 10번째입니다.',
      '🪦 여기 300G가 잠들어 있습니다. R.I.P.',
      '🧾 영수증 출력하시겠습니까? (마음의 상처 포함)',
    ]
    finalEmbed.addFields({
      name: '😢',
      value: pick(sadMessages),
    })
  }

  const currentPity = getGachaPity(user.id, guildId)
  finalEmbed.setFooter({
    text: `잔여 골드: ${player.gold - cost + (pitied ? PITY_GOLD_REFUND : 0)}G | 픽뚫: ${currentPity}/${PITY_THRESHOLD} | 풀: ${gachaPool.length}종`,
  })
  finalEmbed.setTimestamp()

  await interaction.editReply({ embeds: [finalEmbed] })
  rollingUsers.delete(userKey)
}
