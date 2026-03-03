import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js'
import {
  getOrCreatePlayer,
  getOrCreateRelationship,
  updateRelationship,
  addTitle,
  random,
  pick,
} from '../../db/helpers.js'

export const data = new SlashCommandBuilder()
  .setName('betray')
  .setDescription('💔 누군가를 배신한다!')
  .addUserOption((opt) =>
    opt.setName('target').setDescription('배신할 대상').setRequired(true),
  )

const betrayMessages = [
  (a: string, t: string) => `🗡️ ${a}이(가) ${t}의 등 뒤에 칼을 꽂았습니다!`,
  (a: string, t: string) => `💀 ${a}이(가) ${t}의 비밀을 서버에 폭로했습니다!`,
  (a: string, t: string) => `🐍 ${a}이(가) ${t}을(를) 뒷통수쳤습니다!`,
  (a: string, t: string) => `😈 ${a}이(가) ${t}의 점심을 몰래 먹어버렸습니다!`,
  (a: string, t: string) =>
    `🎭 ${a}이(가) 사실 ${t}의 적이었다는 것이 밝혀졌습니다!`,
]

export async function execute(interaction: ChatInputCommandInteraction) {
  const target = interaction.options.getUser('target', true)
  const user = interaction.user

  if (target.id === user.id) {
    await interaction.reply({
      content: '🤡 자기 자신을 배신? 그건 자아 분열이에요...',
      ephemeral: true,
    })
    return
  }

  const guildId = interaction.guildId!
  getOrCreatePlayer(user.id, guildId, user.username)
  getOrCreatePlayer(target.id, guildId, target.username)

  const rel = getOrCreateRelationship(user.id, target.id, guildId)

  const trustLoss = random(10, 30)
  const newTrust = Math.max(0, rel.trust - trustLoss)
  const affinityLoss = random(5, 15)
  const newAffinity = Math.max(0, rel.affinity - affinityLoss)

  updateRelationship(user.id, target.id, guildId, {
    trust: newTrust,
    affinity: newAffinity,
  })

  // If they were a couple, they break up
  if (rel.is_couple) {
    updateRelationship(user.id, target.id, guildId, { is_couple: 0 })
  }

  const embed = new EmbedBuilder()
    .setColor(0x8b0000)
    .setTitle('💔 배신!')
    .setDescription(
      pick(betrayMessages)(user.toString(), target.toString()) +
        `\n\n📉 신뢰도: ${rel.trust} → **${newTrust}** (-${trustLoss})\n` +
        `💔 호감도: ${rel.affinity} → **${newAffinity}** (-${affinityLoss})`,
    )

  if (rel.is_couple) {
    embed.addFields({
      name: '💔 커플 파탄!',
      value: '공식 커플이 파국을 맞이했습니다... 서버가 슬퍼합니다.',
    })
  }

  if (newTrust <= 20) {
    addTitle(user.id, guildId, '🐍 배신자')
    embed.addFields({
      name: '🏷️ 칭호 획득!',
      value: `${user.toString()}이(가) **"🐍 배신자"** 칭호를 획득했습니다!`,
    })
  }

  if (newTrust === 0) {
    embed.addFields({
      name: '⚠️ 신뢰도 0!',
      value: `${target.toString()}은(는) ${user.toString()}을(를) 완전히 신뢰하지 않습니다. 복구 불가!`,
    })
    addTitle(user.id, guildId, '☠️ 절대 악')
  }

  embed.setTimestamp()
  await interaction.reply({ embeds: [embed] })
}
