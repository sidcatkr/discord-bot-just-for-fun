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
  addFish,
  addIslandXp,
  addTitle,
  getIslandBuilding,
  getOrCreateIsland,
  getOrCreatePollution,
  addPollution,
  reducePollution,
  addTrash,
  getTrashInventory,
  removeAllTrashByUser,
  isPlayerDead,
  damagePlayer,
  getEffectiveStats,
  addXp,
  pick,
  sleep,
  random,
} from '../../db/helpers.js'
import {
  rollFish,
  rollFishingEvent,
  rollTrash,
  rollSeaMonster,
  fishRarityLabels,
  fishRarityColors,
} from '../../data/fish-data.js'

export const data = new SlashCommandBuilder()
  .setName('fish')
  .setDescription('🎣 낚시를 합니다!')
  .addStringOption((opt) =>
    opt
      .setName('action')
      .setDescription('추가 행동 (비워두면 낚시합니다)')
      .addChoices(
        { name: '🗑️ 쓰레기 처리', value: 'dispose' },
        { name: '💀 바다에 버리기', value: 'dump' },
        { name: '🌊 오염도 확인', value: 'pollution' },
      ),
  )

const fishingMessages = [
  '찌를 던졌습니다...',
  '물 위에 찌가 떠 있습니다...',
  '조용히 기다리는 중...',
  '뭔가 움직이는 것 같은데...',
  '바다 냄새가 좋다...',
  '졸음이 몰려온다...',
  '유튜브나 볼까... 아 낚시 중이었지',
  '옆 사람은 전설급 잡았다는데...',
  '이게 낚시인지 명상인지 모르겠다...',
  '물고기도 퇴근 시간이 있나...',
  '찌가 안 움직인다. 나도 안 움직인다. 우리 둘 다 NPC다.',
  '이 낚시터 리뷰: ★☆☆☆☆ "물고기 없음"',
  '사실 물고기가 날 낚시하고 있는 건 아닐까...',
]

// Real bite messages — player SHOULD press the button
const realBiteMessages = [
  '🔔 찌가 흔들린다!!',
  '🔔 입질이 왔다!!',
  '🔔 뭔가 강하게 당긴다!!',
  '🔔 묵직한 손맛!!',
  '🔔 찌가 물속으로 빨려들어간다!!',
]

// Fake bait messages — player should NOT press (instant fail if they press)
const fakeBiteMessages = [
  '🔔 찌찌가 흔들린다!!',
  '🔔 입질이 왔다!!... 아닌가?',
  '🔔 찌가 흔들린 것 같기도...',
  '🔔 뭔가 잠깐 흔들렸다?!',
  '🔔 바바바바바바밤!!!!',
  '🔔 옆사람이 찌를 건드렸다!!',
  '🔔 물고기가... 지나갔다!!',
  '🔔 찌가 흔들린다!!!! (바람)',
  '🔔 크크크큰 물고기다!!!!!',
  '🔔 대어가 왔왔왔다!!!',
  '🔔 찌가 미세하게 아주 약간 움직였다!!',
  '🔔 낚싯대가 부르르르!!!... 추웠나보다',
  '🔔 수면이 출렁출렁!!',
  '🔔 물고기가 니 찌를 비웃고 갔다!!',
  '🔔 찌가... 옆으로 갔다!! (조류)',
  '🔔 전설의 물고기가!!!... 꿈이었다',
  '🔔 AI가 입질이라고 합니다!! (신뢰도 2%)',
  '🔔 뭔가 올라온다!! ...해파리다.',
]

export async function execute(interaction: ChatInputCommandInteraction) {
  const action = interaction.options.getString('action')
  const user = interaction.user
  const guildId = interaction.guildId!

  if (!action) {
    await handleCast(interaction, user, guildId)
  } else if (action === 'dispose') {
    await handleDispose(interaction, user, guildId)
  } else if (action === 'dump') {
    await handleDump(interaction, user, guildId)
  } else if (action === 'pollution') {
    await handlePollution(interaction, user, guildId)
  }
}

async function handleCast(
  interaction: ChatInputCommandInteraction,
  user: { id: string; username: string },
  guildId: string,
) {
  // HP check
  if (isPlayerDead(user.id, guildId)) {
    const deadFishMessages = [
      '💀 HP가 0입니다! 활동할 수 없습니다.\n`/heal`로 회복하거나 `/daily`로 보상을 받으세요.',
      '💀 죽은 상태로 낚시하면 본인이 물고기가 됩니다.\n`/heal`로 부활하세요.',
      '💀 유령 낚시는 서비스 준비 중입니다.\n`/heal`로 회복하세요.',
    ]
    await interaction.reply({
      content: pick(deadFishMessages),
      ephemeral: true,
    })
    return
  }

  getOrCreatePlayer(user.id, guildId, user.username)
  const island = getOrCreateIsland(user.id, guildId)
  const fishingSpot = getIslandBuilding(user.id, guildId, 'fishing_spot')
  const spotLevel = fishingSpot?.building_level ?? 1
  const pollution = getOrCreatePollution(user.id, guildId)

  // Water treatment passively reduces pollution each fishing attempt
  const waterTreatment = getIslandBuilding(user.id, guildId, 'water_treatment')
  if (waterTreatment && pollution.pollution_level > 0) {
    const reduction = waterTreatment.building_level * 0.3
    reducePollution(user.id, guildId, reduction)
  }

  // Get current pollution after treatment
  const currentPollution = getOrCreatePollution(user.id, guildId)
  const pollutionWarning =
    currentPollution.pollution_level >= 7
      ? '\n⚠️ **수질 오염 심각!** 좋은 물고기가 안 나옵니다!'
      : currentPollution.pollution_level >= 4
        ? '\n⚠️ 수질 오염도가 높습니다...'
        : ''

  // ── Roll fishing event ──
  const event = rollFishingEvent(spotLevel, currentPollution.pollution_level)

  // ── Phase 1: 낚시 시작 ──
  const embed1 = new EmbedBuilder()
    .setColor(0x1e90ff)
    .setTitle('🎣 낚시 중...')
    .setDescription(
      `> 🌊 ～～～🎣\n\n` +
        `**${pick(fishingMessages)}**\n` +
        `낚시터 레벨: ⭐ ${spotLevel}` +
        `${pollutionWarning}`,
    )
  await interaction.reply({ embeds: [embed1] })

  // ── LINE BREAK (no button phase) ──
  if (event.type === 'line_break') {
    await sleep(2000)
    const lineBreakEmbed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle('💔 이런...!')
      .setDescription(
        `> 🌊 ～💥～ 🎣💢\n\n` +
          `**${event.message}**\n\n` +
          `낚싯줄이 끊어져서 아무것도 못 잡았습니다...\n` +
          `${currentPollution.pollution_level >= 5 ? '🏭 수질 오염이 심해서 줄이 약해진 것 같습니다...' : '다음에는 운이 좋을 거예요!'}`,
      )
      .setTimestamp()
    await interaction.editReply({ embeds: [lineBreakEmbed] })
    return
  }

  // ── Timing minigame: fake bait → real bite ──
  // Decide how many fake baits to show (0-2)
  const fakeCount = random(0, 2)
  const buttonId = `fish_pull_${user.id}_${Date.now()}`

  for (let i = 0; i < fakeCount; i++) {
    await sleep(random(1500, 3000))

    const fakeMsg = pick(fakeBiteMessages)
    const fakeButton = new ButtonBuilder()
      .setCustomId(`${buttonId}_fake_${i}`)
      .setLabel('🎣 당긴다!')
      .setStyle(ButtonStyle.Danger)
    const fakeRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      fakeButton,
    )

    const fakeEmbed = new EmbedBuilder()
      .setColor(0xff6b35)
      .setTitle('🎣 낚시 중...')
      .setDescription(`> 🌊 ～💥～🎣\n\n` + `**${fakeMsg}**`)
    await interaction.editReply({
      embeds: [fakeEmbed],
      components: [fakeRow],
    })

    // Wait for accidental click (3 seconds window)
    try {
      const fakeCollector = await interaction.channel?.awaitMessageComponent({
        componentType: ComponentType.Button,
        filter: (i) =>
          i.customId === `${buttonId}_fake_${i}` && i.user.id === user.id,
        time: 3000,
      })

      if (fakeCollector) {
        // User fell for the fake! Fail!
        const failEmbed = new EmbedBuilder()
          .setColor(0xe74c3c)
          .setTitle('❌ 속았다!')
          .setDescription(
            `> 🌊 ～～～🎣\n\n` +
              `**가짜 입질에 속아서 줄을 잡아당겨버렸습니다!**\n\n` +
              `물고기가 놀라서 도망갔습니다... 🐟💨\n` +
              `다음에는 진짜 입질을 기다리세요!`,
          )
          .setTimestamp()
        await fakeCollector.update({ embeds: [failEmbed], components: [] })
        return
      }
    } catch {
      // Timeout = good, user didn't fall for fake
    }

    // Remove the button after fake phase
    const waitEmbed = new EmbedBuilder()
      .setColor(0x1e90ff)
      .setTitle('🎣 낚시 중...')
      .setDescription(
        `> 🌊 ～～～🎣\n\n` + `**아닌 것 같다... 계속 기다린다...**`,
      )
    await interaction.editReply({ embeds: [waitEmbed], components: [] })
  }

  // ── Real bite phase ──
  await sleep(random(1500, 3500))

  const realMsg = pick(realBiteMessages)
  const eventMessage =
    event.type !== 'normal' ? `\n${event.emoji} **${event.message}**` : ''

  const pullButton = new ButtonBuilder()
    .setCustomId(`${buttonId}_real`)
    .setLabel('🎣 당긴다!')
    .setStyle(ButtonStyle.Success)
  const pullRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    pullButton,
  )

  const biteEmbed = new EmbedBuilder()
    .setColor(
      event.type === 'trash'
        ? 0x95a5a6
        : event.type === 'storm'
          ? 0x2c3e50
          : 0xff6b35,
    )
    .setTitle('🎣 입질이다!!')
    .setDescription(`> 🌊 ～💥～🎣\n\n` + `**${realMsg}**${eventMessage}`)
  await interaction.editReply({
    embeds: [biteEmbed],
    components: [pullRow],
  })

  // Wait for button press (4 second window — not too easy)
  let pulled = false
  try {
    const realCollector = await interaction.channel?.awaitMessageComponent({
      componentType: ComponentType.Button,
      filter: (i) => i.customId === `${buttonId}_real` && i.user.id === user.id,
      time: 4000,
    })

    if (realCollector) {
      pulled = true
      await realCollector.deferUpdate()
    }
  } catch {
    // Timeout = missed the fish
  }

  if (!pulled) {
    const missEmbed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle('💨 놓쳤다!')
      .setDescription(
        `> 🌊 ～～～🎣\n\n` +
          `**타이밍을 놓쳤습니다!**\n\n` +
          `물고기가 미끼만 먹고 도망갔습니다... 🐟💨\n` +
          `다음에는 더 빨리 반응하세요!`,
      )
      .setTimestamp()
    await interaction.editReply({ embeds: [missEmbed], components: [] })
    return
  }

  // ── Successfully pulled! Now resolve the event ──
  await interaction.editReply({ components: [] })

  // ── TRASH EVENT ──
  if (event.type === 'trash') {
    const trash = rollTrash()

    addTrash(user.id, guildId, {
      trash_name: trash.name,
      trash_emoji: trash.emoji,
      disposal_cost: trash.disposalCost,
      pollution_amount: trash.pollutionAmount,
    })

    const trashEmbed = new EmbedBuilder()
      .setColor(0x95a5a6)
      .setTitle('🗑️ 쓰레기를 낚았다...')
      .setDescription(
        `${trash.emoji} **${trash.name}**\n\n` +
          `> *${trash.description}*\n\n` +
          `처리 비용: **${trash.disposalCost}G** 💰\n` +
          `오염도: **+${trash.pollutionAmount}** 🏭\n\n` +
          `📌 **선택지:**\n` +
          `\`/fish action:🗑️ 쓰레기 처리\` — 비용을 내고 처리 (환경 보호!)\n` +
          `\`/fish action:💀 바다에 버리기\` — 바다에 버리기 (수질 오염 증가!)`,
      )
      .setFooter({
        text: `현재 수질 오염도: ${currentPollution.pollution_level.toFixed(1)}/10`,
      })
      .setTimestamp()
    await interaction.editReply({ embeds: [trashEmbed] })
    return
  }

  // ── TREASURE EVENT ──
  if (event.type === 'treasure') {
    const treasureGold = random(100, 500)
    addGold(user.id, guildId, treasureGold)
    addIslandXp(user.id, guildId, 30)

    const treasureEmbed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle('🎁 보물 상자!!!')
      .setDescription(
        `> ✨🎁✨\n\n` +
          `바다 속에서 보물 상자를 발견했습니다!\n\n` +
          `💰 **+${treasureGold}G** 획득!\n` +
          `🏝️ 섬 경험치 +30`,
      )
      .setTimestamp()
    await interaction.editReply({ embeds: [treasureEmbed] })
    return
  }

  // ── SEA MONSTER EVENT ──
  if (event.type === 'sea_monster') {
    const monster = rollSeaMonster()
    const player = getOrCreatePlayer(user.id, guildId, user.username)
    const stats = getEffectiveStats(user.id, guildId)

    // Simple auto-battle: 3 rounds
    let monsterHp = monster.hp
    let playerHp = player.hp
    const battleLines: string[] = [
      `${monster.emoji} **${monster.name}** 등장!`,
      `> *${monster.description}*\n`,
    ]

    for (let round = 1; round <= 3; round++) {
      const playerDmg = random(Math.max(1, stats.attack - 5), stats.attack + 10)
      monsterHp -= playerDmg
      battleLines.push(
        `⚔️ 라운드 ${round}: 당신의 공격! → ${monster.emoji} **-${playerDmg} HP** (${Math.max(0, monsterHp)}/${monster.hp})`,
      )

      if (monsterHp <= 0) {
        battleLines.push(`\n🎉 **${monster.name}을(를) 처치했다!**`)
        break
      }

      const monsterDmg = random(
        Math.max(1, monster.attack - stats.defense),
        monster.attack + 3,
      )
      playerHp -= monsterDmg
      battleLines.push(
        `${monster.emoji} 반격! → 🩸 **-${monsterDmg} HP** (${Math.max(0, playerHp)}/${stats.max_hp})`,
      )

      if (playerHp <= 0) {
        battleLines.push(`\n💀 **당신이 쓰러졌다...**`)
        break
      }
    }

    const won = monsterHp <= 0

    if (won) {
      addGold(user.id, guildId, monster.goldReward)
      addXp(user.id, guildId, monster.xpReward)
      addIslandXp(user.id, guildId, 40)
      // Apply damage taken
      const damageTaken = Math.max(0, player.hp - playerHp)
      if (damageTaken > 0) damagePlayer(user.id, guildId, damageTaken)

      battleLines.push(
        `\n💰 **+${monster.goldReward}G** | ✨ **+${monster.xpReward} XP** | 🏝️ **+40 섬XP**`,
      )
    } else {
      const damageTaken = Math.max(0, player.hp - Math.max(0, playerHp))
      if (damageTaken > 0) damagePlayer(user.id, guildId, damageTaken)
      battleLines.push(`\n괴물에게 패배했습니다... HP를 확인하세요!`)
    }

    const monsterEmbed = new EmbedBuilder()
      .setColor(won ? 0x2ecc71 : 0xe74c3c)
      .setTitle(
        won
          ? `${monster.emoji} 바다 괴물 처치!`
          : `${monster.emoji} 바다 괴물에게 패배...`,
      )
      .setDescription(battleLines.join('\n'))
      .setTimestamp()
    await interaction.editReply({ embeds: [monsterEmbed] })
    return
  }

  // ── NORMAL / STORM / GOLDEN_HOUR / DOUBLE_CATCH ──
  const isStorm = event.type === 'storm'
  const isGoldenHour = event.type === 'golden_hour'
  const isDoubleCatch = event.type === 'double_catch'

  const result = rollFish(spotLevel, currentPollution.pollution_level, isStorm)
  let { fish, size, value } = result

  if (isGoldenHour) value = value * 2

  // Save first fish
  addFish(user.id, guildId, {
    fish_name: fish.name,
    fish_rarity: fish.rarity,
    fish_emoji: fish.emoji,
    fish_size: size,
    fish_value: value,
  })
  addGold(user.id, guildId, value)
  const leveledUp = addIslandXp(user.id, guildId, 10)

  let totalValue = value
  let secondFishText = ''

  // Double catch — roll second fish
  if (isDoubleCatch) {
    const result2 = rollFish(spotLevel, currentPollution.pollution_level)
    const value2 = isGoldenHour ? result2.value * 2 : result2.value
    addFish(user.id, guildId, {
      fish_name: result2.fish.name,
      fish_rarity: result2.fish.rarity,
      fish_emoji: result2.fish.emoji,
      fish_size: result2.size,
      fish_value: value2,
    })
    addGold(user.id, guildId, value2)
    addIslandXp(user.id, guildId, 10)
    totalValue += value2

    const size2Text =
      result2.size >= 1000
        ? `${(result2.size / 100).toFixed(1)}m`
        : `${result2.size}cm`
    secondFishText =
      `\n\n🎉 **두 번째 물고기!**\n` +
      `${result2.fish.emoji} **${result2.fish.name}** (${fishRarityLabels[result2.fish.rarity]})\n` +
      `크기: **${size2Text}** | 판매가: **${value2}G** 💰`
  }

  const sizeText = size >= 1000 ? `${(size / 100).toFixed(1)}m` : `${size}cm`

  const resultEmbed = new EmbedBuilder()
    .setColor(fishRarityColors[fish.rarity])
    .setTitle(
      isStorm
        ? '🌊 폭풍 속의 대어!'
        : isGoldenHour
          ? '✨ 황금 시간 낚시!'
          : isDoubleCatch
            ? '🎉 더블 캐치!'
            : '🎣 낚시 결과!',
    )
    .setDescription(
      `${fish.emoji} **${fish.name}**\n` +
        `등급: ${fishRarityLabels[fish.rarity]}\n` +
        `크기: **${sizeText}**\n` +
        `판매가: **${value}G** 💰` +
        `${isGoldenHour ? ' (✨ 2배!)' : ''}\n\n` +
        `> *${fish.description}*` +
        secondFishText,
    )

  if (fish.rarity === 'legendary' || fish.rarity === 'mythic') {
    resultEmbed.addFields({
      name: '🎊 대어다!!!',
      value:
        fish.rarity === 'mythic'
          ? '🌟 **신화급 물고기!!!** 이건 박제해야 합니다!'
          : '✨ **전설급 물고기!** 대단한 낚시 실력!',
    })
    if (fish.rarity === 'mythic') {
      addTitle(user.id, guildId, '🎣 전설의 낚시왕')
    }
  }

  if (fish.rarity === 'common' && value <= 5) {
    const sadFish = [
      '🗑️ 이걸 팔 수 있긴 한 건가...',
      '😐 차라리 놓아줄걸...',
      '💀 시간 낭비...',
    ]
    resultEmbed.addFields({ name: '😢', value: pick(sadFish) })
  }

  if (leveledUp) {
    resultEmbed.addFields({
      name: '🏝️ 섬 레벨 업!',
      value: `섬이 레벨 ${island.island_level + 1}로 성장했습니다!`,
    })
  }

  resultEmbed.setFooter({
    text: `낚시터 ⭐${spotLevel} | +${totalValue}G | 섬XP +${isDoubleCatch ? 20 : 10} | 오염도: ${currentPollution.pollution_level.toFixed(1)}/10`,
  })
  resultEmbed.setTimestamp()

  await interaction.editReply({ embeds: [resultEmbed] })
}

async function handleDispose(
  interaction: ChatInputCommandInteraction,
  user: { id: string; username: string },
  guildId: string,
) {
  const player = getOrCreatePlayer(user.id, guildId, user.username)
  const trashItems = getTrashInventory(user.id, guildId)

  if (trashItems.length === 0) {
    await interaction.reply({
      content: '✅ 처리할 쓰레기가 없습니다! 깨끗해요!',
      ephemeral: true,
    })
    return
  }

  const totalCost = trashItems.reduce((s, t) => s + t.disposal_cost, 0)

  if (player.gold < totalCost) {
    await interaction.reply({
      content: `💰 처리 비용이 부족합니다!\n쓰레기 ${trashItems.length}개 | 필요: ${totalCost}G | 보유: ${player.gold}G`,
      ephemeral: true,
    })
    return
  }

  addGold(user.id, guildId, -totalCost)

  // Disposing trash reduces pollution
  const totalPollutionReduced = trashItems.reduce(
    (s, t) => s + t.pollution_amount * 0.5,
    0,
  )
  reducePollution(user.id, guildId, totalPollutionReduced)

  removeAllTrashByUser(user.id, guildId)

  // Bonus XP for environmental cleanup
  addIslandXp(user.id, guildId, trashItems.length * 5)

  const embed = new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle('♻️ 쓰레기 처리 완료!')
    .setDescription(
      `${trashItems.map((t) => `${t.trash_emoji} ${t.trash_name}`).join(', ')}\n\n` +
        `🗑️ 처리된 쓰레기: **${trashItems.length}개**\n` +
        `💰 처리 비용: **-${totalCost}G**\n` +
        `🌊 수질 개선: **-${totalPollutionReduced.toFixed(1)}**\n` +
        `🏝️ 환경 보호 보너스 XP: **+${trashItems.length * 5}**\n\n` +
        `> *바다가 조금 더 깨끗해졌습니다!* 🐟`,
    )
    .setTimestamp()

  await interaction.reply({ embeds: [embed] })
}

async function handleDump(
  interaction: ChatInputCommandInteraction,
  user: { id: string; username: string },
  guildId: string,
) {
  getOrCreatePlayer(user.id, guildId, user.username)
  const trashItems = getTrashInventory(user.id, guildId)

  if (trashItems.length === 0) {
    await interaction.reply({
      content: '✅ 버릴 쓰레기가 없습니다!',
      ephemeral: true,
    })
    return
  }

  // Dumping increases pollution
  const totalPollutionAdded = trashItems.reduce(
    (s, t) => s + t.pollution_amount,
    0,
  )

  for (const t of trashItems) {
    addPollution(user.id, guildId, t.pollution_amount)
  }

  removeAllTrashByUser(user.id, guildId)

  const pollution = getOrCreatePollution(user.id, guildId)

  const embed = new EmbedBuilder()
    .setColor(0xe74c3c)
    .setTitle('💀 쓰레기 불법 투기!')
    .setDescription(
      `${trashItems.map((t) => `${t.trash_emoji}`).join(' ')} → 🌊\n\n` +
        `🗑️ 버린 쓰레기: **${trashItems.length}개**\n` +
        `🏭 수질 오염 증가: **+${totalPollutionAdded.toFixed(1)}**\n` +
        `🌊 현재 오염도: **${pollution.pollution_level.toFixed(1)}/10**\n\n` +
        `> *물고기들이 떠나가고 있습니다...*\n` +
        `> *좋은 물고기가 나올 확률이 떨어집니다!*\n\n` +
        `💡 **수질 관리 시설**을 지으면 자동으로 오염이 줄어듭니다!\n` +
        `\`/island build\`에서 🚰 수질 관리 시설을 확인하세요.`,
    )
    .setTimestamp()

  await interaction.reply({ embeds: [embed] })
}

async function handlePollution(
  interaction: ChatInputCommandInteraction,
  user: { id: string; username: string },
  guildId: string,
) {
  getOrCreatePlayer(user.id, guildId, user.username)
  const pollution = getOrCreatePollution(user.id, guildId)

  const level = pollution.pollution_level
  const pollutionBar = makePollutionBar(level)

  let status: string
  let color: number
  if (level <= 1) {
    status = '🏖️ 맑고 깨끗한 바다! 물고기들의 천국!'
    color = 0x00d4aa
  } else if (level <= 3) {
    status = '🌊 약간의 오염이 있지만 괜찮은 수준.'
    color = 0x2ecc71
  } else if (level <= 5) {
    status = '⚠️ 오염이 심해지고 있습니다. 관리가 필요합니다.'
    color = 0xf39c12
  } else if (level <= 7) {
    status = '🏭 심각한 오염! 좋은 물고기가 잘 안 나옵니다.'
    color = 0xe67e22
  } else {
    status = '☠️ 극심한 오염! 쓰레기만 건져올릴 수 있을 정도...'
    color = 0xe74c3c
  }

  const waterTreatment = getIslandBuilding(user.id, guildId, 'water_treatment')
  const treatmentInfo = waterTreatment
    ? `🚰 수질 관리 시설 Lv.${waterTreatment.building_level} — 낚시할 때마다 오염도 ${(waterTreatment.building_level * 0.3).toFixed(1)} 감소`
    : '🚰 수질 관리 시설 없음 — `/island build`에서 건설 가능'

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle('🌊 수질 오염도')
    .setDescription(
      `**오염도:** ${pollutionBar} **${level.toFixed(1)}/10**\n\n` +
        `${status}\n\n` +
        `📊 **통계:**\n` +
        `🗑️ 버린 쓰레기: ${pollution.trash_dumped}개\n` +
        `♻️ 처리한 쓰레기: ${pollution.trash_disposed}개\n\n` +
        `${treatmentInfo}`,
    )
    .setFooter({
      text: '오염이 높을수록 좋은 물고기 확률↓ 쓰레기 확률↑ 줄 끊김↑',
    })
    .setTimestamp()

  await interaction.reply({ embeds: [embed] })
}

function makePollutionBar(level: number): string {
  const ratio = Math.max(0, Math.min(1, level / 10))
  const filled = Math.round(ratio * 10)
  const empty = 10 - filled
  return '🟥'.repeat(filled) + '🟩'.repeat(empty)
}
