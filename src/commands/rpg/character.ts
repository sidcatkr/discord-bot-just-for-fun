import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
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
        opt.setName('id').setDescription('캐릭터 ID').setRequired(true),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName('levelup')
      .setDescription('캐릭터 경험치 재료 사용')
      .addStringOption((opt) =>
        opt.setName('id').setDescription('캐릭터 ID').setRequired(true),
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
        opt.setName('id').setDescription('캐릭터 ID').setRequired(true),
      )
      .addStringOption((opt) =>
        opt.setName('weapon').setDescription('무기 ID').setRequired(true),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName('relic')
      .setDescription('캐릭터에 유물 장착')
      .addStringOption((opt) =>
        opt.setName('id').setDescription('캐릭터 ID').setRequired(true),
      )
      .addIntegerOption((opt) =>
        opt
          .setName('relic_id')
          .setDescription('유물 번호 (inventory에서 확인)')
          .setRequired(true),
      ),
  )

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
    const owned = getOwnedCharacter(userId, charId)
    const template = characterMap.get(charId)

    if (!template) {
      await interaction.reply({
        content: '❌ 존재하지 않는 캐릭터입니다.',
        ephemeral: true,
      })
      return
    }

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

    await interaction.reply({ embeds: [embed] })
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
