import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ComponentType,
} from 'discord.js'
import db from '../../db/database.js'
import {
  getOrCreatePlayer,
  getParty,
  setPartySlot,
  clearParty,
  addCharacter,
  addCharacterXp,
  addWeapon,
  equipWeaponToCharacter,
  getOwnedCharacters,
  getOwnedWeapons,
  addRelic,
  equipRelic,
  getRelicsForCharacter,
  getOwnedRelics,
  getRelicMainStatValue,
  RELIC_STAT_NAMES,
} from '../../db/helpers.js'
import { characterMap, allCharacters } from '../../data/characters.js'
import { weaponMap, allWeapons } from '../../data/weapons.js'
import {
  RELIC_SETS,
  relicSetMap,
  RELIC_SLOT_NAMES,
  RELIC_SLOT_EMOJI,
  type RelicSlot,
} from '../../data/relic-data.js'
import { runPvpBattle } from '../rpg/pvp.js'

const BOT_OWNER_ID = process.env.BOT_OWNER_ID ?? '772161802054270978'

function isOwner(userId: string): boolean {
  return userId === BOT_OWNER_ID
}

/** Get all test users from DB */
function getTestUsers(): { user_id: string; username: string; gold: number }[] {
  return db
    .prepare(
      "SELECT user_id, username, gold FROM players WHERE user_id LIKE 'test_%' ORDER BY rowid DESC",
    )
    .all() as { user_id: string; username: string; gold: number }[]
}

export const data = new SlashCommandBuilder()
  .setName('testuser')
  .setDescription('🤖 테스트 유저 관리 (관리자 전용)')
  .setDefaultMemberPermissions(0)

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!isOwner(interaction.user.id)) {
    await interaction.reply({
      content: '❌ 이 명령어는 봇 소유자만 사용할 수 있습니다.',
      ephemeral: true,
    })
    return
  }

  await showTestUserList(interaction)
}

// ══════════════════════════════════════════════
//  Main Menu — Test User List
// ══════════════════════════════════════════════

async function showTestUserList(
  interaction: ChatInputCommandInteraction,
  followUpMsg?: any,
) {
  const testUsers = getTestUsers()

  const embed = new EmbedBuilder()
    .setColor(0x9b59b6)
    .setTitle('🤖 테스트 유저 관리')
    .setTimestamp()

  if (testUsers.length === 0) {
    embed.setDescription(
      '등록된 테스트 유저가 없습니다.\n`/admin testsetup`으로 생성하세요.',
    )
  } else {
    const lines = testUsers.map((u, i) => {
      const party = getParty(u.user_id)
      const partyText =
        party.length > 0
          ? party
              .map((cid) => {
                const c = characterMap.get(cid)
                return c ? `${c.emoji}` : cid
              })
              .join('')
          : '(파티 없음)'
      return `**${i + 1}.** \`${u.user_id}\` — **${u.username}** | 💰${u.gold}G | ${partyText}`
    })
    embed.setDescription(lines.join('\n'))
  }

  // Build user select menu if there are test users
  const rows: ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[] = []

  if (testUsers.length > 0) {
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('tu_select_user')
      .setPlaceholder('관리할 테스트 유저를 선택하세요')
      .addOptions(
        testUsers.slice(0, 25).map((u) => ({
          label: `${u.username} (${u.user_id})`,
          value: u.user_id,
          description: `💰 ${u.gold}G`,
        })),
      )
    rows.push(
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu),
    )
  }

  const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('tu_create_new')
      .setLabel('➕ 새 테스트 유저 생성')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('tu_close')
      .setLabel('닫기')
      .setStyle(ButtonStyle.Secondary),
  )
  rows.push(buttonRow)

  const msgPayload = { embeds: [embed], components: rows }

  let response: any
  if (followUpMsg) {
    await followUpMsg.edit(msgPayload)
    response = followUpMsg
  } else {
    response = await interaction.reply({
      ...msgPayload,
      fetchReply: true,
    })
  }

  try {
    const collected = await response.awaitMessageComponent({
      filter: (i: any) => i.user.id === interaction.user.id,
      time: 120000,
    })

    if (collected.customId === 'tu_close') {
      await collected.update({
        embeds: [
          new EmbedBuilder()
            .setColor(0x808080)
            .setTitle('🤖 테스트 유저 관리 종료'),
        ],
        components: [],
      })
      return
    }

    if (collected.customId === 'tu_create_new') {
      await collected.deferUpdate()
      await createTestUser(interaction, response)
      return
    }

    if (collected.customId === 'tu_select_user') {
      const selectedId = collected.values[0]
      await collected.deferUpdate()
      await showUserDashboard(interaction, response, selectedId)
      return
    }
  } catch {
    await response
      .edit({
        embeds: [
          new EmbedBuilder()
            .setColor(0x808080)
            .setTitle('🤖 테스트 유저 관리 시간 초과'),
        ],
        components: [],
      })
      .catch(() => {})
  }
}

// ══════════════════════════════════════════════
//  Create Test User (quick setup)
// ══════════════════════════════════════════════

async function createTestUser(
  interaction: ChatInputCommandInteraction,
  response: any,
) {
  const guildId = interaction.guildId ?? ''
  const fakeId = `test_${Date.now()}`
  const testName = `TestUser_${getTestUsers().length + 1}`

  getOrCreatePlayer(fakeId, guildId, testName)

  const testCharacters = [
    { charId: 'baekho', weaponId: 'w5_baekho_fang' },
    { charId: 'cheongryong', weaponId: 'w5_cheongryong_horn' },
    { charId: 'seolhwa', weaponId: 'w5_seolhwa_branch' },
    { charId: 'gumiho', weaponId: 'w5_gumiho_orb' },
  ]

  // Level 60 XP
  const totalXp = (150 * (59 * 60)) / 2

  clearParty(fakeId)
  for (let i = 0; i < testCharacters.length; i++) {
    const { charId, weaponId } = testCharacters[i]
    addCharacter(fakeId, charId)
    addCharacterXp(fakeId, charId, totalXp)
    addWeapon(fakeId, weaponId)
    equipWeaponToCharacter(fakeId, weaponId, charId)
    setPartySlot(fakeId, i + 1, charId)
  }

  // Give gold
  db.prepare('UPDATE players SET gold = gold + 100000 WHERE user_id = ?').run(
    fakeId,
  )

  // Generate a set of basic relics for all characters
  for (const { charId } of testCharacters) {
    const slots: RelicSlot[] = ['head', 'hands', 'body', 'feet']
    for (const slot of slots) {
      const mainType =
        slot === 'head'
          ? 'hp_flat'
          : slot === 'hands'
            ? 'atk_flat'
            : slot === 'body'
              ? 'crit_rate'
              : 'atk_pct'
      const mainValue = getRelicMainStatValue(mainType, 0)
      const subStats = [
        { type: 'atk_pct', value: 0.03 },
        { type: 'crit_rate', value: 0.02 },
        { type: 'crit_dmg', value: 0.04 },
        { type: 'hp_pct', value: 0.03 },
      ]
      const relicId = addRelic(
        fakeId,
        'warrior',
        slot,
        mainType,
        mainValue,
        subStats,
        'epic',
      )
      equipRelic(fakeId, relicId, charId)
    }
  }

  // Return to dashboard
  await showUserDashboard(interaction, response, fakeId)
}

// ══════════════════════════════════════════════
//  User Dashboard — Main management screen
// ══════════════════════════════════════════════

async function showUserDashboard(
  interaction: ChatInputCommandInteraction,
  response: any,
  userId: string,
) {
  const player = db
    .prepare('SELECT * FROM players WHERE user_id = ?')
    .get(userId) as any
  if (!player) {
    await response.edit({
      embeds: [
        new EmbedBuilder()
          .setColor(0xe74c3c)
          .setDescription('❌ 유저를 찾을 수 없습니다.'),
      ],
      components: [],
    })
    return
  }

  const party = getParty(userId)
  const ownedChars = getOwnedCharacters(userId)
  const ownedWeapons = getOwnedWeapons(userId)
  const ownedRelics = getOwnedRelics(userId)

  // Party display
  const partyLines =
    party.length > 0
      ? party.map((cid, i) => {
          const c = characterMap.get(cid)
          const owned = ownedChars.find((o) => o.character_id === cid)
          const relics = getRelicsForCharacter(userId, cid)
          const relicText =
            relics.length > 0
              ? relics
                  .map((r) => {
                    const s = relicSetMap.get(r.set_id)
                    return `${s?.emoji ?? ''}${RELIC_SLOT_EMOJI[r.slot as RelicSlot] ?? ''}`
                  })
                  .join('')
              : '(유물 없음)'
          return `${i + 1}. ${c?.emoji ?? ''} **${c?.name ?? cid}** Lv.${owned?.level ?? '?'} 각성${owned?.awakening ?? 0} | ${relicText}`
        })
      : ['(파티 없음)']

  const embed = new EmbedBuilder()
    .setColor(0x9b59b6)
    .setTitle(`🤖 ${player.username} 관리`)
    .setDescription(
      `**ID:** \`${userId}\`\n` +
        `**💰 골드:** ${Number(player.gold).toLocaleString()}G\n\n` +
        `**파티:**\n${partyLines.join('\n')}\n\n` +
        `**보유:** 캐릭터 ${ownedChars.length}개 | 무기 ${ownedWeapons.length}개 | 유물 ${ownedRelics.length}개`,
    )
    .setTimestamp()

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`tu_party_${userId}`)
      .setLabel('👥 파티 편집')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`tu_char_${userId}`)
      .setLabel('🎭 캐릭터 추가')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`tu_relic_${userId}`)
      .setLabel('💎 유물 관리')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`tu_level_${userId}`)
      .setLabel('📈 레벨 변경')
      .setStyle(ButtonStyle.Secondary),
  )

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`tu_weapon_${userId}`)
      .setLabel('⚔️ 무기 추가')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`tu_pvp_${userId}`)
      .setLabel('⚔️ PVP 테스트')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`tu_delete_${userId}`)
      .setLabel('🗑️ 유저 삭제')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('tu_back_list')
      .setLabel('◀ 목록으로')
      .setStyle(ButtonStyle.Secondary),
  )

  await response.edit({ embeds: [embed], components: [row1, row2] })

  try {
    const collected = await response.awaitMessageComponent({
      filter: (i: any) => i.user.id === interaction.user.id,
      time: 120000,
    })
    await collected.deferUpdate()

    const cid = collected.customId

    if (cid === 'tu_back_list') {
      await showTestUserList(interaction, response)
      return
    }

    if (cid.startsWith('tu_party_')) {
      await showPartyEditor(interaction, response, userId)
      return
    }

    if (cid.startsWith('tu_char_')) {
      await showCharacterAdder(interaction, response, userId)
      return
    }

    if (cid.startsWith('tu_relic_')) {
      await showRelicManager(interaction, response, userId)
      return
    }

    if (cid.startsWith('tu_level_')) {
      await showLevelChanger(interaction, response, userId)
      return
    }

    if (cid.startsWith('tu_weapon_')) {
      await showWeaponAdder(interaction, response, userId)
      return
    }

    if (cid.startsWith('tu_pvp_')) {
      await startTestPvp(interaction, response, userId)
      return
    }

    if (cid.startsWith('tu_delete_')) {
      await deleteTestUser(interaction, response, userId)
      return
    }
  } catch {
    await response
      .edit({
        embeds: [
          new EmbedBuilder().setColor(0x808080).setTitle('🤖 시간 초과'),
        ],
        components: [],
      })
      .catch(() => {})
  }
}

// ══════════════════════════════════════════════
//  Party Editor
// ══════════════════════════════════════════════

async function showPartyEditor(
  interaction: ChatInputCommandInteraction,
  response: any,
  userId: string,
) {
  const party = getParty(userId)
  const ownedChars = getOwnedCharacters(userId)

  const partyText =
    party.length > 0
      ? party
          .map((cid, i) => {
            const c = characterMap.get(cid)
            const owned = ownedChars.find((o) => o.character_id === cid)
            return `${i + 1}. ${c?.emoji ?? ''} **${c?.name ?? cid}** Lv.${owned?.level ?? '?'}`
          })
          .join('\n')
      : '(파티 없음)'

  // Available characters not in party
  const availableChars = ownedChars.filter(
    (o) => !party.includes(o.character_id),
  )

  const embed = new EmbedBuilder()
    .setColor(0x3498db)
    .setTitle('👥 파티 편집')
    .setDescription(
      `**현재 파티:**\n${partyText}\n\n` +
        `사용 가능: ${availableChars.length}캐릭터`,
    )

  const rows: ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[] = []

  if (availableChars.length > 0 && party.length < 4) {
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('tu_party_add')
      .setPlaceholder('파티에 추가할 캐릭터 선택')
      .addOptions(
        availableChars.slice(0, 25).map((o) => {
          const c = characterMap.get(o.character_id)
          return {
            label: `${c?.name ?? o.character_id} Lv.${o.level}`,
            value: o.character_id,
            emoji: c?.emoji,
          }
        }),
      )
    rows.push(
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu),
    )
  }

  const btnRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('tu_party_clear')
      .setLabel('🗑️ 파티 초기화')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(party.length === 0),
    new ButtonBuilder()
      .setCustomId(`tu_dashboard_${userId}`)
      .setLabel('◀ 돌아가기')
      .setStyle(ButtonStyle.Secondary),
  )
  rows.push(btnRow)

  await response.edit({ embeds: [embed], components: rows })

  try {
    const collected = await response.awaitMessageComponent({
      filter: (i: any) => i.user.id === interaction.user.id,
      time: 120000,
    })
    await collected.deferUpdate()

    if (collected.customId === `tu_dashboard_${userId}`) {
      await showUserDashboard(interaction, response, userId)
      return
    }

    if (collected.customId === 'tu_party_clear') {
      clearParty(userId)
      await showPartyEditor(interaction, response, userId)
      return
    }

    if (collected.customId === 'tu_party_add') {
      const charId = collected.values[0]
      const currentParty = getParty(userId)
      setPartySlot(userId, currentParty.length + 1, charId)
      await showPartyEditor(interaction, response, userId)
      return
    }
  } catch {
    await showUserDashboard(interaction, response, userId)
  }
}

// ══════════════════════════════════════════════
//  Character Adder
// ══════════════════════════════════════════════

async function showCharacterAdder(
  interaction: ChatInputCommandInteraction,
  response: any,
  userId: string,
) {
  const ownedChars = getOwnedCharacters(userId)
  const ownedIds = new Set(ownedChars.map((o) => o.character_id))

  const embed = new EmbedBuilder()
    .setColor(0xe67e22)
    .setTitle('🎭 캐릭터 추가')
    .setDescription(
      `보유 캐릭터: ${ownedChars.length}개\n` +
        `추가할 캐릭터를 선택하세요 (5★ / 4★)`,
    )

  // Offer 5★ and 4★ characters not yet owned
  const available5 = allCharacters.filter(
    (c) => c.rarity === 5 && !ownedIds.has(c.id),
  )
  const available4 = allCharacters.filter(
    (c) => c.rarity === 4 && !ownedIds.has(c.id),
  )

  const allAvailable = [...available5, ...available4]
  const rows: ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[] = []

  if (allAvailable.length > 0) {
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('tu_char_add_select')
      .setPlaceholder('추가할 캐릭터 선택')
      .setMaxValues(Math.min(allAvailable.length, 10))
      .addOptions(
        allAvailable.slice(0, 25).map((c) => ({
          label: `${'⭐'.repeat(c.rarity === 5 ? 1 : 0)}${c.rarity}★ ${c.name}`,
          value: c.id,
          emoji: c.emoji,
          description: `${c.element} / ${c.path}`,
        })),
      )
    rows.push(
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu),
    )
  }

  rows.push(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`tu_dashboard_${userId}`)
        .setLabel('◀ 돌아가기')
        .setStyle(ButtonStyle.Secondary),
    ),
  )

  await response.edit({ embeds: [embed], components: rows })

  try {
    const collected = await response.awaitMessageComponent({
      filter: (i: any) => i.user.id === interaction.user.id,
      time: 120000,
    })
    await collected.deferUpdate()

    if (collected.customId === `tu_dashboard_${userId}`) {
      await showUserDashboard(interaction, response, userId)
      return
    }

    if (collected.customId === 'tu_char_add_select') {
      const charIds: string[] = collected.values
      for (const cid of charIds) {
        addCharacter(userId, cid)
        // Auto-level to 60
        const totalXp = (150 * (59 * 60)) / 2
        addCharacterXp(userId, cid, totalXp)
      }
      await showCharacterAdder(interaction, response, userId)
      return
    }
  } catch {
    await showUserDashboard(interaction, response, userId)
  }
}

// ══════════════════════════════════════════════
//  Weapon Adder
// ══════════════════════════════════════════════

async function showWeaponAdder(
  interaction: ChatInputCommandInteraction,
  response: any,
  userId: string,
) {
  const ownedWeaponList = getOwnedWeapons(userId)
  const ownedIds = new Set(ownedWeaponList.map((o) => o.weapon_id))

  const embed = new EmbedBuilder()
    .setColor(0xe67e22)
    .setTitle('⚔️ 무기 추가')
    .setDescription(
      `보유 무기: ${ownedWeaponList.length}개\n추가할 무기를 선택하세요.`,
    )

  const available = allWeapons.filter((w) => !ownedIds.has(w.id))
  const rows: ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[] = []

  if (available.length > 0) {
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('tu_weapon_add_select')
      .setPlaceholder('추가할 무기 선택')
      .setMaxValues(Math.min(available.length, 10))
      .addOptions(
        available.slice(0, 25).map((w) => ({
          label: `${w.rarity}★ ${w.name}`,
          value: w.id,
          emoji: w.emoji,
          description: `${w.path} / ATK+${w.baseATK}`,
        })),
      )
    rows.push(
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu),
    )
  }

  rows.push(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`tu_dashboard_${userId}`)
        .setLabel('◀ 돌아가기')
        .setStyle(ButtonStyle.Secondary),
    ),
  )

  await response.edit({ embeds: [embed], components: rows })

  try {
    const collected = await response.awaitMessageComponent({
      filter: (i: any) => i.user.id === interaction.user.id,
      time: 120000,
    })
    await collected.deferUpdate()

    if (collected.customId === `tu_dashboard_${userId}`) {
      await showUserDashboard(interaction, response, userId)
      return
    }

    if (collected.customId === 'tu_weapon_add_select') {
      const weaponIds: string[] = collected.values
      for (const wid of weaponIds) {
        addWeapon(userId, wid)
      }
      await showWeaponAdder(interaction, response, userId)
      return
    }
  } catch {
    await showUserDashboard(interaction, response, userId)
  }
}

// ══════════════════════════════════════════════
//  Level Changer
// ══════════════════════════════════════════════

async function showLevelChanger(
  interaction: ChatInputCommandInteraction,
  response: any,
  userId: string,
) {
  const ownedChars = getOwnedCharacters(userId)

  const embed = new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle('📈 캐릭터 레벨 변경')
    .setDescription('레벨을 변경할 캐릭터를 선택하세요.')

  const rows: ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[] = []

  if (ownedChars.length > 0) {
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('tu_level_char_select')
      .setPlaceholder('캐릭터 선택')
      .addOptions(
        ownedChars.slice(0, 25).map((o) => {
          const c = characterMap.get(o.character_id)
          return {
            label: `${c?.name ?? o.character_id} (현재 Lv.${o.level})`,
            value: o.character_id,
            emoji: c?.emoji,
          }
        }),
      )
    rows.push(
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu),
    )
  }

  rows.push(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('tu_level_all_max')
        .setLabel('⬆️ 전체 Lv.80')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('tu_level_all_60')
        .setLabel('📊 전체 Lv.60')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`tu_dashboard_${userId}`)
        .setLabel('◀ 돌아가기')
        .setStyle(ButtonStyle.Secondary),
    ),
  )

  await response.edit({ embeds: [embed], components: rows })

  try {
    const collected = await response.awaitMessageComponent({
      filter: (i: any) => i.user.id === interaction.user.id,
      time: 120000,
    })
    await collected.deferUpdate()

    if (collected.customId === `tu_dashboard_${userId}`) {
      await showUserDashboard(interaction, response, userId)
      return
    }

    if (collected.customId === 'tu_level_all_max') {
      for (const o of ownedChars) {
        const xpNeeded = (150 * (79 * 80)) / 2
        addCharacterXp(userId, o.character_id, xpNeeded)
      }
      await showUserDashboard(interaction, response, userId)
      return
    }

    if (collected.customId === 'tu_level_all_60') {
      for (const o of ownedChars) {
        const xpNeeded = (150 * (59 * 60)) / 2
        addCharacterXp(userId, o.character_id, xpNeeded)
      }
      await showUserDashboard(interaction, response, userId)
      return
    }

    if (collected.customId === 'tu_level_char_select') {
      const charId = collected.values[0]
      await showLevelOptions(interaction, response, userId, charId)
      return
    }
  } catch {
    await showUserDashboard(interaction, response, userId)
  }
}

async function showLevelOptions(
  interaction: ChatInputCommandInteraction,
  response: any,
  userId: string,
  charId: string,
) {
  const c = characterMap.get(charId)
  const owned = getOwnedCharacters(userId).find(
    (o) => o.character_id === charId,
  )

  const embed = new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle(`📈 ${c?.emoji ?? ''} ${c?.name ?? charId} 레벨 변경`)
    .setDescription(`현재 레벨: **Lv.${owned?.level ?? 1}**`)

  const levels = [1, 20, 40, 60, 70, 80]
  const btnRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    ...levels.map((lv) =>
      new ButtonBuilder()
        .setCustomId(`tu_setlv_${charId}_${lv}`)
        .setLabel(`Lv.${lv}`)
        .setStyle(
          owned?.level === lv ? ButtonStyle.Success : ButtonStyle.Secondary,
        ),
    ),
  )

  const backRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`tu_level_${userId}`)
      .setLabel('◀ 돌아가기')
      .setStyle(ButtonStyle.Secondary),
  )

  await response.edit({ embeds: [embed], components: [btnRow, backRow] })

  try {
    const collected = await response.awaitMessageComponent({
      filter: (i: any) => i.user.id === interaction.user.id,
      time: 120000,
    })
    await collected.deferUpdate()

    if (collected.customId === `tu_level_${userId}`) {
      await showLevelChanger(interaction, response, userId)
      return
    }

    if (collected.customId.startsWith('tu_setlv_')) {
      const parts = collected.customId.split('_')
      const targetLevel = parseInt(parts[parts.length - 1])
      // Reset level to 1 then add XP to reach target
      db.prepare(
        'UPDATE owned_characters SET level = 1, experience = 0 WHERE user_id = ? AND character_id = ?',
      ).run(userId, charId)
      if (targetLevel > 1) {
        const xpNeeded = (150 * ((targetLevel - 1) * targetLevel)) / 2
        addCharacterXp(userId, charId, xpNeeded)
      }
      await showLevelOptions(interaction, response, userId, charId)
      return
    }
  } catch {
    await showUserDashboard(interaction, response, userId)
  }
}

// ══════════════════════════════════════════════
//  Relic Manager
// ══════════════════════════════════════════════

async function showRelicManager(
  interaction: ChatInputCommandInteraction,
  response: any,
  userId: string,
) {
  const party = getParty(userId)
  const ownedChars = getOwnedCharacters(userId)

  const embed = new EmbedBuilder()
    .setColor(0xe91e63)
    .setTitle('💎 유물 관리')
    .setDescription('유물을 관리할 캐릭터를 선택하세요.')

  const chars = ownedChars.length > 0 ? ownedChars : []
  const rows: ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[] = []

  if (chars.length > 0) {
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('tu_relic_char_select')
      .setPlaceholder('캐릭터 선택')
      .addOptions(
        chars.slice(0, 25).map((o) => {
          const c = characterMap.get(o.character_id)
          const relics = getRelicsForCharacter(userId, o.character_id)
          return {
            label: `${c?.name ?? o.character_id} (유물 ${relics.length}/4)`,
            value: o.character_id,
            emoji: c?.emoji,
          }
        }),
      )
    rows.push(
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu),
    )
  }

  rows.push(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('tu_relic_gen_all')
        .setLabel('⚡ 전체 유물 자동 생성')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`tu_dashboard_${userId}`)
        .setLabel('◀ 돌아가기')
        .setStyle(ButtonStyle.Secondary),
    ),
  )

  await response.edit({ embeds: [embed], components: rows })

  try {
    const collected = await response.awaitMessageComponent({
      filter: (i: any) => i.user.id === interaction.user.id,
      time: 120000,
    })
    await collected.deferUpdate()

    if (collected.customId === `tu_dashboard_${userId}`) {
      await showUserDashboard(interaction, response, userId)
      return
    }

    if (collected.customId === 'tu_relic_gen_all') {
      // Generate epic relics for all owned characters
      for (const o of ownedChars) {
        const existing = getRelicsForCharacter(userId, o.character_id)
        const existingSlots = new Set(existing.map((r) => r.slot))
        const slots: RelicSlot[] = ['head', 'hands', 'body', 'feet']
        for (const slot of slots) {
          if (existingSlots.has(slot)) continue
          const mainType =
            slot === 'head'
              ? 'hp_flat'
              : slot === 'hands'
                ? 'atk_flat'
                : slot === 'body'
                  ? 'crit_rate'
                  : 'atk_pct'
          const mainValue = getRelicMainStatValue(mainType, 0)
          const subStats = [
            { type: 'atk_pct', value: 0.03 },
            { type: 'crit_rate', value: 0.02 },
            { type: 'crit_dmg', value: 0.04 },
            { type: 'hp_pct', value: 0.03 },
          ]
          const relicId = addRelic(
            userId,
            'warrior',
            slot,
            mainType,
            mainValue,
            subStats,
            'epic',
          )
          equipRelic(userId, relicId, o.character_id)
        }
      }
      await showRelicManager(interaction, response, userId)
      return
    }

    if (collected.customId === 'tu_relic_char_select') {
      const charId = collected.values[0]
      await showCharRelicEditor(interaction, response, userId, charId)
      return
    }
  } catch {
    await showUserDashboard(interaction, response, userId)
  }
}

async function showCharRelicEditor(
  interaction: ChatInputCommandInteraction,
  response: any,
  userId: string,
  charId: string,
) {
  const c = characterMap.get(charId)
  const relics = getRelicsForCharacter(userId, charId)

  const slots: RelicSlot[] = ['head', 'hands', 'body', 'feet']
  const slotLines = slots.map((slot) => {
    const relic = relics.find((r) => r.slot === slot)
    if (!relic)
      return `${RELIC_SLOT_EMOJI[slot]} **${RELIC_SLOT_NAMES[slot]}**: (비어있음)`
    const setDef = relicSetMap.get(relic.set_id)
    const subs: { type: string; value: number }[] = JSON.parse(relic.sub_stats)
    const subText = subs
      .map(
        (s) =>
          `${RELIC_STAT_NAMES[s.type as keyof typeof RELIC_STAT_NAMES] ?? s.type} ${formatStat(s.type, s.value)}`,
      )
      .join(', ')
    return (
      `${RELIC_SLOT_EMOJI[slot]} **${RELIC_SLOT_NAMES[slot]}**: ${setDef?.emoji ?? ''} ${setDef?.name ?? relic.set_id} +${relic.level}\n` +
      `  메인: ${RELIC_STAT_NAMES[relic.main_stat_type as keyof typeof RELIC_STAT_NAMES] ?? relic.main_stat_type} ${formatStat(relic.main_stat_type, relic.main_stat_value)}\n` +
      `  서브: ${subText}`
    )
  })

  const embed = new EmbedBuilder()
    .setColor(0xe91e63)
    .setTitle(`💎 ${c?.emoji ?? ''} ${c?.name ?? charId} 유물`)
    .setDescription(slotLines.join('\n\n'))

  // Set selection menu
  const setSelect = new StringSelectMenuBuilder()
    .setCustomId('tu_relic_set_select')
    .setPlaceholder('유물 세트 선택 (4세트 자동 장착)')
    .addOptions(
      RELIC_SETS.map((s) => ({
        label: `${s.name}`,
        value: s.id,
        emoji: s.emoji,
        description: `2세트: ${s.bonus2.slice(0, 50)}`,
      })),
    )

  const rows = [
    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(setSelect),
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('tu_relic_clear_char')
        .setLabel('🗑️ 유물 해제')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(relics.length === 0),
      new ButtonBuilder()
        .setCustomId(`tu_relic_${userId}`)
        .setLabel('◀ 돌아가기')
        .setStyle(ButtonStyle.Secondary),
    ),
  ]

  await response.edit({ embeds: [embed], components: rows })

  try {
    const collected = await response.awaitMessageComponent({
      filter: (i: any) => i.user.id === interaction.user.id,
      time: 120000,
    })
    await collected.deferUpdate()

    if (collected.customId === `tu_relic_${userId}`) {
      await showRelicManager(interaction, response, userId)
      return
    }

    if (collected.customId === 'tu_relic_clear_char') {
      for (const r of relics) {
        equipRelic(userId, r.id, null)
      }
      await showCharRelicEditor(interaction, response, userId, charId)
      return
    }

    if (collected.customId === 'tu_relic_set_select') {
      const setId = collected.values[0]
      // Remove existing equipped relics for this character
      for (const r of relics) {
        equipRelic(userId, r.id, null)
      }
      // Create 4-piece set with good stats
      const slotConfigs: {
        slot: RelicSlot
        mainType: string
      }[] = [
        { slot: 'head', mainType: 'hp_flat' },
        { slot: 'hands', mainType: 'atk_flat' },
        { slot: 'body', mainType: 'crit_rate' },
        { slot: 'feet', mainType: 'atk_pct' },
      ]
      for (const { slot, mainType } of slotConfigs) {
        const mainValue = getRelicMainStatValue(mainType, 12)
        const subStats = [
          { type: 'atk_pct', value: 0.06 },
          { type: 'crit_rate', value: 0.04 },
          { type: 'crit_dmg', value: 0.08 },
          { type: 'hp_pct', value: 0.06 },
        ]
        const relicId = addRelic(
          userId,
          setId,
          slot,
          mainType,
          mainValue,
          subStats,
          'epic',
        )
        equipRelic(userId, relicId, charId)
      }
      await showCharRelicEditor(interaction, response, userId, charId)
      return
    }
  } catch {
    await showUserDashboard(interaction, response, userId)
  }
}

function formatStat(type: string, value: number): string {
  if (type.endsWith('_pct') || type === 'crit_rate' || type === 'crit_dmg') {
    return `${(value * 100).toFixed(1)}%`
  }
  return `${Math.floor(value)}`
}

// ══════════════════════════════════════════════
//  Test PVP
// ══════════════════════════════════════════════

async function startTestPvp(
  interaction: ChatInputCommandInteraction,
  response: any,
  testUserId: string,
) {
  const testPlayer = db
    .prepare('SELECT username FROM players WHERE user_id = ?')
    .get(testUserId) as { username: string } | undefined
  if (!testPlayer) {
    await response.edit({
      embeds: [
        new EmbedBuilder()
          .setColor(0xe74c3c)
          .setDescription('❌ 테스트 유저를 찾을 수 없습니다.'),
      ],
      components: [],
    })
    return
  }

  const myParty = getParty(interaction.user.id)
  const testParty = getParty(testUserId)

  if (myParty.length === 0) {
    await response.edit({
      embeds: [
        new EmbedBuilder()
          .setColor(0xe74c3c)
          .setDescription(
            '❌ 내 파티가 비어있습니다! `/party set`으로 먼저 파티를 구성하세요.',
          ),
      ],
      components: [],
    })
    return
  }
  if (testParty.length === 0) {
    await response.edit({
      embeds: [
        new EmbedBuilder()
          .setColor(0xe74c3c)
          .setDescription(
            '❌ 테스트 유저의 파티가 비어있습니다! 먼저 파티를 편집하세요.',
          ),
      ],
      components: [],
    })
    return
  }

  // Show start message
  await response.edit({
    embeds: [
      new EmbedBuilder()
        .setColor(0xff4500)
        .setTitle('⚔️ PVP 테스트 시작!')
        .setDescription(
          `${interaction.user.toString()} ⚔️ → 🤖 **${testPlayer.username}**\n\n` +
            `🤖 *테스트 유저가 자동 수락! AI가 자동 플레이합니다.*`,
        ),
    ],
    components: [],
  })

  await runPvpBattle(
    interaction,
    interaction.user.id,
    testUserId,
    interaction.user.username,
    testPlayer.username,
    interaction.guildId!,
    0,
    true,
  )
}

// ══════════════════════════════════════════════
//  Delete Test User
// ══════════════════════════════════════════════

async function deleteTestUser(
  interaction: ChatInputCommandInteraction,
  response: any,
  userId: string,
) {
  const embed = new EmbedBuilder()
    .setColor(0xe74c3c)
    .setTitle('🗑️ 테스트 유저 삭제')
    .setDescription(
      `**\`${userId}\`**를 정말 삭제하시겠습니까?\n모든 데이터가 영구 삭제됩니다.`,
    )

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('tu_confirm_delete')
      .setLabel('삭제')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`tu_dashboard_${userId}`)
      .setLabel('취소')
      .setStyle(ButtonStyle.Secondary),
  )

  await response.edit({ embeds: [embed], components: [row] })

  try {
    const collected = await response.awaitMessageComponent({
      filter: (i: any) => i.user.id === interaction.user.id,
      time: 30000,
    })
    await collected.deferUpdate()

    if (collected.customId === `tu_dashboard_${userId}`) {
      await showUserDashboard(interaction, response, userId)
      return
    }

    if (collected.customId === 'tu_confirm_delete') {
      // Delete all data for this test user
      const tables = [
        'players',
        'owned_characters',
        'owned_weapons',
        'owned_relics',
        'parties',
        'inventory',
        'titles',
        'materials',
        'gacha_currency',
        'gacha_pity',
      ]
      for (const table of tables) {
        db.prepare(`DELETE FROM ${table} WHERE user_id = ?`).run(userId)
      }

      await showTestUserList(interaction, response)
      return
    }
  } catch {
    await showUserDashboard(interaction, response, userId)
  }
}
