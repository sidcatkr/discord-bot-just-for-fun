import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js'
import { pick } from '../../db/helpers.js'

export const data = new SlashCommandBuilder()
  .setName('who')
  .setDescription('🔍 오늘 가장 수상한 사람은...?')

const suspiciousReasons = [
  '프로필 사진이 너무 평화로워서 오히려 수상합니다',
  '마지막 메시지가 의미심장합니다...',
  '온라인 시간이 인간의 한계를 초월했습니다',
  '다크웹 접속 이력이... (농담)',
  '눈빛이 범상치 않습니다',
  '지금 이 순간에도 뭔가를 계획하고 있는 것 같습니다',
  '알고 보니 3개의 부계정을 가지고 있을 수도...',
  '서버 규칙을 너무 잘 지켜서 오히려 수상합니다',
  'DM으로 수상한 림크를 보냈을 가능성이 있습니다',
  '사실은 FBI 요원일 수 있습니다',
  '컴퓨터 앞에서 수상하게 웃고 있을 확률 89%',
  '지금 이 봇을 감시하고 있을 수도 있습니다',
]

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply()

  const guild = interaction.guild!
  const members = await guild.members.fetch()
  const humanMembers = [...members.filter((m) => !m.user.bot).values()]

  if (humanMembers.length === 0) {
    await interaction.editReply({
      content: '수상한 사람이 없습니다... 오히려 그게 수상합니다.',
    })
    return
  }

  const suspect = humanMembers[Math.floor(Math.random() * humanMembers.length)]
  const reason = pick(suspiciousReasons)
  const suspicionLevel = Math.floor(Math.random() * 40) + 60

  const embed = new EmbedBuilder()
    .setColor(0xe74c3c)
    .setTitle('🔍 수상한 사람 탐지기')
    .setThumbnail(suspect.user.displayAvatarURL())
    .setDescription(
      `오늘 가장 수상한 사람은...\n\n` +
        `## 🚨 **${suspect.user.username}** 🚨\n\n` +
        `📋 이유: *${reason}*\n` +
        `⚠️ 의심 레벨: ${'🔴'.repeat(Math.ceil(suspicionLevel / 20))} **${suspicionLevel}%**`,
    )
    .setFooter({ text: '이 결과는 아무 근거도 없습니다' })
    .setTimestamp()

  await interaction.editReply({ embeds: [embed] })
}
