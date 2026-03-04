import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js'
import {
  getOrCreatePlayer,
  addGold,
  healPlayer,
  getHealCost,
  getEffectiveStats,
  pick,
} from '../../db/helpers.js'

export const data = new SlashCommandBuilder()
  .setName('heal')
  .setDescription('❤️‍🩹 HP를 회복합니다 (골드 소모)')
  .addStringOption((opt) =>
    opt
      .setName('amount')
      .setDescription('회복량 (전체: 전체 회복, 숫자: 해당 수치만큼)')
      .setRequired(false),
  )

export async function execute(interaction: ChatInputCommandInteraction) {
  const user = interaction.user
  const guildId = interaction.guildId!

  const player = getOrCreatePlayer(user.id, guildId, user.username)
  const stats = getEffectiveStats(user.id, guildId)
  const amountOption = interaction.options.getString('amount')

  const missingHp = stats.max_hp - player.hp

  if (missingHp <= 0) {
    await interaction.reply({
      content: '❤️ 이미 HP가 최대입니다!',
      ephemeral: true,
    })
    return
  }

  // Calculate heal amount
  let healAmount: number
  if (!amountOption || amountOption === '전체') {
    healAmount = missingHp
  } else {
    healAmount = Math.min(parseInt(amountOption) || missingHp, missingHp)
    if (healAmount <= 0) healAmount = missingHp
  }

  // Cost: base cost per HP scales with level
  const costPerHp = getHealCost(player) / stats.max_hp
  const totalCost = Math.max(1, Math.ceil(costPerHp * healAmount))

  if (player.gold < totalCost) {
    // Can they afford partial heal?
    const affordableHeal = Math.floor(player.gold / costPerHp)
    if (affordableHeal <= 0) {
      const embed = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle('💀 치료비 부족!')
        .setDescription(
          `❤️ HP: **${player.hp}/${stats.max_hp}**\n` +
            `💰 보유 골드: **${player.gold}G**\n` +
            `💸 전체 회복 비용: **${totalCost}G**\n\n` +
            `> *골드가 부족합니다...*\n` +
            `> \`/daily\`로 무료 회복과 골드를 받으세요!` +
            `${player.hp <= 0 ? '\n\n💀 **사망 상태** — 전투, 낚시, 가챠를 할 수 없습니다!' : ''}`,
        )
        .setTimestamp()

      await interaction.reply({ embeds: [embed] })
      return
    }

    // Suggest partial heal
    const partialCost = Math.max(1, Math.ceil(costPerHp * affordableHeal))
    healPlayer(user.id, guildId, affordableHeal)
    addGold(user.id, guildId, -partialCost)

    const embed = new EmbedBuilder()
      .setColor(0xf39c12)
      .setTitle('❤️‍🩹 부분 회복!')
      .setDescription(
        `전체 회복 비용이 부족하여 가능한 만큼 회복했습니다.\n\n` +
          `❤️ HP: **${player.hp}** → **${Math.min(player.hp + affordableHeal, stats.max_hp)}/${stats.max_hp}**\n` +
          `💰 비용: **-${partialCost}G**\n` +
          `🩹 회복량: **+${affordableHeal} HP**`,
      )
      .setTimestamp()

    await interaction.reply({ embeds: [embed] })
    return
  }

  healPlayer(user.id, guildId, healAmount)
  addGold(user.id, guildId, -totalCost)

  const wasDead = player.hp <= 0
  const newHp = Math.min(player.hp + healAmount, stats.max_hp)

  const resurrectQuotes = [
    '병원은 리스폰 포인트가 아닙니다.',
    '또 오셨군요. 단골 할인은 없습니다.',
    '사망 원인: skill issue',
    'HP 관리 좀 하세요... 제발...',
    '부활 횟수가 누적되고 있습니다. 보험료가 오를 수 있습니다.',
    '여기가 어디냐고요? 병원이요. 세 번째 방문이시네요.',
    '사망 원인: 수질 오염된 물고기 섭취 (수질 관리 하세요)',
    '이번 부활 할인 쿠폰: STOP_DYING_2024',
  ]
  const healQuotes = [
    '다음에는 좀 덜 맞고 오세요.',
    '포션 대신 밴드를 드릴까요? 더 싸요.',
    '건강보험 적용 안 됩니다. 현금만 받아요.',
    '회복 완료! 바로 전투하러 가시면 또 오실 겁니다.',
    '의사 선생님이 "또 오지 마세요"라고 하셨습니다.',
    '치료비가 갈수록 비싸지는 건 기분 탓이 아닙니다.',
    '의사: "치료보다 오염 안 된 물 좀 드세요"',
    '옆 환자는 물고기에게 물려서 왔다고 합니다.',
  ]

  const embed = new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle(wasDead ? '🔄 부활!' : '❤️‍🩹 회복 완료!')
    .setDescription(
      `${wasDead ? '💀 → ❤️ 사망 상태에서 부활했습니다!\n\n' : ''}` +
        `❤️ HP: **${player.hp}** → **${newHp}/${stats.max_hp}**\n` +
        `💰 비용: **-${totalCost}G**\n` +
        `🩹 회복량: **+${healAmount} HP**\n\n` +
        `> *${wasDead ? pick(resurrectQuotes) : pick(healQuotes)}*`,
    )
    .setFooter({ text: `잔여 골드: ${player.gold - totalCost}G` })
    .setTimestamp()

  await interaction.reply({ embeds: [embed] })
}
