import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js'
import {
  getOrCreatePlayer,
  getTitles,
  getEffectiveStats,
  pick,
} from '../../db/helpers.js'

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
  const effective = getEffectiveStats(target.id, guildId)

  const hpBar = makeBar(player.hp, effective.max_hp, '❤️', '🖤')
  const xpBar = makeBar(player.xp, player.level * 100, '⭐', '☆')

  const critDisplay = `**${(effective.crit_rate * 100).toFixed(0)}%**`
  const critDmgDisplay =
    effective.crit_damage > 2
      ? ` (💥 ${(effective.crit_damage * 100).toFixed(0)}%)`
      : ''

  const embed = new EmbedBuilder()
    .setColor(0x3498db)
    .setTitle(`👤 ${target.username}의 프로필`)
    .setThumbnail(target.displayAvatarURL())
    .addFields(
      {
        name: '📊 기본 정보',
        value:
          `⭐ 레벨: **${player.level}**\n` +
          `❤️ HP: ${hpBar} **${player.hp}/${effective.max_hp}**\n` +
          `✨ XP: ${xpBar} **${player.xp}/${player.level * 100}**\n` +
          `💰 골드: **${player.gold}G**`,
        inline: false,
      },
      {
        name: '⚔️ 전투 스탯',
        value:
          `공격력: **${effective.attack}** | 방어력: **${effective.defense}**\n` +
          `크리티컬: ${critDisplay}${critDmgDisplay} | 회피: **${(player.evasion * 100).toFixed(0)}%**`,
        inline: false,
      },
    )

  if (titles.length > 0) {
    embed.addFields({
      name: '🏷️ 칭호',
      value: titles.join(', '),
    })
  }

  // Random flavor text based on state
  const flavorTexts: string[] = []
  if (player.hp <= 0) {
    flavorTexts.push(
      '💀 현재 사망 상태입니다. F.',
      '💀 이 프로필은 영정 프로필입니다.',
      '💀 주인은 현재 부재중입니다. (저승)',
      '💀 디지털 영정 사진을 준비하세요.',
      '💀 유언: "가챠 한 번만 더..."',
    )
  } else if (player.hp < player.max_hp * 0.2) {
    flavorTexts.push(
      '🏥 병원 가세요. 진지하게.',
      '🩸 반창고 붙이는 것으로는 부족합니다.',
      '⚠️ HP가 빨간불입니다. 위험합니다.',
      '🚑 이 상태로 낚시하면 물고기가 당신을 낚습니다.',
      '🩹 HP 보고 의사가 혀를 찼습니다.',
      '⚠️ 이 상태로 전투하면 시체 배달 서비스입니다.',
    )
  } else if (player.gold > 100000) {
    flavorTexts.push(
      '💰 부자입니다. 세금 내세요.',
      '🤑 이 정도면 나라 하나 세울 수 있습니다.',
      '🏦 은행에서 전화 왔습니다. VIP 등급이랍니다.',
      '💎 이 정도면 가챠를 333번 돌릴 수 있습니다. (하지 마세요)',
      '💰 국세청에서 연락 올 수 있습니다.',
    )
  } else if (player.gold <= 0) {
    flavorTexts.push(
      '💸 무일푼입니다. 문자 그대로.',
      '🪣 통장 잔고: 0G. 꿈도 희망도 없습니다. (/daily)',
      '💸 긴급 대출 서비스는 준비 중입니다.',
      '🍜 라면이라도 사드릴까요... 아 그것도 못 삽니다.',
      '💳 마이너스 통장도 한도가 있습니다.',
    )
  }
  if (flavorTexts.length > 0) {
    embed.addFields({
      name: '💬',
      value: `*${pick(flavorTexts)}*`,
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
