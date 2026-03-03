import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js'
import { pick } from '../../db/helpers.js'

export const data = new SlashCommandBuilder()
  .setName('judge')
  .setDescription('⚖️ 오늘의 누군가를 심판한다!')
  .addUserOption((opt) =>
    opt.setName('target').setDescription('심판할 대상 (비워두면 랜덤)'),
  )

const judgments = [
  '서버 빌런 🦹',
  '숨겨진 보스 👑',
  '서버의 양심 😇',
  '공식 광대 🤡',
  '미래의 대통령 🏛️',
  '치킨집 사장 🍗',
  '전생에 고양이 🐱',
  '인간 알람시계 ⏰',
  '서버 엄마 👩‍🍳',
  '프로 자는 사람 😴',
  '공식 먹보 🍔',
  '숨겨진 천재 🧠',
  '공식 NPC 🤖',
  '소셜 미디어 중독자 📱',
  '비밀 부자 💰',
  '서버의 귀여움 담당 🐹',
  '미확인 생명체 👽',
  '프로 눈치 0단 😶',
  '인간 랜덤 박스 📦',
  '서버 최종 병기 💣',
  '사실은 AI 🤖',
  '전설의 감자 🥔',
  '서버의 배신자 예비군 🐍',
  '공식 리액션 장인 😂',
  '24시간 온라인러 💻',
]

export async function execute(interaction: ChatInputCommandInteraction) {
  const target = interaction.options.getUser('target') ?? interaction.user

  const judgment = pick(judgments)
  const confidence = Math.floor(Math.random() * 40) + 60

  const embed = new EmbedBuilder()
    .setColor(0xe67e22)
    .setTitle('⚖️ 오늘의 심판')
    .setThumbnail(target.displayAvatarURL())
    .setDescription(
      `오늘의 ${target.toString()}은(는)...\n\n` +
        `## **"${judgment}"**\n\n` +
        `📊 정확도: ${confidence}%`,
    )
    .setFooter({ text: '이 결과는 100% 과학적으로 검증되었습니다 (아님)' })
    .setTimestamp()

  await interaction.reply({ embeds: [embed] })
}
