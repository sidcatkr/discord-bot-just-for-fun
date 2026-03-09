import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ComponentType,
} from 'discord.js'
import {
  getOrCreatePlayer,
  isPlayerDead,
  pick,
  sleep,
  getUserFortune,
  getGachaCurrency,
  addStellarite,
  addStandardPass,
  addFatePass,
  addStardust,
  addFateToken,
  spendCurrency,
  getBannerPity,
  incrementBannerPity,
  resetBannerPity,
  setGuaranteed,
  getActiveBanner,
  addCharacter,
  addWeapon,
} from '../../db/helpers.js'
import {
  allCharacters,
  fiveStarPool,
  fourStarPool,
  characterMap,
  elementEmoji,
  pathEmoji,
  starRarityColors,
  starRarityLabels,
  type CharacterTemplate,
} from '../../data/characters.js'
import {
  allWeapons,
  fiveStarWeaponPool,
  fourStarWeaponPool,
  threeStarWeaponPool,
  weaponMap,
  type WeaponTemplate,
} from '../../data/weapons.js'

// Prevent concurrent rolls
const rollingUsers = new Set<string>()

// ── Banner types ──
type BannerType = 'standard' | 'character' | 'weapon'

// ── Pity constants ──
const HARD_PITY = 90
const SOFT_PITY_START = 74
const BASE_5STAR_RATE = 0.006 // 0.6%
const SOFT_PITY_INCREMENT = 0.06 // +6% per pull after 74

// ── Currency costs ──
const STELLARITE_PER_PASS = 160
const STELLARITE_PER_FATE = 160

// ── Stardust per pull rarity ──
const STARDUST_PER_RARITY: Record<number, number> = {
  3: 15,
  4: 40,
  5: 100,
}

function get5StarRate(pityCount: number, bonusRate: number): number {
  if (pityCount >= HARD_PITY - 1) return 1.0 // hard pity
  if (pityCount >= SOFT_PITY_START) {
    return Math.min(
      1.0,
      BASE_5STAR_RATE +
        (pityCount - SOFT_PITY_START + 1) * SOFT_PITY_INCREMENT +
        bonusRate,
    )
  }
  return BASE_5STAR_RATE + bonusRate
}

interface GachaResult {
  type: 'character' | 'weapon'
  id: string
  name: string
  emoji: string
  rarity: 3 | 4 | 5
  isFeatured: boolean
  pitied: boolean
  won5050: boolean | null // null if not applicable
}

function rollBanner(userId: string, bannerType: BannerType): GachaResult {
  const fortune = getUserFortune(userId)
  const bonusRate =
    bannerType === 'weapon'
      ? (fortune?.weapon_gacha_bonus ?? 0) / 100
      : (fortune?.character_gacha_bonus ?? fortune?.gacha_bonus ?? 0) / 100

  const pity = getBannerPity(userId, bannerType)
  const currentPity = incrementBannerPity(userId, bannerType)
  const rate5 = get5StarRate(currentPity - 1, bonusRate)

  const roll = Math.random()

  if (bannerType === 'standard') {
    return rollStandard(userId, roll, rate5)
  } else if (bannerType === 'character') {
    return rollCharacterPickup(userId, roll, rate5)
  } else {
    return rollWeaponPickup(userId, roll, rate5)
  }
}

function rollStandard(
  userId: string,
  roll: number,
  rate5: number,
): GachaResult {
  if (roll < rate5) {
    // 5★ — 50% character, 50% weapon
    resetBannerPity(userId, 'standard')
    if (Math.random() < 0.5) {
      const char = pick(fiveStarPool)
      return {
        type: 'character',
        id: char.id,
        name: char.name,
        emoji: char.emoji,
        rarity: 5,
        isFeatured: false,
        pitied: rate5 >= 1,
        won5050: null,
      }
    } else {
      const wpn = pick(fiveStarWeaponPool)
      return {
        type: 'weapon',
        id: wpn.id,
        name: wpn.name,
        emoji: wpn.emoji,
        rarity: 5,
        isFeatured: false,
        pitied: rate5 >= 1,
        won5050: null,
      }
    }
  } else if (roll < rate5 + 0.051) {
    // 4★ (5.1%) — 50% character, 50% weapon
    if (Math.random() < 0.5) {
      const char = pick(fourStarPool)
      return {
        type: 'character',
        id: char.id,
        name: char.name,
        emoji: char.emoji,
        rarity: 4,
        isFeatured: false,
        pitied: false,
        won5050: null,
      }
    } else {
      const wpn = pick(fourStarWeaponPool)
      return {
        type: 'weapon',
        id: wpn.id,
        name: wpn.name,
        emoji: wpn.emoji,
        rarity: 4,
        isFeatured: false,
        pitied: false,
        won5050: null,
      }
    }
  } else {
    // 3★ weapon
    const wpn = pick(threeStarWeaponPool)
    return {
      type: 'weapon',
      id: wpn.id,
      name: wpn.name,
      emoji: wpn.emoji,
      rarity: 3,
      isFeatured: false,
      pitied: false,
      won5050: null,
    }
  }
}

function rollCharacterPickup(
  userId: string,
  roll: number,
  rate5: number,
): GachaResult {
  const banner = getActiveBanner('character')

  if (roll < rate5) {
    // 5★ hit!
    resetBannerPity(userId, 'character')
    const pityInfo = getBannerPity(userId, 'character')

    let char: CharacterTemplate
    let won5050: boolean

    if (pityInfo.guaranteed && banner) {
      // Guaranteed featured
      char = characterMap.get(banner.featured_id) ?? pick(fiveStarPool)
      setGuaranteed(userId, 'character', false)
      won5050 = true
    } else {
      // 50/50
      if (Math.random() < 0.5 && banner) {
        char = characterMap.get(banner.featured_id) ?? pick(fiveStarPool)
        won5050 = true
      } else {
        char = pick(fiveStarPool)
        won5050 = false
        if (banner) setGuaranteed(userId, 'character', true)
      }
    }

    return {
      type: 'character',
      id: char.id,
      name: char.name,
      emoji: char.emoji,
      rarity: 5,
      isFeatured: won5050 && !!banner,
      pitied: rate5 >= 1,
      won5050,
    }
  } else if (roll < rate5 + 0.051) {
    // 4★ — check for featured uprate
    if (banner && banner.featured_4star_ids.length > 0 && Math.random() < 0.5) {
      const featuredId = pick(banner.featured_4star_ids)
      const char = characterMap.get(featuredId) ?? pick(fourStarPool)
      return {
        type: 'character',
        id: char.id,
        name: char.name,
        emoji: char.emoji,
        rarity: 4,
        isFeatured: true,
        pitied: false,
        won5050: null,
      }
    }
    const char = pick(fourStarPool)
    return {
      type: 'character',
      id: char.id,
      name: char.name,
      emoji: char.emoji,
      rarity: 4,
      isFeatured: false,
      pitied: false,
      won5050: null,
    }
  } else {
    const wpn = pick(threeStarWeaponPool)
    return {
      type: 'weapon',
      id: wpn.id,
      name: wpn.name,
      emoji: wpn.emoji,
      rarity: 3,
      isFeatured: false,
      pitied: false,
      won5050: null,
    }
  }
}

function rollWeaponPickup(
  userId: string,
  roll: number,
  rate5: number,
): GachaResult {
  const banner = getActiveBanner('weapon')

  if (roll < rate5) {
    // 5★ weapon
    resetBannerPity(userId, 'weapon')
    const pityInfo = getBannerPity(userId, 'weapon')

    let wpn: WeaponTemplate
    let won5050: boolean

    if (pityInfo.guaranteed && banner) {
      wpn = weaponMap.get(banner.featured_id) ?? pick(fiveStarWeaponPool)
      setGuaranteed(userId, 'weapon', false)
      won5050 = true
    } else {
      if (Math.random() < 0.75 && banner) {
        wpn = weaponMap.get(banner.featured_id) ?? pick(fiveStarWeaponPool)
        won5050 = true
      } else {
        wpn = pick(fiveStarWeaponPool)
        won5050 = false
        if (banner) setGuaranteed(userId, 'weapon', true)
      }
    }

    return {
      type: 'weapon',
      id: wpn.id,
      name: wpn.name,
      emoji: wpn.emoji,
      rarity: 5,
      isFeatured: won5050 && !!banner,
      pitied: rate5 >= 1,
      won5050,
    }
  } else if (roll < rate5 + 0.051) {
    if (banner && banner.featured_4star_ids.length > 0 && Math.random() < 0.5) {
      const featuredId = pick(banner.featured_4star_ids)
      const wpn = weaponMap.get(featuredId) ?? pick(fourStarWeaponPool)
      return {
        type: 'weapon',
        id: wpn.id,
        name: wpn.name,
        emoji: wpn.emoji,
        rarity: 4,
        isFeatured: true,
        pitied: false,
        won5050: null,
      }
    }
    const wpn = pick(fourStarWeaponPool)
    return {
      type: 'weapon',
      id: wpn.id,
      name: wpn.name,
      emoji: wpn.emoji,
      rarity: 4,
      isFeatured: false,
      pitied: false,
      won5050: null,
    }
  } else {
    const wpn = pick(threeStarWeaponPool)
    return {
      type: 'weapon',
      id: wpn.id,
      name: wpn.name,
      emoji: wpn.emoji,
      rarity: 3,
      isFeatured: false,
      pitied: false,
      won5050: null,
    }
  }
}

function addResultToAccount(userId: string, result: GachaResult): string {
  // Award stardust per pull
  const dust = STARDUST_PER_RARITY[result.rarity] ?? 15
  addStardust(userId, dust)

  // Award fate token on lost 50/50
  if (result.won5050 === false) {
    addFateToken(userId, 1)
  }

  if (result.type === 'character') {
    const res = addCharacter(userId, result.id)
    if (res.isNew) return `🆕 새 캐릭터! | ✨여광 +${dust}`
    return `각성 ${res.awakening}단계 돌파! | ✨여광 +${dust}`
  } else {
    const res = addWeapon(userId, result.id)
    if (res.isNew) return `🆕 새 무기! | ✨여광 +${dust}`
    return `정련 ${res.refinement}단계! | ✨여광 +${dust}`
  }
}

function formatResult(result: GachaResult, index?: number): string {
  const stars = '⭐'.repeat(result.rarity)
  const prefix = index !== undefined ? `${index + 1}. ` : ''
  const featured = result.isFeatured ? ' **[UP]**' : ''
  const pity = result.pitied ? ' 🛡️천장' : ''
  const fiftyfifty =
    result.won5050 === true
      ? ' ✅50/50'
      : result.won5050 === false
        ? ' ❌픽뚫'
        : ''
  return `${prefix}${result.emoji} **${result.name}** ${stars}${featured}${pity}${fiftyfifty}`
}

export const data = new SlashCommandBuilder()
  .setName('gacha')
  .setDescription('🎰 소환을 합니다!')
  .addStringOption((opt) =>
    opt
      .setName('banner')
      .setDescription('배너 선택')
      .setRequired(true)
      .addChoices(
        { name: '🌟 일반 소환 (별빛의 인연)', value: 'standard' },
        { name: '🔥 캐릭터 픽업 (운명의 인연)', value: 'character' },
        { name: '⚔️ 무기 픽업 (운명의 인연)', value: 'weapon' },
      ),
  )
  .addIntegerOption((opt) =>
    opt
      .setName('count')
      .setDescription('소환 횟수')
      .addChoices(
        { name: '1회 소환', value: 1 },
        { name: '10연차', value: 10 },
      ),
  )

export async function execute(interaction: ChatInputCommandInteraction) {
  const user = interaction.user
  const bannerType = interaction.options.getString('banner', true) as BannerType
  const count = interaction.options.getInteger('count') ?? 1

  const userKey = user.id
  if (rollingUsers.has(userKey)) {
    await interaction.reply({
      content: '🎰 이미 소환 중입니다! 잠시만 기다려주세요.',
      ephemeral: true,
    })
    return
  }

  if (isPlayerDead(user.id, interaction.guildId!)) {
    await interaction.reply({
      content: '💀 HP가 0입니다! `/heal`로 회복하세요.',
      ephemeral: true,
    })
    return
  }

  // Check currency
  const currency = getGachaCurrency(user.id)
  const currencyField =
    bannerType === 'standard' ? 'standard_pass' : 'fate_pass'
  const currencyName = bannerType === 'standard' ? '별빛의 인연' : '운명의 인연'
  const currencyEmoji = bannerType === 'standard' ? '🎫' : '🌟'

  if (currency[currencyField] < count) {
    // Try to convert stellarite
    const needed = count - currency[currencyField]
    const stellariteCost =
      needed *
      (bannerType === 'standard' ? STELLARITE_PER_PASS : STELLARITE_PER_FATE)
    if (currency.stellarite >= stellariteCost) {
      spendCurrency(user.id, 'stellarite', stellariteCost)
      if (bannerType === 'standard') addStandardPass(user.id, needed)
      else addFatePass(user.id, needed)
    } else {
      await interaction.reply({
        content:
          `${currencyEmoji} ${currencyName}이(가) 부족합니다! (보유: ${currency[currencyField]}장, 성광석: ${currency.stellarite}개)\n` +
          `성광석 ${STELLARITE_PER_PASS}개 = ${currencyName} 1장\n\`/daily\`로 성광석을 모으세요!`,
        ephemeral: true,
      })
      return
    }
  }

  // Spend currency
  spendCurrency(user.id, currencyField, count)
  rollingUsers.add(userKey)

  try {
    const bannerInfo =
      bannerType !== 'standard' ? getActiveBanner(bannerType) : null
    const bannerTitle =
      bannerType === 'standard'
        ? '🌟 일반 소환'
        : bannerType === 'character'
          ? `🔥 캐릭터 픽업 — ${bannerInfo ? (characterMap.get(bannerInfo.featured_id)?.name ?? '???') : '미설정'}`
          : `⚔️ 무기 픽업 — ${bannerInfo ? (weaponMap.get(bannerInfo.featured_id)?.name ?? '???') : '미설정'}`

    if (count === 10) {
      // ══════════ 10-pull ══════════
      const loadEmbed = new EmbedBuilder()
        .setColor(0xffd700)
        .setTitle(`${bannerTitle}`)
        .setDescription('> ✨✨✨✨✨✨✨✨✨✨\n\n**10연차 소환 중...**')
      await interaction.reply({ embeds: [loadEmbed] })
      await sleep(2000)

      const results: GachaResult[] = []
      for (let i = 0; i < 10; i++) {
        results.push(rollBanner(user.id, bannerType))
      }

      // Add to account
      const extraInfo: string[] = []
      for (const r of results) {
        extraInfo.push(addResultToAccount(user.id, r))
      }

      // Build result
      const bestRarity = Math.max(...results.map((r) => r.rarity))
      const resultLines = results
        .map((r, i) => {
          const info = extraInfo[i]
          return `${formatResult(r, i)} — *${info}*`
        })
        .join('\n')

      // Count by rarity
      const r5 = results.filter((r) => r.rarity === 5).length
      const r4 = results.filter((r) => r.rarity === 4).length
      const r3 = results.filter((r) => r.rarity === 3).length

      const finalEmbed = new EmbedBuilder()
        .setColor(starRarityColors[bestRarity] ?? 0x808080)
        .setTitle(`${bannerTitle} — 10연차 결과!`)
        .setDescription(resultLines)
        .addFields({
          name: '📊 등급 요약',
          value:
            [
              r5 ? `⭐⭐⭐⭐⭐ ×${r5}` : '',
              r4 ? `⭐⭐⭐⭐ ×${r4}` : '',
              r3 ? `⭐⭐⭐ ×${r3}` : '',
            ]
              .filter(Boolean)
              .join(' | ') || '없음',
        })

      if (r5 > 0) {
        finalEmbed.addFields({
          name: '🎊 대박!',
          value: `**5성이 ${r5}개 나왔습니다!!!**`,
        })
      } else if (r4 === 0) {
        finalEmbed.addFields({
          name: '😭',
          value: '10연차에서 4성도 못 뽑았습니다... 위로합니다.',
        })
      }

      const updatedCurrency = getGachaCurrency(user.id)
      const pityInfo = getBannerPity(user.id, bannerType)
      finalEmbed
        .setFooter({
          text: `성광석: ${updatedCurrency.stellarite} | ${currencyName}: ${updatedCurrency[currencyField]}장 | 여광: ${updatedCurrency.stardust} | 선택의 증표: ${updatedCurrency.fate_token} | 천장: ${pityInfo.pity_count}/${HARD_PITY}${pityInfo.guaranteed ? ' (확정)' : ''}`,
        })
        .setTimestamp()

      // Dramatic reveal
      const glowEmbed = new EmbedBuilder()
        .setColor(starRarityColors[bestRarity] ?? 0xffd700)
        .setTitle(`${bannerTitle}`)
        .setDescription(
          bestRarity === 5
            ? '> 🌟🌟🌟 금빛이 쏟아진다...!'
            : bestRarity === 4
              ? '> 💜💜💜 보랏빛이 빛난다...!'
              : '> ⬜⬜⬜ ...',
        )
      await interaction.editReply({ embeds: [glowEmbed] })
      await sleep(2000)

      await interaction.editReply({ embeds: [finalEmbed] })
    } else {
      // ══════════ Single pull ══════════
      const loadEmbed = new EmbedBuilder()
        .setColor(0x2c2f33)
        .setTitle(`${bannerTitle}`)
        .setDescription('> 🎰 🎲 🃏 ✨\n\n**소환 중...**')
      await interaction.reply({ embeds: [loadEmbed] })
      await sleep(1500)

      const result = rollBanner(user.id, bannerType)
      const info = addResultToAccount(user.id, result)

      // Glow
      const glowEmbed = new EmbedBuilder()
        .setColor(starRarityColors[result.rarity] ?? 0x808080)
        .setTitle(`${bannerTitle}`)
        .setDescription(
          result.rarity === 5
            ? '> 🌟🌟🌟 금빛이 터진다...!'
            : result.rarity === 4
              ? '> 💜💜💜 보라색 빛이...!'
              : '> ⬜⬜⬜ ...',
        )
      await interaction.editReply({ embeds: [glowEmbed] })
      await sleep(1500)

      // Reveal
      const stars = '⭐'.repeat(result.rarity)
      const desc = [
        `${result.emoji} **${result.name}**`,
        `등급: ${stars} ${starRarityLabels[result.rarity] ?? ''}`,
        result.isFeatured ? '**🔥 픽업 대상!**' : '',
        result.won5050 === false
          ? '❌ **50/50 실패 (픽뚫)** — 다음 5성은 확정! 선택의 증표 +1'
          : '',
        result.won5050 === true ? '✅ **50/50 성공!**' : '',
        '',
        `📦 ${info}`,
      ]
        .filter(Boolean)
        .join('\n')

      const finalEmbed = new EmbedBuilder()
        .setColor(starRarityColors[result.rarity] ?? 0x808080)
        .setTitle(`${bannerTitle} — 결과!`)
        .setDescription(desc)

      if (result.rarity === 5) {
        finalEmbed.addFields({
          name: '🎊 축하합니다!',
          value: `**5성 ${result.type === 'character' ? '캐릭터' : '무기'} 획득!**`,
        })
      } else if (result.rarity === 3) {
        const sadMsgs = [
          '🗑️ 이거 분해하면 뭐가 나오나요?',
          '💀 성광석이 아깝다...',
          '📉 소환은 도박이고 도박은 패가망신입니다.',
          '🤡 확률은 거짓말을 하지 않습니다.',
          '🪦 여기 당신의 성광석이 잠들어 있습니다.',
        ]
        finalEmbed.addFields({ name: '😢', value: pick(sadMsgs) })
      }

      const updatedCurrency = getGachaCurrency(user.id)
      const pityInfo = getBannerPity(user.id, bannerType)
      finalEmbed
        .setFooter({
          text: `성광석: ${updatedCurrency.stellarite} | ${currencyName}: ${updatedCurrency[currencyField]}장 | 여광: ${updatedCurrency.stardust} | 선택의 증표: ${updatedCurrency.fate_token} | 천장: ${pityInfo.pity_count}/${HARD_PITY}${pityInfo.guaranteed ? ' (확정)' : ''}`,
        })
        .setTimestamp()

      await interaction.editReply({ embeds: [finalEmbed] })
    }
  } finally {
    rollingUsers.delete(userKey)
  }
}
