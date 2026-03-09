import {
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ComponentType,
} from 'discord.js'
import {
  getOwnedCharacters,
  getOwnedCharacter,
  addCharacterXp,
  getMaterials,
  spendMaterial,
  getWeaponEquippedBy,
  equipWeaponToCharacter,
  getOwnedWeapon,
  getOwnedWeapons,
  getRelicsForCharacter,
  equipRelic,
  getOwnedRelics,
} from '../../db/helpers.js'
import {
  characterMap,
  allCharacters,
  elementEmoji,
  elementName,
  pathEmoji,
  pathName,
  getCharacterStats,
  starRarityColors,
  starRarityLabels,
} from '../../data/characters.js'
import { weaponMap } from '../../data/weapons.js'
import {
  relicSetMap,
  slotLabels,
  mainStatLabels,
  qualityLabels,
  qualityColors,
} from '../../data/relics.js'

export const data = new SlashCommandBuilder()
  .setName('character')
  .setDescription('📋 캐릭터를 관리합니다')
  .addSubcommand((sub) =>
    sub.setName('list').setDescription('보유 캐릭터 목록'),
  )
  .addSubcommand((sub) =>
    sub
      .setName('info')
      .setDescription('캐릭터 상세 정보')
      .addStringOption((opt) =>
        opt
          .setName('id')
          .setDescription('캐릭터 ID')
          .setRequired(true)
          .setAutocomplete(true),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName('levelup')
      .setDescription('캐릭터 경험치 재료 사용')
      .addStringOption((opt) =>
        opt
          .setName('id')
          .setDescription('캐릭터 ID')
          .setRequired(true)
          .setAutocomplete(true),
      )
      .addIntegerOption((opt) =>
        opt
          .setName('amount')
          .setDescription('사용할 재료 수 (재료 1개 = 경험치 100)')
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(100),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName('equip')
      .setDescription('캐릭터에 무기 장착')
      .addStringOption((opt) =>
        opt
          .setName('id')
          .setDescription('캐릭터 ID')
          .setRequired(true)
          .setAutocomplete(true),
      )
      .addStringOption((opt) =>
        opt
          .setName('weapon')
          .setDescription('무기 ID')
          .setRequired(true)
          .setAutocomplete(true),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName('relic')
      .setDescription('캐릭터에 유물 장착')
      .addStringOption((opt) =>
        opt
          .setName('id')
          .setDescription('캐릭터 ID')
          .setRequired(true)
          .setAutocomplete(true),
      )
      .addIntegerOption((opt) =>
        opt
          .setName('relic_id')
          .setDescription('유물 번호')
          .setRequired(true)
          .setAutocomplete(true),
      ),
  )

export async function autocomplete(interaction: AutocompleteInteraction) {
  const userId = interaction.user.id
  const focused = interaction.options.getFocused(true)

  if (focused.name === 'id') {
    const owned = getOwnedCharacters(userId)
    const query = focused.value.toLowerCase()
    const choices = owned
      .map((o) => {
        const t = characterMap.get(o.character_id)
        if (!t) return null
        const label = `${'⭐'.repeat(t.rarity)} ${t.emoji} ${t.name} Lv.${o.level}`
        return { name: label.slice(0, 100), value: t.id }
      })
      .filter(
        (c): c is { name: string; value: string } =>
          c !== null &&
          (c.name.toLowerCase().includes(query) ||
            c.value.toLowerCase().includes(query)),
      )
      .slice(0, 25)
    await interaction.respond(choices)
  } else if (focused.name === 'weapon') {
    const owned = getOwnedWeapons(userId)
    const query = focused.value.toLowerCase()
    const choices = owned
      .map((o) => {
        const t = weaponMap.get(o.weapon_id)
        if (!t) return null
        const label = `${'⭐'.repeat(t.rarity)} ${t.emoji} ${t.name} R${o.refinement}`
        return { name: label.slice(0, 100), value: t.id }
      })
      .filter(
        (c): c is { name: string; value: string } =>
          c !== null &&
          (c.name.toLowerCase().includes(query) ||
            c.value.toLowerCase().includes(query)),
      )
      .slice(0, 25)
    await interaction.respond(choices)
  } else if (focused.name === 'relic_id') {
    const relics = getOwnedRelics(userId)
    const query = focused.value.toLowerCase()
    const choices = relics
      .filter((r) => !r.equipped_by)
      .map((r) => {
        const setInfo = relicSetMap.get(r.set_id)
        const label = `#${r.id} ${setInfo?.name ?? r.set_id} [${(slotLabels as Record<string, string>)[r.slot] ?? r.slot}] Lv.${r.level}`
        return { name: label.slice(0, 100), value: r.id }
      })
      .filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          String(c.value).includes(query),
      )
      .slice(0, 25)
    await interaction.respond(choices)
  }
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const userId = interaction.user.id
  const sub = interaction.options.getSubcommand()

  if (sub === 'list') {
    const owned = getOwnedCharacters(userId)
    if (owned.length === 0) {
      await interaction.reply({
        content: '📋 보유한 캐릭터가 없습니다! `/gacha`로 캐릭터를 획득하세요.',
        ephemeral: true,
      })
      return
    }

    // Sort by rarity desc, then level desc
    const sorted = owned
      .map((o) => {
        const t = characterMap.get(o.character_id)
        return { owned: o, template: t }
      })
      .filter((x) => x.template)
      .sort((a, b) => {
        if (b.template!.rarity !== a.template!.rarity)
          return b.template!.rarity - a.template!.rarity
        return b.owned.level - a.owned.level
      })

    const lines = sorted.map(({ owned: o, template: t }) => {
      const stars = '⭐'.repeat(t!.rarity)
      return (
        `${t!.emoji} **${t!.name}** ${stars} Lv.${o.level} E${o.awakening} ` +
        `${elementEmoji[t!.element]}${pathEmoji[t!.path]} \`${t!.id}\``
      )
    })

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`📋 보유 캐릭터 (${owned.length}명)`)
      .setDescription(lines.join('\n'))
      .setTimestamp()

    await interaction.reply({ embeds: [embed] })
  } else if (sub === 'info') {
    const charId = interaction.options.getString('id', true)
    const template = characterMap.get(charId)

    if (!template) {
      await interaction.reply({
        content: '❌ 존재하지 않는 캐릭터입니다.',
        ephemeral: true,
      })
      return
    }

    const buildInfoEmbed = () => {
      const owned = getOwnedCharacter(userId, charId)
      const stats = owned
        ? getCharacterStats(template, owned.level)
        : getCharacterStats(template, 1)
      const stars = '⭐'.repeat(template.rarity)

      const skillInfo = [
        `**일반 공격:** ${template.basic.name} — ${template.basic.description ?? `배율 ${(template.basic.multiplier * 100).toFixed(0)}%`}`,
        `**전투 스킬:** ${template.skill.name} — ${template.skill.description ?? `배율 ${(template.skill.multiplier * 100).toFixed(0)}%`}`,
        `**필살기:** ${template.ultimate.name} — ${template.ultimate.description ?? `배율 ${(template.ultimate.multiplier * 100).toFixed(0)}%`}`,
        `**특성:** ${template.talent.name} — ${template.talent.description}`,
      ].join('\n')

      const embed = new EmbedBuilder()
        .setColor(starRarityColors[template.rarity])
        .setTitle(`${template.emoji} ${template.name} ${stars}`)
        .setDescription(template.description)
        .addFields(
          {
            name: '속성 / 운명',
            value: `${elementEmoji[template.element]} ${elementName[template.element]} | ${pathEmoji[template.path]} ${pathName[template.path]}`,
            inline: true,
          },
          {
            name: '스탯',
            value: `❤️ HP: ${stats.hp}\n⚔️ ATK: ${stats.atk}\n🛡️ DEF: ${stats.def}\n💨 SPD: ${stats.spd}`,
            inline: true,
          },
        )

      if (owned) {
        embed.addFields({
          name: '보유 정보',
          value: `Lv.${owned.level} | E${owned.awakening} | XP: ${owned.experience}/${owned.level * 150}`,
          inline: true,
        })

        const weapon = getWeaponEquippedBy(userId, charId)
        if (weapon) {
          const wt = weaponMap.get(weapon.weapon_id)
          embed.addFields({
            name: '장착 무기',
            value: `${wt?.emoji ?? '?'} ${wt?.name ?? '?'} R${weapon.refinement}`,
            inline: true,
          })
        }

        const relics = getRelicsForCharacter(userId, charId)
        if (relics.length > 0) {
          const relicLines = relics.map((r) => {
            const setInfo = relicSetMap.get(r.set_id)
            return `${(slotLabels as Record<string, string>)[r.slot] ?? r.slot}: ${setInfo?.name ?? r.set_id} (${(mainStatLabels as Record<string, string>)[r.main_stat_type] ?? r.main_stat_type})`
          })
          embed.addFields({ name: '장착 유물', value: relicLines.join('\n') })
        }
      } else {
        embed.addFields({ name: '보유 여부', value: '❌ 미보유', inline: true })
      }

      embed.addFields({ name: '스킬', value: skillInfo })
      embed.setFooter({ text: `ID: ${template.id}` })
      return { embed, owned }
    }

    const { embed, owned } = buildInfoEmbed()

    // Add management buttons if owned
    const components: ActionRowBuilder<ButtonBuilder>[] = []
    if (owned) {
      const mats = getMaterials(userId)
      const isMaxLevel = owned.level >= 80
      const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`char_lvlup_${charId}`)
          .setLabel(`🔼 레벨업 (재료: ${mats.char_xp_material}개)`)
          .setStyle(ButtonStyle.Success)
          .setDisabled(isMaxLevel || mats.char_xp_material < 1),
        new ButtonBuilder()
          .setCustomId(`char_weapon_${charId}`)
          .setLabel('⚔️ 무기 변경')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`char_relic_${charId}`)
          .setLabel('🏺 유물 장착')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`char_refresh_${charId}`)
          .setLabel('🔄')
          .setStyle(ButtonStyle.Secondary),
      )
      components.push(actionRow)
    }

    const response = await interaction.reply({
      embeds: [embed],
      components,
      fetchReply: true,
    })

    if (!owned) return

    // Interactive button collector (60 seconds)
    const collector = response.createMessageComponentCollector({
      filter: (i) => i.user.id === userId,
      time: 60000,
    })

    collector.on('collect', async (i) => {
      if (i.customId === `char_lvlup_${charId}`) {
        // Quick level up (10 materials)
        const currentOwned = getOwnedCharacter(userId, charId)
        if (!currentOwned || currentOwned.level >= 80) {
          await i.reply({
            content: '⚠️ 최대 레벨이거나 미보유입니다.',
            ephemeral: true,
          })
          return
        }
        const amount = Math.min(10, getMaterials(userId).char_xp_material)
        if (amount < 1) {
          await i.reply({
            content: '❌ 경험치 재료가 없습니다!',
            ephemeral: true,
          })
          return
        }
        spendMaterial(userId, 'char_xp_material', amount)
        const result = addCharacterXp(userId, charId, amount * 100)

        await i.reply({
          content: result.leveled
            ? `🎉 재료 ${amount}개 → **Lv.${result.newLevel}** 레벨 업!`
            : `✅ 재료 ${amount}개 → XP +${amount * 100}`,
          ephemeral: true,
        })

        // Refresh embed
        const { embed: newEmbed } = buildInfoEmbed()
        const newMats = getMaterials(userId)
        const newOwned = getOwnedCharacter(userId, charId)
        const newRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`char_lvlup_${charId}`)
            .setLabel(`🔼 레벨업 (재료: ${newMats.char_xp_material}개)`)
            .setStyle(ButtonStyle.Success)
            .setDisabled(
              !newOwned || newOwned.level >= 80 || newMats.char_xp_material < 1,
            ),
          new ButtonBuilder()
            .setCustomId(`char_weapon_${charId}`)
            .setLabel('⚔️ 무기 변경')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`char_relic_${charId}`)
            .setLabel('🏺 유물 장착')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`char_refresh_${charId}`)
            .setLabel('🔄')
            .setStyle(ButtonStyle.Secondary),
        )
        await interaction.editReply({
          embeds: [newEmbed],
          components: [newRow],
        })
      } else if (i.customId === `char_weapon_${charId}`) {
        // Show weapon select dropdown
        const weapons = getOwnedWeapons(userId)
        const compatible = weapons
          .map((w) => ({ owned: w, template: weaponMap.get(w.weapon_id) }))
          .filter((w) => w.template && w.template.path === template.path)
          .slice(0, 25)

        if (compatible.length === 0) {
          await i.reply({
            content: `❌ ${pathName[template.path]} 운명의 무기를 보유하고 있지 않습니다!`,
            ephemeral: true,
          })
          return
        }

        const selectRow =
          new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId(`char_weapon_select_${charId}`)
              .setPlaceholder('무기를 선택하세요')
              .addOptions(
                compatible.map((w) => ({
                  label:
                    `${w.template!.name} ${'⭐'.repeat(w.template!.rarity)} R${w.owned.refinement}`.slice(
                      0,
                      100,
                    ),
                  value: w.template!.id,
                  emoji: w.template!.emoji,
                })),
              ),
          )
        await i.reply({
          content: '⚔️ 장착할 무기를 선택하세요:',
          components: [selectRow],
          ephemeral: true,
        })
      } else if (i.customId === `char_relic_${charId}`) {
        // Show relic select dropdown
        const allRelics = getOwnedRelics(userId)
        const available = allRelics
          .filter((r) => !r.equipped_by || r.equipped_by === charId)
          .slice(0, 25)

        if (available.length === 0) {
          await i.reply({
            content: '❌ 장착 가능한 유물이 없습니다!',
            ephemeral: true,
          })
          return
        }

        const selectRow =
          new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId(`char_relic_select_${charId}`)
              .setPlaceholder('유물을 선택하세요')
              .addOptions(
                available.map((r) => {
                  const setInfo = relicSetMap.get(r.set_id)
                  return {
                    label:
                      `#${r.id} ${setInfo?.name ?? r.set_id} [${(slotLabels as Record<string, string>)[r.slot] ?? r.slot}]`.slice(
                        0,
                        100,
                      ),
                    value: String(r.id),
                    description:
                      `${(mainStatLabels as Record<string, string>)[r.main_stat_type] ?? r.main_stat_type} Lv.${r.level}`.slice(
                        0,
                        100,
                      ),
                  }
                }),
              ),
          )
        await i.reply({
          content: '🏺 장착할 유물을 선택하세요:',
          components: [selectRow],
          ephemeral: true,
        })
      } else if (i.customId === `char_weapon_select_${charId}`) {
        if (!i.isStringSelectMenu()) return
        const weaponId = i.values[0]
        equipWeaponToCharacter(userId, weaponId, charId)
        const wt = weaponMap.get(weaponId)
        await i.update({
          content: `✅ ${wt?.emoji ?? ''} **${wt?.name ?? weaponId}** 장착 완료!`,
          components: [],
        })

        const { embed: newEmbed } = buildInfoEmbed()
        await interaction.editReply({ embeds: [newEmbed] })
      } else if (i.customId === `char_relic_select_${charId}`) {
        if (!i.isStringSelectMenu()) return
        const relicId = parseInt(i.values[0])
        equipRelic(userId, relicId, charId)
        await i.update({
          content: `✅ 유물 #${relicId} 장착 완료!`,
          components: [],
        })

        const { embed: newEmbed } = buildInfoEmbed()
        await interaction.editReply({ embeds: [newEmbed] })
      } else if (i.customId === `char_refresh_${charId}`) {
        const { embed: newEmbed } = buildInfoEmbed()
        const newMats = getMaterials(userId)
        const newOwned = getOwnedCharacter(userId, charId)
        const newRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`char_lvlup_${charId}`)
            .setLabel(`🔼 레벨업 (재료: ${newMats.char_xp_material}개)`)
            .setStyle(ButtonStyle.Success)
            .setDisabled(
              !newOwned || newOwned.level >= 80 || newMats.char_xp_material < 1,
            ),
          new ButtonBuilder()
            .setCustomId(`char_weapon_${charId}`)
            .setLabel('⚔️ 무기 변경')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`char_relic_${charId}`)
            .setLabel('🏺 유물 장착')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`char_refresh_${charId}`)
            .setLabel('🔄')
            .setStyle(ButtonStyle.Secondary),
        )
        await i.update({ embeds: [newEmbed], components: [newRow] })
      }
    })

    collector.on('end', async () => {
      try {
        const { embed: finalEmbed } = buildInfoEmbed()
        await interaction.editReply({ embeds: [finalEmbed], components: [] })
      } catch {
        /* message may be deleted */
      }
    })
  } else if (sub === 'levelup') {
    const charId = interaction.options.getString('id', true)
    const amount = interaction.options.getInteger('amount', true)
    const owned = getOwnedCharacter(userId, charId)
    const template = characterMap.get(charId)

    if (!owned || !template) {
      await interaction.reply({
        content: '❌ 보유하지 않은 캐릭터입니다.',
        ephemeral: true,
      })
      return
    }
    if (owned.level >= 80) {
      await interaction.reply({
        content: '⚠️ 이미 최대 레벨입니다! (Lv.80)',
        ephemeral: true,
      })
      return
    }

    if (!spendMaterial(userId, 'char_xp_material', amount)) {
      const mats = getMaterials(userId)
      await interaction.reply({
        content: `❌ 캐릭터 경험치 재료가 부족합니다! (보유: ${mats.char_xp_material}개)`,
        ephemeral: true,
      })
      return
    }

    const xpGained = amount * 100
    const result = addCharacterXp(userId, charId, xpGained)

    const embed = new EmbedBuilder()
      .setColor(result.leveled ? 0xffd700 : 0x57f287)
      .setTitle(`${template.emoji} ${template.name} — 경험치 획득!`)
      .setDescription(
        `📦 재료 ${amount}개 사용 → 경험치 +${xpGained}\n` +
          (result.leveled
            ? `🎉 **레벨 업! Lv.${result.newLevel}**`
            : `현재 Lv.${result.newLevel}`),
      )

    await interaction.reply({ embeds: [embed] })
  } else if (sub === 'equip') {
    const charId = interaction.options.getString('id', true)
    const weaponId = interaction.options.getString('weapon', true)

    const ownedChar = getOwnedCharacter(userId, charId)
    if (!ownedChar) {
      await interaction.reply({
        content: '❌ 보유하지 않은 캐릭터입니다.',
        ephemeral: true,
      })
      return
    }
    const ownedWpn = getOwnedWeapon(userId, weaponId)
    if (!ownedWpn) {
      await interaction.reply({
        content: '❌ 보유하지 않은 무기입니다.',
        ephemeral: true,
      })
      return
    }
    const charTemplate = characterMap.get(charId)!
    const wpnTemplate = weaponMap.get(weaponId)!

    if (wpnTemplate.path !== charTemplate.path) {
      await interaction.reply({
        content: `❌ 운명이 맞지 않습니다! ${charTemplate.name}은(는) ${pathName[charTemplate.path]} 운명이지만, ${wpnTemplate.name}은(는) ${pathName[wpnTemplate.path]} 운명 무기입니다.`,
        ephemeral: true,
      })
      return
    }

    equipWeaponToCharacter(userId, weaponId, charId)
    await interaction.reply({
      content: `✅ ${charTemplate.emoji} **${charTemplate.name}**에게 ${wpnTemplate.emoji} **${wpnTemplate.name}**을(를) 장착했습니다!`,
    })
  } else if (sub === 'relic') {
    const charId = interaction.options.getString('id', true)
    const relicId = interaction.options.getInteger('relic_id', true)

    const ownedChar = getOwnedCharacter(userId, charId)
    if (!ownedChar) {
      await interaction.reply({
        content: '❌ 보유하지 않은 캐릭터입니다.',
        ephemeral: true,
      })
      return
    }

    equipRelic(userId, relicId, charId)
    const charTemplate = characterMap.get(charId)!
    await interaction.reply({
      content: `✅ ${charTemplate.emoji} **${charTemplate.name}**에게 유물 #${relicId}을(를) 장착했습니다!`,
    })
  }
}
