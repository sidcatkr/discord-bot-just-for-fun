import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js'
import {
  getOrCreatePlayer,
  getActiveEffects,
  getEffectiveStats,
  type EffectType,
} from '../../db/helpers.js'

const effectEmojis: Record<EffectType, string> = {
  stunned: '😵 기절',
  poisoned: '🦠 중독',
  burning: '🔥 불탐',
  frozen: '🧊 얼음',
  cute_overload: '✨ 귀여움 폭발',
  npc: '🤖 NPC화',
}

export const data = new SlashCommandBuilder()
  .setName('status')
  .setDescription('📊 자신 또는 다른 유저의 상태를 확인합니다')
  .addUserOption((opt) =>
    opt.setName('target').setDescription('확인할 대상 (비워두면 본인)'),
  )

export async function execute(interaction: ChatInputCommandInteraction) {
  const target = interaction.options.getUser('target') ?? interaction.user
  const guildId = interaction.guildId!

  const player = getOrCreatePlayer(target.id, guildId, target.username)
  const effects = getActiveEffects(target.id, guildId)
  const effective = getEffectiveStats(target.id, guildId)

  const hpBar = makeHpBar(player.hp, effective.max_hp)
  const xpBar = makeXpBar(player.xp, player.level * 100)

  const atkText =
    effective.attack !== player.attack
      ? `${player.attack} (+${effective.attack - player.attack})`
      : `${player.attack}`
  const defText =
    effective.defense !== player.defense
      ? `${player.defense} (+${effective.defense - player.defense})`
      : `${player.defense}`
  const critText =
    effective.crit_rate !== player.crit_rate
      ? `${(player.crit_rate * 100).toFixed(0)}% (+${((effective.crit_rate - player.crit_rate) * 100).toFixed(0)}%)`
      : `${(player.crit_rate * 100).toFixed(0)}%`
  const hpMaxText =
    effective.max_hp !== player.max_hp
      ? `${player.hp}/${player.max_hp} (+${effective.max_hp - player.max_hp})`
      : `${player.hp}/${player.max_hp}`

  const embed = new EmbedBuilder()
    .setColor(player.hp > effective.max_hp * 0.3 ? 0x2ecc71 : 0xe74c3c)
    .setTitle(`📊 ${target.username}의 상태`)
    .setThumbnail(target.displayAvatarURL())
    .addFields(
      {
        name: '❤️ HP',
        value: `${hpBar} ${hpMaxText}`,
        inline: false,
      },
      {
        name: '⭐ 레벨',
        value: `Lv.${player.level}`,
        inline: true,
      },
      {
        name: '✨ XP',
        value: `${xpBar} ${player.xp}/${player.level * 100}`,
        inline: false,
      },
      {
        name: '⚔️ 공격력',
        value: atkText,
        inline: true,
      },
      {
        name: '🛡️ 방어력',
        value: defText,
        inline: true,
      },
      {
        name: '🎯 크리티컬',
        value: critText,
        inline: true,
      },
      {
        name: '💨 회피율',
        value: `${(player.evasion * 100).toFixed(0)}%`,
        inline: true,
      },
      {
        name: '💰 골드',
        value: `${player.gold}G`,
        inline: true,
      },
    )

  if (effective.equippedItem) {
    embed.addFields({
      name: '🗡️ 장착 아이템',
      value: `${effective.equippedItem.item_emoji} ${effective.equippedItem.item_name}`,
      inline: true,
    })
  }

  if (effects.length > 0) {
    const effectList = effects
      .map((e) => {
        const label = effectEmojis[e.effect_type as EffectType] ?? e.effect_type
        return `${label} (만료: <t:${Math.floor(new Date(e.expires_at + 'Z').getTime() / 1000)}:R>)`
      })
      .join('\n')
    embed.addFields({ name: '🏷️ 상태이상', value: effectList })
  } else {
    embed.addFields({ name: '🏷️ 상태이상', value: '없음 ✅' })
  }

  embed.setTimestamp()
  await interaction.reply({ embeds: [embed] })
}

function makeHpBar(current: number, max: number): string {
  const ratio = Math.max(0, Math.min(1, current / max))
  const filled = Math.round(ratio * 10)
  const empty = 10 - filled
  return '█'.repeat(filled) + '░'.repeat(empty)
}

function makeXpBar(current: number, max: number): string {
  const ratio = Math.max(0, Math.min(1, current / max))
  const filled = Math.round(ratio * 10)
  const empty = 10 - filled
  return '▓'.repeat(filled) + '░'.repeat(empty)
}
