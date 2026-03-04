import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js'
import { applyStatusEffect, getOrCreatePlayer, pick } from '../../db/helpers.js'

export const data = new SlashCommandBuilder()
  .setName('npc')
  .setDescription('🤖 랜덤으로 아무 유저를 NPC로 만든다!')

const npcTypes = [
  {
    name: '마을 촌장',
    emoji: '👴',
    dialogue: '이 마을에 오신 것을 환영합니다, 용사여...',
  },
  {
    name: '수상한 상인',
    emoji: '🧙',
    dialogue: '좋은 물건이 있는데... 관심 있나?',
  },
  {
    name: '길막 NPC',
    emoji: '🚧',
    dialogue: '여긴 아직 개발 중이라 못 지나간다.',
  },
  {
    name: '퀘스트 NPC',
    emoji: '❗',
    dialogue: '용사여! 이 서버에 몬스터가 출몰했다!',
  },
  {
    name: '도구 상점 점원',
    emoji: '🏪',
    dialogue: '어서오세요~ 뭘 사시겠어요?',
  },
  {
    name: '쓸데없는 NPC',
    emoji: '🧑',
    dialogue: '....... (아무 말도 하지 않는다)',
  },
  {
    name: '반복 대사 NPC',
    emoji: '🔄',
    dialogue: '나는 유어 가이 맨! 나는 유어 가이 맨! 나는 유어 가이...',
  },
  {
    name: '버그 NPC',
    emoji: '🐛',
    dialogue: 'ERROR: dialogue.txt not found ||||||||',
  },
  {
    name: '최종 보스',
    emoji: '👿',
    dialogue: '후후후... 드디어 만났구나, 용사여.',
  },
  {
    name: '치킨집 사장',
    emoji: '🍗',
    dialogue: '양념으로 하시겠어요, 후라이드로 하시겠어요?',
  },
  {
    name: '튜토리얼 가이드',
    emoji: '📖',
    dialogue: '안녕하세요! 움직이려면 WASD를 눌러보세요!',
  },
  {
    name: '잠자는 경비원',
    emoji: '😴',
    dialogue: 'Zzz... Zzz... (아무도 못 막는다)',
  },
  {
    name: '고양이',
    emoji: '🐱',
    dialogue: '야옹. (인간의 말을 이해하지 못한다)',
  },
  {
    name: '떠돌이 음유시인',
    emoji: '🎵',
    dialogue: '♪ 이 서버에 평화가 깃들기를~ ♪',
  },
]

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply()

  const guild = interaction.guild!
  const humanMembers = [
    ...guild.members.cache.filter((m) => !m.user.bot).values(),
  ]

  if (humanMembers.length === 0) {
    await interaction.editReply({ content: 'NPC로 만들 사람이 없습니다!' })
    return
  }

  const victim = humanMembers[Math.floor(Math.random() * humanMembers.length)]
  const npc = pick(npcTypes)

  const guildId = interaction.guildId!
  getOrCreatePlayer(victim.id, guildId, victim.user.username)
  applyStatusEffect(victim.id, guildId, 'npc', 60) // NPC for 60 seconds

  const embed = new EmbedBuilder()
    .setColor(0x9b59b6)
    .setTitle('🤖 NPC 변환 완료!')
    .setThumbnail(victim.user.displayAvatarURL())
    .setDescription(
      `${victim.toString()}이(가) NPC가 되었습니다!\n\n` +
        `**직업:** ${npc.emoji} ${npc.name}\n\n` +
        `💬 *"${npc.dialogue}"*\n\n` +
        `⏱️ 60초 후 인간으로 복귀합니다...`,
    )
    .setFooter({ text: 'NPC 상태에서는 전투/행동이 제한될 수 있습니다' })
    .setTimestamp()

  await interaction.editReply({ embeds: [embed] })
}
