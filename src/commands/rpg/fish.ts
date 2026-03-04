import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js'
import {
  getOrCreatePlayer,
  addGold,
  addFish,
  addIslandXp,
  addTitle,
  getIslandBuilding,
  getOrCreateIsland,
  pick,
  sleep,
} from '../../db/helpers.js'
import {
  rollFish,
  fishRarityLabels,
  fishRarityColors,
} from '../../data/fish-data.js'

export const data = new SlashCommandBuilder()
  .setName('fish')
  .setDescription('🎣 낚시를 합니다!')

const fishingMessages = [
  '찌를 던졌습니다...',
  '물 위에 찌가 떠 있습니다...',
  '조용히 기다리는 중...',
  '뭔가 움직이는 것 같은데...',
]

const biteMessages = [
  '🔔 입질이 왔다!',
  '🔔 찌가 흔들린다!',
  '🔔 뭔가 걸렸다!',
  '🔔 강한 손맛!',
]

export async function execute(interaction: ChatInputCommandInteraction) {
  const user = interaction.user
  const guildId = interaction.guildId!

  getOrCreatePlayer(user.id, guildId, user.username)
  const island = getOrCreateIsland(user.id, guildId)
  const fishingSpot = getIslandBuilding(user.id, guildId, 'fishing_spot')
  const spotLevel = fishingSpot?.building_level ?? 1

  // ── Phase 1: 낚시 시작 ──
  const embed1 = new EmbedBuilder()
    .setColor(0x1e90ff)
    .setTitle('🎣 낚시 중...')
    .setDescription(
      `> 🌊 ～～～🎣\n\n` +
        `**${pick(fishingMessages)}**\n` +
        `낚시터 레벨: ⭐ ${spotLevel}`,
    )
  await interaction.reply({ embeds: [embed1] })

  await sleep(2000)

  // ── Phase 2: 입질 ──
  const embed2 = new EmbedBuilder()
    .setColor(0xff6b35)
    .setTitle('🎣 낚시 중...')
    .setDescription(`> 🌊 ～💥～🎣\n\n` + `**${pick(biteMessages)}**`)
  await interaction.editReply({ embeds: [embed2] })

  await sleep(1500)

  // ── Phase 3: 결과 ──
  const result = rollFish(spotLevel)
  const { fish, size, value } = result

  addFish(user.id, guildId, {
    fish_name: fish.name,
    fish_rarity: fish.rarity,
    fish_emoji: fish.emoji,
    fish_size: size,
    fish_value: value,
  })

  addGold(user.id, guildId, value)
  const leveledUp = addIslandXp(user.id, guildId, 10)

  const sizeText = size >= 1000 ? `${(size / 100).toFixed(1)}m` : `${size}cm`

  const resultEmbed = new EmbedBuilder()
    .setColor(fishRarityColors[fish.rarity])
    .setTitle('🎣 낚시 결과!')
    .setDescription(
      `${fish.emoji} **${fish.name}**\n` +
        `등급: ${fishRarityLabels[fish.rarity]}\n` +
        `크기: **${sizeText}**\n` +
        `판매가: **${value}G** 💰\n\n` +
        `> *${fish.description}*`,
    )

  if (fish.rarity === 'legendary' || fish.rarity === 'mythic') {
    resultEmbed.addFields({
      name: '🎊 대어다!!!',
      value:
        fish.rarity === 'mythic'
          ? '🌟 **신화급 물고기!!!** 이건 박제해야 합니다!'
          : '✨ **전설급 물고기!** 대단한 낚시 실력!',
    })
    if (fish.rarity === 'mythic') {
      addTitle(user.id, guildId, '🎣 전설의 낚시왕')
    }
  }

  if (fish.rarity === 'common' && value <= 5) {
    const sadFish = [
      '🗑️ 이걸 팔 수 있긴 한 건가...',
      '😐 차라리 놓아줄걸...',
      '💀 시간 낭비...',
    ]
    resultEmbed.addFields({ name: '😢', value: pick(sadFish) })
  }

  if (leveledUp) {
    resultEmbed.addFields({
      name: '🏝️ 섬 레벨 업!',
      value: `섬이 레벨 ${island.island_level + 1}로 성장했습니다!`,
    })
  }

  resultEmbed.setFooter({
    text: `낚시터 레벨: ⭐${spotLevel} | +${value}G | 섬 경험치 +10`,
  })
  resultEmbed.setTimestamp()

  await interaction.editReply({ embeds: [resultEmbed] })
}
