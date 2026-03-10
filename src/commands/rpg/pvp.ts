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

// ── Dramatic combat reactions ──
const critReactions = [
  '🔥 **통렬한 일격!!**',
  '⚡ **약점을 꿰뚫었다!!**',
  '💢 **아프다!! 이건 진짜 아프다!!**',
  '🌟 **완벽한 타이밍!!**',
  '😱 **이런 데미지가 가능해?!**',
]

const killReactions = [
  '💀 **적 전사!! 전장에서 퇴장!!**',
  '☠️ **ELIMINATED!!**',
  '⚰️ **잔인한 처형이다!!**',
  '🪦 **여기가 무덤이 되었다...**',
  '👻 **성불하세요...**',
]

const ultReactions = [
  '🌀 **필살기 발동!!!**',
  '💫 **궁극기!! 모든 것을 걸었다!!**',
  '🔮 **절체절명의 한 방!!**',
  '⭐ **이것이 진정한 힘이다!!**',
]

const closeCallReactions = [
  '😰 **간발의 차이로 살아남았다!!**',
  '💦 **위험했다... HP가 바닥이다!**',
  '🫣 **숨이 멎을 뻔했다!!**',
]

const dotDeathReactions = [
  '🔥 **상태이상이 목숨을 앗아갔다!!**',
  '💔 **독에 쓰러졌다... 비참한 최후...**',
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
    const BOT_OWNER_ID = process.env.BOT_OWNER_ID ?? ''
    if (user.id !== BOT_OWNER_ID) {
      await interaction.reply({
        content: '❌ 테스트 유저 대전은 봇 소유자만 사용할 수 있습니다.',
        ephemeral: true,
      })
      return
    }
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
  const initialEmbed = buildBattleEmbed(
    state,
    player1Name,
    player2Name,
    bet,
    [
      `**시너지:**`,
      `🔴 ${player1Name}: ${synText1}`,
      `🔵 ${player2Name}: ${synText2}`,
      `\n⚔️ **전투 개시!**`,
    ],
    undefined,
    undefined,
    '🟢 초반전',
  )
  await interaction.editReply({ embeds: [initialEmbed], components: [] })
  await sleep(2000)

  const allLines: string[] = []
  let team1Kills = 0
  let team2Kills = 0
  let lastKillTeam: 1 | 2 | null = null
  let killStreak = 0

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
    const energyBar = buildBar(actor.energy, actor.maxEnergy, 8)

    // Battle phase
    const phase = getBattlePhase(state)

    // Active buttons for controlling player
    const activeRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`pvp_basic_${state.turnCount}`)
        .setLabel(`🗡️ ${actor.basic.name}`)
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`pvp_skill_${state.turnCount}`)
        .setLabel(`✨ ${actor.skill.name} (SP ${sp})`)
        .setStyle(ButtonStyle.Primary)
        .setDisabled(skillDisabled),
      new ButtonBuilder()
        .setCustomId(`pvp_ult_${state.turnCount}`)
        .setLabel(`💥 ${actor.ultimate.name} (${energyPct}%)`)
        .setStyle(ButtonStyle.Danger)
        .setDisabled(ultDisabled),
    )

    // Disabled buttons shown to opponent (waiting indicator)
    const waitRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`pvp_wait_1_${state.turnCount}`)
        .setLabel(`⏳ ${controllingPlayerName}의 턴...`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId(`pvp_wait_2_${state.turnCount}`)
        .setLabel('행동 대기 중')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
    )

    // Check for low HP drama
    const lowHpWarning = getLowHpWarning(state, actor)

    const teamColor = actor.team === 1 ? 0xe74c3c : 0x3498db
    const teamIcon = actor.team === 1 ? '🔴' : '🔵'
    const turnBanner =
      `\n\n━━━━━━━━━━━━━━━━━━━\n` +
      `${teamIcon} **${actor.emoji} ${actor.name}**의 차례!\n` +
      `┃ 조종: **${controllingPlayerName}**\n` +
      `┃ SP: ${'🔷'.repeat(Math.min(sp, 5))}${'⬛'.repeat(Math.max(0, 5 - sp))} ${sp}/${state.maxSP}\n` +
      `┃ ⚡ ${energyBar} ${energyPct}%\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      (lowHpWarning ? `${lowHpWarning}\n` : '') +
      `*25초 안에 선택! (시간 초과 → 일반 공격)*`

    const turnEmbed = buildBattleEmbed(
      state,
      player1Name,
      player2Name,
      bet,
      allLines,
      turnBanner,
      teamColor,
      phase,
      team1Kills,
      team2Kills,
    )
    await interaction.editReply({
      embeds: [turnEmbed],
      components: [activeRow, waitRow],
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

    // Enrich log lines with action type indicator & dramatic commentary
    const actionIcon =
      actionType === 'ultimate' ? '💥' : actionType === 'skill' ? '✨' : '🗡️'

    // Detect events from lines
    const joinedResult = result.lines.join(' ')
    const hasCrit = joinedResult.includes('치명타')
    const hasKill =
      joinedResult.includes('처치') || joinedResult.includes('전사')
    const hasDotDeath = joinedResult.includes('으로 전사')

    // Add ultimate reaction
    if (actionType === 'ultimate') {
      allLines.push(pick(ultReactions))
    }

    // Add action lines with icon
    if (result.lines.length > 0) {
      result.lines[0] = `${actionIcon} ${result.lines[0]}`
    }
    allLines.push(...result.lines)

    // Add dramatic commentary
    if (hasKill) {
      // Track kills
      if (actor.team === 1) team1Kills++
      else team2Kills++

      // Kill streaks
      if (lastKillTeam === actor.team) {
        killStreak++
        if (killStreak >= 3)
          allLines.push(`🔥🔥🔥 **${killStreak}연속 킬!! 미쳤다!!**`)
        else if (killStreak >= 2) allLines.push(`⚡⚡ **더블 킬!!**`)
      } else {
        killStreak = 1
        lastKillTeam = actor.team
      }

      if (hasDotDeath) {
        allLines.push(pick(dotDeathReactions))
      } else {
        allLines.push(pick(killReactions))
      }
    } else if (hasCrit) {
      allLines.push(pick(critReactions))
    }

    // Close call detection (target survived with <15% HP)
    if (!hasKill && !hasCrit) {
      const enemyTeam = actor.team === 1 ? 2 : 1
      const lowestEnemy = state.combatants
        .filter((c) => c.team === enemyTeam && c.isAlive)
        .sort(
          (a, b) => a.currentHP / a.stats.maxHP - b.currentHP / b.stats.maxHP,
        )[0]
      if (
        lowestEnemy &&
        lowestEnemy.currentHP / lowestEnemy.stats.maxHP < 0.15
      ) {
        allLines.push(pick(closeCallReactions))
      }
    }

    // Keep log manageable (last 14 lines)
    if (allLines.length > 14) {
      allLines.splice(0, allLines.length - 14)
    }

    // Impact color based on event significance
    let impactColor: number
    if (hasKill) {
      impactColor = 0x000000 // black flash for kills
    } else if (hasCrit) {
      impactColor = 0xffd700 // gold flash for crits
    } else if (actionType === 'ultimate') {
      impactColor = 0xff0000
    } else if (actionType === 'skill') {
      impactColor = 0x9b59b6
    } else {
      impactColor = 0x95a5a6
    }

    // Update display after action
    const updateEmbed = buildBattleEmbed(
      state,
      player1Name,
      player2Name,
      bet,
      allLines,
      undefined,
      impactColor,
      phase,
      team1Kills,
      team2Kills,
    )
    await interaction.editReply({ embeds: [updateEmbed], components: [] })

    if (result.finished) break
    // Dynamic pacing: longer pause for dramatic events
    await sleep(hasKill ? 1800 : hasCrit ? 1500 : 1200)
  }

  // Battle finished — dramatic conclusion
  await sleep(2000)

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

  // Build epic final result
  const survivors = state.combatants.filter(
    (c) => c.team === state.winner && c.isAlive,
  )
  const survivorText = survivors
    .map((c) => {
      const hpPct = Math.round((c.currentHP / c.stats.maxHP) * 100)
      const hpBar = buildBar(c.currentHP, c.stats.maxHP, 6)
      return `${c.emoji} **${c.name}** ${hpBar} ${hpPct}%`
    })
    .join('\n')

  // Find MVP (survivor with highest HP% or last one standing)
  const mvp = survivors.sort(
    (a, b) => b.currentHP / b.stats.maxHP - a.currentHP / a.stats.maxHP,
  )[0]

  const winnerKills = state.winner === 1 ? team1Kills : team2Kills
  const loserKills = state.winner === 1 ? team2Kills : team1Kills

  // Determine battle verdict
  let verdict: string
  if (state.turnCount <= 10) {
    verdict = '⚡ 전광석화!! 압도적 실력 차이!'
  } else if (
    survivors.length === 1 &&
    survivors[0].currentHP / survivors[0].stats.maxHP < 0.2
  ) {
    verdict = '🫨 간발의 차이!! 극적인 역전극!'
  } else if (winnerKills >= 4) {
    verdict = '👑 완벽한 승리! 상대를 압살했다!'
  } else {
    verdict = `*"${pick(victoryQuotes)}"*`
  }

  const winnerIcon = state.winner === 1 ? '🔴' : '🔵'
  const finalLines = [
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    `${winnerIcon} 🏆 **${winnerName}** 승리!!`,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `**📊 전투 기록:**`,
    `┃ 🔴 ${player1Name}: ${team1Kills}킬`,
    `┃ 🔵 ${player2Name}: ${team2Kills}킬`,
    `┃ 총 ${state.turnCount}턴`,
    ``,
    `**🎖️ MVP: ${mvp.emoji} ${mvp.name}**`,
    ``,
    `**💰 보상:**`,
    `┃ ✨ XP +${xpReward}`,
    `┃ 💰 +${goldReward}G`,
    ...(bet > 0 ? [`┃ 🎰 배팅 수익 **${bet * 2}G**!`] : []),
    ``,
    `**🛡️ 생존자:**`,
    survivorText,
    ``,
    verdict,
  ]

  const finalEmbed = new EmbedBuilder()
    .setColor(state.winner === 1 ? 0x2ecc71 : 0x3498db)
    .setTitle(`⚔️ PVP 결과 — ${player1Name} vs ${player2Name}`)
    .setDescription(finalLines.join('\n'))
    .setFooter({
      text: `${state.turnCount}턴 | ${team1Kills + team2Kills}킬 | ${survivors.length}명 생존`,
    })
    .setTimestamp()
  await interaction.editReply({ embeds: [finalEmbed], components: [] })
}

function buildBar(current: number, max: number, length: number = 10): string {
  const filled = Math.round((current / max) * length)
  return '█'.repeat(filled) + '░'.repeat(Math.max(0, length - filled))
}

function buildBattleEmbed(
  state: ReturnType<typeof initCombat>,
  p1Name: string,
  p2Name: string,
  bet: number,
  log: string[],
  turnInfo?: string,
  color?: number,
  phase?: string,
  team1Kills?: number,
  team2Kills?: number,
): EmbedBuilder {
  const team1Status = getTeamStatus(state, 1)
  const team2Status = getTeamStatus(state, 2)
  const betText = bet > 0 ? `\n💰 배팅: ${bet * 2}G (승자 독식)` : ''

  // Kill scoreboard
  const k1 = team1Kills ?? 0
  const k2 = team2Kills ?? 0
  const scoreText = k1 + k2 > 0 ? `\n⚔️ **킬 스코어:** 🔴 ${k1} — ${k2} 🔵` : ''

  const logText =
    log.length > 0 ? `\n\n**📜 전투 로그:**\n${log.slice(-12).join('\n')}` : ''

  const phaseText = phase ? ` | ${phase}` : ''

  return new EmbedBuilder()
    .setColor(color ?? 0xff4500)
    .setTitle(`⚔️ PVP: ${p1Name} vs ${p2Name}`)
    .setDescription(
      `**🔴 ${p1Name}**\n${team1Status}\n\n` +
        `**🔵 ${p2Name}**\n${team2Status}` +
        betText +
        scoreText +
        logText +
        (turnInfo ?? ''),
    )
    .setFooter({
      text: `턴: ${state.turnCount}/${state.maxTurns}${phaseText}`,
    })
}

// ── Helper functions ──

function getBattlePhase(state: ReturnType<typeof initCombat>): string {
  const totalAlive = state.combatants.filter((c) => c.isAlive).length
  const totalChars = state.combatants.length
  if (state.turnCount <= 5) return '🟢 초반전'
  if (totalAlive <= Math.ceil(totalChars / 2)) return '🔴 종반전'
  if (state.turnCount >= 15 || totalAlive < totalChars) return '🟡 중반전'
  return '🟢 초반전'
}

function getLowHpWarning(
  state: ReturnType<typeof initCombat>,
  actor: ReturnType<typeof getNextActor>,
): string | null {
  if (!actor) return null
  const hpPct = actor.currentHP / actor.stats.maxHP
  if (hpPct <= 0.1)
    return `🚨 **위험!! ${actor.emoji} ${actor.name} HP ${Math.round(hpPct * 100)}%!!**`
  if (hpPct <= 0.25)
    return `⚠️ *${actor.emoji} ${actor.name} HP 위험! (${Math.round(hpPct * 100)}%)*`
  return null
}
