import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js'
import {
  getOrCreatePlayer,
  updatePlayer,
  addGold,
  healPlayer,
  random,
  chance,
} from '../../db/helpers.js'

export const data = new SlashCommandBuilder()
  .setName('daily')
  .setDescription('📅 일일 보상을 받습니다!')

export async function execute(interaction: ChatInputCommandInteraction) {
  const user = interaction.user
  const guildId = interaction.guildId!

  const player = getOrCreatePlayer(user.id, guildId, user.username)

  // Check cooldown (24h)
  const now = new Date()
  if (player.last_daily) {
    const lastDaily = new Date(player.last_daily + 'Z')
    const diff = now.getTime() - lastDaily.getTime()
    const hoursLeft = 24 - diff / (1000 * 60 * 60)
    if (hoursLeft > 0) {
      const h = Math.floor(hoursLeft)
      const m = Math.floor((hoursLeft - h) * 60)
      await interaction.reply({
        content: `⏰ 다음 일일 보상까지 **${h}시간 ${m}분** 남았습니다!`,
        ephemeral: true,
      })
      return
    }
  }

  const goldAmount = random(50, 200)
  const healAmount = random(20, 50)
  const bonusGold = chance(15) ? random(100, 500) : 0
  const gachaTicket = chance(30)

  addGold(user.id, guildId, goldAmount + bonusGold)
  healPlayer(user.id, guildId, healAmount)
  updatePlayer(user.id, guildId, {
    last_daily: now.toISOString().replace('T', ' ').split('.')[0],
  })

  const embed = new EmbedBuilder()
    .setColor(0xffd700)
    .setTitle('📅 일일 보상!')
    .setDescription(`${user.toString()}님의 오늘의 보상:`)
    .addFields(
      { name: '💰 골드', value: `+${goldAmount}G`, inline: true },
      { name: '❤️ 회복', value: `HP +${healAmount}`, inline: true },
    )

  if (bonusGold > 0) {
    embed.addFields({
      name: '🎰 보너스 골드!',
      value: `+${bonusGold}G (15% 확률 발동!)`,
      inline: true,
    })
  }

  if (gachaTicket) {
    embed.addFields({
      name: '🎫 가챠 티켓!',
      value: '무료 가챠 1회 획득! `/gacha` 로 사용하세요!',
      inline: false,
    })
  }

  // Random fortune message
  const fortunes = [
    '🔮 오늘의 운세: 대박날 것 같은 예감!',
    '🌟 오늘의 운세: 가챠 전설 뜰 확률 UP!',
    '💀 오늘의 운세: 전투에서 지는 날...',
    '✨ 오늘의 운세: 좋은 일이 생길 것 같다!',
    '🐍 오늘의 운세: 배신을 조심하세요...',
    '💕 오늘의 운세: 사랑이 찾아올 수도?',
    '🧠 오늘의 운세: 지능이 3% 상승합니다 (일시적)',
    '🍀 오늘의 운세: 행운의 날!',
  ]

  embed.addFields({
    name: '🔮 오늘의 운세',
    value: fortunes[Math.floor(Math.random() * fortunes.length)],
  })

  embed.setTimestamp()
  await interaction.reply({ embeds: [embed] })
}
