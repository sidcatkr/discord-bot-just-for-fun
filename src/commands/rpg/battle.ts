import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js'
import {
  getOrCreatePlayer,
  damagePlayer,
  addXp,
  addGold,
  logBattle,
  hasEffect,
  applyStatusEffect,
  getEffectiveStats,
  isPlayerDead,
  chance,
  random,
  pick,
  sleep,
} from '../../db/helpers.js'

export const data = new SlashCommandBuilder()
  .setName('battle')
  .setDescription('⚔️ 누군가와 전투한다!')
  .addUserOption((opt) =>
    opt.setName('target').setDescription('전투 상대').setRequired(true),
  )

const attackVerbs = [
  '강력한 펀치를 날렸다',
  '회전 킥을 시전했다',
  '검으로 베어냈다',
  '마법 미사일을 발사했다',
  '머리를 박았다',
  '초강력 빔을 쏘았다',
  '고무 오리로 후려쳤다',
  '감자를 투척했다',
  '정의의 곰손을 휘둘렀다',
  '음파 공격을 시전했다',
]

const dodgeMessages = [
  '화려하게 회피했다!',
  '매트릭스 회피를 시전했다!',
  '순간이동으로 피했다!',
  '바닥에 엎드려 피했다!',
  '거울을 꺼내 반사했다!',
]

const critMessages = [
  '💥 크리티컬 히트!!!',
  '🌟 치명적인 일격!!!',
  '☄️ 초필살기 발동!!!',
  '⚡ 번개처럼 강한 한방!!!',
]

// Pre-compute all rounds, return structured data
interface RoundAction {
  text: string[]
  attackerHp: number
  defenderHp: number
  finished: boolean
}

function simulateBattle(
  userName: string,
  targetName: string,
  atkStats: ReturnType<typeof getEffectiveStats>,
  defStats: ReturnType<typeof getEffectiveStats>,
  attackerHpStart: number,
  defenderHpStart: number,
) {
  const rounds: RoundAction[] = []
  let attackerHp = attackerHpStart
  let defenderHp = defenderHpStart

  for (let round = 1; round <= 3; round++) {
    const lines: string[] = []

    // Attacker's turn
    const atkEvade = chance(defStats.evasion * 100)
    if (atkEvade) {
      lines.push(`🎯 ${userName}이(가) ${pick(attackVerbs)}!`)
      lines.push(`💨 ${targetName}이(가) ${pick(dodgeMessages)}`)
    } else {
      const isCrit = chance(atkStats.crit_rate * 100)
      let dmg = random(
        Math.max(1, atkStats.attack - defStats.defense),
        atkStats.attack + 5,
      )
      if (isCrit) dmg = Math.floor(dmg * 2)

      lines.push(`⚔️ ${userName}이(가) ${pick(attackVerbs)}!`)
      if (isCrit) lines.push(pick(critMessages))
      lines.push(`🩸 ${targetName} HP -${dmg}${isCrit ? '!' : ''}`)
      defenderHp -= dmg
    }

    if (defenderHp <= 0) {
      lines.push(`\n💀 ${targetName}이(가) 쓰러졌다!`)
      rounds.push({ text: lines, attackerHp, defenderHp: 0, finished: true })
      break
    }

    // Defender's turn
    const defEvade = chance(atkStats.evasion * 100)
    if (defEvade) {
      lines.push(`🎯 ${targetName}이(가) ${pick(attackVerbs)}!`)
      lines.push(`💨 ${userName}이(가) ${pick(dodgeMessages)}`)
    } else {
      const isCrit = chance(defStats.crit_rate * 100)
      let dmg = random(
        Math.max(1, defStats.attack - atkStats.defense),
        defStats.attack + 5,
      )
      if (isCrit) dmg = Math.floor(dmg * 2)

      lines.push(`⚔️ ${targetName}이(가) 반격! ${pick(attackVerbs)}!`)
      if (isCrit) lines.push(pick(critMessages))
      lines.push(`🩸 ${userName} HP -${dmg}${isCrit ? '!' : ''}`)
      attackerHp -= dmg
    }

    if (attackerHp <= 0) {
      lines.push(`\n💀 ${userName}이(가) 쓰러졌다!`)
      rounds.push({ text: lines, attackerHp: 0, defenderHp, finished: true })
      break
    }

    rounds.push({
      text: lines,
      attackerHp,
      defenderHp,
      finished: round === 3,
    })
  }

  return rounds
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const target = interaction.options.getUser('target', true)
  const user = interaction.user

  if (target.id === user.id) {
    await interaction.reply({
      content: '🤦 자해하지 마세요... 상담 전화: 1393',
      ephemeral: true,
    })
    return
  }

  if (target.bot) {
    await interaction.reply({
      content: '🤖 봇과는 전투할 수 없습니다!',
      ephemeral: true,
    })
    return
  }

  const guildId = interaction.guildId!
  const attacker = getOrCreatePlayer(user.id, guildId, user.username)
  const defender = getOrCreatePlayer(target.id, guildId, target.username)

  // HP=0 death check
  if (isPlayerDead(user.id, guildId)) {
    await interaction.reply({
      content:
        '💀 HP가 0입니다! 활동할 수 없습니다.\n`/heal`로 회복하거나 `/daily`로 보상을 받으세요.',
      ephemeral: true,
    })
    return
  }

  if (hasEffect(user.id, guildId, 'stunned')) {
    await interaction.reply({ content: '😵 기절 상태에서는 전투할 수 없어요!' })
    return
  }
  if (hasEffect(user.id, guildId, 'frozen')) {
    await interaction.reply({ content: '🧊 얼어붙어서 전투할 수 없어요!' })
    return
  }

  // Get effective stats (base + equipped item bonuses)
  const atkStats = getEffectiveStats(user.id, guildId)
  const defStats = getEffectiveStats(target.id, guildId)

  // ── Phase 1: 전투 시작 연출 ──
  const introEmbed = new EmbedBuilder()
    .setColor(0x2c2f33)
    .setTitle(`⚔️ ${user.username} vs ${target.username}`)
    .setDescription(
      `**전투 준비 중...**\n\n` +
        `🔴 ${user.username} — HP: ${attacker.hp}/${atkStats.max_hp} | ⚔️${atkStats.attack} 🛡️${atkStats.defense}` +
        (atkStats.items.length > 0
          ? ` | 📦 아이템 ${atkStats.items.length}개`
          : '') +
        `\n🔵 ${target.username} — HP: ${defender.hp}/${defStats.max_hp} | ⚔️${defStats.attack} 🛡️${defStats.defense}` +
        (defStats.items.length > 0
          ? ` | 📦 아이템 ${defStats.items.length}개`
          : ''),
    )
  await interaction.reply({ embeds: [introEmbed] })

  await sleep(2000)

  // Pre-compute all rounds
  const rounds = simulateBattle(
    user.username,
    target.username,
    atkStats,
    defStats,
    attacker.hp,
    defender.hp,
  )

  // ── Phase 2+: 라운드별 공개 ──
  const allLines: string[] = []

  for (let i = 0; i < rounds.length; i++) {
    const round = rounds[i]
    allLines.push(`\n**━━━ 라운드 ${i + 1} ━━━**`)
    allLines.push(...round.text)

    const hpStatus =
      `\n🔴 ${user.username}: ${Math.max(0, round.attackerHp)} HP` +
      `  |  🔵 ${target.username}: ${Math.max(0, round.defenderHp)} HP`
    allLines.push(hpStatus)

    const roundEmbed = new EmbedBuilder()
      .setColor(0xff6b00)
      .setTitle(`⚔️ ${user.username} vs ${target.username}`)
      .setDescription(allLines.join('\n'))

    await interaction.editReply({ embeds: [roundEmbed] })

    if (!round.finished) {
      await sleep(2500)
    }
  }

  await sleep(1500)

  // ── Phase 3: 최종 결과 ──
  const lastRound = rounds[rounds.length - 1]
  let winnerId: string | null = null
  let loserId: string | null = null

  if (lastRound.defenderHp <= 0) {
    winnerId = user.id
    loserId = target.id
  } else if (lastRound.attackerHp <= 0) {
    winnerId = target.id
    loserId = user.id
  } else {
    if (lastRound.attackerHp >= lastRound.defenderHp) {
      winnerId = user.id
      loserId = target.id
    } else {
      winnerId = target.id
      loserId = user.id
    }
  }

  const xpReward = random(15, 40)
  const goldReward = random(10, 30)

  if (winnerId) {
    const leveledUp = addXp(winnerId, guildId, xpReward)
    addGold(winnerId, guildId, goldReward)
    logBattle(guildId, user.id, target.id, winnerId, xpReward, goldReward)

    damagePlayer(
      user.id,
      guildId,
      Math.max(0, attacker.hp - Math.max(0, lastRound.attackerHp)),
    )
    damagePlayer(
      target.id,
      guildId,
      Math.max(0, defender.hp - Math.max(0, lastRound.defenderHp)),
    )

    if (loserId) {
      applyStatusEffect(loserId, guildId, 'stunned', 10, winnerId)
    }

    const winnerName = winnerId === user.id ? user.username : target.username

    allLines.push(`\n\n🏆 **${winnerName} 승리!**`)
    allLines.push(`✨ XP +${xpReward} | 💰 +${goldReward}G`)
    if (leveledUp) {
      allLines.push(`🎉 **레벨 업!!!**`)
    }
  }

  const finalEmbed = new EmbedBuilder()
    .setColor(winnerId === user.id ? 0x2ecc71 : 0xe74c3c)
    .setTitle(`⚔️ ${user.username} vs ${target.username} — 결과`)
    .setDescription(allLines.join('\n'))
    .setTimestamp()

  await interaction.editReply({ embeds: [finalEmbed] })
}
