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
  addFish,
  addIslandXp,
  addTitle,
  getIslandBuilding,
  getOrCreateIsland,
  getOrCreatePollution,
  addPollution,
  reducePollution,
  increasePassivePollution,
  addTrash,
  getTrashInventory,
  removeAllTrashByUser,
  isPlayerDead,
  damagePlayer,
  getEffectiveStats,
  addXp,
  addStellarite,
  pick,
  sleep,
  random,
} from '../../db/helpers.js'
import {
  rollFish,
  rollFishingEvent,
  rollTrash,
  rollSeaMonster,
  rollDangerousCatch,
  fishRarityLabels,
  fishRarityColors,
  fishPool,
} from '../../data/fish-data.js'

export const data = new SlashCommandBuilder()
  .setName('fish')
  .setDescription('🎣 낚시를 합니다!')
  .addStringOption((opt) =>
    opt
      .setName('action')
      .setDescription('추가 행동 (비워두면 낚시합니다)')
      .addChoices(
        { name: '🗑️ 쓰레기 처리', value: 'dispose' },
        { name: '💀 바다에 버리기', value: 'dump' },
        { name: '🌊 오염도 확인', value: 'pollution' },
      ),
  )

const fishingMessages = [
  '찌를 던졌습니다...',
  '물 위에 찌가 떠 있습니다...',
  '조용히 기다리는 중...',
  '뭔가 움직이는 것 같은데...',
  '바다 냄새가 좋다...',
  '졸음이 몰려온다...',
  '유튜브나 볼까... 아 낚시 중이었지',
  '옆 사람은 전설급 잡았다는데...',
  '이게 낚시인지 명상인지 모르겠다...',
  '물고기도 퇴근 시간이 있나...',
  '찌가 안 움직인다. 나도 안 움직인다. 우리 둘 다 NPC다.',
  '이 낚시터 리뷰: ★☆☆☆☆ "물고기 없음"',
  '사실 물고기가 날 낚시하고 있는 건 아닐까...',
  '물고기: (회의 중) "저거 미끼인 거 다 알지?"',
  '갈매기가 날 비웃고 있다...',
  '다리가 저려온다... 이게 맞나...',
  '옆자리에서 5연속 전설급 뽑음. 난 쓰레기 3연속. 공평하다.',
  '바다에 지갑 떨어뜨릴 뻔함...',
  'BGM: lofi hip hop radio - beats to fish/relax to',
  '물고기 AI가 오늘 특히 똑똑한 것 같다...',
  '찌를 바라보니 인생이 보인다...',
  '"아 옛날에 이 자리에서 크라켄 잡았는데"  (거짓말)',
  '물고기한테 DM 보내고 싶다...',
  `이 바다에는 ${fishPool.length.toLocaleString()}종의 물고기가 있다... 다 잡을 수 있을까?`,
  '현생 도망치려고 낚시 시작했는데 낚시가 현생이 됐다...',
  '물고기: "쟤 또 왔다" 🐟🐟🐟 (단체 카톡방)',
  'Ctrl+Z로 인생 되돌리기 하고 싶다...',
  '아무도 안 봤으면 좋겠다... 쓰레기 3연속 ㅠ',
  '낚시 유튜브 광고: "이 미끼 쓰면 전설급 물고기가!" (거짓말입니다)',
  '물고기가 내 미끼를 씹다가 뱉었다... 모욕적이다.',
  '커피 마시러 갔다 와도 찌가 그대로일 듯...',
  '바다 보면서 명상하는 중이라고 하겠습니다.',
  '프로 낚시꾼 팁: 물고기한테 인사하면 잘 잡힌다 (아님)',
  '물고기가 CCTV 보는 것처럼 미끼만 관찰하고 있다...',
  '지금 이 순간에도 누군가는 신화급을 잡고 있다... (나 제외)',
  '물고기가 찌찌를 물었다!! 아 가짜다...',
  '찌: "날 좀 그만 쳐다봐..." (찌도 지쳤다)',
  '물고기가 미끼를 먹고 도망갈 확률: 99.7%',
  '낚시 = 물 앞에서 멍 때리기 시뮬레이터',
  '물고기가 내 미끼 사진 찍어서 인스타에 올렸다... #오늘의미끼 #별로',
  '찌가 자기도 공무원이라며 칼퇴근했다...',
  '물고기: "그 미끼 유통기한 지났는데요" 🐟🤮',
  '옆 낚시꾼이 치킨 시켜먹고 있다... 나도 먹고 싶다...',
  '물고기가 미끼에 1원 놓고 갔다. 팁인가?',
  '찌를 던졌더니 갈매기가 낚였다... 아 갈매기 놔줘...',
]

// Real bite messages — player SHOULD press the button
const realBiteMessages = [
  '🔔 찌가 흔들린다!!',
  '🔔 입질이 왔다!!',
  '🔔 뭔가 강하게 당긴다!!',
  '🔔 묵직한 손맛!!',
  '🔔 찌가 물속으로 빨려들어간다!!',
  '🔔 진짜다!! 이번엔 진짜!!',
  '🔔 찌가 완전히 가라앉았다!!',
  '🔔 낚싯대가 활처럼 휜다!!',
  '🔔 번호 따기 성공!! 아니 입질 성공!!',
  '🔔 강한 입질이다!!',
  '🔔 대어의 기운이 느껴진다!!',
  '🔔 찌가 급격히 움직인다!!',
  '🔔 뭔가 물었다!!',
  '🔔 확실한 입질!!',
  '🔔 줄이 팽팽해진다!!',
  '🔔 찌가 수면 아래로!!',
  '🔔 힘차게 물었다!!',
  '🔔 드디어 왔다!!',
  '🔔 낚싯대가 크게 휘어진다!!',
  '🔔 강렬한 입질!!',
  '🔔 찌가 빠르게 움직인다!!',
  '🔔 물고기가 미끼를 물었다!!',
  '🔔 진짜 입질이다!!',
  '🔔 찌가 깊이 잠긴다!!',
  '🔔 큰 놈이 물었다!!',
  '🔔 손맛이 온다!!',
  '🔔 낚싯줄이 당겨진다!!',
  '🔔 찌가 순식간에 가라앉았다!!',
  '🔔 묵직하게 당긴다!!',
  '🔔 입질이 확실하다!!',
  '🔔 뭔가 큰 놈이다!!',
  '🔔 찌가 흔들리면서 잠긴다!!',
  '🔔 강하게 잡아당긴다!!',
  '🔔 미끼를 삼켰다!!',
  '🔔 이건 진짜다!!',
  '🔔 낚싯대가 크게 움직인다!!',
  '🔔 찌가 사라졌다!!',
  '🔔 줄이 급하게 풀린다!!',
  '🔔 물속에서 저항이 느껴진다!!',
  '🔔 엄청난 입질이다!!',
  '🔔 찌가 완전히 수면 아래로!!',
  '🔔 이번엔 진짜다!!',
  '🔔 찌 반응이 확실하다!!',
  '🔔 찌가 격하게 움직인다!!',
  '🔔 확실한 손맛이다!!',
  '🔔 뭔가 무거운 게 걸렸다!!',
  '🔔 찌가 빠르게 잠긴다!!',
  '🔔 강력한 입질이다!!',
  '🔔 대물의 느낌이다!!',
]

// Fake bait messages — player should NOT press (instant fail if they press)
const fakeBiteMessages = [
  '🔔 찌찌가 흔들린다!!',
  '🔔 별찌찌',
  '🔔 찌찌를 물었다!!!',
  '🔔 물고기 똥을 낚았다!!',
  '🔔 찌가 춤을 추고 있다!! (자아 발견)',
  '🔔 물고기가 찌에 낙서하고 갔다!!',
  '🔔 바다에서 택배가 도착했습니다!! (오배송)',
  '🔔 물고기가 미끼 배달 시켰다!! (쿠팡이츠)',
  '🔔 물고기가 찌를 비웃고 갔다!!',
  '🔔 해파리가 하이파이브를 원한다!!',
  '🔔 물고기: "야 쟤 또 낚시질이래" (비웃음)',
  '🔔 찌가 셀카를 찍고 있다!!',
  '🔔 AI가 입질이라고 합니다!! (신뢰도 2%)',
  '🔔 전설의 물고기가!!!... 꿈이었다',
  '🔔 인어가 손흔들고 갔다!! (환각)',
  '🔔 물고기가 가슴이 웅장해진다!!',
  '🔔 물속에서 "사랑해요" 소리가?! (공기방울)',
  '🔔 찌가 SOS 신호를 보내고 있다!!',
  '🔔 물 밑에서 뭔가 회의 중인 소리가!!',
  '🔔 물고기가 미끼에 별점 1점 남겼다!!',
  '🔔 찌가 아파합니다!! 아 찌찌가 아프다고!!',
  '🔔 옆사람이 찌를 건드렸다!!',
  '🔔 바바바바바바밤!!!!',
  '🔔 고래가 지나가면서 파도가 왔다!!',
  '🔔 해적선이 지나간다!! (코스프레)',
  '🔔 찌: (도발 모드) 흔들흔들~',
  '🔔 물고기가 찌를 업어갔다가 돌려놓았다!!',
  '🔔 옆 낚시꾼이 재채기를 해서 흔들렸다!!',
  '🔔 바닷속에서 박수 소리가?!?!',
  '🔔 지진이다!! 아니 옆사람이 점프했다!!',
  '🔔 물고기가 니 찌에 이력서를 제출했다!!',
  '🔔 찌가 명함을 건네받았다!!',
  '🔔 물고기가 미끼 맛 평가 중!! ⭐☆☆☆☆',
  '🔔 물고기가 찌를 어항으로 착각했다!!',
  '🔔 물고기가 잠수 자격증 검사를 요청했다!!',
  '🔔 찌가 독립 선언을 했다!!',
  '🔔 물고기가 낚시 금지 구역이라고 항의했다!!',
  '🔔 크크크큰 물고기다!!!!! (소문)',
  '🔔 대어가 왔왔왔다!!!',
  '🔔 찌가 자기가 물고기인 척한다!!',
  '🔔 물고기가 미끼를 리뷰하고 갔다!! "맛 없음"',
]

// ── Weather system ──
interface Weather {
  name: string
  emoji: string
  valueMod: number // multiplier for fish value
  message: string
}

const WEATHERS: Weather[] = [
  {
    name: '맑음',
    emoji: '☀️',
    valueMod: 1.0,
    message: '맑은 하늘 아래 낚시 중!',
  },
  {
    name: '흐림',
    emoji: '☁️',
    valueMod: 1.0,
    message: '흐린 날이지만 물고기는 잘 물어요.',
  },
  {
    name: '비',
    emoji: '🌧️',
    valueMod: 1.15,
    message: '비가 오면 물고기가 활발해집니다!',
  },
  {
    name: '폭우',
    emoji: '⛈️',
    valueMod: 1.3,
    message: '폭우 속의 낚시! 대어 확률 UP!',
  },
  {
    name: '안개',
    emoji: '🌫️',
    valueMod: 0.9,
    message: '안개가 자욱해서 앞이 안 보입니다...',
  },
  {
    name: '무지개',
    emoji: '🌈',
    valueMod: 1.5,
    message: '무지개가 떴다! 행운의 낚시!',
  },
  {
    name: '눈',
    emoji: '❄️',
    valueMod: 0.8,
    message: '눈이 오는데 왜 낚시를 하는 거죠...',
  },
  {
    name: '태풍',
    emoji: '🌪️',
    valueMod: 1.4,
    message: '태풍 속 낚시! 미쳤지만 대어가 올 수도!',
  },
  {
    name: '달빛',
    emoji: '🌙',
    valueMod: 1.2,
    message: '달빛 아래 로맨틱한 낚시...',
  },
]

function getWeather(): Weather {
  const roll = Math.random() * 100
  if (roll < 2) return WEATHERS[7] // 태풍 2%
  if (roll < 5) return WEATHERS[5] // 무지개 3%
  if (roll < 10) return WEATHERS[3] // 폭우 5%
  if (roll < 15) return WEATHERS[6] // 눈 5%
  if (roll < 25) return WEATHERS[2] // 비 10%
  if (roll < 35) return WEATHERS[4] // 안개 10%
  if (roll < 45) return WEATHERS[8] // 달빛 10%
  if (roll < 70) return WEATHERS[1] // 흐림 25%
  return WEATHERS[0] // 맑음 30%
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const action = interaction.options.getString('action')
  const user = interaction.user
  const guildId = interaction.guildId!

  if (!action) {
    await handleCast(interaction, user, guildId)
  } else if (action === 'dispose') {
    await handleDispose(interaction, user, guildId)
  } else if (action === 'dump') {
    await handleDump(interaction, user, guildId)
  } else if (action === 'pollution') {
    await handlePollution(interaction, user, guildId)
  }
}

async function handleCast(
  interaction: ChatInputCommandInteraction,
  user: { id: string; username: string },
  guildId: string,
) {
  // HP check
  if (isPlayerDead(user.id, guildId)) {
    const deadFishMessages = [
      '💀 HP가 0입니다! 활동할 수 없습니다.\n`/heal`로 회복하거나 `/daily`로 보상을 받으세요.',
      '💀 죽은 상태로 낚시하면 본인이 물고기가 됩니다.\n`/heal`로 부활하세요.',
      '💀 유령 낚시는 서비스 준비 중입니다.\n`/heal`로 회복하세요.',
    ]
    await interaction.reply({
      content: pick(deadFishMessages),
      ephemeral: true,
    })
    return
  }

  getOrCreatePlayer(user.id, guildId, user.username)
  const island = getOrCreateIsland(user.id, guildId)
  const fishingSpot = getIslandBuilding(user.id, guildId, 'fishing_spot')
  const spotLevel = fishingSpot?.building_level ?? 1
  const pollution = getOrCreatePollution(user.id, guildId)

  // ── Passive pollution: fishing naturally degrades water quality ──
  const waterTreatment = getIslandBuilding(user.id, guildId, 'water_treatment')
  const factory = getIslandBuilding(user.id, guildId, 'factory')
  const basePollutionIncrease = 0.15 // base pollution per cast
  const factoryPollution = factory ? factory.building_level * 0.08 : 0 // factories pollute
  const treatmentReduction = waterTreatment
    ? waterTreatment.building_level * 0.06
    : 0
  const netPollutionChange =
    basePollutionIncrease + factoryPollution - treatmentReduction

  if (netPollutionChange > 0) {
    increasePassivePollution(user.id, guildId, netPollutionChange)
  } else if (netPollutionChange < 0 && pollution.pollution_level > 0) {
    // Water treatment is strong enough to actively clean
    reducePollution(user.id, guildId, Math.abs(netPollutionChange))
  }

  // Get current pollution after treatment
  const currentPollution = getOrCreatePollution(user.id, guildId)
  const pollutionWarning =
    currentPollution.pollution_level >= 7
      ? '\n⚠️ **수질 오염 심각!** 좋은 물고기가 안 나옵니다!'
      : currentPollution.pollution_level >= 4
        ? '\n⚠️ 수질 오염도가 높습니다...'
        : ''

  // ── Roll fishing event ──
  const event = rollFishingEvent(spotLevel, currentPollution.pollution_level)

  // ── Weather ──
  const weather = getWeather()

  // ── Phase 1: 낚시 시작 ──
  const pollutionDelta =
    netPollutionChange > 0
      ? `📈 오염 +${netPollutionChange.toFixed(2)}/회`
      : netPollutionChange < 0
        ? `📉 정화 ${Math.abs(netPollutionChange).toFixed(2)}/회`
        : ''

  const embed1 = new EmbedBuilder()
    .setColor(0x1e90ff)
    .setTitle(`🎣 ${island.island_name}에서 낚시 중...`)
    .setDescription(
      `> 🏝️ **${island.island_name}** 낚시터\n` +
        `> ${weather.emoji} ${weather.message}\n` +
        `> 🌊 ～～～🎣\n\n` +
        `**${pick(fishingMessages)}**\n` +
        `낚시터 레벨: ⭐ ${spotLevel} | 날씨: ${weather.emoji} ${weather.name}` +
        `${weather.valueMod !== 1.0 ? ` (가치 ×${weather.valueMod})` : ''}` +
        `${pollutionWarning}`,
    )
  if (pollutionDelta) {
    embed1.setFooter({ text: pollutionDelta })
  }
  await interaction.reply({ embeds: [embed1] })

  // ── LINE BREAK (no button phase) ──
  if (event.type === 'line_break') {
    await sleep(2000)
    const lineBreakEmbed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle('💔 이런...!')
      .setDescription(
        `> 🌊 ～💥～ 🎣💢\n\n` +
          `**${event.message}**\n\n` +
          `낚싯줄이 끊어져서 아무것도 못 잡았습니다...\n` +
          `${currentPollution.pollution_level >= 5 ? '🏭 수질 오염이 심해서 줄이 약해진 것 같습니다... 수질 관리 시설을 지으세요!' : '다음에는 운이 좋을 거예요!'}`,
      )
      .setFooter({
        text: `🏝️ ${island.island_name} | 오염도: ${currentPollution.pollution_level.toFixed(1)}/10`,
      })
      .setTimestamp()
    await interaction.editReply({ embeds: [lineBreakEmbed] })
    return
  }

  // ── Timing minigame: fake bait → real bite (or not!) ──
  // Decide how many fake baits to show (0-3)
  // 20% chance that no real bite comes (fish just leaves)
  const fakeCount = random(0, 3)
  const noRealBite = Math.random() < 0.2
  const buttonId = `fish_pull_${user.id}_${Date.now()}`

  for (let i = 0; i < fakeCount; i++) {
    await sleep(random(1500, 3000))

    const fakeMsg = pick(fakeBiteMessages)
    const fakeCustomId = `${buttonId}_fake_${i}`
    const fakeButton = new ButtonBuilder()
      .setCustomId(fakeCustomId)
      .setLabel('🎣 당긴다!')
      .setStyle(ButtonStyle.Success)
    const fakeRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      fakeButton,
    )

    const fakeEmbed = new EmbedBuilder()
      .setColor(0xff6b35)
      .setTitle('🎣 입질이다!!')
      .setDescription(`> 🌊 ～💥～🎣\n\n` + `**${fakeMsg}**`)
    await interaction.editReply({
      embeds: [fakeEmbed],
      components: [fakeRow],
    })

    // Wait for accidental click (3 seconds window)
    try {
      const fakeCollector = await interaction.channel?.awaitMessageComponent({
        componentType: ComponentType.Button,
        filter: (btnInteraction) =>
          btnInteraction.customId === fakeCustomId &&
          btnInteraction.user.id === user.id,
        time: 3000,
      })

      if (fakeCollector) {
        // User fell for the fake! Fail!
        const failMessages = [
          '물고기가 놀라서 도망갔습니다... 🐟💨',
          '물고기: "참을성 제로ㅋ" 🐟💨',
          '물고기들이 수군수군합니다... "저 사람 또 속았대" 🐟💨',
          '물고기가 박수를 치며 떠났습니다 🐟👏',
          '물고기: "ㅋㅋㅋ 또 걸렸다 야 단톡방에 올려" 🐟📱',
          '물고기가 미끼를 보고 한숨을 쉬었습니다... 🐟😮‍💨',
          '찌가 당신에게 실망했습니다... 찌: "더 이상 못 참아" 🎣💔',
          '물고기: "에이~ 성급하면 못 잡아~" (선생님 모드) 🐟👨‍🏫',
        ]
        const failEmbed = new EmbedBuilder()
          .setColor(0xe74c3c)
          .setTitle('❌ 속았다!')
          .setDescription(
            `> 🌊 ～～～🎣\n\n` +
              `**가짜 입질에 속아서 줄을 잡아당겨버렸습니다!**\n\n` +
              `${pick(failMessages)}\n` +
              `다음에는 진짜 입질을 기다리세요!`,
          )
          .setFooter({ text: `🏝️ ${island.island_name}` })
          .setTimestamp()
        await fakeCollector.update({ embeds: [failEmbed], components: [] })
        return
      }
    } catch {
      // Timeout = good, user didn't fall for fake
    }

    // Remove the button after fake phase
    const waitMessages = [
      '아닌 것 같다... 계속 기다린다...',
      '가짜였다... 물고기 이 녀석...',
      '찌가 거짓말을 했다... 믿었는데...',
      '아무것도 아니었다... 내 심장만 뛰었다...',
      '물고기가 장난치고 갔다... 🐟💨',
      '헛둘헛둘... 계속 기다려본다...',
    ]
    const waitEmbed = new EmbedBuilder()
      .setColor(0x1e90ff)
      .setTitle('🎣 낚시 중...')
      .setDescription(`> 🌊 ～～～🎣\n\n` + `**${pick(waitMessages)}**`)
    await interaction.editReply({ embeds: [waitEmbed], components: [] })
  }

  // ── No real bite — fish just never came ──
  if (noRealBite) {
    await sleep(random(2000, 4000))
    const noBiteMessages = [
      '오늘은 물고기가 출근을 안 한 것 같습니다... 🐟💤',
      '물고기들이 단체로 파업 중이랍니다... 🐟✊',
      '찌만 바라보다가 시간이 다 갔습니다... ⏰',
      '물고기: "오늘 쉬는 날임" (단톡방 공지) 🐟📢',
      '미끼가 너무 수상해서 아무도 안 물었습니다... 🎣',
      '찌가 외로워하고 있습니다... 아무도 안 왔어요... 🎣😢',
      '물고기가 찌를 구경만 하고 갔습니다. 관광이었나봅니다. 🐟📸',
      '오늘의 조황: 꽝. 완전한 꽝. 역대급 꽝. 🏆',
      '물고기가 미끼를 보고 "에이 또 저거네" 하고 갔습니다 🐟🙄',
      '바다가 오늘 휴무라고 합니다. 내일 다시 오세요. 🌊🚫',
      '물고기한테 차였습니다. 연애 실패 느낌... 💔🐟',
      '찌만 던지고 멍 때리다 왔습니다. 명상 완료. 🧘',
    ]
    const noBiteEmbed = new EmbedBuilder()
      .setColor(0x95a5a6)
      .setTitle('🎣 ... 아무것도 안 잡혔다')
      .setDescription(
        `> 🌊 ～～～🎣\n\n` +
          `**한참을 기다렸지만 입질이 없었습니다...**\n\n` +
          `${pick(noBiteMessages)}\n\n` +
          `> *낚시는 원래 이런 겁니다. 인내의 스포츠.*`,
      )
      .setFooter({
        text: `🏝️ ${island.island_name} | 오염도: ${currentPollution.pollution_level.toFixed(1)}/10 | 오늘의 운세: 💩`,
      })
      .setTimestamp()
    await interaction.editReply({ embeds: [noBiteEmbed], components: [] })
    return
  }

  // ── Real bite phase ──
  await sleep(random(1500, 3500))

  const realMsg = pick(realBiteMessages)
  const eventMessage =
    event.type !== 'normal' ? `\n${event.emoji} **${event.message}**` : ''

  const pullButton = new ButtonBuilder()
    .setCustomId(`${buttonId}_real`)
    .setLabel('🎣 당긴다!')
    .setStyle(ButtonStyle.Success)
  const pullRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    pullButton,
  )

  const biteEmbed = new EmbedBuilder()
    .setColor(
      event.type === 'trash'
        ? 0x95a5a6
        : event.type === 'storm'
          ? 0x2c3e50
          : 0xff6b35,
    )
    .setTitle('🎣 입질이다!!')
    .setDescription(`> 🌊 ～💥～🎣\n\n` + `**${realMsg}**${eventMessage}`)
  await interaction.editReply({
    embeds: [biteEmbed],
    components: [pullRow],
  })

  // Wait for button press (4 second window — not too easy)
  let pulled = false
  try {
    const realCollector = await interaction.channel?.awaitMessageComponent({
      componentType: ComponentType.Button,
      filter: (i) => i.customId === `${buttonId}_real` && i.user.id === user.id,
      time: 4000,
    })

    if (realCollector) {
      pulled = true
      await realCollector.deferUpdate()
    }
  } catch {
    // Timeout = missed the fish
  }

  if (!pulled) {
    const missMessages = [
      '물고기가 미끼만 먹고 도망갔습니다... 🐟💨',
      '물고기: "ㅋㅋ 느리네~" 🐟💨',
      '물고기가 손가락 하트를 날리고 사라졌습니다 🐟💕',
      '반응속도 테스트 결과: 불합격 🐟💨',
      '물고기가 미끼를 뱉으면서 혀를 내밀었습니다 🐟👅',
      '물고기: "다음에 봐~" (안 볼 예정) 🐟💨',
      '물고기가 미끼에 "구데타마" 얼굴을 새기고 갔습니다 🐟😐',
      '물고기가 "느려~"라고 물거품으로 써놓고 갔습니다 🐟',
      '물고기가 당신의 반응속도를 측정하고 F 등급을 매겼습니다 🐟📊',
      '물고기: "3초 안에 안 당기면 도망갈거임" (0.5초 전에 도망감)',
    ]
    const missEmbed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle('💨 놓쳤다!')
      .setDescription(
        `> 🌊 ～～～🎣\n\n` +
          `**타이밍을 놓쳤습니다!**\n\n` +
          `${pick(missMessages)}\n` +
          `다음에는 더 빨리 반응하세요!`,
      )
      .setFooter({ text: `🏝️ ${island.island_name}` })
      .setTimestamp()
    await interaction.editReply({ embeds: [missEmbed], components: [] })
    return
  }

  // ── Successfully pulled! Now resolve the event ──
  await interaction.editReply({ components: [] })

  // ── TRASH EVENT (button-based disposal) ──
  if (event.type === 'trash') {
    const trash = rollTrash()

    addTrash(user.id, guildId, {
      trash_name: trash.name,
      trash_emoji: trash.emoji,
      disposal_cost: trash.disposalCost,
      pollution_amount: trash.pollutionAmount,
    })

    const trashButtonId = `trash_${user.id}_${Date.now()}`
    const disposeButton = new ButtonBuilder()
      .setCustomId(`${trashButtonId}_dispose`)
      .setLabel(`♻️ 처리하기 (-${trash.disposalCost}G)`)
      .setStyle(ButtonStyle.Success)
    const dumpButton = new ButtonBuilder()
      .setCustomId(`${trashButtonId}_dump`)
      .setLabel('💀 바다에 버리기')
      .setStyle(ButtonStyle.Danger)
    const trashRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      disposeButton,
      dumpButton,
    )

    const trashJokes = [
      '환경부에서 지켜보고 있습니다... 👀',
      '그린피스가 전화를 걸어오고 있습니다...',
      '물고기: "우리 집에 쓰레기 좀 버리지 마세요" 🐟',
      '해양경찰이 쌍안경으로 보고 있습니다... 🔭',
      '쓰레기도 낚는 실력... 대단합니다.',
      '이걸 물고기라고 낚은 건가... 쓰레기라고 낚은 건가...',
    ]

    const trashEmbed = new EmbedBuilder()
      .setColor(0x95a5a6)
      .setTitle('🗑️ 쓰레기를 낚았다...')
      .setDescription(
        `${trash.emoji} **${trash.name}**\n\n` +
          `> *${trash.description}*\n\n` +
          `처리 비용: **${trash.disposalCost}G** 💰\n` +
          `오염도: **+${trash.pollutionAmount}** 🏭\n\n` +
          `> 💡 *${pick(trashJokes)}*\n\n` +
          `**어떻게 하시겠습니까?**`,
      )
      .setFooter({
        text: `🏝️ ${island.island_name} | 수질 오염도: ${currentPollution.pollution_level.toFixed(1)}/10`,
      })
      .setTimestamp()
    await interaction.editReply({
      embeds: [trashEmbed],
      components: [trashRow],
    })

    // Wait for button press (15 second window)
    try {
      const trashCollector = await interaction.channel?.awaitMessageComponent({
        componentType: ComponentType.Button,
        filter: (i) =>
          (i.customId === `${trashButtonId}_dispose` ||
            i.customId === `${trashButtonId}_dump`) &&
          i.user.id === user.id,
        time: 15000,
      })

      if (trashCollector) {
        await trashCollector.deferUpdate()

        if (trashCollector.customId === `${trashButtonId}_dispose`) {
          // ─ Dispose properly ─
          const player = getOrCreatePlayer(user.id, guildId, user.username)
          if (player.gold < trash.disposalCost) {
            const brokeEmbed = new EmbedBuilder()
              .setColor(0xe74c3c)
              .setTitle('💸 골드 부족!')
              .setDescription(
                `처리 비용 **${trash.disposalCost}G**가 필요합니다!\n보유 골드: **${player.gold}G**\n\n` +
                  `쓰레기가 인벤토리에 보관됩니다.\n\`/fish action:🗑️ 쓰레기 처리\`로 나중에 처리하세요.`,
              )
              .setTimestamp()
            await interaction.editReply({
              embeds: [brokeEmbed],
              components: [],
            })
          } else {
            addGold(user.id, guildId, -trash.disposalCost)
            reducePollution(user.id, guildId, trash.pollutionAmount * 0.5)
            addIslandXp(user.id, guildId, 5)
            removeAllTrashByUser(user.id, guildId) // remove the one we just added

            const disposeEmbed = new EmbedBuilder()
              .setColor(0x2ecc71)
              .setTitle('♻️ 쓰레기 처리 완료!')
              .setDescription(
                `${trash.emoji} **${trash.name}** 처리 완료!\n\n` +
                  `💰 처리 비용: **-${trash.disposalCost}G**\n` +
                  `🌊 수질 개선: **-${(trash.pollutionAmount * 0.5).toFixed(1)}**\n` +
                  `🏝️ 환경 보호 XP: **+5**\n\n` +
                  `> *바다가 조금 더 깨끗해졌습니다!* 🐟\n` +
                  `> *물고기들이 고마워하고 있습니다* 🐠💕`,
              )
              .setFooter({ text: `🏝️ ${island.island_name}` })
              .setTimestamp()
            await interaction.editReply({
              embeds: [disposeEmbed],
              components: [],
            })
          }
        } else {
          // ─ Dump into ocean ─
          addPollution(user.id, guildId, trash.pollutionAmount)
          removeAllTrashByUser(user.id, guildId) // remove from inventory since dumped

          const updatedPollution = getOrCreatePollution(user.id, guildId)
          const dumpJokes = [
            '물고기들이 이사 준비를 시작했습니다... 🐟📦',
            '해양경찰에 신고가 접수되었습니다 🚔 (농담)',
            '그레타 툰베리가 실망했습니다...',
            '물고기: "진짜 이러실 거예요?" 🐟😠',
            '바다가 울고 있습니다... 🌊😢',
          ]

          const dumpEmbed = new EmbedBuilder()
            .setColor(0xe74c3c)
            .setTitle('💀 쓰레기 불법 투기!')
            .setDescription(
              `${trash.emoji} → 🌊\n\n` +
                `🏭 수질 오염 증가: **+${trash.pollutionAmount}**\n` +
                `🌊 현재 오염도: **${updatedPollution.pollution_level.toFixed(1)}/10**\n\n` +
                `> *${pick(dumpJokes)}*\n\n` +
                `💡 수질 관리 시설을 지으면 자동으로 오염이 줄어듭니다!`,
            )
            .setFooter({ text: `🏝️ ${island.island_name}` })
            .setTimestamp()
          await interaction.editReply({ embeds: [dumpEmbed], components: [] })
        }
      }
    } catch {
      // Timeout — trash stays in inventory
      const timeoutEmbed = new EmbedBuilder()
        .setColor(0x95a5a6)
        .setTitle('🗑️ 쓰레기 보관 중...')
        .setDescription(
          `결정을 안 하셔서 쓰레기가 인벤토리에 보관됩니다.\n` +
            `\`/fish action:🗑️ 쓰레기 처리\` 또는 \`/fish action:💀 바다에 버리기\`로 나중에 처리하세요.`,
        )
        .setTimestamp()
      await interaction.editReply({ embeds: [timeoutEmbed], components: [] })
    }
    return
  }

  // ── DANGEROUS CATCH EVENT ──
  if (event.type === 'dangerous') {
    const danger = rollDangerousCatch()
    const player = getOrCreatePlayer(user.id, guildId, user.username)

    const dangerIntros = [
      '뭔가... 이상하다... 이게 물고기가 아닌데??',
      '낚싯줄을 당겼더니 이상한 게 올라온다!',
      '잠깐, 이건 물고기가 아니라—',
      '찌를 올렸는데... 응??? 🤨',
      '축하합니다! 당신은 물고기 대신 죽음을 낚았습니다!',
    ]

    if (danger.damage === 0) {
      // Instant kill
      damagePlayer(user.id, guildId, player.hp)
      if (danger.goldLoss > 0) addGold(user.id, guildId, -danger.goldLoss)

      const deathEmbed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`${danger.emoji} ${danger.name} — 즉사!!!`)
        .setDescription(
          `> *${pick(dangerIntros)}*\n\n` +
            `${danger.emoji} **${danger.name}!!**\n\n` +
            `${danger.deathMessage}\n\n` +
            `💀 **HP: ${player.hp} → 0**\n` +
            `${danger.goldLoss > 0 ? `💸 **-${danger.goldLoss}G**\n` : ''}` +
            `\n> *\`/heal\`로 부활하세요...*`,
        )
        .setFooter({
          text: `🏝️ ${island.island_name} | 사인: ${danger.name}에 의한 사망`,
        })
        .setTimestamp()
      await interaction.editReply({ embeds: [deathEmbed] })
    } else {
      // Partial damage
      damagePlayer(user.id, guildId, danger.damage)
      if (danger.goldLoss > 0) addGold(user.id, guildId, -danger.goldLoss)

      const newHp = Math.max(0, player.hp - danger.damage)
      const hurtEmbed = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle(`${danger.emoji} ${danger.name}!!`)
        .setDescription(
          `> *${pick(dangerIntros)}*\n\n` +
            `${danger.emoji} **${danger.name}!!**\n\n` +
            `${danger.deathMessage}\n\n` +
            `🩸 **HP: ${player.hp} → ${newHp}** (-${danger.damage})\n` +
            `${danger.goldLoss > 0 ? `💸 **-${danger.goldLoss}G**\n` : ''}` +
            `${newHp <= 0 ? '\n💀 **사망했습니다!** `/heal`로 부활하세요.' : '\n⚠️ *살아남았지만 많이 다쳤습니다...*'}`,
        )
        .setFooter({ text: `🏝️ ${island.island_name}` })
        .setTimestamp()
      await interaction.editReply({ embeds: [hurtEmbed] })
    }
    return
  }

  // ── TREASURE EVENT ──
  if (event.type === 'treasure') {
    const treasureGold = random(200, 1000)
    addGold(user.id, guildId, treasureGold)
    addIslandXp(user.id, guildId, 50)

    const treasureEmbed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle('🎁 보물 상자!!!')
      .setDescription(
        `> ✨🎁✨\n\n` +
          `바다 속에서 보물 상자를 발견했습니다!\n\n` +
          `💰 **+${treasureGold}G** 획득!\n` +
          `🏝️ 섬 경험치 +50`,
      )
      .setFooter({ text: `🏝️ ${island.island_name}` })
      .setTimestamp()
    await interaction.editReply({ embeds: [treasureEmbed] })
    return
  }

  // ── SEA MONSTER EVENT ──
  if (event.type === 'sea_monster') {
    const monster = rollSeaMonster()
    const player = getOrCreatePlayer(user.id, guildId, user.username)
    const stats = getEffectiveStats(user.id, guildId)

    // Simple auto-battle: 3 rounds
    let monsterHp = monster.hp
    let playerHp = player.hp
    const battleLines: string[] = [
      `${monster.emoji} **${monster.name}** 등장!`,
      `> *${monster.description}*\n`,
    ]

    for (let round = 1; round <= 3; round++) {
      const playerDmg = random(Math.max(1, stats.attack - 5), stats.attack + 10)
      monsterHp -= playerDmg
      battleLines.push(
        `⚔️ 라운드 ${round}: 당신의 공격! → ${monster.emoji} **-${playerDmg} HP** (${Math.max(0, monsterHp)}/${monster.hp})`,
      )

      if (monsterHp <= 0) {
        battleLines.push(`\n🎉 **${monster.name}을(를) 처치했다!**`)
        break
      }

      const monsterDmg = random(
        Math.max(1, monster.attack - stats.defense),
        monster.attack + 3,
      )
      playerHp -= monsterDmg
      battleLines.push(
        `${monster.emoji} 반격! → 🩸 **-${monsterDmg} HP** (${Math.max(0, playerHp)}/${stats.max_hp})`,
      )

      if (playerHp <= 0) {
        battleLines.push(`\n💀 **당신이 쓰러졌다...**`)
        break
      }
    }

    const won = monsterHp <= 0

    if (won) {
      addGold(user.id, guildId, monster.goldReward)
      addXp(user.id, guildId, monster.xpReward)
      addIslandXp(user.id, guildId, 40)
      // Apply damage taken
      const damageTaken = Math.max(0, player.hp - playerHp)
      if (damageTaken > 0) damagePlayer(user.id, guildId, damageTaken)

      battleLines.push(
        `\n💰 **+${monster.goldReward}G** | ✨ **+${monster.xpReward} XP** | 🏝️ **+40 섬XP**`,
      )
    } else {
      const damageTaken = Math.max(0, player.hp - Math.max(0, playerHp))
      if (damageTaken > 0) damagePlayer(user.id, guildId, damageTaken)
      battleLines.push(`\n괴물에게 패배했습니다... HP를 확인하세요!`)
    }

    const monsterEmbed = new EmbedBuilder()
      .setColor(won ? 0x2ecc71 : 0xe74c3c)
      .setTitle(
        won
          ? `${monster.emoji} 바다 괴물 처치!`
          : `${monster.emoji} 바다 괴물에게 패배...`,
      )
      .setDescription(battleLines.join('\n'))
      .setFooter({ text: `🏝️ ${island.island_name} 해역` })
      .setTimestamp()
    await interaction.editReply({ embeds: [monsterEmbed] })
    return
  }

  // ── NORMAL / STORM / GOLDEN_HOUR / DOUBLE_CATCH ──
  const isStorm = event.type === 'storm'
  const isGoldenHour = event.type === 'golden_hour'
  const isDoubleCatch = event.type === 'double_catch'

  const result = rollFish(
    spotLevel,
    currentPollution.pollution_level,
    isStorm,
    user.id,
  )
  let { fish, size, value } = result

  if (isGoldenHour) value = value * 2
  // Apply weather modifier
  value = Math.round(value * weather.valueMod)

  // Save first fish
  addFish(user.id, guildId, {
    fish_name: fish.name,
    fish_rarity: fish.rarity,
    fish_emoji: fish.emoji,
    fish_size: size,
    fish_value: value,
  })
  addGold(user.id, guildId, value)
  const leveledUp = addIslandXp(user.id, guildId, 10)

  let totalValue = value
  let secondFishText = ''

  // Double catch — roll second fish
  if (isDoubleCatch) {
    const result2 = rollFish(
      spotLevel,
      currentPollution.pollution_level,
      false,
      user.id,
    )
    let value2 = isGoldenHour ? result2.value * 2 : result2.value
    value2 = Math.round(value2 * weather.valueMod)
    addFish(user.id, guildId, {
      fish_name: result2.fish.name,
      fish_rarity: result2.fish.rarity,
      fish_emoji: result2.fish.emoji,
      fish_size: result2.size,
      fish_value: value2,
    })
    addGold(user.id, guildId, value2)
    addIslandXp(user.id, guildId, 10)
    totalValue += value2

    const size2Text =
      result2.size >= 1000
        ? `${(result2.size / 100).toFixed(1)}m`
        : `${result2.size}cm`
    secondFishText =
      `\n\n🎉 **두 번째 물고기!**\n` +
      `${result2.fish.emoji} **${result2.fish.name}** (${fishRarityLabels[result2.fish.rarity]})\n` +
      `크기: **${size2Text}** | 판매가: **${value2}G** 💰`
  }

  const sizeText = size >= 1000 ? `${(size / 100).toFixed(1)}m` : `${size}cm`

  const resultEmbed = new EmbedBuilder()
    .setColor(fishRarityColors[fish.rarity])
    .setTitle(
      isStorm
        ? '🌊 폭풍 속의 대어!'
        : isGoldenHour
          ? '✨ 황금 시간 낚시!'
          : isDoubleCatch
            ? '🎉 더블 캐치!'
            : '🎣 낚시 결과!',
    )
    .setDescription(
      `${fish.emoji} **${fish.name}**\n` +
        `등급: ${fishRarityLabels[fish.rarity]}\n` +
        `크기: **${sizeText}**\n` +
        `판매가: **${value}G** 💰` +
        `${isGoldenHour ? ' (✨ 2배!)' : ''}` +
        `${weather.valueMod !== 1.0 ? ` (${weather.emoji} ×${weather.valueMod})` : ''}\n\n` +
        `> *${fish.description}*` +
        secondFishText,
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

  // 5% chance for stellarite on rare+ fish
  if (['rare', 'epic', 'legendary', 'mythic'].includes(fish.rarity)) {
    if (Math.random() < 0.05) {
      const stellariteBonus = random(10, 20)
      addStellarite(user.id, stellariteBonus)
      resultEmbed.addFields({
        name: '💎 성광석 발견!',
        value: `물고기가 성광석을 물고 있었다! +${stellariteBonus}`,
      })
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
    text: `🏝️ ${island.island_name} | ${weather.emoji}${weather.name} | ⭐${spotLevel} | +${totalValue}G | 섬XP +${isDoubleCatch ? 20 : 10} | 오염도: ${currentPollution.pollution_level.toFixed(1)}/10`,
  })
  resultEmbed.setTimestamp()

  await interaction.editReply({ embeds: [resultEmbed] })
}

async function handleDispose(
  interaction: ChatInputCommandInteraction,
  user: { id: string; username: string },
  guildId: string,
) {
  const player = getOrCreatePlayer(user.id, guildId, user.username)
  const trashItems = getTrashInventory(user.id, guildId)

  if (trashItems.length === 0) {
    await interaction.reply({
      content: '✅ 처리할 쓰레기가 없습니다! 깨끗해요!',
      ephemeral: true,
    })
    return
  }

  const totalCost = trashItems.reduce((s, t) => s + t.disposal_cost, 0)

  if (player.gold < totalCost) {
    await interaction.reply({
      content: `💰 처리 비용이 부족합니다!\n쓰레기 ${trashItems.length}개 | 필요: ${totalCost}G | 보유: ${player.gold}G`,
      ephemeral: true,
    })
    return
  }

  addGold(user.id, guildId, -totalCost)

  // Disposing trash reduces pollution
  const totalPollutionReduced = trashItems.reduce(
    (s, t) => s + t.pollution_amount * 0.5,
    0,
  )
  reducePollution(user.id, guildId, totalPollutionReduced)

  removeAllTrashByUser(user.id, guildId)

  // Bonus XP for environmental cleanup
  addIslandXp(user.id, guildId, trashItems.length * 5)

  const embed = new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle('♻️ 쓰레기 처리 완료!')
    .setDescription(
      `${trashItems.map((t) => `${t.trash_emoji} ${t.trash_name}`).join(', ')}\n\n` +
        `🗑️ 처리된 쓰레기: **${trashItems.length}개**\n` +
        `💰 처리 비용: **-${totalCost}G**\n` +
        `🌊 수질 개선: **-${totalPollutionReduced.toFixed(1)}**\n` +
        `🏝️ 환경 보호 보너스 XP: **+${trashItems.length * 5}**\n\n` +
        `> *바다가 조금 더 깨끗해졌습니다!* 🐟`,
    )
    .setTimestamp()

  await interaction.reply({ embeds: [embed] })
}

async function handleDump(
  interaction: ChatInputCommandInteraction,
  user: { id: string; username: string },
  guildId: string,
) {
  getOrCreatePlayer(user.id, guildId, user.username)
  const trashItems = getTrashInventory(user.id, guildId)

  if (trashItems.length === 0) {
    await interaction.reply({
      content: '✅ 버릴 쓰레기가 없습니다!',
      ephemeral: true,
    })
    return
  }

  // Dumping increases pollution
  const totalPollutionAdded = trashItems.reduce(
    (s, t) => s + t.pollution_amount,
    0,
  )

  for (const t of trashItems) {
    addPollution(user.id, guildId, t.pollution_amount)
  }

  removeAllTrashByUser(user.id, guildId)

  const pollution = getOrCreatePollution(user.id, guildId)

  const embed = new EmbedBuilder()
    .setColor(0xe74c3c)
    .setTitle('💀 쓰레기 불법 투기!')
    .setDescription(
      `${trashItems.map((t) => `${t.trash_emoji}`).join(' ')} → 🌊\n\n` +
        `🗑️ 버린 쓰레기: **${trashItems.length}개**\n` +
        `🏭 수질 오염 증가: **+${totalPollutionAdded.toFixed(1)}**\n` +
        `🌊 현재 오염도: **${pollution.pollution_level.toFixed(1)}/10**\n\n` +
        `> *물고기들이 떠나가고 있습니다...*\n` +
        `> *좋은 물고기가 나올 확률이 떨어집니다!*\n\n` +
        `💡 **수질 관리 시설**을 지으면 자동으로 오염이 줄어듭니다!\n` +
        `\`/island build\`에서 🚰 수질 관리 시설을 확인하세요.`,
    )
    .setTimestamp()

  await interaction.reply({ embeds: [embed] })
}

async function handlePollution(
  interaction: ChatInputCommandInteraction,
  user: { id: string; username: string },
  guildId: string,
) {
  getOrCreatePlayer(user.id, guildId, user.username)
  const pollution = getOrCreatePollution(user.id, guildId)
  const island = getOrCreateIsland(user.id, guildId)

  const level = pollution.pollution_level
  const pollutionBar = makePollutionBar(level)

  let status: string
  let color: number
  if (level <= 1) {
    status = '🏖️ 맑고 깨끗한 바다! 물고기들의 천국!'
    color = 0x00d4aa
  } else if (level <= 3) {
    status = '🌊 약간의 오염이 있지만 괜찮은 수준.'
    color = 0x2ecc71
  } else if (level <= 5) {
    status = '⚠️ 오염이 심해지고 있습니다. 관리가 필요합니다.'
    color = 0xf39c12
  } else if (level <= 7) {
    status = '🏭 심각한 오염! 좋은 물고기가 잘 안 나옵니다.'
    color = 0xe67e22
  } else {
    status = '☠️ 극심한 오염! 쓰레기만 건져올릴 수 있을 정도...'
    color = 0xe74c3c
  }

  const waterTreatment = getIslandBuilding(user.id, guildId, 'water_treatment')
  const factory = getIslandBuilding(user.id, guildId, 'factory')

  const basePollution = 0.15
  const factoryPollution = factory ? factory.building_level * 0.08 : 0
  const treatmentReduction = waterTreatment
    ? waterTreatment.building_level * 0.06
    : 0
  const netChange = basePollution + factoryPollution - treatmentReduction

  const treatmentInfo = waterTreatment
    ? `🚰 수질 관리 시설 Lv.${waterTreatment.building_level} — 처리 능력: -${treatmentReduction.toFixed(2)}/회`
    : '🚰 수질 관리 시설 없음 — `/island build`에서 건설 가능'

  const factoryInfo = factory
    ? `🏭 공장 Lv.${factory.building_level} — 오염 증가: +${factoryPollution.toFixed(2)}/회`
    : ''

  const netChangeText =
    netChange > 0
      ? `📈 낚시 시 오염도 **+${netChange.toFixed(2)}** 증가`
      : netChange < 0
        ? `📉 낚시 시 오염도 **${netChange.toFixed(2)}** 감소 (정화 중!)`
        : '⚖️ 낚시 시 오염도 변화 없음 (균형)'

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`🌊 ${island.island_name} 수질 오염도`)
    .setDescription(
      `**오염도:** ${pollutionBar} **${level.toFixed(1)}/10**\n\n` +
        `${status}\n\n` +
        `📊 **통계:**\n` +
        `🗑️ 버린 쓰레기: ${pollution.trash_dumped}개\n` +
        `♻️ 처리한 쓰레기: ${pollution.trash_disposed}개\n\n` +
        `⚙️ **오염 요인 분석:**\n` +
        `🎣 기본 오염: +${basePollution.toFixed(2)}/회\n` +
        `${factoryInfo ? factoryInfo + '\n' : ''}` +
        `${treatmentInfo}\n\n` +
        `**${netChangeText}**`,
    )
    .setFooter({
      text: '오염이 높을수록 좋은 물고기 확률↓ 쓰레기 확률↑ 줄 끊김↑ | 수질 관리 시설을 지어라!',
    })
    .setTimestamp()

  await interaction.reply({ embeds: [embed] })
}

function makePollutionBar(level: number): string {
  const ratio = Math.max(0, Math.min(1, level / 10))
  const filled = Math.round(ratio * 10)
  const empty = 10 - filled
  return '🟥'.repeat(filled) + '🟩'.repeat(empty)
}
