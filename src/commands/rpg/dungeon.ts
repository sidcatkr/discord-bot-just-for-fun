import {
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from 'discord.js'
import {
  getOwnedCharacter,
  getParty,
  getWeaponEquippedBy,
  getRelicsForCharacter,
  getStamina,
  spendStamina,
  addStellarite,
  addGold,
  addMaterial,
  addFatePass,
  addRelic,
} from '../../db/helpers.js'
import { pick, random, chance, sleep } from '../../db/helpers.js'
import {
  characterMap,
  getCharacterStats,
  elementEmoji,
} from '../../data/characters.js'
import { weaponMap } from '../../data/weapons.js'
import {
  dungeons,
  dungeonMap,
  generateDungeonEnemies,
  type DungeonEnemy,
} from '../../data/dungeon-data.js'
import {
  generateRelic,
  relicSetMap,
  qualityLabels,
  slotLabels,
  mainStatLabels,
} from '../../data/relics.js'

export const data = new SlashCommandBuilder()
  .setName('dungeon')
  .setDescription('🏰 던전에 도전합니다')
  .addSubcommand((sub) => sub.setName('list').setDescription('던전 목록 보기'))
  .addSubcommand((sub) =>
    sub
      .setName('enter')
      .setDescription('던전에 입장합니다')
      .addStringOption((opt) =>
        opt
          .setName('id')
          .setDescription('던전 ID')
          .setRequired(true)
          .setAutocomplete(true),
      )
      .addIntegerOption((opt) =>
        opt
          .setName('difficulty')
          .setDescription('난이도 (1-6)')
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(6),
      ),
  )
  .addSubcommand((sub) =>
    sub.setName('stamina').setDescription('현재 스태미나 확인'),
  )

// Simple auto-battle for dungeon PvE
function simulateDungeonBattle(
  partyChars: {
    name: string
    emoji: string
    hp: number
    atk: number
    def: number
    spd: number
    element: string
  }[],
  enemies: DungeonEnemy[],
): { won: boolean; log: string[]; survivingParty: number } {
  const log: string[] = []

  // Clone HP pools
  const partyHP = partyChars.map((c) => c.hp)
  const enemyHP = enemies.map((e) => e.hp)

  const MAX_ROUNDS = 15

  for (let round = 1; round <= MAX_ROUNDS; round++) {
    // All participants act in SPD order
    const actors: { index: number; side: 'party' | 'enemy'; spd: number }[] = []
    partyChars.forEach((c, i) => {
      if (partyHP[i] > 0) actors.push({ index: i, side: 'party', spd: c.spd })
    })
    enemies.forEach((e, i) => {
      if (enemyHP[i] > 0) actors.push({ index: i, side: 'enemy', spd: e.spd })
    })
    actors.sort((a, b) => b.spd - a.spd)

    for (const actor of actors) {
      if (actor.side === 'party') {
        if (partyHP[actor.index] <= 0) continue
        // Attack random alive enemy
        const aliveEnemies = enemies
          .map((e, i) => i)
          .filter((i) => enemyHP[i] > 0)
        if (aliveEnemies.length === 0) break
        const targetIdx = pick(aliveEnemies)
        const pc = partyChars[actor.index]
        const dmg = Math.max(
          1,
          Math.floor(
            pc.atk * (1.2 + Math.random() * 0.4) - enemies[targetIdx].def * 0.5,
          ),
        )
        enemyHP[targetIdx] = Math.max(0, enemyHP[targetIdx] - dmg)
        if (round <= 3 || enemyHP[targetIdx] === 0) {
          log.push(
            `${pc.emoji} ${pc.name} → ${enemies[targetIdx].emoji} ${enemies[targetIdx].name}: ${dmg} 피해${enemyHP[targetIdx] === 0 ? ' 💀처치!' : ''}`,
          )
        }
      } else {
        if (enemyHP[actor.index] <= 0) continue
        const aliveParty = partyChars
          .map((c, i) => i)
          .filter((i) => partyHP[i] > 0)
        if (aliveParty.length === 0) break
        const targetIdx = pick(aliveParty)
        const enemy = enemies[actor.index]
        const dmg = Math.max(
          1,
          Math.floor(
            enemy.atk * (1 + Math.random() * 0.3) -
              partyChars[targetIdx].def * 0.5,
          ),
        )
        partyHP[targetIdx] = Math.max(0, partyHP[targetIdx] - dmg)
        if (round <= 3 || partyHP[targetIdx] === 0) {
          log.push(
            `${enemy.emoji} ${enemy.name} → ${partyChars[targetIdx].emoji} ${partyChars[targetIdx].name}: ${dmg} 피해${partyHP[targetIdx] === 0 ? ' 💀전사!' : ''}`,
          )
        }
      }

      // Check end conditions
      if (enemyHP.every((h) => h === 0)) {
        log.push('🎉 **모든 적을 처치했습니다!**')
        return {
          won: true,
          log,
          survivingParty: partyHP.filter((h) => h > 0).length,
        }
      }
      if (partyHP.every((h) => h === 0)) {
        log.push('💀 **파티가 전멸했습니다...**')
        return { won: false, log, survivingParty: 0 }
      }
    }

    if (round === 3 && MAX_ROUNDS > 3) {
      log.push(`*... ${MAX_ROUNDS - 3}라운드 더 전투 중 ...*`)
    }
  }

  // Timed out — partial victory based on remaining enemies
  const remainingEnemies = enemyHP.filter((h) => h > 0).length
  if (remainingEnemies < enemies.length / 2) {
    log.push('⏰ **시간 초과! 남은 적을 간신히 처리했습니다.**')
    return {
      won: true,
      log,
      survivingParty: partyHP.filter((h) => h > 0).length,
    }
  }
  log.push('⏰ **시간 초과! 퇴각합니다...**')
  return {
    won: false,
    log,
    survivingParty: partyHP.filter((h) => h > 0).length,
  }
}

export async function autocomplete(interaction: AutocompleteInteraction) {
  const focused = interaction.options.getFocused(true)

  if (focused.name === 'id') {
    const query = focused.value.toLowerCase()
    const choices = dungeons
      .map((d) => ({
        name: `${d.emoji} ${d.name}`,
        value: d.id,
      }))
      .filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.value.toLowerCase().includes(query),
      )
      .slice(0, 25)
    await interaction.respond(choices)
  }
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const userId = interaction.user.id
  const sub = interaction.options.getSubcommand()

  if (sub === 'list') {
    const stamina = getStamina(userId)
    const lines = dungeons.map((d) => {
      const diffRange = `${d.difficulties[0].staminaCost}-${d.difficulties[d.difficulties.length - 1].staminaCost} 스태미나`
      return `${d.emoji} **${d.name}** — ${d.description}\n  📊 난이도 1-${d.difficulties.length} | ⚡ ${diffRange} | \`${d.id}\``
    })

    const embed = new EmbedBuilder()
      .setColor(0xf1c40f)
      .setTitle('🏰 던전 목록')
      .setDescription(lines.join('\n\n'))
      .setFooter({ text: `⚡ 스태미나: ${stamina}/180` })
      .setTimestamp()

    await interaction.reply({ embeds: [embed] })
  } else if (sub === 'stamina') {
    const stamina = getStamina(userId)
    await interaction.reply({
      content: `⚡ 현재 스태미나: **${stamina}/180** (6분마다 1 회복)`,
    })
  } else if (sub === 'enter') {
    const dungeonId = interaction.options.getString('id', true)
    const difficulty = interaction.options.getInteger('difficulty', true)

    const dungeon = dungeonMap.get(dungeonId)
    if (!dungeon) {
      await interaction.reply({
        content: '❌ 존재하지 않는 던전입니다! `/dungeon list`로 확인하세요.',
        ephemeral: true,
      })
      return
    }

    const diff = dungeon.difficulties[difficulty - 1]
    if (!diff) {
      await interaction.reply({
        content: '❌ 해당 난이도가 없습니다!',
        ephemeral: true,
      })
      return
    }

    // Check stamina
    const stamina = getStamina(userId)
    if (stamina < diff.staminaCost) {
      await interaction.reply({
        content: `⚡ 스태미나가 부족합니다! (보유: ${stamina} / 필요: ${diff.staminaCost})`,
        ephemeral: true,
      })
      return
    }

    // Check party
    const partyIds = getParty(userId)
    if (partyIds.length === 0) {
      await interaction.reply({
        content:
          '❌ 파티가 비어있습니다! `/party set`으로 캐릭터를 배치하세요.',
        ephemeral: true,
      })
      return
    }

    // Build party stats
    const partyChars = partyIds
      .map((id) => {
        const owned = getOwnedCharacter(userId, id)
        const template = characterMap.get(id)
        if (!owned || !template) return null

        const stats = getCharacterStats(template, owned.level)
        const weapon = getWeaponEquippedBy(userId, id)
        let bonusAtk = 0,
          bonusHP = 0,
          bonusDef = 0
        if (weapon) {
          const wt = weaponMap.get(weapon.weapon_id)
          if (wt) {
            bonusAtk += wt.baseATK
            bonusHP += wt.baseHP
            bonusDef += wt.baseDEF
          }
        }

        return {
          name: template.name,
          emoji: template.emoji,
          hp: stats.hp + bonusHP,
          atk: stats.atk + bonusAtk,
          def: stats.def + bonusDef,
          spd: stats.spd,
          element: template.element,
        }
      })
      .filter(Boolean) as {
      name: string
      emoji: string
      hp: number
      atk: number
      def: number
      spd: number
      element: string
    }[]

    if (partyChars.length === 0) {
      await interaction.reply({
        content: '❌ 파티에 유효한 캐릭터가 없습니다!',
        ephemeral: true,
      })
      return
    }

    spendStamina(userId, diff.staminaCost)

    // Generate enemies
    const enemies = generateDungeonEnemies(difficulty)

    // Show entering
    const enterEmbed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle(`${dungeon.emoji} ${dungeon.name} — ${diff.name}`)
      .setDescription(
        `⚔️ 전투 시작!\n\n**파티:** ${partyChars.map((c) => `${c.emoji}${c.name}`).join(' ')}\n**적:** ${enemies.map((e) => `${e.emoji}${e.name}`).join(' ')}`,
      )
    await interaction.reply({ embeds: [enterEmbed] })
    await sleep(2000)

    // Simulate battle
    const result = simulateDungeonBattle(partyChars, enemies)

    if (result.won) {
      // Calculate rewards
      const rewards = diff.rewards
      const earnedStellarite = random(
        rewards.stellariteMin,
        rewards.stellariteMax,
      )
      const earnedGold = random(rewards.goldMin, rewards.goldMax)
      const earnedCharXp = random(rewards.xpMaterialMin, rewards.xpMaterialMax)
      const earnedWpnXp = random(rewards.weaponXpMin, rewards.weaponXpMax)

      addStellarite(userId, earnedStellarite)
      addGold(userId, interaction.guildId!, earnedGold)
      if (earnedCharXp > 0)
        addMaterial(userId, 'char_xp_material', earnedCharXp)
      if (earnedWpnXp > 0)
        addMaterial(userId, 'weapon_xp_material', earnedWpnXp)

      const rewardLines: string[] = [
        `💎 성광석: +${earnedStellarite}`,
        `🪙 골드: +${earnedGold}`,
      ]
      if (earnedCharXp > 0)
        rewardLines.push(`📦 캐릭터 경험치 재료: +${earnedCharXp}`)
      if (earnedWpnXp > 0)
        rewardLines.push(`⚒️ 무기 강화 재료: +${earnedWpnXp}`)

      // Relic drop
      let relicLine = ''
      if (
        dungeon.type === 'relic' &&
        dungeon.relicSetIds &&
        chance(rewards.relicDropChance)
      ) {
        const setId = pick(dungeon.relicSetIds)
        const relic = generateRelic(setId, difficulty)
        const relicId = addRelic(
          userId,
          relic.setId,
          relic.slot,
          relic.mainStat.type,
          relic.mainStat.value,
          relic.subStats,
          relic.quality,
        )
        const setInfo = relicSetMap.get(setId)
        relicLine = `\n🏺 **유물 드롭!** ${setInfo?.emoji ?? ''} ${setInfo?.name ?? setId} (${slotLabels[relic.slot] ?? relic.slot}) — ${qualityLabels[relic.quality] ?? relic.quality}`
      }

      // Fate pass
      let fateLine = ''
      if (chance(rewards.fatePassChance)) {
        addFatePass(userId, 1)
        fateLine = '\n🌟 **운명의 인연 드롭!** +1'
      }

      const winEmbed = new EmbedBuilder()
        .setColor(0x57f287)
        .setTitle(`${dungeon.emoji} ${dungeon.name} — 클리어!`)
        .setDescription(
          `${result.log.join('\n')}\n\n` +
            `**보상:**\n${rewardLines.join('\n')}${relicLine}${fateLine}`,
        )
        .setFooter({
          text: `⚡ 스태미나 -${diff.staminaCost} | 생존 ${result.survivingParty}/${partyChars.length}`,
        })
        .setTimestamp()

      await interaction.editReply({ embeds: [winEmbed] })
    } else {
      const loseEmbed = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle(`${dungeon.emoji} ${dungeon.name} — 실패...`)
        .setDescription(result.log.join('\n'))
        .setFooter({
          text: `⚡ 스태미나 -${diff.staminaCost} (돌려받지 못합니다)`,
        })
        .setTimestamp()

      await interaction.editReply({ embeds: [loseEmbed] })
    }
  }
}
