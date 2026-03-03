import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js'
import {
  getOrCreatePlayer,
  damagePlayer,
  applyStatusEffect,
  hasEffect,
  chance,
  random,
  pick,
  addTitle,
} from '../../db/helpers.js'

export const data = new SlashCommandBuilder()
  .setName('slap')
  .setDescription('💥 누군가를 세게 때린다!')
  .addUserOption((opt) =>
    opt.setName('target').setDescription('때릴 대상').setRequired(true),
  )

const slapMessages = [
  (t: string) => `💥 ${t}의 뺨을 세게 때렸습니다! 쪽!`,
  (t: string) => `🤛 ${t}에게 주먹 인사를 날렸습니다!`,
  (t: string) => `👋 ${t}을(를) 찰싹 때렸습니다! 아야!`,
  (t: string) => `🫲 ${t}의 머리를 쿨하게 박살냈습니다!`,
  (t: string) => `💢 ${t}에게 정의의 철권을 시전했습니다!`,
]

const critMessages = [
  (t: string) =>
    `💀 **크리티컬!** ${t}은(는) 뺨이 360도 회전했습니다! 기절 5초!`,
  (t: string) =>
    `☠️ **치명타!** ${t}의 영혼이 잠시 몸에서 이탈했습니다! 기절 5초!`,
  (t: string) =>
    `🌟 **CRITICAL HIT!** ${t}이(가) 다른 차원으로 날아갔다! 기절 5초!`,
]

export async function execute(interaction: ChatInputCommandInteraction) {
  const target = interaction.options.getUser('target', true)
  const attacker = interaction.user

  if (target.id === attacker.id) {
    await interaction.reply({
      content: '🤦 자해는 안 됩니다... 괜찮으세요?',
      ephemeral: true,
    })
    return
  }

  if (target.bot) {
    await interaction.reply({
      content: '🤖 봇을 때리면 손만 아파요...',
      ephemeral: true,
    })
    return
  }

  const guildId = interaction.guildId!
  getOrCreatePlayer(attacker.id, guildId, attacker.username)
  getOrCreatePlayer(target.id, guildId, target.username)

  // Check if attacker is stunned
  if (hasEffect(attacker.id, guildId, 'stunned')) {
    await interaction.reply({
      content: '😵 당신은 기절 상태입니다! 아무것도 할 수 없어요!',
    })
    return
  }

  const dmg = random(5, 20)
  damagePlayer(target.id, guildId, dmg)

  const isCrit = chance(15) // 15% crit chance
  const embed = new EmbedBuilder().setColor(isCrit ? 0xff0000 : 0xff6b6b)

  if (isCrit) {
    embed.setDescription(
      `${pick(critMessages)(target.toString())}\n💔 HP -${dmg * 2}`,
    )
    damagePlayer(target.id, guildId, dmg) // double damage on crit
    applyStatusEffect(target.id, guildId, 'stunned', 5, attacker.id)

    // Super rare: 2% chance "almost kicked"
    if (chance(2)) {
      embed.addFields({
        name: '⚠️ 위험!',
        value: `${target.toString()}은(는) 서버에서 추방될 뻔했다...! (2% 확률 발동)`,
      })
      addTitle(target.id, guildId, '🎯 추방 위기 생존자')
    }
  } else {
    embed.setDescription(
      `${pick(slapMessages)(target.toString())}\n💔 HP -${dmg}`,
    )
    if (chance(30)) {
      applyStatusEffect(target.id, guildId, 'stunned', 3, attacker.id)
      embed.addFields({
        name: '😵 기절!',
        value: `${target.toString()}은(는) 3초간 기절했습니다!`,
      })
    }
  }

  embed.setFooter({ text: `${attacker.username}의 공격` }).setTimestamp()

  await interaction.reply({ embeds: [embed] })
}
