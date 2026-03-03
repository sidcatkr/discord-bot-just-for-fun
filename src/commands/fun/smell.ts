import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js'
import { pick, random } from '../../db/helpers.js'

export const data = new SlashCommandBuilder()
  .setName('smell')
  .setDescription('💨 누군가의 냄새를 맡는다!')
  .addUserOption((opt) =>
    opt.setName('target').setDescription('냄새 맡을 대상').setRequired(true),
  )

const smellGrades = [
  { grade: '전설급', emoji: '💀', color: 0x8b0000, range: [90, 100] },
  { grade: '영웅급', emoji: '🤮', color: 0xe74c3c, range: [70, 89] },
  { grade: '희귀급', emoji: '😷', color: 0xf39c12, range: [50, 69] },
  { grade: '일반', emoji: '😐', color: 0x95a5a6, range: [30, 49] },
  { grade: '청정', emoji: '😊', color: 0x2ecc71, range: [10, 29] },
  { grade: '천상의 향기', emoji: '✨', color: 0xff69b4, range: [0, 9] },
]

const smellDescriptions: Record<string, string[]> = {
  전설급: [
    '화학 무기로 분류됩니다',
    '반경 5km 이내 생명체가 소멸합니다',
    '환경부에서 조사 나올 예정입니다',
    '이 냄새는 전쟁 범죄에 해당합니다',
  ],
  영웅급: [
    '쓰레기장의 왕입니다',
    '코가 자동으로 폐업합니다',
    '3일 안 씻은 양말 × 100',
  ],
  희귀급: [
    '좀 특이한 냄새가 납니다...',
    '지하철 6호차 냄새와 유사합니다',
    '야, 좀 씻어라...',
  ],
  일반: [
    '평범한 인간 냄새입니다',
    '딱히 좋지도 나쁘지도 않습니다',
    '무취에 가까운 존재감',
  ],
  청정: ['오 깨끗하네요!', '방금 샤워하고 온 것 같습니다', '비누 향기가 솔솔~'],
  '천상의 향기': [
    '신이 내린 향기입니다',
    '지나가면 꽃이 핍니다',
    '향수 회사에서 계약하고 싶어합니다',
    '이 냄새를 맡으면 HP가 회복됩니다',
  ],
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const target = interaction.options.getUser('target', true)

  const intensity = random(0, 100)
  const gradeInfo = smellGrades.find(
    (g) => intensity >= g.range[0] && intensity <= g.range[1],
  )!

  const description = pick(smellDescriptions[gradeInfo.grade])

  const smellBar =
    '💨'.repeat(Math.ceil(intensity / 10)) +
    '🌸'.repeat(Math.max(0, 10 - Math.ceil(intensity / 10)))

  const embed = new EmbedBuilder()
    .setColor(gradeInfo.color)
    .setTitle('💨 냄새 감정기')
    .setThumbnail(target.displayAvatarURL())
    .setDescription(
      `${target.toString()}의 냄새 측정 결과:\n\n` +
        `## ${gradeInfo.emoji} 등급: **${gradeInfo.grade}**\n\n` +
        `악취 지수: **${intensity}%**\n` +
        `${smellBar}\n\n` +
        `*${description}*`,
    )
    .setFooter({ text: '이 봇은 실제 냄새를 맡을 수 없습니다 (다행히도)' })
    .setTimestamp()

  await interaction.reply({ embeds: [embed] })
}
