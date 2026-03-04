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

  const goldAmount = random(200, 800)
  const healAmount = random(30, 70)
  const bonusGold = chance(15) ? random(500, 2000) : 0
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
    '🌟 오늘의 운세: 가챠 전설 뜰 확률 UP! (거짓말)',
    '💀 오늘의 운세: 전투에서 지는 날...',
    '✨ 오늘의 운세: 좋은 일이 생길 것 같다!',
    '🐍 오늘의 운세: 배신을 조심하세요...',
    '💕 오늘의 운세: 사랑이 찾아올 수도?',
    '🧠 오늘의 운세: 지능이 3% 상승합니다 (일시적)',
    '🍀 오늘의 운세: 행운의 날!',
    '📱 오늘의 운세: 핸드폰을 내려놓으세요.',
    '🎰 오늘의 운세: 가챠 금지. 진심으로.',
    '🐟 오늘의 운세: 낚시하면 쓰레기만 나옵니다.',
    '☕ 오늘의 운세: 커피를 마시면 모든 게 해결됩니다 (거짓말)',
    '🤖 오늘의 운세: 이 봇을 만든 사람도 오늘 운이 없습니다.',
    '💀 오늘의 운세: 오늘 HP가 0이 될 확률 87%',
    '🏥 오늘의 운세: 병원 자주 가실 예정입니다.',
    '🌊 오늘의 운세: 바다가 당신을 부르고 있습니다... (수질 오염 때문)',
    '🏝️ 오늘의 운세: 섬에 관광객이 0명 방문합니다.',
    '🎣 오늘의 운세: 전설의 물고기를 잡을 뻔 합니다. "뻔".',
    '🏭 오늘의 운세: 공장을 지으면 부자가 됩니다. 환경은 포기.',
    '💸 오늘의 운세: 골드가 순식간에 사라집니다.',
    '🦑 오늘의 운세: 바다 괴물과 눈이 마주칩니다.',
    '🧊 오늘의 운세: 얼음 위에서 낚시하는 꿈을 꿉니다.',
    '🎲 오늘의 운세: 도박하지 마세요. (가챠는 도박 아님) (거짓말)',
    '📊 오늘의 운세: 수익률 -300%. 건물 유지비 확인하세요.',
    '🏢 출석 도장 꾹! 여기 직장인가...',
    '🍚 오늘도 무료 급식 받으러 왔습니다.',
    '📋 출석체크 개근상은 없습니다. 현실도 마찬가지.',
    '🕐 매일 같은 시간에 오시네요. 출근인가요?',
    '💼 일일 보상은 시급 환산하면 최저시급 이하입니다.',
    '🎁 무료라서 받는 거지 300G 줄 거면 안 받습니다.',
  ]

  embed.addFields({
    name: '🔮 오늘의 운세',
    value: fortunes[Math.floor(Math.random() * fortunes.length)],
  })

  embed.setTimestamp()
  await interaction.reply({ embeds: [embed] })
}
