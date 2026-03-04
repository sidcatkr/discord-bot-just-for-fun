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
} from '../../db/helpers.js'

export const data = new SlashCommandBuilder()
  .setName('eat')
  .setDescription('🍔 누군가를 맛있게 먹는다!')
  .addUserOption((opt) =>
    opt.setName('target').setDescription('먹을 대상').setRequired(true),
  )

const eatResults = [
  {
    msg: (t: string) => `🍔 오늘의 특식은 ${t}입니다! 맛있다~`,
    dmg: 10,
    backfire: false,
  },
  {
    msg: (t: string) => `🍕 ${t}을(를) 피자처럼 접어서 먹었습니다!`,
    dmg: 12,
    backfire: false,
  },
  {
    msg: (t: string) => `🌮 ${t} 타코 완성! 한입에 꿀꺽!`,
    dmg: 8,
    backfire: false,
  },
  {
    msg: (t: string) => `🍜 ${t} 라면을 끓여 먹었습니다... 졸깃졸깃...`,
    dmg: 15,
    backfire: false,
  },
  {
    msg: (t: string) => `🍣 ${t} 초밥! 근데 상한 것 같다... 🤮`,
    dmg: 5,
    backfire: true,
  },
  {
    msg: (t: string) => `🥩 ${t}을(를) 스테이크로 구워 먹었는데... 날고기였다!`,
    dmg: 7,
    backfire: true,
  },
]

export async function execute(interaction: ChatInputCommandInteraction) {
  const target = interaction.options.getUser('target', true)
  const attacker = interaction.user

  if (target.id === attacker.id) {
    const selfEatReplies = [
      '🤨 자기 자신을 먹을 수는 없습니다... 식인은 불법!',
      '🍽️ 오토파지(자가포식)는 세포 단위에서만 가능합니다.',
      '🤡 배가 그렇게 고프시면 /daily 하세요.',
      '💀 자기 팔을 먹으면 체중이 줄까요 늘까요? 정답: 줄지도 늘지도 않습니다.',
    ]
    await interaction.reply({
      content: pick(selfEatReplies),
      ephemeral: true,
    })
    return
  }

  const guildId = interaction.guildId!
  getOrCreatePlayer(attacker.id, guildId, attacker.username)
  getOrCreatePlayer(target.id, guildId, target.username)

  if (hasEffect(attacker.id, guildId, 'stunned')) {
    await interaction.reply({ content: '😵 기절 상태에서는 먹을 수 없어요!' })
    return
  }

  const result = pick(eatResults)
  damagePlayer(target.id, guildId, result.dmg)

  const embed = new EmbedBuilder()
    .setColor(0xff8c00)
    .setDescription(
      `${result.msg(target.toString())}\n💔 ${target.toString()} HP -${result.dmg}`,
    )

  if (result.backfire || chance(25)) {
    const selfDmg = random(3, 8)
    damagePlayer(attacker.id, guildId, selfDmg)
    applyStatusEffect(attacker.id, guildId, 'poisoned', 10, target.id)
    embed.addFields({
      name: '🦠 배탈!',
      value: `배가 이상하다... ${attacker.toString()} HP -${selfDmg}\n독 상태 10초!`,
    })
  }

  // Rare: cute overload
  if (chance(10)) {
    applyStatusEffect(target.id, guildId, 'cute_overload', 30)
    embed.addFields({
      name: '✨ 귀여움 폭발!',
      value: `${target.toString()}이(가) 너무 귀여워서 먹을 수가 없었습니다...\n귀여움 증가 30초!`,
    })
  }

  embed.setFooter({ text: `${attacker.username}의 식사` }).setTimestamp()

  await interaction.reply({ embeds: [embed] })
}
