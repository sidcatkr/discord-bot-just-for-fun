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
  getPartySynergies,
  applySynergies,
  type ActionType,
} from '../../data/combat-engine.js'

export const data = new SlashCommandBuilder()
  .setName('pvp')
  .setDescription('⚔️ 파티 PVP! 스타레일 스타일 턴제 전투!')
  .addUserOption((opt) =>
    opt.setName('target').setDescription('대결 상대').setRequired(true),
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
  const target = interaction.options.getUser('target', true)
  const bet = interaction.options.getInteger('bet') ?? 0
  const guildId = interaction.guildId!

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

  const targetId = target.id
  const targetName = target.username

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
    const defender = getOrCreatePlayer(targetId, guildId, targetName)
    if (defender.gold < bet) {
      await interaction.reply({
        content: `💰 상대방의 골드가 부족합니다!`,
        ephemeral: true,
      })
      return
    }
  }

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

  // Start PVP
  pvpUsers.add(userKey)
  pvpUsers.add(targetKey)

  if (bet > 0) {
    addGold(user.id, guildId, -bet)
    addGold(targetId, guildId, -bet)
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
    )
  } finally {
    pvpUsers.delete(userKey)
    pvpUsers.delete(targetKey)
  }
}

export async function runPvpBattle(
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

  // Show initial state with synergies
  const synText1 =
    syn1.length > 0 ? syn1.map((s) => `${s.emoji} ${s.name}`).join(' ') : '없음'
  const synText2 =
    syn2.length > 0 ? syn2.map((s) => `${s.emoji} ${s.name}`).join(' ') : '없음'

  const initEmbed = new EmbedBuilder()
    .setColor(0xff4500)
    .setTitle(`⚔️ ${player1Name} vs ${player2Name}`)
    .addFields(
      {
        name: `🔴 ${player1Name}`,
        value: compactTeamHP(state, 1) + `\n시너지: ${synText1}`,
        inline: true,
      },
      {
        name: `🔵 ${player2Name}`,
        value: compactTeamHP(state, 2) + `\n시너지: ${synText2}`,
        inline: true,
      },
    )
    .setDescription(
      (bet > 0 ? `💰 배팅: **${bet * 2}G** (승자 독식)\n` : '') +
        `⚔️ **전투 개시!**`,
    )
  await interaction.editReply({ embeds: [initEmbed], components: [] })
  await sleep(2500)

  let team1Kills = 0
  let team2Kills = 0
  let lastKillTeam: 1 | 2 | null = null
  let killStreak = 0
  const recentLog: string[] = [] // last 4 lines only

  // Combat loop
  while (!state.isFinished) {
    const actor = getNextActor(state)
    if (!actor) break

    const controllingPlayerId = actor.ownerId
    const controllingPlayerName =
      controllingPlayerId === player1Id ? player1Name : player2Name

    const skillDisabled = !canUseSkill(state, actor)
    const ultDisabled = !canUseUltimate(actor)
    const sp = actor.team === 1 ? state.team1SP : state.team2SP
    const energyPct = Math.floor((actor.energy / actor.maxEnergy) * 100)

    const teamColor = actor.team === 1 ? 0xe74c3c : 0x3498db
    const teamIcon = actor.team === 1 ? '🔴' : '🔵'

    // ── Turn selection embed ─ clean & focused ──
    const turnEmbed = new EmbedBuilder()
      .setColor(teamColor)
      .setTitle(`⚔️ ${player1Name} vs ${player2Name}`)
      .addFields(
        {
          name: `🔴 ${player1Name}`,
          value: compactTeamHP(state, 1),
          inline: true,
        },
        {
          name: `🔵 ${player2Name}`,
          value: compactTeamHP(state, 2),
          inline: true,
        },
      )

    // Show recent log compactly if exists
    if (recentLog.length > 0) {
      turnEmbed.addFields({
        name: '📜 최근',
        value: recentLog.join('\n'),
        inline: false,
      })
    }

    // Turn info as description — prominent but clean
    const spBar =
      '🔷'.repeat(Math.min(sp, 5)) + '⬛'.repeat(Math.max(0, 5 - sp))
    turnEmbed.setDescription(
      `${teamIcon} **${actor.emoji} ${actor.name}**의 차례! (**${controllingPlayerName}**)\n` +
        `SP ${spBar} ${sp}/${state.maxSP} · ⚡ ${energyPct}%` +
        (bet > 0 ? ` · 💰 ${bet * 2}G` : ''),
    )

    const phase = getBattlePhase(state)
    const killScore =
      team1Kills + team2Kills > 0 ? ` · ⚔️ ${team1Kills}-${team2Kills}` : ''
    turnEmbed.setFooter({
      text: `턴 ${state.turnCount}/${state.maxTurns} · ${phase}${killScore} · 30초`,
    })

    // Action buttons
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

    await interaction.editReply({
      embeds: [turnEmbed],
      components: [actionRow],
    })

    // Wait for input
    let actionType: ActionType
    const isAutoTurn = isTestTarget && controllingPlayerId === player2Id

    if (isAutoTurn) {
      await sleep(800)
      if (!ultDisabled) actionType = 'ultimate'
      else if (!skillDisabled) actionType = 'skill'
      else actionType = 'basic'
    } else {
      try {
        const msg = await interaction.fetchReply()
        const buttonPress = await msg.awaitMessageComponent({
          componentType: ComponentType.Button,
          filter: (i) => i.user.id === controllingPlayerId,
          time: 30000,
        })
        if (buttonPress.customId.startsWith('pvp_ult')) actionType = 'ultimate'
        else if (buttonPress.customId.startsWith('pvp_skill'))
          actionType = 'skill'
        else actionType = 'basic'
        await buttonPress.deferUpdate()
      } catch {
        actionType = 'basic'
      }
    }

    // Execute
    const result = executeAction(state, actor, actionType)

    // Detect events
    const joined = result.lines.join(' ')
    const hasCrit = joined.includes('치명타')
    const hasKill = joined.includes('처치') || joined.includes('전사')
    const hasDotDeath = joined.includes('으로 전사')

    // Build action result line (1 compact summary)
    const actionIcon =
      actionType === 'ultimate' ? '💥' : actionType === 'skill' ? '✨' : '🗡️'

    // Get the most important line (first damage line)
    const mainLine = result.lines[0] ?? ''

    // Build compact log entry
    let logEntry = `${actionIcon} ${mainLine}`
    if (hasKill) {
      if (actor.team === 1) team1Kills++
      else team2Kills++
      if (lastKillTeam === actor.team) {
        killStreak++
        if (killStreak >= 3) logEntry += ` 🔥${killStreak}연킬!`
        else if (killStreak >= 2) logEntry += ` ⚡더블킬!`
      } else {
        killStreak = 1
        lastKillTeam = actor.team
      }
    }

    recentLog.push(logEntry)
    // Keep only last 4 entries
    if (recentLog.length > 4) recentLog.shift()

    // Impact color
    let impactColor: number
    if (hasKill) impactColor = 0x000000
    else if (hasCrit) impactColor = 0xffd700
    else if (actionType === 'ultimate') impactColor = 0xff0000
    else impactColor = teamColor

    // ── Action result embed ─ dramatic but brief ──
    const resultEmbed = new EmbedBuilder()
      .setColor(impactColor)
      .setTitle(`⚔️ ${player1Name} vs ${player2Name}`)
      .addFields(
        {
          name: `🔴 ${player1Name}`,
          value: compactTeamHP(state, 1),
          inline: true,
        },
        {
          name: `🔵 ${player2Name}`,
          value: compactTeamHP(state, 2),
          inline: true,
        },
      )

    // Show action + commentary as description
    let actionDesc = `${teamIcon} ${logEntry}`
    if (hasKill) {
      actionDesc += `\n${hasDotDeath ? pick(dotDeathReactions) : pick(killReactions)}`
    } else if (hasCrit) {
      actionDesc += `\n${pick(critReactions)}`
    } else if (actionType === 'ultimate') {
      actionDesc += `\n${pick(ultReactions)}`
    }

    // Low HP warning for any surviving enemy
    const enemyTeam = actor.team === 1 ? 2 : 1
    const lowestEnemy = state.combatants
      .filter((c) => c.team === enemyTeam && c.isAlive)
      .sort(
        (a, b) => a.currentHP / a.stats.maxHP - b.currentHP / b.stats.maxHP,
      )[0]
    if (
      lowestEnemy &&
      !hasKill &&
      lowestEnemy.currentHP / lowestEnemy.stats.maxHP < 0.15
    ) {
      actionDesc += `\n${pick(closeCallReactions)}`
    }

    resultEmbed.setDescription(actionDesc)
    resultEmbed.setFooter({
      text: `턴 ${state.turnCount}/${state.maxTurns} · ⚔️ ${team1Kills}-${team2Kills}`,
    })

    await interaction.editReply({ embeds: [resultEmbed], components: [] })

    if (result.finished) break
    await sleep(hasKill ? 2000 : hasCrit ? 1600 : 1300)
  }

  // ══════ Battle finished ══════
  await sleep(2000)

  const winnerId = state.winner === 1 ? player1Id : player2Id
  const winnerName = state.winner === 1 ? player1Name : player2Name
  const loserName = state.winner === 1 ? player2Name : player1Name

  const xpReward = random(50, 120)
  const goldReward = bet > 0 ? bet * 2 : random(30, 80)
  if (!winnerId.startsWith('test_')) {
    addXp(winnerId, guildId, xpReward)
    addGold(winnerId, guildId, goldReward)
    addTitle(winnerId, guildId, '⚔️ PVP 승리자')
  }
  logBattle(guildId, player1Id, player2Id, winnerId, xpReward, goldReward)

  const survivors = state.combatants.filter(
    (c) => c.team === state.winner && c.isAlive,
  )
  const mvp = [...survivors].sort(
    (a, b) => b.currentHP / b.stats.maxHP - a.currentHP / a.stats.maxHP,
  )[0]

  // Verdict
  let verdict: string
  if (state.turnCount <= 10) {
    verdict = '⚡ 전광석화!! 압도적 실력 차이!'
  } else if (
    survivors.length === 1 &&
    survivors[0].currentHP / survivors[0].stats.maxHP < 0.2
  ) {
    verdict = '🫨 간발의 차이!! 극적인 역전극!'
  } else {
    verdict = `*"${pick(victoryQuotes)}"*`
  }

  const winnerIcon = state.winner === 1 ? '🔴' : '🔵'

  const finalEmbed = new EmbedBuilder()
    .setColor(state.winner === 1 ? 0x2ecc71 : 0x3498db)
    .setTitle(`🏆 ${winnerName} 승리!`)
    .setDescription(
      `${winnerIcon} **${player1Name}** vs **${player2Name}**\n\n` + verdict,
    )
    .addFields(
      {
        name: '📊 전투 기록',
        value:
          `🔴 ${player1Name}: ${team1Kills}킬\n` +
          `🔵 ${player2Name}: ${team2Kills}킬`,
        inline: true,
      },
      {
        name: '💰 보상',
        value:
          `✨ XP +${xpReward}\n💰 +${goldReward}G` +
          (bet > 0 ? `\n🎰 배팅 수익 ${bet * 2}G` : ''),
        inline: true,
      },
      {
        name: '🛡️ 생존자',
        value: survivors
          .map((c) => {
            const pct = Math.round((c.currentHP / c.stats.maxHP) * 100)
            return `${c.emoji} ${c.name} ${buildBar(c.currentHP, c.stats.maxHP, 5)} ${pct}%`
          })
          .join('\n'),
        inline: false,
      },
    )
    .setFooter({
      text: `${state.turnCount}턴 · MVP: ${mvp.emoji} ${mvp.name}`,
    })
    .setTimestamp()
  await interaction.editReply({ embeds: [finalEmbed], components: [] })
}

function buildBar(current: number, max: number, length: number = 10): string {
  const filled = Math.round((current / max) * length)
  return '█'.repeat(filled) + '░'.repeat(Math.max(0, length - filled))
}

/** Compact team HP: one line per character with mini HP bar */
function compactTeamHP(
  state: ReturnType<typeof initCombat>,
  team: 1 | 2,
): string {
  return state.combatants
    .filter((c) => c.team === team)
    .map((c) => {
      if (!c.isAlive) return `${c.emoji} ~~${c.name}~~ 💀`
      const pct = Math.round((c.currentHP / c.stats.maxHP) * 100)
      const bar = buildBar(c.currentHP, c.stats.maxHP, 5)
      const effects =
        c.effects.length > 0
          ? ' ' +
            c.effects
              .map((e) => {
                const icons: Record<string, string> = {
                  burn: '🔥',
                  shock: '⚡',
                  bleed: '🩸',
                  freeze: '❄️',
                  entangle: '🌿',
                }
                return icons[e.type] ?? ''
              })
              .filter(Boolean)
              .join('')
          : ''
      return `${c.emoji} ${c.name} ${bar} ${pct}%${effects}`
    })
    .join('\n')
}

function getBattlePhase(state: ReturnType<typeof initCombat>): string {
  const totalAlive = state.combatants.filter((c) => c.isAlive).length
  const totalChars = state.combatants.length
  if (state.turnCount <= 5) return '🟢 초반전'
  if (totalAlive <= Math.ceil(totalChars / 2)) return '🔴 종반전'
  if (state.turnCount >= 15 || totalAlive < totalChars) return '🟡 중반전'
  return '🟢 초반전'
}
