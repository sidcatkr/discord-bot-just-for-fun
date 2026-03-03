import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js'
import { pick, random } from '../../db/helpers.js'

export const data = new SlashCommandBuilder()
  .setName('predict')
  .setDescription('🎱 질문에 대한 예언을 받는다!')
  .addStringOption((opt) =>
    opt
      .setName('question')
      .setDescription('질문을 입력하세요')
      .setRequired(true),
  )

const predictions = [
  // Positive
  { answer: '그렇다 ✅', emoji: '✅', color: 0x2ecc71 },
  { answer: '당연하지! 🎉', emoji: '🎉', color: 0x2ecc71 },
  { answer: '100% 확실합니다 💯', emoji: '💯', color: 0x2ecc71 },
  { answer: '별이 그렇다고 말하고 있어요 ⭐', emoji: '⭐', color: 0x2ecc71 },
  { answer: '의심할 여지없이 YES 🙌', emoji: '🙌', color: 0x2ecc71 },

  // Neutral
  { answer: '글쎄요... 🤔', emoji: '🤔', color: 0xf39c12 },
  { answer: '나중에 다시 물어보세요 🔄', emoji: '🔄', color: 0xf39c12 },
  { answer: '대답하기 어렵네요... 😶', emoji: '😶', color: 0xf39c12 },
  { answer: '50:50입니다 ⚖️', emoji: '⚖️', color: 0xf39c12 },
  { answer: '지금은 알 수 없습니다 🌫️', emoji: '🌫️', color: 0xf39c12 },

  // Negative
  { answer: '아니오 ❌', emoji: '❌', color: 0xe74c3c },
  { answer: '절대 안 됩니다 🚫', emoji: '🚫', color: 0xe74c3c },
  { answer: '꿈에서도 안 됩니다 💀', emoji: '💀', color: 0xe74c3c },
  { answer: '포기하세요... 😢', emoji: '😢', color: 0xe74c3c },
  { answer: '그건 불가능합니다 🌑', emoji: '🌑', color: 0xe74c3c },

  // Chaotic
  {
    answer: '에러: 미래를 불러오는 데 실패했습니다 🐛',
    emoji: '🐛',
    color: 0x9b59b6,
  },
  { answer: '감자가 대신 대답합니다: 🥔', emoji: '🥔', color: 0x9b59b6 },
  {
    answer: '질문이 너무 위험해서 답변을 거부합니다 ⚠️',
    emoji: '⚠️',
    color: 0x9b59b6,
  },
]

export async function execute(interaction: ChatInputCommandInteraction) {
  const question = interaction.options.getString('question', true)
  const prediction = pick(predictions)

  const embed = new EmbedBuilder()
    .setColor(prediction.color)
    .setTitle('🎱 마법의 8볼')
    .addFields(
      { name: '❓ 질문', value: question },
      { name: `${prediction.emoji} 답변`, value: `**${prediction.answer}**` },
    )
    .setFooter({ text: '이 예언의 정확도는 보장할 수 없습니다' })
    .setTimestamp()

  await interaction.reply({ embeds: [embed] })
}
