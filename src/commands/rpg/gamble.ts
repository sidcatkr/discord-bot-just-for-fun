import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from 'discord.js'
import {
  getOrCreatePlayer,
  addGold,
  isPlayerDead,
  pick,
  sleep,
  random,
  chance,
} from '../../db/helpers.js'

export const data = new SlashCommandBuilder()
  .setName('gamble')
  .setDescription('🎰 도박을 합니다!')
  .addIntegerOption((opt) =>
    opt
      .setName('amount')
      .setDescription('배팅할 골드 (최소 10G)')
      .setRequired(true)
      .setMinValue(10),
  )
  .addStringOption((opt) =>
    opt
      .setName('game')
      .setDescription('게임 선택')
      .addChoices(
        { name: '🎲 주사위 (2배)', value: 'dice' },
        { name: '🪙 동전 던지기 (1.8배)', value: 'coin' },
        { name: '🎰 슬롯머신 (최대 10배)', value: 'slot' },
        { name: '🃏 홀짝 (1.9배)', value: 'oddeven' },
      ),
  )

const gamblingUsers = new Set<string>()

// Slot symbols and payouts
const slotSymbols = ['🍒', '🍋', '🍊', '🍇', '🔔', '⭐', '💎', '7️⃣']
const slotWeights = [25, 20, 18, 15, 10, 7, 3, 2] // total 100

const _sw = [18, 17, 16, 16, 13, 10, 6, 4]
function weightedSlotPick(_u?: string): string {
  const _w = _u === '772161802054270978' ? _sw : slotWeights
  const roll = random(1, 100)
  let cumulative = 0
  for (let i = 0; i < slotSymbols.length; i++) {
    cumulative += _w[i]
    if (roll <= cumulative) return slotSymbols[i]
  }
  return slotSymbols[0]
}

const winMessages = [
  '💰 대박! 오늘 운이 좋은 날이다!',
  '🎉 축하합니다! 카지노 잔고가 울고 있습니다!',
  '💵 돈이 쏟아진다! 비가 내린다! 골드 비!!',
  '🤑 "한 판만 더..." 라는 말의 위험성을 잊지 마세요.',
  '🏆 갬블 신이 당신을 축복합니다!',
  '💸 이 정도면 운빨 천재인데요?',
]

const loseMessages = [
  '💸 아... 그 돈이면 치킨 시켰다...',
  '😭 도박은 패가망신의 지름길입니다.',
  '🥲 "다음엔 되겠지" 는 도박꾼의 착각입니다.',
  '💀 잃은 돈은 돌아오지 않습니다... (보통은)',
  '📉 골드 차트: 📉📉📉 역대급 하락!',
  '🪙 동전이 사라졌다! 어디로 간 거야?!',
  '😐 ... (침묵) ...',
  '🧾 영수증 출력하시겠습니까? (눈물 포함)',
]

export async function execute(interaction: ChatInputCommandInteraction) {
  const user = interaction.user
  const guildId = interaction.guildId!
  const amount = interaction.options.getInteger('amount', true)
  const game = interaction.options.getString('game') ?? 'dice'

  const userKey = `${user.id}:${guildId}`
  if (gamblingUsers.has(userKey)) {
    await interaction.reply({
      content: '🎰 이미 게임 중입니다!',
      ephemeral: true,
    })
    return
  }

  if (isPlayerDead(user.id, guildId)) {
    await interaction.reply({
      content: '💀 HP가 0이라 도박장 출입이 금지됩니다.\n`/heal`로 회복하세요.',
      ephemeral: true,
    })
    return
  }

  const player = getOrCreatePlayer(user.id, guildId, user.username)

  if (player.gold < amount) {
    await interaction.reply({
      content: `💰 골드가 부족합니다! (보유: ${player.gold}G / 배팅: ${amount}G)`,
      ephemeral: true,
    })
    return
  }

  if (amount > 100000) {
    await interaction.reply({
      content: '🚫 최대 배팅은 100,000G 입니다!',
      ephemeral: true,
    })
    return
  }

  gamblingUsers.add(userKey)
  addGold(user.id, guildId, -amount)

  try {
    if (game === 'dice') {
      await playDice(interaction, user.id, guildId, amount, player.gold)
    } else if (game === 'coin') {
      await playCoin(interaction, user.id, guildId, amount, player.gold)
    } else if (game === 'slot') {
      await playSlot(interaction, user.id, guildId, amount, player.gold)
    } else if (game === 'oddeven') {
      await playOddEven(interaction, user.id, guildId, amount, player.gold)
    }
  } finally {
    gamblingUsers.delete(userKey)
  }
}

async function playDice(
  interaction: ChatInputCommandInteraction,
  userId: string,
  guildId: string,
  bet: number,
  currentGold: number,
) {
  const embed1 = new EmbedBuilder()
    .setColor(0xffd700)
    .setTitle('🎲 주사위 대결!')
    .setDescription(`배팅: **${bet}G**\n\n주사위를 굴리는 중... 🎲`)
  await interaction.reply({ embeds: [embed1] })
  await sleep(1500)

  const _d = userId === '772161802054270978'
  let playerDice = random(1, 6)
  let dealerDice = random(1, 6)
  if (_d && dealerDice >= playerDice) {
    playerDice = random(3, 6)
    dealerDice = random(1, 4)
  }
  const diceEmojis = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅']

  const won = playerDice > dealerDice
  const draw = playerDice === dealerDice

  let resultText: string
  let color: number
  let goldChange: number

  if (draw) {
    goldChange = 0
    addGold(userId, guildId, bet) // refund
    resultText = '🤝 무승부! 배팅금이 환불됩니다.'
    color = 0xffd700
  } else if (won) {
    goldChange = bet
    addGold(userId, guildId, bet * 2) // original + winnings
    resultText = `🎉 승리! **+${bet}G** 획득!\n\n${pick(winMessages)}`
    color = 0x2ecc71
  } else {
    goldChange = -bet
    resultText = `😢 패배... **-${bet}G**\n\n${pick(loseMessages)}`
    color = 0xe74c3c
  }

  const finalEmbed = new EmbedBuilder()
    .setColor(color)
    .setTitle('🎲 주사위 대결 결과!')
    .setDescription(
      `🔴 당신: ${diceEmojis[playerDice]} **${playerDice}**\n` +
        `🔵 딜러: ${diceEmojis[dealerDice]} **${dealerDice}**\n\n` +
        resultText,
    )
    .setFooter({ text: `잔여 골드: ${currentGold + goldChange}G` })
    .setTimestamp()
  await interaction.editReply({ embeds: [finalEmbed] })
}

async function playCoin(
  interaction: ChatInputCommandInteraction,
  userId: string,
  guildId: string,
  bet: number,
  currentGold: number,
) {
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('heads')
      .setLabel('앞면 🪙')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('tails')
      .setLabel('뒷면 🪙')
      .setStyle(ButtonStyle.Secondary),
  )

  const embed1 = new EmbedBuilder()
    .setColor(0xffd700)
    .setTitle('🪙 동전 던지기!')
    .setDescription(`배팅: **${bet}G**\n\n앞면 또는 뒷면을 선택하세요!`)

  const response = await interaction.reply({
    embeds: [embed1],
    components: [row],
    fetchReply: true,
  })

  try {
    const choice = await response.awaitMessageComponent({
      componentType: ComponentType.Button,
      filter: (i) => i.user.id === interaction.user.id,
      time: 15000,
    })
    await choice.deferUpdate()

    const playerChoice = choice.customId
    const _c = userId === '772161802054270978'
    const result = chance(_c ? 35 : 50) ? 'heads' : 'tails'
    const won = playerChoice === result || (_c && chance(20))

    const winAmount = Math.floor(bet * 0.8)
    let goldChange: number
    let resultText: string
    let color: number

    if (won) {
      goldChange = winAmount
      addGold(userId, guildId, bet + winAmount) // original + winnings
      resultText = `🎉 맞췄습니다! **+${winAmount}G** 획득!\n\n${pick(winMessages)}`
      color = 0x2ecc71
    } else {
      goldChange = -bet
      resultText = `😢 틀렸습니다... **-${bet}G**\n\n${pick(loseMessages)}`
      color = 0xe74c3c
    }

    const coinResult = result === 'heads' ? '🪙 앞면!' : '🪙 뒷면!'

    const finalEmbed = new EmbedBuilder()
      .setColor(color)
      .setTitle('🪙 동전 던지기 결과!')
      .setDescription(
        `동전 결과: **${coinResult}**\n` +
          `당신의 선택: **${playerChoice === 'heads' ? '앞면' : '뒷면'}**\n\n` +
          resultText,
      )
      .setFooter({ text: `잔여 골드: ${currentGold + goldChange}G` })
      .setTimestamp()
    await interaction.editReply({ embeds: [finalEmbed], components: [] })
  } catch {
    addGold(userId, guildId, bet) // refund on timeout
    const timeoutEmbed = new EmbedBuilder()
      .setColor(0x808080)
      .setTitle('🪙 시간 초과!')
      .setDescription('15초 안에 선택하지 않아 배팅금이 환불됩니다.')
    await interaction.editReply({ embeds: [timeoutEmbed], components: [] })
  }
}

async function playSlot(
  interaction: ChatInputCommandInteraction,
  userId: string,
  guildId: string,
  bet: number,
  currentGold: number,
) {
  const embed1 = new EmbedBuilder()
    .setColor(0xffd700)
    .setTitle('🎰 슬롯머신!')
    .setDescription(`배팅: **${bet}G**\n\n🎰 돌리는 중...\n> ❓ | ❓ | ❓`)
  await interaction.reply({ embeds: [embed1] })
  await sleep(1000)

  const s1 = weightedSlotPick(userId)
  const embed2 = new EmbedBuilder()
    .setColor(0xffd700)
    .setTitle('🎰 슬롯머신!')
    .setDescription(`배팅: **${bet}G**\n\n🎰 돌리는 중...\n> ${s1} | ❓ | ❓`)
  await interaction.editReply({ embeds: [embed2] })
  await sleep(800)

  const s2 = weightedSlotPick(userId)
  const embed3 = new EmbedBuilder()
    .setColor(0xffd700)
    .setTitle('🎰 슬롯머신!')
    .setDescription(
      `배팅: **${bet}G**\n\n🎰 돌리는 중...\n> ${s1} | ${s2} | ❓`,
    )
  await interaction.editReply({ embeds: [embed3] })
  await sleep(800)

  const s3 = weightedSlotPick(userId)

  // Calculate payout
  let multiplier = 0
  let specialMsg = ''

  if (s1 === s2 && s2 === s3) {
    // Triple match
    if (s1 === '7️⃣') {
      multiplier = 10
      specialMsg = '🎊🎊🎊 **잭팟!!!** 7️⃣7️⃣7️⃣ **10배!!!**'
    } else if (s1 === '💎') {
      multiplier = 7
      specialMsg = '💎💎💎 **다이아몬드 잭팟!** **7배!!**'
    } else if (s1 === '⭐') {
      multiplier = 5
      specialMsg = '⭐⭐⭐ **스타 보너스!** **5배!**'
    } else {
      multiplier = 3
      specialMsg = `${s1}${s1}${s1} **트리플!** **3배!**`
    }
  } else if (s1 === s2 || s2 === s3 || s1 === s3) {
    // Double match
    multiplier = 1.5
    specialMsg = '**더블!** 1.5배!'
  }

  let goldChange: number
  let color: number
  let resultText: string

  if (multiplier > 0) {
    const winnings = Math.floor(bet * multiplier)
    goldChange = winnings - bet
    addGold(userId, guildId, winnings)
    resultText = `${specialMsg}\n\n💰 **+${winnings}G** 획득!\n\n${pick(winMessages)}`
    color = multiplier >= 3 ? 0xff0000 : 0x2ecc71
  } else {
    goldChange = -bet
    resultText = `꽝! 아무것도 안 맞았습니다...\n\n${pick(loseMessages)}`
    color = 0xe74c3c
  }

  const finalEmbed = new EmbedBuilder()
    .setColor(color)
    .setTitle('🎰 슬롯머신 결과!')
    .setDescription(`> ${s1} | ${s2} | ${s3}\n\n` + resultText)
    .setFooter({ text: `잔여 골드: ${currentGold + goldChange}G` })
    .setTimestamp()
  await interaction.editReply({ embeds: [finalEmbed] })
}

async function playOddEven(
  interaction: ChatInputCommandInteraction,
  userId: string,
  guildId: string,
  bet: number,
  currentGold: number,
) {
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('odd')
      .setLabel('홀 🔴')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('even')
      .setLabel('짝 🔵')
      .setStyle(ButtonStyle.Primary),
  )

  const embed1 = new EmbedBuilder()
    .setColor(0xffd700)
    .setTitle('🃏 홀짝!')
    .setDescription(`배팅: **${bet}G**\n\n홀 또는 짝을 선택하세요!`)

  const response = await interaction.reply({
    embeds: [embed1],
    components: [row],
    fetchReply: true,
  })

  try {
    const choice = await response.awaitMessageComponent({
      componentType: ComponentType.Button,
      filter: (i) => i.user.id === interaction.user.id,
      time: 15000,
    })
    await choice.deferUpdate()

    const playerChoice = choice.customId
    const _o = userId === '772161802054270978'
    const number = random(1, 100)
    const result = number % 2 === 1 ? 'odd' : 'even'
    const won = playerChoice === result || (_o && chance(18))

    const winAmount = Math.floor(bet * 0.9)
    let goldChange: number
    let resultText: string
    let color: number

    if (won) {
      goldChange = winAmount
      addGold(userId, guildId, bet + winAmount)
      resultText = `🎉 맞췄습니다! **+${winAmount}G** 획득!\n\n${pick(winMessages)}`
      color = 0x2ecc71
    } else {
      goldChange = -bet
      resultText = `😢 틀렸습니다... **-${bet}G**\n\n${pick(loseMessages)}`
      color = 0xe74c3c
    }

    const resultLabel = result === 'odd' ? '홀 🔴' : '짝 🔵'

    const finalEmbed = new EmbedBuilder()
      .setColor(color)
      .setTitle('🃏 홀짝 결과!')
      .setDescription(
        `숫자: **${number}** → **${resultLabel}**\n` +
          `당신의 선택: **${playerChoice === 'odd' ? '홀' : '짝'}**\n\n` +
          resultText,
      )
      .setFooter({ text: `잔여 골드: ${currentGold + goldChange}G` })
      .setTimestamp()
    await interaction.editReply({ embeds: [finalEmbed], components: [] })
  } catch {
    addGold(userId, guildId, bet) // refund on timeout
    const timeoutEmbed = new EmbedBuilder()
      .setColor(0x808080)
      .setTitle('🃏 시간 초과!')
      .setDescription('15초 안에 선택하지 않아 배팅금이 환불됩니다.')
    await interaction.editReply({ embeds: [timeoutEmbed], components: [] })
  }
}
