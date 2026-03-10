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
  addXp,
  addTitle,
  logBattle,
  getParty,
  pick,
  sleep,
  random,
} from '../../db/helpers.js'
import {
  buildPlayerCombatant,
  initCombat,
  getNextActor,
  canUseSkill,
  canUseUltimate,
  executeAction,
  getTeamStatus,
  getPartySynergies,
  applySynergies,
  type ActionType,
} from '../../data/combat-engine.js'
import db from '../../db/database.js'

export const data = new SlashCommandBuilder()
  .setName('pvp')
  .setDescription('⚔️ 파티 PVP! 스타레일 스타일 턴제 전투!')
  .addUserOption((opt) => opt.setName('target').setDescription('대결 상대'))
  .addStringOption((opt) =>
    opt.setName('test_id').setDescription('테스트 유저 ID (test_ 접두사)'),
  )
  .addIntegerOption((opt) =>
    opt
      .setName('bet')
      .setDescription('배팅 골드 (0이면 무배팅)')
      .setMinValue(0),
  )

const pvpUsers = new Set<string>()

const pvpTaunts = [
  '😏 "겁나면 도망가도 돼요~"',
  '🗡️ "이것이 진정한 PVP다!"',
  '💀 "오늘 저승길 동반자를 구합니다"',
  '⚔️ "전투는 숫자가 아니라 감각이다"',
  '🏆 "서버 최강자를 가린다!"',
  '🔥 "불꽃 튀는 대결의 시간!"',
]

const victoryQuotes = [
  '승리의 여신은 한 명만 선택합니다.',
  '이것이 바로 실력차입니다.',
  '패배를 딛고 더 강해지세요.',
  '최강자는 태어나는 것이 아니라 만들어지는 것.',
  'GG WP',
]

export async function execute(interaction: ChatInputCommandInteraction) {
  const user = interaction.user
  const target = interaction.options.getUser('target')
  const testId = interaction.options.getString('test_id')
  const bet = interaction.options.getInteger('bet') ?? 0
  const guildId = interaction.guildId!

  // Determine target info
  let targetId: string
  let targetName: string
  let isTestUser = false

  if (testId) {
    if (!testId.startsWith('test_')) {
      await interaction.reply({
        content: '❌ 테스트 유저 ID는 `test_`로 시작해야 합니다.',
        ephemeral: true,
      })
      return
    }
    // Verify test user exists in DB
    const testPlayer = db
      .prepare('SELECT username FROM players WHERE user_id = ?')
      .get(testId) as { username: string } | undefined
    if (!testPlayer) {
      await interaction.reply({
        content:
          '❌ 존재하지 않는 테스트 유저입니다. `/admin testsetup`으로 먼저 생성하세요.',
        ephemeral: true,
      })
      return
    }
    targetId = testId
    targetName = testPlayer.username
    isTestUser = true
  } else if (target) {
    if (target.id === user.id) {
      await interaction.reply({
        content: '🤦 자기 자신과는 PVP할 수 없습니다!',
        ephemeral: true,
      })
      return
    }
    if (target.bot) {
      await interaction.reply({
        content: '🤖 봇에게는 파티가 없어 PVP가 불가능합니다!',
        ephemeral: true,
      })
      return
    }
    targetId = target.id
    targetName = target.username
  } else {
    await interaction.reply({
      content:
        '❌ 대결 상대(`target`) 또는 테스트 유저 ID(`test_id`)를 입력하세요.',
      ephemeral: true,
    })
    return
  }

  const userKey = `${user.id}:${guildId}`
  const targetKey = `${targetId}:${guildId}`
  if (pvpUsers.has(userKey) || pvpUsers.has(targetKey)) {
    await interaction.reply({
      content: '⚔️ 이미 PVP 중입니다!',
      ephemeral: true,
    })
    return
  }

  // Check parties
  const userParty = getParty(user.id)
  const targetParty = getParty(targetId)

  if (userParty.length === 0) {
    await interaction.reply({
      content: '❌ 파티가 비어있습니다! `/party set`으로 캐릭터를 배치하세요.',
      ephemeral: true,
    })
    return
  }
  if (targetParty.length === 0) {
    await interaction.reply({
      content: '❌ 상대방의 파티가 비어있습니다!',
      ephemeral: true,
    })
    return
  }

  if (bet > 0) {
    const attacker = getOrCreatePlayer(user.id, guildId, user.username)
    if (attacker.gold < bet) {
      await interaction.reply({
        content: `💰 골드가 부족합니다! (보유: ${attacker.gold}G)`,
        ephemeral: true,
      })
      return
    }
    if (!isTestUser) {
      const defender = getOrCreatePlayer(targetId, guildId, targetName)
      if (defender.gold < bet) {
        await interaction.reply({
          content: `💰 상대방의 골드가 부족합니다!`,
          ephemeral: true,
        })
        return
      }
    }
  }

  if (isTestUser) {
    // Test user auto-accepts — skip challenge flow
    const startEmbed = new EmbedBuilder()
      .setColor(0xff4500)
      .setTitle('⚔️ PVP 파티 대결! (vs 테스트 유저)')
      .setDescription(
        `${user.toString()} ⚔️ → 🤖 **${targetName}**\n\n` +
          (bet > 0 ? `💰 배팅: **${bet}G**\n\n` : '') +
          `🤖 *테스트 유저가 자동 수락했습니다!*`,
      )
    await interaction.reply({ embeds: [startEmbed], fetchReply: true })
  } else {
    // Challenge accept/decline for real users
    const acceptRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('pvp_accept')
        .setLabel('⚔️ 수락')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('pvp_decline')
        .setLabel('🏃 거절')
        .setStyle(ButtonStyle.Secondary),
    )

    const challengeEmbed = new EmbedBuilder()
      .setColor(0xff4500)
      .setTitle('⚔️ PVP 파티 대결 신청!')
      .setDescription(
        `${user.toString()} ⚔️ → <@${targetId}>\n\n` +
          (bet > 0 ? `💰 배팅: **${bet}G**\n\n` : '') +
          `${pick(pvpTaunts)}\n\n` +
          `<@${targetId}>님, 수락하시겠습니까? (30초)`,
      )

    const response = await interaction.reply({
      embeds: [challengeEmbed],
      components: [acceptRow],
      fetchReply: true,
    })

    try {
      const accepted = await response.awaitMessageComponent({
        componentType: ComponentType.Button,
        filter: (i) => i.user.id === targetId,
        time: 30000,
      })

      if (accepted.customId === 'pvp_decline') {
        await accepted.update({
          embeds: [
            new EmbedBuilder()
              .setColor(0x808080)
              .setTitle('⚔️ PVP 거절됨')
              .setDescription(`<@${targetId}>이(가) 도망갔습니다! 🏃💨`),
          ],
          components: [],
        })
        return
      }

      await accepted.deferUpdate()
    } catch {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x808080)
            .setTitle('⚔️ PVP 시간 초과')
            .setDescription('30초 안에 응답하지 않아 대결이 취소되었습니다.'),
        ],
        components: [],
      })
      return
    }
  }

  // Start PVP
  pvpUsers.add(userKey)
  pvpUsers.add(targetKey)

  if (bet > 0) {
    addGold(user.id, guildId, -bet)
    if (!isTestUser) addGold(targetId, guildId, -bet)
  }

  try {
    await runPvpBattle(
      interaction,
      user.id,
      targetId,
      user.username,
      targetName,
      guildId,
      bet,
      isTestUser,
    )
  } finally {
    pvpUsers.delete(userKey)
    pvpUsers.delete(targetKey)
  }
}

async function runPvpBattle(
  interaction: ChatInputCommandInteraction,
  player1Id: string,
  player2Id: string,
  player1Name: string,
  player2Name: string,
  guildId: string,
  bet: number,
  isTestTarget = false,
) {
  // Build combatants from parties
  const p1Party = getParty(player1Id)
  const p2Party = getParty(player2Id)

  const team1 = p1Party
    .map((id) => buildPlayerCombatant(player1Id, id, 1))
    .filter(Boolean) as NonNullable<ReturnType<typeof buildPlayerCombatant>>[]
  const team2 = p2Party
    .map((id) => buildPlayerCombatant(player2Id, id, 2))
    .filter(Boolean) as NonNullable<ReturnType<typeof buildPlayerCombatant>>[]

  if (team1.length === 0 || team2.length === 0) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xe74c3c)
          .setTitle('❌ PVP 오류')
          .setDescription(
            '유효한 캐릭터가 없습니다! `/party set`으로 파티를 구성하세요.',
          ),
      ],
      components: [],
    })
    return
  }

  // Apply party synergies
  const syn1 = getPartySynergies(p1Party)
  const syn2 = getPartySynergies(p2Party)
  applySynergies(team1, syn1)
  applySynergies(team2, syn2)

  // Init combat state
  const state = initCombat(team1, team2, 50)

  // Show initial state
  const synText1 =
    syn1.length > 0 ? syn1.map((s) => `${s.emoji} ${s.name}`).join(' ') : '없음'
  const synText2 =
    syn2.length > 0 ? syn2.map((s) => `${s.emoji} ${s.name}`).join(' ') : '없음'
  const initialEmbed = buildBattleEmbed(state, player1Name, player2Name, bet, [
    `**시너지:**`,
    `🔴 ${player1Name}: ${synText1}`,
    `🔵 ${player2Name}: ${synText2}`,
    `\n⚔️ **전투 개시!**`,
  ])
  await interaction.editReply({ embeds: [initialEmbed], components: [] })
  await sleep(2000)

  const allLines: string[] = []

  // Combat loop — interactive turns
  while (!state.isFinished) {
    const actor = getNextActor(state)
    if (!actor) break

    const controllingPlayerId = actor.ownerId
    const controllingPlayerName =
      controllingPlayerId === player1Id ? player1Name : player2Name

    // Build action buttons
    const skillDisabled = !canUseSkill(state, actor)
    const ultDisabled = !canUseUltimate(actor)
    const sp = actor.team === 1 ? state.team1SP : state.team2SP
    const energyPct = Math.floor((actor.energy / actor.maxEnergy) * 100)

    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`pvp_basic_${state.turnCount}`)
        .setLabel(`🗡️ ${actor.basic.name}`)
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`pvp_skill_${state.turnCount}`)
        .setLabel(`✨ ${actor.skill.name}`)
        .setStyle(ButtonStyle.Primary)
        .setDisabled(skillDisabled),
      new ButtonBuilder()
        .setCustomId(`pvp_ult_${state.turnCount}`)
        .setLabel(`💥 ${actor.ultimate.name}`)
        .setStyle(ButtonStyle.Danger)
        .setDisabled(ultDisabled),
    )

    const turnInfo =
      `\n\n🎯 **${actor.emoji} ${actor.name}**의 차례 (${controllingPlayerName})` +
      `\nSP: ${sp}/${state.maxSP} | ⚡에너지: ${energyPct}%` +
      `\n*25초 안에 선택하세요! (시간 초과 시 일반 공격)*`

    const turnEmbed = buildBattleEmbed(
      state,
      player1Name,
      player2Name,
      bet,
      allLines,
      turnInfo,
    )
    await interaction.editReply({
      embeds: [turnEmbed],
      components: [actionRow],
    })

    // Wait for player input (or auto-play for test users)
    let actionType: ActionType
    const isAutoTurn = isTestTarget && controllingPlayerId === player2Id

    if (isAutoTurn) {
      // AI auto-play: prefer ultimate > skill > basic
      await sleep(800)
      if (!ultDisabled) {
        actionType = 'ultimate'
      } else if (!skillDisabled) {
        actionType = 'skill'
      } else {
        actionType = 'basic'
      }
    } else {
      try {
        const msg = await interaction.fetchReply()
        const buttonPress = await msg.awaitMessageComponent({
          componentType: ComponentType.Button,
          filter: (i) => i.user.id === controllingPlayerId,
          time: 25000,
        })

        if (buttonPress.customId.startsWith('pvp_ult')) {
          actionType = 'ultimate'
        } else if (buttonPress.customId.startsWith('pvp_skill')) {
          actionType = 'skill'
        } else {
          actionType = 'basic'
        }
        await buttonPress.deferUpdate()
      } catch {
        actionType = 'basic'
      }
    }

    // Execute action via combat engine
    const result = executeAction(state, actor, actionType)
    allLines.push(...result.lines)

    // Keep log manageable (last 10 lines)
    if (allLines.length > 10) {
      allLines.splice(0, allLines.length - 10)
    }

    // Update display after action
    const updateEmbed = buildBattleEmbed(
      state,
      player1Name,
      player2Name,
      bet,
      allLines,
    )
    await interaction.editReply({ embeds: [updateEmbed], components: [] })

    if (result.finished) break
    await sleep(1000)
  }

  // Battle finished
  await sleep(1500)

  const winnerId = state.winner === 1 ? player1Id : player2Id
  const winnerName = state.winner === 1 ? player1Name : player2Name
  const loserName = state.winner === 1 ? player2Name : player1Name

  // Rewards (skip for test users)
  const xpReward = random(50, 120)
  const goldReward = bet > 0 ? bet * 2 : random(30, 80)
  if (!winnerId.startsWith('test_')) {
    addXp(winnerId, guildId, xpReward)
    addGold(winnerId, guildId, goldReward)
    addTitle(winnerId, guildId, '⚔️ PVP 승리자')
  }
  logBattle(guildId, player1Id, player2Id, winnerId, xpReward, goldReward)

  // Build final result
  const survivors = state.combatants.filter(
    (c) => c.team === state.winner && c.isAlive,
  )
  const survivorText = survivors
    .map(
      (c) =>
        `${c.emoji}${c.name}(${Math.round((c.currentHP / c.stats.maxHP) * 100)}%)`,
    )
    .join(' ')

  const resultLines = [
    ...allLines.slice(-6),
    `\n🏆 **${winnerName} 승리!** (vs ${loserName})`,
    `✨ XP +${xpReward} | 💰 +${goldReward}G`,
    ...(bet > 0 ? [`💰 배팅금 **${bet * 2}G** 획득!`] : []),
    `생존: ${survivorText}`,
    `\n*"${pick(victoryQuotes)}"*`,
  ]

  const finalEmbed = new EmbedBuilder()
    .setColor(state.winner === 1 ? 0x2ecc71 : 0xe74c3c)
    .setTitle(`⚔️ PVP 결과: ${player1Name} vs ${player2Name}`)
    .setDescription(resultLines.join('\n'))
    .setFooter({ text: `총 ${state.turnCount}턴` })
    .setTimestamp()
  await interaction.editReply({ embeds: [finalEmbed], components: [] })
}

function buildBattleEmbed(
  state: ReturnType<typeof initCombat>,
  p1Name: string,
  p2Name: string,
  bet: number,
  log: string[],
  turnInfo?: string,
): EmbedBuilder {
  const team1Status = getTeamStatus(state, 1)
  const team2Status = getTeamStatus(state, 2)
  const betText = bet > 0 ? `\n💰 배팅: ${bet * 2}G (승자 독식)` : ''
  const logText =
    log.length > 0 ? `\n\n**전투 로그:**\n${log.slice(-8).join('\n')}` : ''

  return new EmbedBuilder()
    .setColor(0xff4500)
    .setTitle(`⚔️ PVP: ${p1Name} vs ${p2Name}`)
    .setDescription(
      `**🔴 ${p1Name}**\n${team1Status}\n\n` +
        `**🔵 ${p2Name}**\n${team2Status}` +
        betText +
        logText +
        (turnInfo ?? ''),
    )
    .setFooter({ text: `턴: ${state.turnCount}/${state.maxTurns}` })
}
