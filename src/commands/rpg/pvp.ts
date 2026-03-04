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
  damagePlayer,
  healPlayer,
  getEffectiveStats,
  getInventory,
  isPlayerDead,
  hasEffect,
  applyStatusEffect,
  logBattle,
  pick,
  sleep,
  random,
  chance,
  type EffectiveStats,
} from '../../db/helpers.js'

export const data = new SlashCommandBuilder()
  .setName('pvp')
  .setDescription('⚔️ PVP 대결! 아이템을 활용한 진검승부!')
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

const attackSkills = [
  { name: '강타', emoji: '💥', dmgMult: 1.2, description: '강력한 일격!' },
  {
    name: '연속 공격',
    emoji: '⚡',
    dmgMult: 0.7,
    hits: 2,
    description: '두 번 연속 공격!',
  },
  {
    name: '필살기',
    emoji: '🔥',
    dmgMult: 2.0,
    hitChance: 50,
    description: '50% 확률로 2배 데미지! 실패 시 0!',
  },
  {
    name: '방어 무시',
    emoji: '🗡️',
    dmgMult: 1.0,
    ignoreDefense: true,
    description: '상대 방어력 무시!',
  },
]

const defendSkills = [
  { name: '방어 태세', emoji: '🛡️', defMult: 2.0, description: '방어력 2배!' },
  {
    name: '회피',
    emoji: '💨',
    dodgeChance: 60,
    description: '60% 확률로 완전 회피!',
  },
  {
    name: '반격',
    emoji: '🔄',
    counterMult: 0.8,
    description: '피해를 받고 80% 반격!',
  },
  { name: '치유', emoji: '💚', healPercent: 20, description: 'HP 20% 회복!' },
]

const pvpTaunts = [
  '😏 "겁나면 도망가도 돼요~"',
  '🗡️ "이것이 진정한 PVP다!"',
  '💀 "오늘 저승길 동반자를 구합니다"',
  '🎮 "랭크 골드에서 뵙겠습니다"',
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
  '오늘 서버의 주인공이 결정되었습니다.',
]

export async function execute(interaction: ChatInputCommandInteraction) {
  const user = interaction.user
  const target = interaction.options.getUser('target', true)
  const bet = interaction.options.getInteger('bet') ?? 0
  const guildId = interaction.guildId!

  // Validations
  if (target.id === user.id) {
    await interaction.reply({
      content: '🤦 자기 자신과는 PVP할 수 없습니다!',
      ephemeral: true,
    })
    return
  }
  if (target.bot) {
    await interaction.reply({
      content: '🤖 봇에게는 아이템이 없어 PVP가 불가능합니다!',
      ephemeral: true,
    })
    return
  }

  const userKey = `${user.id}:${guildId}`
  const targetKey = `${target.id}:${guildId}`
  if (pvpUsers.has(userKey) || pvpUsers.has(targetKey)) {
    await interaction.reply({
      content: '⚔️ 이미 PVP 중입니다!',
      ephemeral: true,
    })
    return
  }

  if (isPlayerDead(user.id, guildId)) {
    await interaction.reply({
      content: '💀 HP가 0입니다! `/heal`로 회복하세요.',
      ephemeral: true,
    })
    return
  }
  if (isPlayerDead(target.id, guildId)) {
    await interaction.reply({
      content: '💀 상대방의 HP가 0입니다! 상대가 회복한 후 도전하세요.',
      ephemeral: true,
    })
    return
  }

  if (hasEffect(user.id, guildId, 'stunned')) {
    await interaction.reply({
      content: '😵 기절 상태에서는 PVP할 수 없어요!',
      ephemeral: true,
    })
    return
  }

  const attacker = getOrCreatePlayer(user.id, guildId, user.username)
  const defender = getOrCreatePlayer(target.id, guildId, target.username)

  if (bet > 0) {
    if (attacker.gold < bet) {
      await interaction.reply({
        content: `💰 골드가 부족합니다! (보유: ${attacker.gold}G)`,
        ephemeral: true,
      })
      return
    }
    if (defender.gold < bet) {
      await interaction.reply({
        content: `💰 상대방의 골드가 부족합니다! (상대 보유: ${defender.gold}G)`,
        ephemeral: true,
      })
      return
    }
  }

  // Challenge accept/decline
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
    .setTitle('⚔️ PVP 대결 신청!')
    .setDescription(
      `${user.toString()} ⚔️ → ${target.toString()}\n\n` +
        (bet > 0 ? `💰 배팅: **${bet}G**\n\n` : '') +
        `${pick(pvpTaunts)}\n\n` +
        `${target.toString()}님, 수락하시겠습니까? (30초)`,
    )

  const response = await interaction.reply({
    embeds: [challengeEmbed],
    components: [acceptRow],
    fetchReply: true,
  })

  try {
    const accepted = await response.awaitMessageComponent({
      componentType: ComponentType.Button,
      filter: (i) => i.user.id === target.id,
      time: 30000,
    })

    if (accepted.customId === 'pvp_decline') {
      await accepted.update({
        embeds: [
          new EmbedBuilder()
            .setColor(0x808080)
            .setTitle('⚔️ PVP 거절됨')
            .setDescription(`${target.toString()}이(가) 도망갔습니다! 🏃💨`),
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
    addGold(target.id, guildId, -bet)
  }

  try {
    await runPvpBattle(
      interaction,
      user.id,
      target.id,
      user.username,
      target.username,
      guildId,
      bet,
    )
  } finally {
    pvpUsers.delete(userKey)
    pvpUsers.delete(targetKey)
  }
}

async function runPvpBattle(
  interaction: ChatInputCommandInteraction,
  attackerId: string,
  defenderId: string,
  attackerName: string,
  defenderName: string,
  guildId: string,
  bet: number,
) {
  const atkStats = getEffectiveStats(attackerId, guildId)
  const defStats = getEffectiveStats(defenderId, guildId)

  const atkPlayer = getOrCreatePlayer(attackerId, guildId, attackerName)
  const defPlayer = getOrCreatePlayer(defenderId, guildId, defenderName)

  let atkHp = atkPlayer.hp
  let defHp = defPlayer.hp
  const maxRounds = 5
  const allLines: string[] = []

  // Item display
  const atkItemCount = atkStats.items.length
  const defItemCount = defStats.items.length

  const statusEmbed = new EmbedBuilder()
    .setColor(0xff4500)
    .setTitle(`⚔️ PVP: ${attackerName} vs ${defenderName}`)
    .setDescription(
      `**전투 시작!**\n\n` +
        `🔴 ${attackerName} — HP: ${atkHp} | ⚔️${atkStats.attack} 🛡️${atkStats.defense} | 📦 아이템 ${atkItemCount}개\n` +
        `🔵 ${defenderName} — HP: ${defHp} | ⚔️${defStats.attack} 🛡️${defStats.defense} | 📦 아이템 ${defItemCount}개` +
        (bet > 0 ? `\n\n💰 배팅: ${bet * 2}G (승자 독식)` : ''),
    )
  await interaction.editReply({ embeds: [statusEmbed], components: [] })
  await sleep(2000)

  for (let round = 1; round <= maxRounds; round++) {
    const roundLines: string[] = [`\n**━━━ 라운드 ${round} ━━━**`]

    // Attacker turn
    const atkSkill = pick(attackSkills)
    let atkDmg = 0

    if (atkSkill.name === '필살기') {
      if (chance(atkSkill.hitChance!)) {
        atkDmg = Math.floor(
          random(
            Math.max(1, atkStats.attack - defStats.defense),
            atkStats.attack + 5,
          ) * atkSkill.dmgMult,
        )
        roundLines.push(
          `${atkSkill.emoji} ${attackerName}의 **${atkSkill.name}** 성공!!! 💥 ${defenderName} HP -${atkDmg}`,
        )
      } else {
        roundLines.push(
          `${atkSkill.emoji} ${attackerName}의 **${atkSkill.name}** 실패! 허공을 쳤다...`,
        )
      }
    } else if (atkSkill.name === '연속 공격') {
      let totalDmg = 0
      for (let h = 0; h < (atkSkill.hits ?? 1); h++) {
        const d = Math.floor(
          random(
            Math.max(1, atkStats.attack - defStats.defense),
            atkStats.attack + 3,
          ) * atkSkill.dmgMult,
        )
        totalDmg += d
      }
      atkDmg = totalDmg
      roundLines.push(
        `${atkSkill.emoji} ${attackerName}의 **${atkSkill.name}**! ${atkSkill.hits}연속! 🩸 ${defenderName} HP -${atkDmg}`,
      )
    } else if (atkSkill.ignoreDefense) {
      atkDmg = random(atkStats.attack, atkStats.attack + 10)
      roundLines.push(
        `${atkSkill.emoji} ${attackerName}의 **${atkSkill.name}**! 방어 무시! 🩸 ${defenderName} HP -${atkDmg}`,
      )
    } else {
      atkDmg = Math.floor(
        random(
          Math.max(1, atkStats.attack - defStats.defense),
          atkStats.attack + 5,
        ) * atkSkill.dmgMult,
      )
      roundLines.push(
        `${atkSkill.emoji} ${attackerName}의 **${atkSkill.name}**! 🩸 ${defenderName} HP -${atkDmg}`,
      )
    }

    // Crit check for attacker
    if (atkDmg > 0 && chance(atkStats.crit_rate * 100)) {
      const critBonus = Math.floor(atkDmg * (atkStats.crit_damage - 1))
      atkDmg += critBonus
      roundLines.push(`💥 **크리티컬!** +${critBonus} 추가 데미지!`)
    }

    defHp -= atkDmg

    if (defHp <= 0) {
      roundLines.push(`\n💀 ${defenderName}이(가) 쓰러졌다!`)
      allLines.push(...roundLines)
      break
    }

    // Defender turn
    const defSkill = pick(defendSkills)

    if (defSkill.name === '회피') {
      if (chance(defSkill.dodgeChance!)) {
        defHp += atkDmg // undo damage
        roundLines.push(
          `${defSkill.emoji} ${defenderName}의 **${defSkill.name}** 성공! 공격을 완전히 피했다!`,
        )
      } else {
        roundLines.push(
          `${defSkill.emoji} ${defenderName}의 **${defSkill.name}** 실패! 그대로 맞았다!`,
        )
      }
    } else if (defSkill.name === '반격') {
      const counterDmg = Math.floor(
        random(
          Math.max(1, defStats.attack - atkStats.defense),
          defStats.attack + 3,
        ) * (defSkill.counterMult ?? 0.8),
      )
      atkHp -= counterDmg
      roundLines.push(
        `${defSkill.emoji} ${defenderName}의 **${defSkill.name}**! 🩸 ${attackerName} HP -${counterDmg}`,
      )
    } else if (defSkill.name === '치유') {
      const healAmt = Math.floor(
        defPlayer.max_hp * ((defSkill.healPercent ?? 20) / 100),
      )
      defHp = Math.min(defPlayer.max_hp, defHp + healAmt)
      roundLines.push(
        `${defSkill.emoji} ${defenderName}의 **${defSkill.name}**! 💚 HP +${healAmt}`,
      )
    } else {
      // Defense stance - next attack does less
      roundLines.push(
        `${defSkill.emoji} ${defenderName}이(가) **${defSkill.name}**! 방어 강화!`,
      )
    }

    // Defender attack
    const defAttackDmg = random(
      Math.max(1, defStats.attack - atkStats.defense),
      defStats.attack + 5,
    )
    atkHp -= defAttackDmg
    roundLines.push(
      `⚔️ ${defenderName}의 반격! 🩸 ${attackerName} HP -${defAttackDmg}`,
    )

    if (chance(defStats.crit_rate * 100)) {
      const critBonus = Math.floor(defAttackDmg * (defStats.crit_damage - 1))
      atkHp -= critBonus
      roundLines.push(`💥 **크리티컬!** +${critBonus} 추가 데미지!`)
    }

    if (atkHp <= 0) {
      roundLines.push(`\n💀 ${attackerName}이(가) 쓰러졌다!`)
      allLines.push(...roundLines)
      break
    }

    // HP status
    roundLines.push(
      `\n🔴 ${attackerName}: ${Math.max(0, atkHp)} HP | 🔵 ${defenderName}: ${Math.max(0, defHp)} HP`,
    )
    allLines.push(...roundLines)

    const roundEmbed = new EmbedBuilder()
      .setColor(0xff6b00)
      .setTitle(`⚔️ PVP: ${attackerName} vs ${defenderName}`)
      .setDescription(allLines.join('\n'))
    await interaction.editReply({ embeds: [roundEmbed] })
    await sleep(2500)
  }

  await sleep(1500)

  // Determine winner
  let winnerId: string
  let loserId: string
  let winnerName: string

  if (defHp <= 0) {
    winnerId = attackerId
    loserId = defenderId
    winnerName = attackerName
  } else if (atkHp <= 0) {
    winnerId = defenderId
    loserId = attackerId
    winnerName = defenderName
  } else if (atkHp >= defHp) {
    winnerId = attackerId
    loserId = defenderId
    winnerName = attackerName
  } else {
    winnerId = defenderId
    loserId = attackerId
    winnerName = defenderName
  }

  // Rewards
  const xpReward = random(30, 80)
  const goldReward = bet > 0 ? bet * 2 : random(20, 60)

  const leveledUp = addXp(winnerId, guildId, xpReward)
  addGold(winnerId, guildId, goldReward)
  logBattle(guildId, attackerId, defenderId, winnerId, xpReward, goldReward)

  // Apply damage
  damagePlayer(
    attackerId,
    guildId,
    Math.max(0, atkPlayer.hp - Math.max(0, atkHp)),
  )
  damagePlayer(
    defenderId,
    guildId,
    Math.max(0, defPlayer.hp - Math.max(0, defHp)),
  )
  applyStatusEffect(loserId, guildId, 'stunned', 15, winnerId)

  // Titles
  addTitle(winnerId, guildId, '⚔️ PVP 승리자')

  allLines.push(`\n\n🏆 **${winnerName} 승리!**`)
  allLines.push(`✨ XP +${xpReward} | 💰 +${goldReward}G`)
  if (bet > 0) allLines.push(`💰 배팅금 **${bet * 2}G** 획득!`)
  if (leveledUp) allLines.push(`🎉 **레벨 업!!!**`)
  allLines.push(`\n*"${pick(victoryQuotes)}"*`)

  const finalEmbed = new EmbedBuilder()
    .setColor(winnerId === attackerId ? 0x2ecc71 : 0xe74c3c)
    .setTitle(`⚔️ PVP 결과: ${attackerName} vs ${defenderName}`)
    .setDescription(allLines.join('\n'))
    .setTimestamp()
  await interaction.editReply({ embeds: [finalEmbed] })
}
