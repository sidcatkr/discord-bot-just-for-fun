import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js'
import {
  getOrCreatePlayer,
  addGold,
  addItem,
  addTitle,
  pick,
  sleep,
} from '../../db/helpers.js'

export const data = new SlashCommandBuilder()
  .setName('gacha')
  .setDescription('🎰 가챠를 돌린다! (비용: 100G)')

interface GachaItem {
  name: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic'
  emoji: string
  attack: number
  defense: number
  hp: number
  crit: number
}

const rarityColors: Record<string, number> = {
  common: 0x808080,
  uncommon: 0x2ecc71,
  rare: 0x3498db,
  epic: 0x9b59b6,
  legendary: 0xf39c12,
  mythic: 0xff0000,
}

const rarityLabels: Record<string, string> = {
  common: '⬜ 일반',
  uncommon: '🟩 고급',
  rare: '🟦 희귀',
  epic: '🟪 영웅',
  legendary: '🟨 전설',
  mythic: '🟥 신화',
}

const gachaPool: GachaItem[] = [
  // ═══════════════════════════════════════
  //  Common (45%) — 잡템의 왕국
  // ═══════════════════════════════════════
  {
    name: '고무장갑',
    rarity: 'common',
    emoji: '🧤',
    attack: 1,
    defense: 0,
    hp: 0,
    crit: 0,
  },
  {
    name: '감자',
    rarity: 'common',
    emoji: '🥔',
    attack: 0,
    defense: 0,
    hp: 5,
    crit: 0,
  },
  {
    name: '나무 막대기',
    rarity: 'common',
    emoji: '🪵',
    attack: 2,
    defense: 0,
    hp: 0,
    crit: 0,
  },
  {
    name: '비닐봉지',
    rarity: 'common',
    emoji: '🛍️',
    attack: 0,
    defense: 1,
    hp: 0,
    crit: 0,
  },
  {
    name: '양말 한 짝',
    rarity: 'common',
    emoji: '🧦',
    attack: 0,
    defense: 0,
    hp: 3,
    crit: 0,
  },
  {
    name: '돌멩이',
    rarity: 'common',
    emoji: '🪨',
    attack: 3,
    defense: 0,
    hp: 0,
    crit: 0,
  },
  {
    name: '삶은 달걀',
    rarity: 'common',
    emoji: '🥚',
    attack: 1,
    defense: 0,
    hp: 5,
    crit: 0,
  },
  {
    name: '깨진 안경',
    rarity: 'common',
    emoji: '👓',
    attack: 0,
    defense: 0,
    hp: 0,
    crit: 0.01,
  },
  {
    name: '종이 비행기',
    rarity: 'common',
    emoji: '✈️',
    attack: 1,
    defense: 0,
    hp: 0,
    crit: 0.01,
  },
  {
    name: '구겨진 종이컵',
    rarity: 'common',
    emoji: '🥤',
    attack: 0,
    defense: 1,
    hp: 2,
    crit: 0,
  },
  {
    name: '부러진 연필',
    rarity: 'common',
    emoji: '✏️',
    attack: 2,
    defense: 0,
    hp: 0,
    crit: 0,
  },
  {
    name: '먼지 뭉치',
    rarity: 'common',
    emoji: '🌫️',
    attack: 0,
    defense: 0,
    hp: 1,
    crit: 0,
  },
  {
    name: '빈 캔',
    rarity: 'common',
    emoji: '🥫',
    attack: 1,
    defense: 1,
    hp: 0,
    crit: 0,
  },
  {
    name: '젖은 신문지',
    rarity: 'common',
    emoji: '📰',
    attack: 1,
    defense: 0,
    hp: 0,
    crit: 0,
  },
  {
    name: '식빵 한 조각',
    rarity: 'common',
    emoji: '🍞',
    attack: 0,
    defense: 0,
    hp: 4,
    crit: 0,
  },
  {
    name: '찢어진 우산',
    rarity: 'common',
    emoji: '☂️',
    attack: 0,
    defense: 2,
    hp: 0,
    crit: 0,
  },
  {
    name: '오래된 배터리',
    rarity: 'common',
    emoji: '🔋',
    attack: 2,
    defense: 0,
    hp: 0,
    crit: 0,
  },
  {
    name: '말라붙은 껌',
    rarity: 'common',
    emoji: '🫧',
    attack: 0,
    defense: 1,
    hp: 0,
    crit: 0.01,
  },
  {
    name: '벌레 한 마리',
    rarity: 'common',
    emoji: '🐛',
    attack: 1,
    defense: 0,
    hp: 1,
    crit: 0,
  },
  {
    name: '녹슨 못',
    rarity: 'common',
    emoji: '📌',
    attack: 3,
    defense: 0,
    hp: 0,
    crit: 0,
  },
  {
    name: '반쪽짜리 지우개',
    rarity: 'common',
    emoji: '🧽',
    attack: 0,
    defense: 0,
    hp: 2,
    crit: 0,
  },
  {
    name: '누군가의 영수증',
    rarity: 'common',
    emoji: '🧾',
    attack: 0,
    defense: 0,
    hp: 1,
    crit: 0.01,
  },
  {
    name: '플라스틱 포크',
    rarity: 'common',
    emoji: '🍴',
    attack: 2,
    defense: 0,
    hp: 0,
    crit: 0,
  },
  {
    name: '구멍난 주머니',
    rarity: 'common',
    emoji: '👖',
    attack: 0,
    defense: 1,
    hp: 1,
    crit: 0,
  },
  {
    name: '마른 나뭇잎',
    rarity: 'common',
    emoji: '🍂',
    attack: 0,
    defense: 0,
    hp: 3,
    crit: 0,
  },
  {
    name: '깨진 컵',
    rarity: 'common',
    emoji: '☕',
    attack: 1,
    defense: 0,
    hp: 2,
    crit: 0,
  },
  {
    name: '누군가의 머리카락',
    rarity: 'common',
    emoji: '💇',
    attack: 0,
    defense: 0,
    hp: 0,
    crit: 0.02,
  },
  {
    name: '접착 테이프',
    rarity: 'common',
    emoji: '📎',
    attack: 0,
    defense: 2,
    hp: 0,
    crit: 0,
  },
  {
    name: '다 쓴 건전지',
    rarity: 'common',
    emoji: '🪫',
    attack: 1,
    defense: 0,
    hp: 1,
    crit: 0,
  },
  {
    name: '오래된 동전',
    rarity: 'common',
    emoji: '🪙',
    attack: 0,
    defense: 1,
    hp: 0,
    crit: 0.01,
  },

  // ═══════════════════════════════════════
  //  Uncommon (25%) — 쓸만한 잡동사니
  // ═══════════════════════════════════════
  {
    name: '녹슨 칼',
    rarity: 'uncommon',
    emoji: '🗡️',
    attack: 5,
    defense: 0,
    hp: 0,
    crit: 0.02,
  },
  {
    name: '가죽 갑옷',
    rarity: 'uncommon',
    emoji: '🦺',
    attack: 0,
    defense: 5,
    hp: 10,
    crit: 0,
  },
  {
    name: '마법 반지',
    rarity: 'uncommon',
    emoji: '💍',
    attack: 3,
    defense: 3,
    hp: 0,
    crit: 0.01,
  },
  {
    name: '치킨 뼈다귀',
    rarity: 'uncommon',
    emoji: '🍗',
    attack: 4,
    defense: 0,
    hp: 5,
    crit: 0,
  },
  {
    name: '쿠션 방패',
    rarity: 'uncommon',
    emoji: '🛡️',
    attack: 0,
    defense: 7,
    hp: 0,
    crit: 0,
  },
  {
    name: '매운 고추',
    rarity: 'uncommon',
    emoji: '🌶️',
    attack: 6,
    defense: 0,
    hp: 0,
    crit: 0.01,
  },
  {
    name: '수상한 물약',
    rarity: 'uncommon',
    emoji: '🧪',
    attack: 0,
    defense: 0,
    hp: 15,
    crit: 0.02,
  },
  {
    name: '강화된 슬리퍼',
    rarity: 'uncommon',
    emoji: '🩴',
    attack: 5,
    defense: 2,
    hp: 0,
    crit: 0,
  },
  {
    name: '고양이 발톱',
    rarity: 'uncommon',
    emoji: '🐱',
    attack: 4,
    defense: 0,
    hp: 0,
    crit: 0.03,
  },
  {
    name: '철제 프라이팬',
    rarity: 'uncommon',
    emoji: '🍳',
    attack: 6,
    defense: 3,
    hp: 0,
    crit: 0,
  },
  {
    name: '포도주스',
    rarity: 'uncommon',
    emoji: '🍇',
    attack: 0,
    defense: 0,
    hp: 12,
    crit: 0.01,
  },
  {
    name: '강아지 인형',
    rarity: 'uncommon',
    emoji: '🐶',
    attack: 0,
    defense: 4,
    hp: 8,
    crit: 0,
  },
  {
    name: '망토 조각',
    rarity: 'uncommon',
    emoji: '🧣',
    attack: 0,
    defense: 6,
    hp: 5,
    crit: 0,
  },
  {
    name: '던지기용 별',
    rarity: 'uncommon',
    emoji: '⭐',
    attack: 5,
    defense: 0,
    hp: 0,
    crit: 0.02,
  },
  {
    name: '수상한 부적',
    rarity: 'uncommon',
    emoji: '📿',
    attack: 2,
    defense: 2,
    hp: 5,
    crit: 0.01,
  },
  {
    name: '강화 붕대',
    rarity: 'uncommon',
    emoji: '🩹',
    attack: 0,
    defense: 3,
    hp: 10,
    crit: 0,
  },
  {
    name: '고무 망치',
    rarity: 'uncommon',
    emoji: '🔨',
    attack: 5,
    defense: 1,
    hp: 0,
    crit: 0.01,
  },
  {
    name: '도시락 폭탄',
    rarity: 'uncommon',
    emoji: '🍱',
    attack: 3,
    defense: 0,
    hp: 8,
    crit: 0.01,
  },
  {
    name: '마법 깃털',
    rarity: 'uncommon',
    emoji: '🪶',
    attack: 2,
    defense: 0,
    hp: 0,
    crit: 0.04,
  },
  {
    name: '강화된 모자',
    rarity: 'uncommon',
    emoji: '🧢',
    attack: 0,
    defense: 5,
    hp: 5,
    crit: 0.01,
  },
  {
    name: '소금 주머니',
    rarity: 'uncommon',
    emoji: '🧂',
    attack: 4,
    defense: 0,
    hp: 3,
    crit: 0,
  },
  {
    name: '장난감 칼',
    rarity: 'uncommon',
    emoji: '🔪',
    attack: 6,
    defense: 0,
    hp: 0,
    crit: 0.01,
  },
  {
    name: '에너지 드링크',
    rarity: 'uncommon',
    emoji: '🥤',
    attack: 3,
    defense: 0,
    hp: 8,
    crit: 0.01,
  },
  {
    name: '무지개 사탕',
    rarity: 'uncommon',
    emoji: '🍬',
    attack: 0,
    defense: 0,
    hp: 15,
    crit: 0,
  },
  {
    name: '은빛 팔찌',
    rarity: 'uncommon',
    emoji: '⛓️',
    attack: 2,
    defense: 4,
    hp: 0,
    crit: 0.01,
  },

  // ═══════════════════════════════════════
  //  Rare (15%) — 제법 쓸만한 장비
  // ═══════════════════════════════════════
  {
    name: '불꽃 검',
    rarity: 'rare',
    emoji: '🔥',
    attack: 10,
    defense: 0,
    hp: 0,
    crit: 0.05,
  },
  {
    name: '얼음 갑옷',
    rarity: 'rare',
    emoji: '🧊',
    attack: 0,
    defense: 12,
    hp: 20,
    crit: 0,
  },
  {
    name: '번개 지팡이',
    rarity: 'rare',
    emoji: '⚡',
    attack: 12,
    defense: 0,
    hp: 0,
    crit: 0.03,
  },
  {
    name: '힐링 오브',
    rarity: 'rare',
    emoji: '💚',
    attack: 0,
    defense: 5,
    hp: 50,
    crit: 0,
  },
  {
    name: '바람의 단검',
    rarity: 'rare',
    emoji: '🌪️',
    attack: 8,
    defense: 0,
    hp: 0,
    crit: 0.08,
  },
  {
    name: '독 묻은 화살',
    rarity: 'rare',
    emoji: '🏹',
    attack: 11,
    defense: 0,
    hp: 0,
    crit: 0.04,
  },
  {
    name: '강철 부츠',
    rarity: 'rare',
    emoji: '🥾',
    attack: 3,
    defense: 10,
    hp: 10,
    crit: 0,
  },
  {
    name: '마법사의 모자',
    rarity: 'rare',
    emoji: '🎩',
    attack: 7,
    defense: 3,
    hp: 0,
    crit: 0.05,
  },
  {
    name: '고대 부적',
    rarity: 'rare',
    emoji: '🔮',
    attack: 5,
    defense: 5,
    hp: 15,
    crit: 0.02,
  },
  {
    name: '어둠의 망토',
    rarity: 'rare',
    emoji: '🦇',
    attack: 0,
    defense: 8,
    hp: 0,
    crit: 0.07,
  },
  {
    name: '화염 방패',
    rarity: 'rare',
    emoji: '🛡️',
    attack: 0,
    defense: 15,
    hp: 10,
    crit: 0,
  },
  {
    name: '도깨비 방망이',
    rarity: 'rare',
    emoji: '🏏',
    attack: 13,
    defense: 0,
    hp: 5,
    crit: 0.02,
  },
  {
    name: '용사의 장갑',
    rarity: 'rare',
    emoji: '🧤',
    attack: 8,
    defense: 5,
    hp: 0,
    crit: 0.03,
  },
  {
    name: '생명의 물약',
    rarity: 'rare',
    emoji: '💉',
    attack: 0,
    defense: 0,
    hp: 40,
    crit: 0.03,
  },
  {
    name: '우주 망원경',
    rarity: 'rare',
    emoji: '🔭',
    attack: 5,
    defense: 0,
    hp: 0,
    crit: 0.1,
  },
  {
    name: '수정 구슬',
    rarity: 'rare',
    emoji: '🔮',
    attack: 6,
    defense: 6,
    hp: 6,
    crit: 0.03,
  },
  {
    name: '닌자 슈리켄',
    rarity: 'rare',
    emoji: '💠',
    attack: 10,
    defense: 0,
    hp: 0,
    crit: 0.06,
  },
  {
    name: '미스릴 반지',
    rarity: 'rare',
    emoji: '💎',
    attack: 4,
    defense: 8,
    hp: 10,
    crit: 0.02,
  },
  {
    name: '뱀파이어 이빨',
    rarity: 'rare',
    emoji: '🧛',
    attack: 9,
    defense: 0,
    hp: 15,
    crit: 0.04,
  },
  {
    name: '천사의 날개깃',
    rarity: 'rare',
    emoji: '🪽',
    attack: 0,
    defense: 7,
    hp: 25,
    crit: 0.03,
  },

  // ═══════════════════════════════════════
  //  Epic (10%) — 이거 좀 치는데?
  // ═══════════════════════════════════════
  {
    name: '용의 발톱',
    rarity: 'epic',
    emoji: '🐉',
    attack: 18,
    defense: 5,
    hp: 10,
    crit: 0.08,
  },
  {
    name: '암흑 로브',
    rarity: 'epic',
    emoji: '🌑',
    attack: 10,
    defense: 15,
    hp: 0,
    crit: 0.05,
  },
  {
    name: '성스러운 방패',
    rarity: 'epic',
    emoji: '✨',
    attack: 0,
    defense: 25,
    hp: 30,
    crit: 0,
  },
  {
    name: '악마의 뿔',
    rarity: 'epic',
    emoji: '😈',
    attack: 22,
    defense: 0,
    hp: 0,
    crit: 0.1,
  },
  {
    name: '정령왕의 지팡이',
    rarity: 'epic',
    emoji: '🌿',
    attack: 15,
    defense: 8,
    hp: 20,
    crit: 0.05,
  },
  {
    name: '불사조 깃털',
    rarity: 'epic',
    emoji: '🐦‍🔥',
    attack: 12,
    defense: 0,
    hp: 40,
    crit: 0.06,
  },
  {
    name: '심해의 삼지창',
    rarity: 'epic',
    emoji: '🔱',
    attack: 20,
    defense: 5,
    hp: 10,
    crit: 0.05,
  },
  {
    name: '타이탄의 건틀릿',
    rarity: 'epic',
    emoji: '🤜',
    attack: 16,
    defense: 12,
    hp: 15,
    crit: 0.03,
  },
  {
    name: '달빛 활',
    rarity: 'epic',
    emoji: '🌙',
    attack: 17,
    defense: 0,
    hp: 0,
    crit: 0.12,
  },
  {
    name: '대지의 갑옷',
    rarity: 'epic',
    emoji: '🏔️',
    attack: 0,
    defense: 28,
    hp: 20,
    crit: 0,
  },
  {
    name: '저주받은 인형',
    rarity: 'epic',
    emoji: '🪆',
    attack: 14,
    defense: 0,
    hp: 0,
    crit: 0.15,
  },
  {
    name: '전투 고양이',
    rarity: 'epic',
    emoji: '😼',
    attack: 13,
    defense: 10,
    hp: 10,
    crit: 0.07,
  },
  {
    name: '무한의 두루마리',
    rarity: 'epic',
    emoji: '📜',
    attack: 10,
    defense: 10,
    hp: 10,
    crit: 0.06,
  },
  {
    name: '흑마법서',
    rarity: 'epic',
    emoji: '📕',
    attack: 20,
    defense: 0,
    hp: 0,
    crit: 0.08,
  },
  {
    name: '성기사의 검',
    rarity: 'epic',
    emoji: '⚜️',
    attack: 18,
    defense: 8,
    hp: 15,
    crit: 0.04,
  },
  {
    name: '얼음 여왕의 왕관',
    rarity: 'epic',
    emoji: '👑',
    attack: 8,
    defense: 18,
    hp: 10,
    crit: 0.06,
  },
  {
    name: '천둥신의 망치',
    rarity: 'epic',
    emoji: '🔨',
    attack: 22,
    defense: 5,
    hp: 0,
    crit: 0.06,
  },
  {
    name: '마왕의 부적',
    rarity: 'epic',
    emoji: '🧿',
    attack: 15,
    defense: 15,
    hp: 0,
    crit: 0.05,
  },

  // ═══════════════════════════════════════
  //  Legendary (4%) — 서버에서 자랑할 수 있음
  // ═══════════════════════════════════════
  {
    name: '엑스칼리버',
    rarity: 'legendary',
    emoji: '⚔️',
    attack: 30,
    defense: 10,
    hp: 20,
    crit: 0.15,
  },
  {
    name: '무적의 갑옷',
    rarity: 'legendary',
    emoji: '🏰',
    attack: 5,
    defense: 40,
    hp: 50,
    crit: 0,
  },
  {
    name: '용왕의 비늘',
    rarity: 'legendary',
    emoji: '🐲',
    attack: 25,
    defense: 20,
    hp: 30,
    crit: 0.1,
  },
  {
    name: '천상의 활',
    rarity: 'legendary',
    emoji: '🌈',
    attack: 28,
    defense: 0,
    hp: 0,
    crit: 0.2,
  },
  {
    name: '마왕의 대검',
    rarity: 'legendary',
    emoji: '🗡️',
    attack: 35,
    defense: 5,
    hp: 10,
    crit: 0.12,
  },
  {
    name: '세계수의 가지',
    rarity: 'legendary',
    emoji: '🌳',
    attack: 10,
    defense: 15,
    hp: 80,
    crit: 0.05,
  },
  {
    name: '시간의 모래시계',
    rarity: 'legendary',
    emoji: '⏳',
    attack: 20,
    defense: 20,
    hp: 20,
    crit: 0.1,
  },
  {
    name: '오딘의 눈',
    rarity: 'legendary',
    emoji: '👁️',
    attack: 15,
    defense: 10,
    hp: 0,
    crit: 0.25,
  },
  {
    name: '소울 이터',
    rarity: 'legendary',
    emoji: '💀',
    attack: 38,
    defense: 0,
    hp: 0,
    crit: 0.15,
  },
  {
    name: '차원의 갑옷',
    rarity: 'legendary',
    emoji: '🌀',
    attack: 0,
    defense: 45,
    hp: 40,
    crit: 0.05,
  },
  {
    name: '불멸의 심장',
    rarity: 'legendary',
    emoji: '❤️‍🔥',
    attack: 10,
    defense: 10,
    hp: 100,
    crit: 0.08,
  },
  {
    name: '신의 장갑',
    rarity: 'legendary',
    emoji: '🧤',
    attack: 25,
    defense: 15,
    hp: 25,
    crit: 0.12,
  },

  // ═══════════════════════════════════════
  //  Mythic (1%) — 전설 속의 전설
  // ═══════════════════════════════════════
  {
    name: '세계를 멸망시키는 고무 오리',
    rarity: 'mythic',
    emoji: '🦆',
    attack: 50,
    defense: 30,
    hp: 100,
    crit: 0.25,
  },
  {
    name: '시간을 되돌리는 감자',
    rarity: 'mythic',
    emoji: '🥔',
    attack: 40,
    defense: 40,
    hp: 50,
    crit: 0.2,
  },
  {
    name: '우주를 씹어먹는 츄파춥스',
    rarity: 'mythic',
    emoji: '🍭',
    attack: 55,
    defense: 20,
    hp: 80,
    crit: 0.18,
  },
  {
    name: '차원을 베는 슬리퍼',
    rarity: 'mythic',
    emoji: '🩴',
    attack: 60,
    defense: 10,
    hp: 50,
    crit: 0.22,
  },
  {
    name: '신이 실수로 떨어뜨린 리모컨',
    rarity: 'mythic',
    emoji: '📱',
    attack: 35,
    defense: 35,
    hp: 100,
    crit: 0.2,
  },
  {
    name: '전지전능한 고양이',
    rarity: 'mythic',
    emoji: '🐈‍⬛',
    attack: 45,
    defense: 25,
    hp: 80,
    crit: 0.25,
  },
  {
    name: '빅뱅 주먹밥',
    rarity: 'mythic',
    emoji: '🍙',
    attack: 30,
    defense: 30,
    hp: 150,
    crit: 0.15,
  },
  {
    name: '만물을 삼키는 검은 구멍',
    rarity: 'mythic',
    emoji: '🕳️',
    attack: 70,
    defense: 0,
    hp: 0,
    crit: 0.3,
  },
  {
    name: '42번째 차원의 열쇠',
    rarity: 'mythic',
    emoji: '🗝️',
    attack: 42,
    defense: 42,
    hp: 42,
    crit: 0.2,
  },
  {
    name: '인터넷을 조종하는 마우스',
    rarity: 'mythic',
    emoji: '🖱️',
    attack: 50,
    defense: 20,
    hp: 60,
    crit: 0.25,
  },
]

function rollGacha(): GachaItem {
  const roll = Math.random() * 100
  let rarity: string

  if (roll < 1) rarity = 'mythic'
  else if (roll < 5) rarity = 'legendary'
  else if (roll < 15) rarity = 'epic'
  else if (roll < 30) rarity = 'rare'
  else if (roll < 55) rarity = 'uncommon'
  else rarity = 'common'

  const pool = gachaPool.filter((i) => i.rarity === rarity)
  return pick(pool)
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const user = interaction.user
  const guildId = interaction.guildId!

  const player = getOrCreatePlayer(user.id, guildId, user.username)

  if (player.gold < 100) {
    await interaction.reply({
      content: `💰 골드가 부족합니다! (현재: ${player.gold}G / 필요: 100G)\n\`/daily\`로 골드를 모으세요!`,
      ephemeral: true,
    })
    return
  }

  addGold(user.id, guildId, -100)
  const item = rollGacha()

  // ── Phase 1: 돌리는 중 ──
  const embed1 = new EmbedBuilder()
    .setColor(0x2c2f33)
    .setTitle('🎰 가챠 돌리는 중...')
    .setDescription(
      '```\n' +
        '  ╔══════════════╗\n' +
        '  ║  🎰 🎰 🎰   ║\n' +
        '  ║   돌리는 중...  ║\n' +
        '  ╚══════════════╝\n' +
        '```',
    )
  await interaction.reply({ embeds: [embed1] })

  await sleep(1500)

  // ── Phase 2: 빛이 난다 ──
  const glowColor =
    item.rarity === 'mythic' || item.rarity === 'legendary'
      ? 0xffd700
      : item.rarity === 'epic'
        ? 0x9b59b6
        : item.rarity === 'rare'
          ? 0x3498db
          : 0x808080

  const embed2 = new EmbedBuilder()
    .setColor(glowColor)
    .setTitle('🎰 가챠 돌리는 중...')
    .setDescription(
      '```\n' +
        '  ╔══════════════╗\n' +
        '  ║  ✨ ✨ ✨   ║\n' +
        '  ║   빛이 난다...  ║\n' +
        '  ╚══════════════╝\n' +
        '```',
    )
  await interaction.editReply({ embeds: [embed2] })

  await sleep(1500)

  // ── Phase 3: 등급 공개 ──
  const embed3 = new EmbedBuilder()
    .setColor(rarityColors[item.rarity])
    .setTitle('🎰 가챠!')
    .setDescription(
      `등급이 보인다...!\n\n## ${rarityLabels[item.rarity]}\n\n*아이템이 나타나는 중...*`,
    )
  await interaction.editReply({ embeds: [embed3] })

  await sleep(2000)

  // ── Phase 4: 최종 결과 ──
  addItem(user.id, {
    item_name: item.name,
    item_rarity: item.rarity,
    item_emoji: item.emoji,
    attack_bonus: item.attack,
    defense_bonus: item.defense,
    hp_bonus: item.hp,
    crit_bonus: item.crit,
  })

  const stats: string[] = []
  if (item.attack > 0) stats.push(`⚔️ 공격력 +${item.attack}`)
  if (item.defense > 0) stats.push(`🛡️ 방어력 +${item.defense}`)
  if (item.hp > 0) stats.push(`❤️ HP +${item.hp}`)
  if (item.crit > 0) stats.push(`🎯 크리티컬 +${(item.crit * 100).toFixed(0)}%`)

  const finalEmbed = new EmbedBuilder()
    .setColor(rarityColors[item.rarity])
    .setTitle('🎰 가챠 결과!')
    .setDescription(
      `${item.emoji} **${item.name}**\n` +
        `등급: ${rarityLabels[item.rarity]}\n\n` +
        (stats.length > 0 ? stats.join(' | ') : '특수 능력 없음'),
    )

  if (item.rarity === 'legendary' || item.rarity === 'mythic') {
    finalEmbed.addFields({
      name: '🎊 대박!!!',
      value:
        item.rarity === 'mythic'
          ? '🌟 **신화급 아이템 획득!!!** 서버 전체가 부러워합니다!'
          : '✨ **전설급 아이템 획득!** 축하합니다!',
    })
    if (item.rarity === 'mythic') {
      addTitle(user.id, guildId, '🦆 신화 수집가')
    }
  }

  if (item.rarity === 'common') {
    const sadMessages = [
      '😐 ...뭐, 세상이 다 그런 거지.',
      '🗑️ 이거 환불 안 되나요?',
      '💀 100G가 아깝다...',
      '😭 다음에는 전설이 나올 거야... 아마...',
    ]
    finalEmbed.addFields({
      name: '😢',
      value: pick(sadMessages),
    })
  }

  finalEmbed.setFooter({ text: `잔여 골드: ${player.gold - 100}G` })
  finalEmbed.setTimestamp()

  await interaction.editReply({ embeds: [finalEmbed] })
}
