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
  getEquippedItem,
  chance,
  random,
  pick,
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

  // Check status effects
  if (hasEffect(user.id, guildId, 'stunned')) {
    await interaction.reply({ content: '😵 기절 상태에서는 전투할 수 없어요!' })
    return
  }
  if (hasEffect(user.id, guildId, 'frozen')) {
    await interaction.reply({ content: '🧊 얼어붙어서 전투할 수 없어요!' })
    return
  }

  // Get equipped items
  const attackerItem = getEquippedItem(user.id)
  const defenderItem = getEquippedItem(target.id)

  const atkBonus = attackerItem?.attack_bonus ?? 0
  const defBonus = defenderItem?.defense_bonus ?? 0
  const critBonus = attackerItem?.crit_bonus ?? 0

  // Battle simulation (3 rounds)
  const log: string[] = []
  let attackerHp = attacker.hp
  let defenderHp = defender.hp

  for (let round = 1; round <= 3; round++) {
    log.push(`\n**━━━ 라운드 ${round} ━━━**`)

    // Attacker's turn
    const atkEvade = chance(defender.evasion * 100)
    if (atkEvade) {
      log.push(`🎯 ${user.username}이(가) ${pick(attackVerbs)}!`)
      log.push(`💨 ${target.username}이(가) ${pick(dodgeMessages)}`)
    } else {
      const isCrit = chance((attacker.crit_rate + critBonus) * 100)
      let dmg = random(
        Math.max(1, attacker.attack + atkBonus - defender.defense - defBonus),
        attacker.attack + atkBonus + 5,
      )
      if (isCrit) {
        dmg = Math.floor(dmg * 2)
        log.push(`⚔️ ${user.username}이(가) ${pick(attackVerbs)}!`)
        log.push(`${pick(critMessages)}`)
        log.push(`🩸 ${target.username} HP -${dmg}!`)
      } else {
        log.push(`⚔️ ${user.username}이(가) ${pick(attackVerbs)}!`)
        log.push(`🩸 ${target.username} HP -${dmg}`)
      }
      defenderHp -= dmg
    }

    if (defenderHp <= 0) {
      log.push(`\n💀 ${target.username}이(가) 쓰러졌다!`)
      break
    }

    // Defender's turn
    const defEvade = chance(attacker.evasion * 100)
    if (defEvade) {
      log.push(`🎯 ${target.username}이(가) ${pick(attackVerbs)}!`)
      log.push(`💨 ${user.username}이(가) ${pick(dodgeMessages)}`)
    } else {
      const isCrit = chance(defender.crit_rate * 100)
      let dmg = random(
        Math.max(1, defender.attack - attacker.attack),
        defender.attack + 5,
      )
      if (isCrit) {
        dmg = Math.floor(dmg * 2)
        log.push(`⚔️ ${target.username}이(가) 반격! ${pick(attackVerbs)}!`)
        log.push(`${pick(critMessages)}`)
        log.push(`🩸 ${user.username} HP -${dmg}!`)
      } else {
        log.push(`⚔️ ${target.username}이(가) 반격! ${pick(attackVerbs)}!`)
        log.push(`🩸 ${user.username} HP -${dmg}`)
      }
      attackerHp -= dmg
    }

    if (attackerHp <= 0) {
      log.push(`\n💀 ${user.username}이(가) 쓰러졌다!`)
      break
    }
  }

  // Determine winner
  let winnerId: string | null = null
  let loserId: string | null = null
  if (defenderHp <= 0) {
    winnerId = user.id
    loserId = target.id
  } else if (attackerHp <= 0) {
    winnerId = target.id
    loserId = user.id
  } else {
    // Whoever has more HP remaining wins
    if (attackerHp >= defenderHp) {
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

    // Apply real damage
    damagePlayer(user.id, guildId, Math.max(0, attacker.hp - attackerHp))
    damagePlayer(target.id, guildId, Math.max(0, defender.hp - defenderHp))

    // Loser gets stunned
    if (loserId) {
      applyStatusEffect(loserId, guildId, 'stunned', 10, winnerId)
    }

    const winnerName = winnerId === user.id ? user.username : target.username

    log.push(`\n🏆 **${winnerName} 승리!**`)
    log.push(`✨ XP +${xpReward} | 💰 +${goldReward}G`)
    if (leveledUp) {
      log.push(`🎉 **레벨 업!!!**`)
    }
  }

  const embed = new EmbedBuilder()
    .setColor(winnerId === user.id ? 0x2ecc71 : 0xe74c3c)
    .setTitle(`⚔️ ${user.username} vs ${target.username}`)
    .setDescription(log.join('\n'))
    .setTimestamp()

  await interaction.reply({ embeds: [embed] })
}
