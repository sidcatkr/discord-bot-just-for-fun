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
  generateEnhancedEnemies,
} from '../../data/dungeon-data.js'
import {
  generateRelic,
  relicSetMap,
  qualityLabels,
  slotLabels,
  mainStatLabels,
} from '../../data/relics.js'
import {
  buildPlayerCombatant,
  buildEnemyCombatant,
  runAutoBattle,
  getTeamStatus,
  getPartySynergies,
  applySynergies,
  formatHPBar,
} from '../../data/combat-engine.js'

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

    // Build party combatants using combat engine
    const team1 = partyIds
      .map((id) => buildPlayerCombatant(userId, id, 1))
      .filter(Boolean) as import('../../data/combat-engine.js').Combatant[]

    if (team1.length === 0) {
      await interaction.reply({
        content: '❌ 파티에 유효한 캐릭터가 없습니다!',
        ephemeral: true,
      })
      return
    }

    // Apply party synergies
    const synergies = getPartySynergies(partyIds)
    applySynergies(team1, synergies)

    spendStamina(userId, diff.staminaCost)

    // Generate enemies using enhanced system
    const enemyDefs = generateEnhancedEnemies(difficulty)
    const team2 = enemyDefs.map((e, i) => buildEnemyCombatant(e, i))

    // Show entering
    const synergyText =
      synergies.length > 0
        ? `\n**시너지:** ${synergies.map((s) => `${s.emoji} ${s.name}`).join(', ')}`
        : ''
    const enterEmbed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle(`${dungeon.emoji} ${dungeon.name} — ${diff.name}`)
      .setDescription(
        `⚔️ 전투 시작!\n\n` +
          `**파티:** ${team1.map((c) => `${c.emoji}${c.name}(Lv.${Math.floor((c.stats.atk - 800) / 13 + 1)})`).join(' ')}` +
          synergyText +
          `\n**적:** ${team2.map((e) => `${e.emoji}${e.name}`).join(' ')}` +
          `\n\n> 📊 추천 전투력: **${diff.recommendedPower}**`,
      )
    await interaction.reply({ embeds: [enterEmbed] })
    await sleep(2000)

    // Run auto-battle using combat engine
    const { state, fullLog } = runAutoBattle(team1, team2, 40)
    const won = state.winner === 1
    const survivingParty = state.combatants.filter(
      (c) => c.team === 1 && c.isAlive,
    ).length

    if (won) {
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
          `${fullLog.join('\n')}\n\n` +
            `**보상:**\n${rewardLines.join('\n')}${relicLine}${fateLine}`,
        )
        .setFooter({
          text: `⚡ 스태미나 -${diff.staminaCost} | 생존 ${survivingParty}/${team1.length}`,
        })
        .setTimestamp()

      await interaction.editReply({ embeds: [winEmbed] })
    } else {
      const loseEmbed = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle(`${dungeon.emoji} ${dungeon.name} — 실패...`)
        .setDescription(
          fullLog.join('\n') +
            '\n\n💡 **팁:** 캐릭터를 레벨업하고, 무기와 유물을 장착하여 전투력을 높이세요!',
        )
        .setFooter({
          text: `⚡ 스태미나 -${diff.staminaCost} (돌려받지 못합니다)`,
        })
        .setTimestamp()

      await interaction.editReply({ embeds: [loseEmbed] })
    }
  }
}
