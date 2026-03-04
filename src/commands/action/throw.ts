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
  .setName('throw')
  .setDescription('🚀 누군가를 우주로 던진다!')
  .addUserOption((opt) =>
    opt.setName('target').setDescription('던질 대상').setRequired(true),
  )

const throwDestinations = [
  { place: '우주 🌌', emoji: '🚀', time: 5 },
  { place: '태양 ☀️', emoji: '🔥', time: 8 },
  { place: '블랙홀 🕳️', emoji: '💫', time: 15 },
  { place: '화성 🔴', emoji: '👽', time: 10 },
  { place: '지구 반대편 🌍', emoji: '🤸', time: 3 },
  { place: '닭갈비집 🍗', emoji: '🐔', time: 2 },
  { place: '지옥 🔥', emoji: '😈', time: 20 },
  { place: '2090년 미래 ⏰', emoji: '🤖', time: 30 },
  { place: '마인크래프트 세계 ⛏️', emoji: '🟫', time: 7 },
  { place: '남극 🧊', emoji: '🐧', time: 12 },
  { place: '대학교 과제방 📝', emoji: '😱', time: 99 },
  { place: '월요일 아침 ⏰', emoji: '😵', time: 25 },
  { place: 'IE6 브라우저 속 🌐', emoji: '💀', time: 60 },
  { place: 'npm install 대기줄 📦', emoji: '⏳', time: 45 },
  { place: '어머니 잔소리 차원 👩', emoji: '📢', time: 10 },
  { place: '배달 예상시간 "곧 도착" 🛵', emoji: '🍕', time: 999 },
]

export async function execute(interaction: ChatInputCommandInteraction) {
  const target = interaction.options.getUser('target', true)
  const attacker = interaction.user

  if (target.id === attacker.id) {
    await interaction.reply({
      content: '🤔 자기 자신을 던질 수는 없습니다... 물리법칙 위반!',
      ephemeral: true,
    })
    return
  }

  const guildId = interaction.guildId!
  getOrCreatePlayer(attacker.id, guildId, attacker.username)
  getOrCreatePlayer(target.id, guildId, target.username)

  if (hasEffect(attacker.id, guildId, 'stunned')) {
    await interaction.reply({
      content: '😵 기절 상태에서는 던질 수 없어요!',
    })
    return
  }

  if (hasEffect(attacker.id, guildId, 'frozen')) {
    await interaction.reply({
      content: '🧊 얼음 상태에서는 던질 수 없어요!',
    })
    return
  }

  const dest = pick(throwDestinations)
  const dmg = random(3, 15)
  damagePlayer(target.id, guildId, dmg)

  const embed = new EmbedBuilder()
    .setColor(0x00bfff)
    .setDescription(
      `${dest.emoji} ${target.toString()}을(를) **${dest.place}**로 던졌습니다!\n` +
        `⏱️ ${dest.time}초 뒤 귀환 예정...\n` +
        `💔 HP -${dmg}`,
    )

  // Chance of backfire
  if (chance(20)) {
    const selfDmg = random(2, 8)
    damagePlayer(attacker.id, guildId, selfDmg)
    embed.addFields({
      name: '🪃 부메랑 효과!',
      value: `던지다가 허리를 삐끗했습니다! ${attacker.toString()} HP -${selfDmg}`,
    })
  }

  // Frozen effect if thrown to cold place
  if (dest.place.includes('남극') || dest.place.includes('우주')) {
    applyStatusEffect(target.id, guildId, 'frozen', dest.time, attacker.id)
    embed.addFields({
      name: '🧊 얼음!',
      value: `${target.toString()}은(는) ${dest.time}초간 얼어붙었습니다!`,
    })
  }

  // Burning if thrown to hot place
  if (dest.place.includes('태양') || dest.place.includes('지옥')) {
    applyStatusEffect(target.id, guildId, 'burning', dest.time, attacker.id)
    embed.addFields({
      name: '🔥 불탐!',
      value: `${target.toString()}은(는) ${dest.time}초간 불타고 있습니다!`,
    })
  }

  embed.setFooter({ text: `${attacker.username}의 투척` }).setTimestamp()

  await interaction.reply({ embeds: [embed] })
}
