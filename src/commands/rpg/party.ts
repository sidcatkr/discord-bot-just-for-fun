import {
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js'
import {
  getOwnedCharacters,
  getOwnedCharacter,
  getParty,
  setPartySlot,
  removePartySlot,
  clearParty,
  getWeaponEquippedBy,
  getRelicsForCharacter,
} from '../../db/helpers.js'
import {
  characterMap,
  elementEmoji,
  pathEmoji,
  getCharacterStats,
  starRarityLabels,
} from '../../data/characters.js'
import { weaponMap } from '../../data/weapons.js'
import { getPartySynergies } from '../../data/combat-engine.js'

export const data = new SlashCommandBuilder()
  .setName('party')
  .setDescription('🎭 파티를 관리합니다')
  .addSubcommand((sub) => sub.setName('view').setDescription('현재 파티 확인'))
  .addSubcommand((sub) =>
    sub
      .setName('set')
      .setDescription('파티 슬롯에 캐릭터 배치')
      .addIntegerOption((opt) =>
        opt
          .setName('slot')
          .setDescription('슬롯 번호 (1-4)')
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(4),
      )
      .addStringOption((opt) =>
        opt
          .setName('character')
          .setDescription('캐릭터 ID')
          .setRequired(true)
          .setAutocomplete(true),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName('remove')
      .setDescription('파티 슬롯에서 캐릭터 제거')
      .addIntegerOption((opt) =>
        opt
          .setName('slot')
          .setDescription('슬롯 번호 (1-4)')
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(4),
      ),
  )
  .addSubcommand((sub) => sub.setName('clear').setDescription('파티 초기화'))

export async function autocomplete(interaction: AutocompleteInteraction) {
  const userId = interaction.user.id
  const focused = interaction.options.getFocused(true)

  if (focused.name === 'character') {
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
  }
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const userId = interaction.user.id
  const subcommand = interaction.options.getSubcommand()

  if (subcommand === 'view') {
    const partyIds = getParty(userId)
    if (partyIds.length === 0) {
      await interaction.reply({
        content:
          '🎭 파티가 비어있습니다! `/party set`으로 캐릭터를 배치하세요.',
        ephemeral: true,
      })
      return
    }

    const lines: string[] = []
    for (let i = 0; i < 4; i++) {
      const charId = partyIds[i]
      if (!charId) {
        lines.push(`**슬롯 ${i + 1}:** 비어있음`)
        continue
      }
      const template = characterMap.get(charId)
      const owned = getOwnedCharacter(userId, charId)
      if (!template || !owned) {
        lines.push(`**슬롯 ${i + 1}:** ❌ 알 수 없는 캐릭터`)
        continue
      }
      const stats = getCharacterStats(template, owned.level)
      const weapon = getWeaponEquippedBy(userId, charId)
      const weaponName = weapon
        ? (weaponMap.get(weapon.weapon_id)?.name ?? '?')
        : '없음'

      lines.push(
        `**슬롯 ${i + 1}:** ${template.emoji} **${template.name}** Lv.${owned.level}` +
          ` ${elementEmoji[template.element]}${pathEmoji[template.path]}` +
          `\n  ❤️${stats.hp} ⚔️${stats.atk} 🛡️${stats.def} 💨${stats.spd}` +
          ` | 각성 E${owned.awakening} | 무기: ${weaponName}`,
      )
    }

    // Synergy display
    const synergies = getPartySynergies(partyIds)
    if (synergies.length > 0) {
      lines.push(
        `\n**✨ 활성 시너지:**\n` +
          synergies
            .map((s) => `${s.emoji} **${s.name}** — ${s.description}`)
            .join('\n'),
      )
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🎭 나의 파티')
      .setDescription(lines.join('\n\n'))
      .setTimestamp()

    await interaction.reply({ embeds: [embed] })
  } else if (subcommand === 'set') {
    const slot = interaction.options.getInteger('slot', true)
    const characterId = interaction.options.getString('character', true)

    const owned = getOwnedCharacter(userId, characterId)
    if (!owned) {
      await interaction.reply({
        content:
          '❌ 보유하지 않은 캐릭터입니다! `/character list`로 보유 캐릭터를 확인하세요.',
        ephemeral: true,
      })
      return
    }
    const template = characterMap.get(characterId)
    if (!template) {
      await interaction.reply({
        content: '❌ 존재하지 않는 캐릭터입니다.',
        ephemeral: true,
      })
      return
    }

    // Check if character is already in another slot
    const currentParty = getParty(userId)
    const existingSlot = currentParty.indexOf(characterId)
    if (existingSlot !== -1 && existingSlot !== slot - 1) {
      removePartySlot(userId, existingSlot + 1)
    }

    setPartySlot(userId, slot, characterId)
    await interaction.reply({
      content: `✅ **슬롯 ${slot}**에 ${template.emoji} **${template.name}**을(를) 배치했습니다!`,
    })
  } else if (subcommand === 'remove') {
    const slot = interaction.options.getInteger('slot', true)
    removePartySlot(userId, slot)
    await interaction.reply({
      content: `✅ 슬롯 ${slot}에서 캐릭터를 제거했습니다.`,
    })
  } else if (subcommand === 'clear') {
    clearParty(userId)
    await interaction.reply({ content: '✅ 파티를 초기화했습니다.' })
  }
}
