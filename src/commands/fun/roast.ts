import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js'
import { pick, random } from '../../db/helpers.js'

export const data = new SlashCommandBuilder()
  .setName('roast')
  .setDescription('🔥 누군가를 로스트(디스)한다!')
  .addUserOption((opt) =>
    opt.setName('target').setDescription('로스트할 대상').setRequired(true),
  )

const roasts = [
  (t: string) => `${t}의 코딩 실력은 console.log("hello") 수준입니다`,
  (t: string) => `${t}은(는) 구글 검색 결과 2페이지 같은 존재입니다`,
  (t: string) => `${t}의 패션 센스는 2003년에 멈춰있습니다`,
  (t: string) => `${t}은(는) WiFi 없으면 존재하지 않는 사람입니다`,
  (t: string) => `${t}의 유머 감각은 404 Not Found입니다`,
  (t: string) => `${t}은(는) NPC보다 대화가 재미없습니다`,
  (t: string) => `${t}의 반응속도는 인터넷 익스플로러 수준입니다`,
  (t: string) => `${t}은(는) 서버 채팅에 읽씹만 하는 유령회원입니다`,
  (t: string) => `${t}의 게임 실력은 튜토리얼에서 막히는 수준입니다`,
  (t: string) => `${t}은(는) 팝업 광고보다 존재감이 없습니다`,
  (t: string) => `${t}은(는) 알람 10개 맞춰도 못 일어나는 타입입니다`,
  (t: string) => `${t}의 요리 실력은 물도 태우는 수준입니다`,
  (t: string) => `${t}은(는) 길치인데 GPS도 길을 잃을 정도입니다`,
  (t: string) => `${t}의 운동 실력은 계단 3층에 숨이 차는 수준입니다`,
  (t: string) => `${t}은(는) 갈등 상황에서 항상 풀 대신 가위를 냅니다`,
  (t: string) => `${t}은(는) ChatGPT한테 "고마워" 라고 말하는 타입입니다`,
  (t: string) => `${t}의 git commit 메시지: "ㅇㅇ"`,
  (t: string) => `${t}은(는) 코드 리뷰에서 "LGTM" 만 다는 사람입니다`,
  (t: string) => `${t}의 비밀번호는 password1234입니다`,
  (t: string) => `${t}은(는) 스택오버플로우 복붙 장인입니다`,
  (t: string) => `${t}은(는) 와이파이 끊기면 인생도 끊기는 타입입니다`,
  (t: string) => `${t}은(는) 노래방에서 92점이 최고 기록입니다`,
  (t: string) => `${t}의 카톡 프사는 2019년 것입니다`,
  (t: string) => `${t}은(는) "읽씹 아니고 바빴어" 라고 매번 말합니다`,
  (t: string) => `${t}은(는) Ctrl+Z 인생을 살고 있습니다`,
  (t: string) => `${t}은(는) 디시인사이드 정치 갤러리 출신입니다`,
  (t: string) => `${t}의 매력은 비트코인처럼 폭락 중입니다`,
  (t: string) => `${t}은(는) 잠을 자도 피곤한 체질입니다 (존재 자체가 피로)`,
  (t: string) => `${t}의 인생 그래프는 우하향 일직선입니다`,
  (t: string) => `${t}은(는) 가챠에서 커먼만 뽑는 저주에 걸렸습니다`,
  (t: string) =>
    `${t}은(는) "아 ㅋㅋ 그거 내가 원래 알고 있었는데" 라고 매번 말합니다`,
]

export async function execute(interaction: ChatInputCommandInteraction) {
  const target = interaction.options.getUser('target', true)

  if (target.id === interaction.user.id) {
    await interaction.reply({
      content: '🪞 자기 디스는 너무 슬프니까... 다른 사람을 골라주세요!',
      ephemeral: true,
    })
    return
  }

  const roast = pick(roasts)(target.toString())
  const burnLevel = random(1, 5)

  const embed = new EmbedBuilder()
    .setColor(0xff4500)
    .setTitle('🔥 ROAST! 🔥')
    .setDescription(
      `${roast}\n\n` +
        `화상 등급: ${'🔥'.repeat(burnLevel)}${'💨'.repeat(5 - burnLevel)}`,
    )
    .setFooter({ text: '장난이니까 진지하게 받아들이지 마세요 💕' })
    .setTimestamp()

  await interaction.reply({ embeds: [embed] })
}
