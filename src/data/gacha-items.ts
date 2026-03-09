export interface GachaItem {
  name: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic'
  type: 'equipment' | 'consumable' | 'material'
  emoji: string
  attack: number
  defense: number
  hp: number
  crit: number
  useEffect?: string // description for consumables
}

// ──────────────────────────────────────
//  Hand-crafted signature items
// ──────────────────────────────────────

// All handcrafted items default to 'equipment' type
const _rawHandcraftedItems: Omit<GachaItem, 'type'>[] = [
  // ═══ Common (45%) ═══
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
    name: '누군가의 머리카락',
    rarity: 'common',
    emoji: '💇',
    attack: 0,
    defense: 0,
    hp: 0,
    crit: 0.02,
  },
  {
    name: '곰팡이 핀 빵',
    rarity: 'common',
    emoji: '🍞',
    attack: 0,
    defense: 0,
    hp: 2,
    crit: 0,
  },
  {
    name: '구부러진 숟가락',
    rarity: 'common',
    emoji: '🥄',
    attack: 1,
    defense: 0,
    hp: 0,
    crit: 0.01,
  },
  {
    name: '쓰레기봉투',
    rarity: 'common',
    emoji: '🗑️',
    attack: 0,
    defense: 2,
    hp: 1,
    crit: 0,
  },
  {
    name: '기름때 묻은 행주',
    rarity: 'common',
    emoji: '🧻',
    attack: 0,
    defense: 1,
    hp: 0,
    crit: 0,
  },
  {
    name: '고장난 시계',
    rarity: 'common',
    emoji: '⌚',
    attack: 0,
    defense: 0,
    hp: 0,
    crit: 0.02,
  },
  {
    name: '빗자루 자루',
    rarity: 'common',
    emoji: '🧹',
    attack: 2,
    defense: 0,
    hp: 0,
    crit: 0,
  },
  {
    name: '휴지 한 장',
    rarity: 'common',
    emoji: '🧻',
    attack: 0,
    defense: 0,
    hp: 1,
    crit: 0,
  },
  {
    name: '낡은 운동화',
    rarity: 'common',
    emoji: '👟',
    attack: 0,
    defense: 1,
    hp: 2,
    crit: 0,
  },
  {
    name: '물에 젖은 성냥',
    rarity: 'common',
    emoji: '🔥',
    attack: 1,
    defense: 0,
    hp: 0,
    crit: 0,
  },
  {
    name: '바람 빠진 풍선',
    rarity: 'common',
    emoji: '🎈',
    attack: 0,
    defense: 0,
    hp: 2,
    crit: 0,
  },

  // ═══ Uncommon (25%) ═══
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

  // ═══ Rare (15%) ═══
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

  // ═══ Epic (10%) ═══
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

  // ═══ Legendary (4%) ═══
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

  // ═══ Mythic (1%) ═══
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

// Map raw handcrafted items to include type
const handcraftedItems: GachaItem[] = _rawHandcraftedItems.map((item) => ({
  ...item,
  type: 'equipment' as const,
}))

// ──────────────────────────────────────
//  Template-based generation for ~10,000 items
// ──────────────────────────────────────

interface ItemTemplate {
  prefixes: string[]
  bases: { name: string; emoji: string }[]
  suffixes: string[]
}

const commonTemplates: ItemTemplate = {
  prefixes: [
    '깨진',
    '녹슨',
    '낡은',
    '구부러진',
    '잊혀진',
    '버려진',
    '젖은',
    '곰팡이 핀',
    '먼지 묻은',
    '쓸모없는',
    '의문의',
    '찢어진',
    '못생긴',
    '유통기한 지난',
    '중고',
    '짝퉁',
    '할인된',
    '반품된',
    '재활용',
    '약한',
    '작은',
    '미니',
    '가짜',
    '싸구려',
    '저렴한',
    '지저분한',
    '손상된',
    '휘어진',
    '색바랜',
    '때묻은',
    '무거운',
    '무딘',
    '삐걱거리는',
    '허름한',
    '초라한',
    '낡아빠진',
    '볼품없는',
    '수상쩍은',
    '엉성한',
    '쓸데없는',
  ],
  bases: [
    { name: '검', emoji: '🗡️' },
    { name: '방패', emoji: '🛡️' },
    { name: '반지', emoji: '💍' },
    { name: '목걸이', emoji: '📿' },
    { name: '모자', emoji: '🎩' },
    { name: '장갑', emoji: '🧤' },
    { name: '부츠', emoji: '👢' },
    { name: '망토', emoji: '🧥' },
    { name: '허리띠', emoji: '🪢' },
    { name: '팔찌', emoji: '⌚' },
    { name: '주먹밥', emoji: '🍙' },
    { name: '쿠키', emoji: '🍪' },
    { name: '사과', emoji: '🍎' },
    { name: '물병', emoji: '🍶' },
    { name: '돌', emoji: '🪨' },
    { name: '나뭇가지', emoji: '🪵' },
    { name: '인형', emoji: '🧸' },
    { name: '열쇠', emoji: '🔑' },
    { name: '나침반', emoji: '🧭' },
    { name: '양초', emoji: '🕯️' },
    { name: '안경', emoji: '👓' },
    { name: '구두', emoji: '👞' },
    { name: '넥타이', emoji: '👔' },
    { name: '노트', emoji: '📓' },
    { name: '담요', emoji: '🛏️' },
  ],
  suffixes: [
    '',
    '(파손)',
    '(불량)',
    '(중고)',
    '(수선됨)',
    '(더러운)',
    '(임시방편)',
    '(복제품)',
    '(모조품)',
    '(혹시나)',
    '(일단)',
    '(혹여나)',
  ],
}

const uncommonTemplates: ItemTemplate = {
  prefixes: [
    '강화된',
    '마법의',
    '은빛',
    '단단한',
    '빛나는',
    '가벼운',
    '정밀한',
    '예리한',
    '부드러운',
    '재빠른',
    '축복받은',
    '특수한',
    '강철',
    '청동',
    '경량',
    '집중의',
    '수호의',
    '감시자의',
    '민첩한',
    '균형잡힌',
    '비전의',
    '영리한',
    '신뢰할 만한',
    '탄탄한',
    '우아한',
    '세심한',
    '치밀한',
    '정교한',
    '단련된',
    '청명한',
    '활기찬',
    '활발한',
    '경계의',
    '잠재적',
    '숨겨진',
    '신중한',
    '능숙한',
    '숙련된',
  ],
  bases: [
    { name: '검', emoji: '⚔️' },
    { name: '방패', emoji: '🛡️' },
    { name: '활', emoji: '🏹' },
    { name: '지팡이', emoji: '🪄' },
    { name: '갑옷', emoji: '🦺' },
    { name: '투구', emoji: '⛑️' },
    { name: '장갑', emoji: '🧤' },
    { name: '부츠', emoji: '🥾' },
    { name: '반지', emoji: '💍' },
    { name: '목걸이', emoji: '📿' },
    { name: '귀걸이', emoji: '💎' },
    { name: '망토', emoji: '🧣' },
    { name: '단검', emoji: '🔪' },
    { name: '도끼', emoji: '🪓' },
    { name: '해머', emoji: '🔨' },
    { name: '허리띠', emoji: '🪢' },
    { name: '물약', emoji: '🧪' },
    { name: '두루마리', emoji: '📜' },
    { name: '창', emoji: '🔱' },
    { name: '채찍', emoji: '🪢' },
  ],
  suffixes: [
    '',
    '(기본)',
    '(일반)',
    '(+1)',
    '(개량)',
    '(시제품)',
    '(연습용)',
    '(개선)',
    '(1단계)',
    '(소형)',
    '(경량형)',
  ],
}

const rareTemplates: ItemTemplate = {
  prefixes: [
    '불꽃의',
    '얼음의',
    '번개의',
    '바람의',
    '대지의',
    '암흑의',
    '빛의',
    '독의',
    '피의',
    '강철의',
    '마법사의',
    '전사의',
    '기사의',
    '사냥꾼의',
    '도적의',
    '성직자의',
    '현자의',
    '왕실의',
    '용암의',
    '폭풍의',
    '심해의',
    '천공의',
    '황금의',
    '신비한',
    '강림한',
    '조각된',
    '봉인의',
    '냉혹한',
  ],
  bases: [
    { name: '대검', emoji: '⚔️' },
    { name: '장검', emoji: '🗡️' },
    { name: '전투 방패', emoji: '🛡️' },
    { name: '전투 활', emoji: '🏹' },
    { name: '마법봉', emoji: '🪄' },
    { name: '판금갑옷', emoji: '🦺' },
    { name: '전투 투구', emoji: '⛑️' },
    { name: '전투 장갑', emoji: '🧤' },
    { name: '전투 부츠', emoji: '🥾' },
    { name: '마법 반지', emoji: '💍' },
    { name: '마력 목걸이', emoji: '📿' },
    { name: '전투 망토', emoji: '🧣' },
    { name: '쌍검', emoji: '⚔️' },
    { name: '전투 도끼', emoji: '🪓' },
    { name: '전투 해머', emoji: '🔨' },
    { name: '마법 지팡이', emoji: '🪄' },
    { name: '크리스탈 오브', emoji: '🔮' },
    { name: '룬 두루마리', emoji: '📜' },
    { name: '전술 창', emoji: '🔱' },
    { name: '전술 로브', emoji: '🧥' },
  ],
  suffixes: [
    '',
    '(기본)',
    '(+2)',
    '(강화)',
    '(축복)',
    '(각성)',
    '(보강)',
    '(성수)',
    '(단련)',
    '(심연)',
    '(고대의)',
  ],
}

const epicTemplates: ItemTemplate = {
  prefixes: [
    '용의',
    '피닉스의',
    '심연의',
    '천상의',
    '폭풍의',
    '절대의',
    '지배자의',
    '파괴자의',
    '수호자의',
    '창조자의',
    '고대의',
    '영원의',
    '운명의',
    '심판의',
    '예언자의',
    '무한의',
    '차원의',
    '영혼의',
    '봉인된',
    '해방의',
    '재앙의',
    '공허의',
    '시공의',
    '신성한',
    '칠흑의',
    '태초의',
  ],
  bases: [
    { name: '마검', emoji: '⚔️' },
    { name: '신성 방패', emoji: '🛡️' },
    { name: '마궁', emoji: '🏹' },
    { name: '대지팡이', emoji: '🪄' },
    { name: '드래곤 아머', emoji: '🐉' },
    { name: '천사의 투구', emoji: '👑' },
    { name: '흑철 건틀릿', emoji: '🤜' },
    { name: '바람신의 부츠', emoji: '🥾' },
    { name: '마왕의 반지', emoji: '💍' },
    { name: '용사의 목걸이', emoji: '📿' },
    { name: '천상의 귀걸이', emoji: '💎' },
    { name: '어둠왕의 망토', emoji: '🌑' },
    { name: '마력 폭탄', emoji: '💣' },
    { name: '정령의 인장', emoji: '🧿' },
    { name: '불멸의 오브', emoji: '🔮' },
    { name: '비전 두루마리', emoji: '📜' },
    { name: '혼돈의 오브', emoji: '💥' },
    { name: '정령 오라', emoji: '🌟' },
  ],
  suffixes: [
    '',
    '(기본)',
    '(+3)',
    '(초월)',
    '(각인)',
    '(영혼 결합)',
    '(+4)',
    '(궁극형)',
    '(재앙)',
  ],
}

const legendaryTemplates: ItemTemplate = {
  prefixes: [
    '신들의',
    '세계를 가르는',
    '별을 삼킨',
    '운명을 바꾸는',
    '차원을 찢는',
    '영겁의',
    '만물의',
    '절대자의',
    '원초의',
    '종말의',
    '시간을 멈추는',
    '공간을 왜곡하는',
    '영혼을 지배하는',
    '신화 속',
    '존재를 초월한',
    '세계를 지배하는',
    '불멸을 깨뜨리는',
    '진실을 담은',
    '허공을 가르는',
    '빛과 어둠의',
    '경이로운',
    '초고대의',
  ],
  bases: [
    { name: '성검', emoji: '⚔️' },
    { name: '신성 갑옷', emoji: '🏰' },
    { name: '천궁', emoji: '🏹' },
    { name: '세계수 지팡이', emoji: '🌳' },
    { name: '신의 왕관', emoji: '👑' },
    { name: '드래곤 하트', emoji: '❤️‍🔥' },
    { name: '타임 오브', emoji: '⏳' },
    { name: '바하무트의 비늘', emoji: '🐲' },
    { name: '은하의 반지', emoji: '💍' },
    { name: '루시퍼의 날개', emoji: '🪽' },
    { name: '영혼 수확기', emoji: '💀' },
    { name: '차원 절단기', emoji: '🌀' },
    { name: '신화의 철퇴', emoji: '🔨' },
    { name: '불사조의 갑옷', emoji: '🔥' },
  ],
  suffixes: [
    '',
    '(기본)',
    '(+5)',
    '(궁극)',
    '(초월체)',
    '(각성 완료)',
    '(신화 직전)',
  ],
}

const mythicTemplates: ItemTemplate = {
  prefixes: [
    '우주를 멸망시키는',
    '차원을 삼키는',
    '만물을 창조하는',
    '시공간을 지배하는',
    '존재를 초월하는',
    '세계를 리셋하는',
    '신을 쓰러뜨리는',
    '현실을 무시하는',
    '법칙을 파괴하는',
    '은하를 집어삼키는',
    '다중우주를 지배하는',
    '인과율을 무시하는',
  ],
  bases: [
    { name: '고무 오리', emoji: '🦆' },
    { name: '슬리퍼', emoji: '🩴' },
    { name: '빨래판', emoji: '🧺' },
    { name: '리모컨', emoji: '📱' },
    { name: '국자', emoji: '🥄' },
    { name: '수박', emoji: '🍉' },
    { name: '고양이', emoji: '🐈‍⬛' },
    { name: '키보드', emoji: '⌨️' },
    { name: '주먹밥', emoji: '🍙' },
    { name: '양말', emoji: '🧦' },
    { name: '시계', emoji: '⏰' },
    { name: '마우스', emoji: '🖱️' },
    { name: '감자', emoji: '🥔' },
    { name: '풍선', emoji: '🎈' },
    { name: '우산', emoji: '☂️' },
    { name: '젓가락', emoji: '🥢' },
  ],
  suffixes: ['', '(기본)', '(EX)', '(Ω)', '(∞)'],
}

// Stat ranges per rarity
const statRanges = {
  common: { attack: [0, 3], defense: [0, 2], hp: [0, 5], crit: [0, 0.02] },
  uncommon: { attack: [2, 7], defense: [1, 7], hp: [3, 15], crit: [0, 0.04] },
  rare: { attack: [5, 14], defense: [3, 15], hp: [5, 50], crit: [0.02, 0.1] },
  epic: { attack: [8, 25], defense: [5, 28], hp: [10, 40], crit: [0.03, 0.15] },
  legendary: {
    attack: [15, 40],
    defense: [10, 45],
    hp: [20, 100],
    crit: [0.05, 0.25],
  },
  mythic: {
    attack: [30, 70],
    defense: [10, 45],
    hp: [40, 150],
    crit: [0.15, 0.3],
  },
} as const

// Seeded pseudo-random for deterministic generation
function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

function generateItems(
  template: ItemTemplate,
  rarity: GachaItem['rarity'],
  targetCount: number,
  seed: number,
): GachaItem[] {
  const rand = seededRandom(seed)
  const items: GachaItem[] = []
  const usedNames = new Set<string>()
  const range = statRanges[rarity]

  for (const prefix of template.prefixes) {
    for (const base of template.bases) {
      for (const suffix of template.suffixes) {
        if (items.length >= targetCount) break
        const name = `${prefix} ${base.name}${suffix ? ' ' + suffix : ''}`
        if (usedNames.has(name)) continue
        usedNames.add(name)

        // Generate stats with variety — 2 stats prominent, others minor
        const statType = Math.floor(rand() * 4)
        let attack = 0,
          defense = 0,
          hp = 0,
          crit = 0

        const rMin = (key: keyof typeof range) => range[key][0]
        const rMax = (key: keyof typeof range) => range[key][1]
        const randBetween = (min: number, max: number) =>
          min + rand() * (max - min)

        switch (statType) {
          case 0: // Attack focused
            attack = Math.round(
              randBetween(rMin('attack') * 0.7, rMax('attack')),
            )
            defense = Math.round(randBetween(0, rMax('defense') * 0.3))
            hp = Math.round(randBetween(0, rMax('hp') * 0.2))
            crit =
              Math.round(randBetween(rMin('crit'), rMax('crit') * 0.6) * 100) /
              100
            break
          case 1: // Defense focused
            attack = Math.round(randBetween(0, rMax('attack') * 0.3))
            defense = Math.round(
              randBetween(rMin('defense') * 0.7, rMax('defense')),
            )
            hp = Math.round(randBetween(rMin('hp'), rMax('hp') * 0.5))
            crit = Math.round(randBetween(0, rMax('crit') * 0.2) * 100) / 100
            break
          case 2: // HP focused
            attack = Math.round(randBetween(0, rMax('attack') * 0.2))
            defense = Math.round(randBetween(0, rMax('defense') * 0.3))
            hp = Math.round(randBetween(rMin('hp') * 0.7, rMax('hp')))
            crit = Math.round(randBetween(0, rMax('crit') * 0.3) * 100) / 100
            break
          case 3: // Crit focused
            attack = Math.round(
              randBetween(rMin('attack') * 0.5, rMax('attack') * 0.6),
            )
            defense = Math.round(randBetween(0, rMax('defense') * 0.2))
            hp = Math.round(randBetween(0, rMax('hp') * 0.2))
            crit =
              Math.round(randBetween(rMin('crit') * 0.7, rMax('crit')) * 100) /
              100
            break
        }

        items.push({
          name,
          rarity,
          type: 'equipment',
          emoji: base.emoji,
          attack,
          defense,
          hp,
          crit,
        })
      }
      if (items.length >= targetCount) break
    }
    if (items.length >= targetCount) break
  }
  return items.slice(0, targetCount)
}

// Generate items per rarity to fill up to ~50,000 total
const generatedCommon = generateItems(commonTemplates, 'common', 12000, 42)
const generatedUncommon = generateItems(
  uncommonTemplates,
  'uncommon',
  8360,
  137,
)
const generatedRare = generateItems(rareTemplates, 'rare', 6160, 256)
const generatedEpic = generateItems(epicTemplates, 'epic', 4212, 512)
const generatedLegendary = generateItems(
  legendaryTemplates,
  'legendary',
  2156,
  777,
)
const generatedMythic = generateItems(mythicTemplates, 'mythic', 900, 999)

// ──────────────────────────────────────
//  Consumable & Material item generation
// ──────────────────────────────────────

const consumableCommonTemplate: ItemTemplate = {
  prefixes: [
    '싸구려',
    '기본',
    '흔한',
    '오래된',
    '맛없는',
    '수상한',
    '작은',
    '미니',
    '저렴한',
    '할인된',
    '재활용',
    '의문의',
    '남은',
    '구겨진',
    '녹슨',
    '식은',
    '딱딱한',
    '시큼한',
    '이상한',
    '기묘한',
    '색다른',
    '독특한',
    '특이한',
    '이국적인',
    '신기한',
    '예상치 못한',
    '우연한',
    '무작위의',
    '혼합된',
    '잡다한',
  ],
  bases: [
    { name: '물약', emoji: '🧪' },
    { name: '빵', emoji: '🍞' },
    { name: '사과', emoji: '🍎' },
    { name: '쿠키', emoji: '🍪' },
    { name: '주먹밥', emoji: '🍙' },
    { name: '생수', emoji: '💧' },
    { name: '붕대', emoji: '🩹' },
    { name: '허브', emoji: '🌿' },
    { name: '버섯', emoji: '🍄' },
    { name: '열매', emoji: '🫐' },
    { name: '약초', emoji: '🌱' },
    { name: '연고', emoji: '💊' },
    { name: '떡', emoji: '🍡' },
    { name: '캔디', emoji: '🍬' },
    { name: '죽', emoji: '🥣' },
    { name: '젤리', emoji: '🍮' },
    { name: '초콜릿', emoji: '🍫' },
  ],
  suffixes: [
    '',
    '(기본)',
    '(약)',
    '(소)',
    '(잔여분)',
    '(파손)',
    '(작은)',
    '(잔량)',
    '(오래된)',
    '(뚜껑없는)',
  ],
}

const consumableUncommonTemplate: ItemTemplate = {
  prefixes: [
    '강화된',
    '정제된',
    '고급',
    '향기로운',
    '따뜻한',
    '시원한',
    '달콤한',
    '쓴맛의',
    '특제',
    '비밀의',
    '조합사의',
    '약사의',
    '요리사의',
    '마법의',
    '최상급',
    '희귀한',
    '정성스러운',
    '수제',
    '전통',
    '오래 숙성된',
    '황금빛',
    '황제의',
    '프리미엄',
    '선별된',
  ],
  bases: [
    { name: '치유 물약', emoji: '🧪' },
    { name: '에너지 드링크', emoji: '🥫' },
    { name: '스테이크', emoji: '🥩' },
    { name: '스크롤', emoji: '📜' },
    { name: '정령수', emoji: '💧' },
    { name: '만두', emoji: '🥟' },
    { name: '파이', emoji: '🥧' },
    { name: '주스', emoji: '🧃' },
    { name: '거품약', emoji: '🫧' },
    { name: '부적', emoji: '🧿' },
    { name: '향', emoji: '🪔' },
    { name: '요리', emoji: '🍲' },
    { name: '소스', emoji: '🫙' },
  ],
  suffixes: [
    '',
    '(기본)',
    '(중)',
    '(+1)',
    '(개량)',
    '(특제)',
    '(고급)',
    '(특대)',
    '(정품)',
    '(1등급)',
  ],
}

const consumableRareTemplate: ItemTemplate = {
  prefixes: [
    '불꽃의',
    '얼음의',
    '번개의',
    '치유의',
    '강화의',
    '보호의',
    '축복의',
    '성수의',
    '용의',
    '현자의',
    '고대의',
    '왕실의',
    '폭발적인',
    '극한의',
    '최강의',
    '희귀한',
    '비전의',
    '초희귀',
    '영원한',
    '황금의',
  ],
  bases: [
    { name: '엘릭서', emoji: '🧪' },
    { name: '영약', emoji: '💊' },
    { name: '만능약', emoji: '⚗️' },
    { name: '각성제', emoji: '💉' },
    { name: '강화 스크롤', emoji: '📜' },
    { name: '마력 결정', emoji: '🔮' },
    { name: '정령석', emoji: '💎' },
    { name: '신비의 과일', emoji: '🍇' },
    { name: '마법 케이크', emoji: '🎂' },
    { name: '축복 구슬', emoji: '🟢' },
    { name: '진액', emoji: '🌊' },
  ],
  suffixes: [
    '',
    '(기본)',
    '(★)',
    '(대)',
    '(축복)',
    '(정제)',
    '(S급)',
    '(초희귀)',
    '(고대 제조)',
    '(마법진)',
  ],
}

const consumableEpicTemplate: ItemTemplate = {
  prefixes: [
    '용의',
    '피닉스의',
    '심연의',
    '천상의',
    '불멸의',
    '절대의',
    '신성한',
    '금단의',
    '영혼의',
    '차원의',
    '영원한',
    '초월적',
    '환상적',
    '불가사의한',
    '신비로운',
    '경이로운',
    '분열의',
    '전설에 가까운',
  ],
  bases: [
    { name: '불사약', emoji: '⚗️' },
    { name: '전설의 영약', emoji: '🧪' },
    { name: '용의 눈물', emoji: '💧' },
    { name: '세계수 열매', emoji: '🍎' },
    { name: '시간의 모래', emoji: '⏳' },
    { name: '마력 증폭기', emoji: '🔮' },
    { name: '대천사의 깃털', emoji: '🪶' },
    { name: '정령왕의 축복', emoji: '🌟' },
    { name: '신성수', emoji: '💎' },
  ],
  suffixes: ['', '(기본)', '(★★)', '(초월)', '(각성)', '(영혼)', '(귀함)'],
}

const materialCommonTemplate: ItemTemplate = {
  prefixes: [
    '조각난',
    '작은',
    '흔한',
    '거친',
    '낮은등급',
    '잡다한',
    '평범한',
    '얇은',
    '가벼운',
    '싼',
    '잔해의',
    '부서진',
    '마모된',
    '탁한',
    '흩어진',
    '방치된',
    '버려진',
    '찌꺼기',
    '저급한',
    '투박한',
    '반쪽짜리',
    '불완전한',
    '원시적인',
    '날것의',
    '정제 안된',
    '거칠게 만든',
    '쓸모없어 보이는',
    '오래 쌓인',
  ],
  bases: [
    { name: '나무', emoji: '🪵' },
    { name: '돌', emoji: '🪨' },
    { name: '철광석', emoji: '⛏️' },
    { name: '가죽', emoji: '🧶' },
    { name: '천 조각', emoji: '🧵' },
    { name: '뼈', emoji: '🦴' },
    { name: '잡초', emoji: '🌾' },
    { name: '실', emoji: '🧵' },
    { name: '모래', emoji: '🏖️' },
    { name: '점토', emoji: '🏺' },
    { name: '숯', emoji: '♨️' },
    { name: '유리 조각', emoji: '🔩' },
    { name: '흙덩이', emoji: '🪨' },
    { name: '나무 조각', emoji: '🪵' },
  ],
  suffixes: [
    '',
    '(기본)',
    '(소)',
    '(파편)',
    '(잔해)',
    '(저급)',
    '(원료)',
    '(폐기물)',
    '(불량)',
    '(잡동사니)',
    '(수집물)',
  ],
}

const materialUncommonTemplate: ItemTemplate = {
  prefixes: [
    '정제된',
    '가공된',
    '단단한',
    '유연한',
    '빛나는',
    '마법의',
    '강화된',
    '은빛',
    '금빛',
    '순수한',
    '고급',
    '정밀한',
    '고급의',
    '선별된',
    '귀한',
    '마력을 담은',
    '정수의',
    '압축된',
    '고밀도의',
    '결정화된',
    '최상급의',
    '안정된',
  ],
  bases: [
    { name: '강철', emoji: '⚙️' },
    { name: '은괴', emoji: '🪙' },
    { name: '루비 원석', emoji: '🔴' },
    { name: '사파이어 원석', emoji: '🔵' },
    { name: '에메랄드 원석', emoji: '🟢' },
    { name: '미스릴', emoji: '⚪' },
    { name: '마력석', emoji: '🔮' },
    { name: '비단', emoji: '🧣' },
    { name: '용가죽', emoji: '🐲' },
    { name: '달의 조각', emoji: '🌙' },
    { name: '마력 결정', emoji: '🔷' },
  ],
  suffixes: [
    '',
    '(기본)',
    '(정제)',
    '(가공)',
    '(중)',
    '(고급)',
    '(정수)',
    '(최고급)',
    '(압축)',
  ],
}

// Generate consumables
function generateConsumables(
  template: ItemTemplate,
  rarity: GachaItem['rarity'],
  targetCount: number,
  seed: number,
): GachaItem[] {
  const rand = seededRandom(seed)
  const items: GachaItem[] = []
  const usedNames = new Set<string>()
  const range = statRanges[rarity]

  for (const prefix of template.prefixes) {
    for (const base of template.bases) {
      for (const suffix of template.suffixes) {
        if (items.length >= targetCount) break
        const name = `${prefix} ${base.name}${suffix ? ' ' + suffix : ''}`
        if (usedNames.has(name)) continue
        usedNames.add(name)

        const rMin = (key: keyof typeof range) => range[key][0]
        const rMax = (key: keyof typeof range) => range[key][1]
        const randBetween = (min: number, max: number) =>
          min + rand() * (max - min)

        // Consumables focus on HP recovery
        const hp = Math.round(randBetween(rMin('hp') * 0.5, rMax('hp') * 1.2))
        const attack = Math.round(randBetween(0, rMax('attack') * 0.2))
        const defense = Math.round(randBetween(0, rMax('defense') * 0.2))
        const crit = Math.round(randBetween(0, rMax('crit') * 0.1) * 100) / 100

        items.push({
          name,
          rarity,
          type: 'consumable',
          emoji: base.emoji,
          attack,
          defense,
          hp,
          crit,
          useEffect: `사용 시 HP +${hp} 회복`,
        })
      }
      if (items.length >= targetCount) break
    }
    if (items.length >= targetCount) break
  }
  return items.slice(0, targetCount)
}

// Generate materials
function generateMaterials(
  template: ItemTemplate,
  rarity: GachaItem['rarity'],
  targetCount: number,
  seed: number,
): GachaItem[] {
  const rand = seededRandom(seed)
  const items: GachaItem[] = []
  const usedNames = new Set<string>()

  for (const prefix of template.prefixes) {
    for (const base of template.bases) {
      for (const suffix of template.suffixes) {
        if (items.length >= targetCount) break
        const name = `${prefix} ${base.name}${suffix ? ' ' + suffix : ''}`
        if (usedNames.has(name)) continue
        usedNames.add(name)

        items.push({
          name,
          rarity,
          type: 'material',
          emoji: base.emoji,
          attack: 0,
          defense: 0,
          hp: 0,
          crit: 0,
          useEffect: '재료 아이템 — 조합에 사용',
        })
      }
      if (items.length >= targetCount) break
    }
    if (items.length >= targetCount) break
  }
  return items.slice(0, targetCount)
}

// Generate consumables per rarity
const genConsCommon = generateConsumables(
  consumableCommonTemplate,
  'common',
  5100,
  11111,
)
const genConsUncommon = generateConsumables(
  consumableUncommonTemplate,
  'uncommon',
  3120,
  22222,
)
const genConsRare = generateConsumables(
  consumableRareTemplate,
  'rare',
  2200,
  33333,
)
const genConsEpic = generateConsumables(
  consumableEpicTemplate,
  'epic',
  1134,
  44444,
)

// Generate materials per rarity
const genMatCommon = generateMaterials(
  materialCommonTemplate,
  'common',
  4312,
  55555,
)
const genMatUncommon = generateMaterials(
  materialUncommonTemplate,
  'uncommon',
  2178,
  66666,
)

// Merge handcrafted + generated, dedup by name
function mergeAndDedup(...arrays: GachaItem[][]): GachaItem[] {
  const seen = new Set<string>()
  const result: GachaItem[] = []
  for (const arr of arrays) {
    for (const item of arr) {
      if (!seen.has(item.name)) {
        seen.add(item.name)
        result.push(item)
      }
    }
  }
  return result
}

export const gachaPool: GachaItem[] = mergeAndDedup(
  handcraftedItems,
  generatedCommon,
  generatedUncommon,
  generatedRare,
  generatedEpic,
  generatedLegendary,
  generatedMythic,
  genConsCommon,
  genConsUncommon,
  genConsRare,
  genConsEpic,
  genMatCommon,
  genMatUncommon,
)

// For encyclopedia: get all unique item names that exist
export function getAllGachaItemNames(): GachaItem[] {
  return [...gachaPool]
}

export const rarityColors: Record<string, number> = {
  common: 0x808080,
  uncommon: 0x2ecc71,
  rare: 0x3498db,
  epic: 0x9b59b6,
  legendary: 0xf39c12,
  mythic: 0xff0000,
}

export const rarityLabels: Record<string, string> = {
  common: '⬜ 일반',
  uncommon: '🟩 고급',
  rare: '🟦 희귀',
  epic: '🟪 영웅',
  legendary: '🟨 전설',
  mythic: '🟥 신화',
}
