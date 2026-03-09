import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from 'discord.js'
import {
  getOrCreatePlayer,
  addGold,
  addXp,
  addStellarite,
  isPlayerDead,
  pick,
  random,
} from '../../db/helpers.js'

export const data = new SlashCommandBuilder()
  .setName('quiz')
  .setDescription('🧠 퀴즈를 풀어 골드를 벌자!')

interface QuizQuestion {
  question: string
  choices: string[]
  answer: number // 0-indexed
  difficulty: 'easy' | 'medium' | 'hard'
}

const questions: QuizQuestion[] = [
  // Easy
  {
    question: '한국의 수도는?',
    choices: ['서울', '부산', '대구', '인천'],
    answer: 0,
    difficulty: 'easy',
  },
  {
    question: '1 + 1 = ?',
    choices: ['1', '2', '3', '11'],
    answer: 1,
    difficulty: 'easy',
  },
  {
    question: '물의 화학식은?',
    choices: ['CO2', 'H2O', 'NaCl', 'O2'],
    answer: 1,
    difficulty: 'easy',
  },
  {
    question: '태양계에서 가장 큰 행성은?',
    choices: ['지구', '화성', '목성', '토성'],
    answer: 2,
    difficulty: 'easy',
  },
  {
    question: '한글을 창제한 왕은?',
    choices: ['태종', '세종대왕', '성종', '영조'],
    answer: 1,
    difficulty: 'easy',
  },
  {
    question: '사과의 영어 단어는?',
    choices: ['Banana', 'Orange', 'Apple', 'Grape'],
    answer: 2,
    difficulty: 'easy',
  },
  {
    question: '대한민국의 국기 이름은?',
    choices: ['일장기', '태극기', '오성홍기', '유니언잭'],
    answer: 1,
    difficulty: 'easy',
  },
  {
    question: '1년은 몇 개월인가?',
    choices: ['10개월', '11개월', '12개월', '13개월'],
    answer: 2,
    difficulty: 'easy',
  },
  {
    question: '가장 빠른 동물은?',
    choices: ['사자', '치타', '말', '독수리'],
    answer: 1,
    difficulty: 'easy',
  },
  {
    question: '피자의 원산지는?',
    choices: ['미국', '프랑스', '이탈리아', '독일'],
    answer: 2,
    difficulty: 'easy',
  },

  // Medium
  {
    question: '광복절은 몇 월 며칠인가?',
    choices: ['3월 1일', '6월 25일', '8월 15일', '10월 3일'],
    answer: 2,
    difficulty: 'medium',
  },
  {
    question: '원주율(π)의 소수점 두 번째 자리까지는?',
    choices: ['3.12', '3.14', '3.16', '3.18'],
    answer: 1,
    difficulty: 'medium',
  },
  {
    question: '한국 전쟁이 발발한 연도는?',
    choices: ['1945년', '1948년', '1950년', '1953년'],
    answer: 2,
    difficulty: 'medium',
  },
  {
    question: 'CSS에서 글자 색을 바꾸는 속성은?',
    choices: ['font-color', 'text-color', 'color', 'font-style'],
    answer: 2,
    difficulty: 'medium',
  },
  {
    question: 'JavaScript에서 배열의 길이를 구하는 속성은?',
    choices: ['.size', '.length', '.count', '.len'],
    answer: 1,
    difficulty: 'medium',
  },
  {
    question: '가장 가벼운 원소는?',
    choices: ['헬륨', '수소', '리튬', '탄소'],
    answer: 1,
    difficulty: 'medium',
  },
  {
    question: '조선의 마지막 왕은?',
    choices: ['고종', '순종', '영친왕', '헌종'],
    answer: 1,
    difficulty: 'medium',
  },
  {
    question: '비트코인을 만든 사람(닉네임)은?',
    choices: [
      '일론 머스크',
      '사토시 나카모토',
      '비탈릭 부테린',
      '찰스 호스킨슨',
    ],
    answer: 1,
    difficulty: 'medium',
  },
  {
    question: 'git에서 변경사항을 저장하는 명령어는?',
    choices: ['git save', 'git commit', 'git push', 'git store'],
    answer: 1,
    difficulty: 'medium',
  },
  {
    question: '인체에서 가장 큰 장기는?',
    choices: ['심장', '뇌', '간', '피부'],
    answer: 3,
    difficulty: 'medium',
  },

  // Hard
  {
    question: '빛의 속도는 약 초속 몇 km인가?',
    choices: ['10만 km', '20만 km', '30만 km', '40만 km'],
    answer: 2,
    difficulty: 'hard',
  },
  {
    question: 'HTTP 상태코드 418의 의미는?',
    choices: ['Not Found', "I'm a teapot", 'Forbidden', 'Bad Request'],
    answer: 1,
    difficulty: 'hard',
  },
  {
    question: '세계에서 가장 깊은 바다는?',
    choices: ['대서양', '인도양', '태평양 마리아나 해구', '북극해'],
    answer: 2,
    difficulty: 'hard',
  },
  {
    question: 'TypeScript의 개발사는?',
    choices: ['Google', 'Facebook', 'Microsoft', 'Apple'],
    answer: 2,
    difficulty: 'hard',
  },
  {
    question: 'NP-완전 문제를 처음 정의한 사람은?',
    choices: ['앨런 튜링', '스티븐 쿡', '도널드 크누스', '존 폰 노이만'],
    answer: 1,
    difficulty: 'hard',
  },
  {
    question: '대한민국 헌법 제1조 1항의 내용은?',
    choices: [
      '대한민국은 민주공화국이다',
      '대한민국의 주권은 국민에게 있다',
      '모든 국민은 인간으로서의 존엄과 가치를 가진다',
      '대한민국은 통일을 지향한다',
    ],
    answer: 0,
    difficulty: 'hard',
  },
  {
    question: '유클리드 호제법은 무엇을 구하는 알고리즘인가?',
    choices: ['최소공배수', '최대공약수', '소인수분해', '소수 판별'],
    answer: 1,
    difficulty: 'hard',
  },
  {
    question: 'Discord 봇의 기본 게이트웨이 인텐트 중 하나가 아닌 것은?',
    choices: ['Guilds', 'GuildMembers', 'MessageContent', 'UserPresence'],
    answer: 3,
    difficulty: 'hard',
  },
  {
    question: 'Linux에서 파일 권한 "755"의 의미는?',
    choices: [
      '소유자 읽기만',
      '모두 전체권한',
      '소유자 전체, 나머지 읽기+실행',
      '소유자 읽기+쓰기',
    ],
    answer: 2,
    difficulty: 'hard',
  },
  {
    question: 'SHA-256 해시의 출력 길이는?',
    choices: ['128비트', '256비트', '512비트', '1024비트'],
    answer: 1,
    difficulty: 'hard',
  },
]

const difficultyRewards: Record<
  string,
  { gold: [number, number]; xp: [number, number] }
> = {
  easy: { gold: [30, 80], xp: [5, 15] },
  medium: { gold: [80, 200], xp: [15, 35] },
  hard: { gold: [200, 500], xp: [30, 70] },
}

const difficultyLabels: Record<string, string> = {
  easy: '🟢 쉬움',
  medium: '🟡 보통',
  hard: '🔴 어려움',
}

const difficultyColors: Record<string, number> = {
  easy: 0x2ecc71,
  medium: 0xf39c12,
  hard: 0xe74c3c,
}

const correctMessages = [
  '🎉 정답! 똑똑하시네요!',
  '✅ 맞았습니다! 천재인가요?',
  '🧠 두뇌 풀가동! 정답!',
  '📚 공부 좀 했군요! 정답!',
  '💡 빛나는 지성! 정답입니다!',
  '🏆 퀴즈왕의 자질이 보입니다!',
]

const wrongMessages = [
  '❌ 틀렸습니다! 다음에 도전하세요!',
  '😅 아쉽네요... 정답은 다른 거였습니다!',
  '📖 공부가 더 필요합니다!',
  '🤔 거의 맞출 뻔했는데... 아쉽!',
  '💀 이건 좀 어려웠죠... (변명)',
  '🫠 뇌가 과부하 걸렸습니다...',
]

const quizUsers = new Set<string>()

export async function execute(interaction: ChatInputCommandInteraction) {
  const user = interaction.user
  const guildId = interaction.guildId!

  const userKey = `${user.id}:${guildId}`
  if (quizUsers.has(userKey)) {
    await interaction.reply({
      content: '🧠 이미 퀴즈 중입니다!',
      ephemeral: true,
    })
    return
  }

  if (isPlayerDead(user.id, guildId)) {
    await interaction.reply({
      content: '💀 HP가 0입니다! 퀴즈를 풀 수 없습니다.\n`/heal`로 회복하세요.',
      ephemeral: true,
    })
    return
  }

  quizUsers.add(userKey)
  getOrCreatePlayer(user.id, guildId, user.username)

  const q = pick(questions)
  const buttonLabels = ['1️⃣', '2️⃣', '3️⃣', '4️⃣']

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    ...q.choices.map((choice, i) =>
      new ButtonBuilder()
        .setCustomId(`quiz_${i}`)
        .setLabel(`${buttonLabels[i]} ${choice}`)
        .setStyle(ButtonStyle.Secondary),
    ),
  )

  const embed = new EmbedBuilder()
    .setColor(difficultyColors[q.difficulty])
    .setTitle('🧠 퀴즈!')
    .setDescription(
      `난이도: ${difficultyLabels[q.difficulty]}\n\n` +
        `## ${q.question}\n\n` +
        q.choices.map((c, i) => `${buttonLabels[i]} ${c}`).join('\n') +
        `\n\n⏱️ 15초 안에 답하세요!`,
    )

  const response = await interaction.reply({
    embeds: [embed],
    components: [row],
    fetchReply: true,
  })

  try {
    const choice = await response.awaitMessageComponent({
      componentType: ComponentType.Button,
      filter: (i) => i.user.id === user.id,
      time: 15000,
    })
    await choice.deferUpdate()

    const chosen = parseInt(choice.customId.split('_')[1])
    const isCorrect = chosen === q.answer

    const rewards = difficultyRewards[q.difficulty]

    if (isCorrect) {
      const goldReward = random(rewards.gold[0], rewards.gold[1])
      const xpReward = random(rewards.xp[0], rewards.xp[1])
      addGold(user.id, guildId, goldReward)
      const leveledUp = addXp(user.id, guildId, xpReward)

      // 15% chance for stellarite on correct answer
      let stellariteBonus = 0
      if (Math.random() < 0.15) {
        stellariteBonus = random(5, 10)
        addStellarite(user.id, stellariteBonus)
      }

      const resultEmbed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle('🧠 퀴즈 결과!')
        .setDescription(
          `## ${q.question}\n\n` +
            `✅ 정답: **${q.choices[q.answer]}**\n\n` +
            `${pick(correctMessages)}\n\n` +
            `💰 **+${goldReward}G** | ✨ **+${xpReward} XP**` +
            (stellariteBonus > 0
              ? ` | 💎 **성광석 +${stellariteBonus}**`
              : '') +
            (leveledUp ? '\n🎉 **레벨 업!!!**' : ''),
        )
        .setTimestamp()
      await interaction.editReply({ embeds: [resultEmbed], components: [] })
    } else {
      const resultEmbed = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle('🧠 퀴즈 결과!')
        .setDescription(
          `## ${q.question}\n\n` +
            `❌ 당신의 답: **${q.choices[chosen]}**\n` +
            `✅ 정답: **${q.choices[q.answer]}**\n\n` +
            `${pick(wrongMessages)}`,
        )
        .setTimestamp()
      await interaction.editReply({ embeds: [resultEmbed], components: [] })
    }
  } catch {
    const timeoutEmbed = new EmbedBuilder()
      .setColor(0x808080)
      .setTitle('🧠 시간 초과!')
      .setDescription(
        `⏱️ 15초가 지났습니다!\n\n` +
          `정답은: **${q.choices[q.answer]}** 이었습니다!`,
      )
    await interaction.editReply({ embeds: [timeoutEmbed], components: [] })
  } finally {
    quizUsers.delete(userKey)
  }
}
