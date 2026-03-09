import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ComponentType,
} from 'discord.js'
import {
  getGachaCurrency,
  addStandardPass,
  addFatePass,
  spendCurrency,
  addCharacter,
  getShopPurchaseCount,
  recordShopPurchase,
  getOwnedCharacter,
} from '../../db/helpers.js'
import {
  fiveStarPool,
  characterMap,
  elementEmoji,
  pathEmoji,
  type CharacterTemplate,
} from '../../data/characters.js'

// ── Shop Items ──

interface ShopItem {
  key: string
  name: string
  emoji: string
  description: string
  cost: number
  costCurrency: 'stardust' | 'fate_token'
  maxPerMonth: number
}

const STARDUST_SHOP: ShopItem[] = [
  {
    key: 'standard_pass',
    name: '별빛의 인연',
    emoji: '🎫',
    description: '일반 소환에 사용',
    cost: 75,
    costCurrency: 'stardust',
    maxPerMonth: 5,
  },
  {
    key: 'fate_pass',
    name: '운명의 인연',
    emoji: '🌟',
    description: '캐릭터/무기 픽업 소환에 사용',
    cost: 100,
    costCurrency: 'stardust',
    maxPerMonth: 5,
  },
]

const FATE_TOKEN_COST = 5 // 선택의 증표 5개로 5성 캐릭터 1명

export const data = new SlashCommandBuilder()
  .setName('shop')
  .setDescription('🏪 상점 — 여광/선택의 증표로 아이템 교환')
  .addStringOption((opt) =>
    opt
      .setName('category')
      .setDescription('상점 카테고리')
      .addChoices(
        { name: '✨ 여광 상점 (소환권 교환)', value: 'stardust' },
        { name: '🎯 선택의 증표 (5성 캐릭터 지명 소환)', value: 'fate_token' },
      ),
  )

export async function execute(interaction: ChatInputCommandInteraction) {
  const category = interaction.options.getString('category')
  const user = interaction.user
  const currency = getGachaCurrency(user.id)

  if (!category) {
    // Show overview
    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle('🏪 상점')
      .setDescription(
        `보유 재화:\n` +
          `✨ **여광**: ${currency.stardust}개\n` +
          `🎯 **선택의 증표**: ${currency.fate_token}개\n\n` +
          `\`/shop stardust\` — 여광으로 소환권 교환 (매월 리셋)\n` +
          `\`/shop fate_token\` — 선택의 증표로 5성 캐릭터 지명 소환`,
      )
      .setFooter({
        text: '여광: 가챠를 돌리면 획득 | 선택의 증표: 50/50 실패시 획득',
      })
      .setTimestamp()
    await interaction.reply({ embeds: [embed] })
    return
  }

  if (category === 'stardust') {
    await handleStardustShop(interaction, currency)
  } else {
    await handleFateTokenShop(interaction, currency)
  }
}

async function handleStardustShop(
  interaction: ChatInputCommandInteraction,
  currency: ReturnType<typeof getGachaCurrency>,
) {
  const user = interaction.user
  const lines: string[] = []

  for (const item of STARDUST_SHOP) {
    const bought = getShopPurchaseCount(user.id, item.key)
    const remaining = item.maxPerMonth - bought
    lines.push(
      `${item.emoji} **${item.name}** — ${item.cost} 여광\n` +
        `> ${item.description}\n` +
        `> 남은 구매 횟수: **${remaining}/${item.maxPerMonth}** (30일 리셋)`,
    )
  }

  const options = STARDUST_SHOP.map((item) => {
    const bought = getShopPurchaseCount(user.id, item.key)
    const remaining = item.maxPerMonth - bought
    return {
      label: `${item.name} (${item.cost} 여광)`,
      description: `남은: ${remaining}/${item.maxPerMonth}`,
      value: item.key,
      emoji: item.emoji,
    }
  })

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('shop_stardust')
    .setPlaceholder('구매할 아이템 선택...')
    .addOptions(options)

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    selectMenu,
  )

  const embed = new EmbedBuilder()
    .setColor(0xffd700)
    .setTitle('✨ 여광 상점')
    .setDescription(
      `✨ 보유 여광: **${currency.stardust}**개\n\n${lines.join('\n\n')}`,
    )
    .setFooter({
      text: '여광은 가챠를 돌리면 획득됩니다 (3★: 15, 4★: 40, 5★: 100)',
    })
    .setTimestamp()

  const response = await interaction.reply({
    embeds: [embed],
    components: [row],
    fetchReply: true,
  })

  try {
    const selection = await response.awaitMessageComponent({
      componentType: ComponentType.StringSelect,
      filter: (i) => i.user.id === user.id,
      time: 30000,
    })
    await selection.deferUpdate()

    const selectedKey = selection.values[0]
    const item = STARDUST_SHOP.find((i) => i.key === selectedKey)!
    const bought = getShopPurchaseCount(user.id, item.key)

    if (bought >= item.maxPerMonth) {
      const failEmbed = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle('❌ 구매 실패')
        .setDescription(
          `${item.emoji} **${item.name}**은(는) 이번 달 구매 한도에 도달했습니다!`,
        )
      await interaction.editReply({ embeds: [failEmbed], components: [] })
      return
    }

    const updated = getGachaCurrency(user.id)
    if (updated.stardust < item.cost) {
      const failEmbed = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle('❌ 여광 부족')
        .setDescription(
          `필요: ${item.cost} 여광 | 보유: ${updated.stardust} 여광`,
        )
      await interaction.editReply({ embeds: [failEmbed], components: [] })
      return
    }

    spendCurrency(user.id, 'stardust', item.cost)
    if (selectedKey === 'standard_pass') {
      addStandardPass(user.id, 1)
    } else {
      addFatePass(user.id, 1)
    }
    recordShopPurchase(user.id, item.key, 1)

    const final = getGachaCurrency(user.id)
    const successEmbed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle('✅ 구매 완료!')
      .setDescription(
        `${item.emoji} **${item.name}** ×1 획득!\n\n` +
          `✨ 여광: ${final.stardust}개\n` +
          `🎫 별빛의 인연: ${final.standard_pass}장\n` +
          `🌟 운명의 인연: ${final.fate_pass}장`,
      )
      .setTimestamp()
    await interaction.editReply({ embeds: [successEmbed], components: [] })
  } catch {
    await interaction.editReply({ components: [] })
  }
}

async function handleFateTokenShop(
  interaction: ChatInputCommandInteraction,
  currency: ReturnType<typeof getGachaCurrency>,
) {
  const user = interaction.user

  // Show available 5★ characters
  const charOptions = fiveStarPool
    .slice(0, 25)
    .map((char: CharacterTemplate) => {
      const owned = getOwnedCharacter(user.id, char.id)
      return {
        label: `${char.name} (${owned ? `각성 ${owned.awakening}` : '미보유'})`,
        description: `${char.element} / ${char.path}`,
        value: char.id,
        emoji: char.emoji,
      }
    })

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('shop_fate_token')
    .setPlaceholder('지명 소환할 캐릭터 선택...')
    .addOptions(charOptions)

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    selectMenu,
  )

  const embed = new EmbedBuilder()
    .setColor(0xff6b6b)
    .setTitle('🎯 선택의 증표 상점')
    .setDescription(
      `🎯 보유 선택의 증표: **${currency.fate_token}**개\n` +
        `필요량: **${FATE_TOKEN_COST}**개\n\n` +
        `50/50에서 패배할 때마다 선택의 증표 1개를 얻습니다.\n` +
        `${FATE_TOKEN_COST}개를 모으면 원하는 5성 캐릭터를 직접 선택할 수 있습니다!\n\n` +
        `아래에서 원하는 캐릭터를 선택하세요.`,
    )
    .setFooter({ text: '픽뚫의 슬픔을 보상으로 바꾸세요!' })
    .setTimestamp()

  const response = await interaction.reply({
    embeds: [embed],
    components: [row],
    fetchReply: true,
  })

  try {
    const selection = await response.awaitMessageComponent({
      componentType: ComponentType.StringSelect,
      filter: (i) => i.user.id === user.id,
      time: 30000,
    })
    await selection.deferUpdate()

    const charId = selection.values[0]
    const char = characterMap.get(charId)
    if (!char) {
      await interaction.editReply({
        content: '❌ 캐릭터를 찾을 수 없습니다.',
        embeds: [],
        components: [],
      })
      return
    }

    const updated = getGachaCurrency(user.id)
    if (updated.fate_token < FATE_TOKEN_COST) {
      const failEmbed = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle('❌ 선택의 증표 부족')
        .setDescription(
          `필요: ${FATE_TOKEN_COST}개 | 보유: ${updated.fate_token}개`,
        )
      await interaction.editReply({ embeds: [failEmbed], components: [] })
      return
    }

    spendCurrency(user.id, 'fate_token', FATE_TOKEN_COST)
    const result = addCharacter(user.id, charId)

    const successEmbed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle('🎯 지명 소환 성공!')
      .setDescription(
        `${char.emoji} **${char.name}** ⭐⭐⭐⭐⭐\n` +
          `${elementEmoji[char.element]} ${char.element} | ${pathEmoji[char.path]} ${char.path}\n\n` +
          (result.isNew
            ? '🆕 **새 캐릭터 획득!**'
            : `각성 ${result.awakening}단계 돌파!`) +
          `\n\n🎯 남은 선택의 증표: ${updated.fate_token - FATE_TOKEN_COST}개`,
      )
      .setTimestamp()
    await interaction.editReply({ embeds: [successEmbed], components: [] })
  } catch {
    await interaction.editReply({ components: [] })
  }
}
