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
  pick,
  sleep,
} from '../../db/helpers.js'
import {
  gachaPool,
  rarityColors,
  rarityLabels,
  type GachaItem,
} from '../../data/gacha-items.js'

export const data = new SlashCommandBuilder()
  .setName('gacha')
  .setDescription('🎰 가챠를 돌린다! (비용: 100G)')

function rollGacha(): GachaItem {
  const roll = Math.random() * 100
  let rarity: string

  if (roll < 1) rarity = 'mythic'
  else if (roll < 5) rarity = 'legendary'
  else if (roll < 15) rarity = 'epic'
  else if (roll < 30) rarity = 'rare'
  else if (roll < 55) rarity = 'uncommon'
  else rarity = 'common'

  const pool = gachaPool.filter((i) => i.rarity === rarity)
  return pick(pool)
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const user = interaction.user
  const guildId = interaction.guildId!

  const player = getOrCreatePlayer(user.id, guildId, user.username)

  if (player.gold < 100) {
    await interaction.reply({
      content: `💰 골드가 부족합니다! (현재: ${player.gold}G / 필요: 100G)\n\`/daily\`로 골드를 모으세요!`,
      ephemeral: true,
    })
    return
  }

  addGold(user.id, guildId, -100)
  const item = rollGacha()

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

  if (item.rarity === 'common') {
    const sadMessages = [
      '😐 ...뭐, 세상이 다 그런 거지.',
      '🗑️ 이거 환불 안 되나요?',
      '💀 100G가 아깝다...',
      '😭 다음에는 전설이 나올 거야... 아마...',
    ]
    finalEmbed.addFields({
      name: '😢',
      value: pick(sadMessages),
    })
  }

  finalEmbed.setFooter({
    text: `잔여 골드: ${player.gold - 100}G | 전체 아이템 풀: ${gachaPool.length}종`,
  })
  finalEmbed.setTimestamp()

  await interaction.editReply({ embeds: [finalEmbed] })
}
