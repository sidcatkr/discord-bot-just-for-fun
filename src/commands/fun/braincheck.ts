import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js'
import { pick, random } from '../../db/helpers.js'

export const data = new SlashCommandBuilder()
  .setName('braincheck')
  .setDescription('🧠 누군가의 지능을 측정한다!')
  .addUserOption((opt) =>
    opt.setName('target').setDescription('측정할 대상').setRequired(true),
  )

const lowIQComments = [
  '🦠 뇌 세포가 멸종 위기입니다',
  '🥔 감자보다 낮은 IQ...',
  '🪨 돌멩이와 대화하는 게 더 생산적일 수 있습니다',
  '🐟 금붕어보다 기억력이 나쁠 수 있습니다',
  '📉 주식보다 빨리 하락하는 지능',
]

const midIQComments = [
  '😐 평범한 인간 수준입니다',
  '🤔 가끔 천재적인 발상을 하지만... 가끔만요',
  '📊 AI보다는 낫지만 많이는 아닙니다',
  '🧮 덧셈은 잘합니다 아마...',
]

const highIQComments = [
  '🧠 아인슈타인이 무덤에서 인정합니다',
  '🌟 NASA에서 스카우트 제의가 올 수도 있습니다',
  '👑 이 서버의 두뇌 담당!',
  '🔬 과학적 사고의 정수!',
]

const negativeIQComments = [
  '💀 음수 IQ는 의학적으로 불가능한데... 기록 갱신!',
  '🕳️ 블랙홀보다 지능이 어둡습니다',
  '☠️ 뇌가 반대로 작동하고 있습니다',
]

export async function execute(interaction: ChatInputCommandInteraction) {
  const target = interaction.options.getUser('target', true)

  // Weighted random: most results are funny-low
  let iq: number
  const roll = Math.random() * 100
  if (roll < 5)
    iq = random(-50, -1) // 5% negative
  else if (roll < 50)
    iq = random(1, 30) // 45% very low
  else if (roll < 80)
    iq = random(31, 80) // 30% mid
  else if (roll < 95)
    iq = random(81, 130) // 15% normal-high
  else iq = random(131, 300) // 5% genius

  let comment: string
  let color: number
  if (iq < 0) {
    comment = pick(negativeIQComments)
    color = 0x000000
  } else if (iq <= 30) {
    comment = pick(lowIQComments)
    color = 0xe74c3c
  } else if (iq <= 100) {
    comment = pick(midIQComments)
    color = 0xf39c12
  } else {
    comment = pick(highIQComments)
    color = 0x2ecc71
  }

  const brainBar =
    iq > 0
      ? '🧠'.repeat(Math.min(10, Math.ceil(iq / 30))) +
        '💀'.repeat(Math.max(0, 10 - Math.ceil(iq / 30)))
      : '💀'.repeat(10)

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle('🧠 지능 측정기')
    .setThumbnail(target.displayAvatarURL())
    .setDescription(
      `${target.toString()}의 지능 측정 결과:\n\n` +
        `## IQ: **${iq}**\n\n` +
        `${brainBar}\n\n` +
        `*${comment}*`,
    )
    .setFooter({ text: '이 결과는 100% 비과학적입니다' })
    .setTimestamp()

  await interaction.reply({ embeds: [embed] })
}
