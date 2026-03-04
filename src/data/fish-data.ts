export interface FishType {
  name: string
  emoji: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic'
  minSize: number // cm
  maxSize: number
  baseValue: number // gold per cm
  description: string
  category: 'freshwater' | 'saltwater' | 'deep_sea' | 'tropical' | 'mythical'
}

export interface TrashType {
  name: string
  emoji: string
  disposalCost: number // gold to dispose
  pollutionAmount: number // how much it pollutes (0-10)
  description: string
}

export type FishingEventType =
  | 'normal'
  | 'line_break'
  | 'trash'
  | 'double_catch'
  | 'golden_hour'
  | 'storm'
  | 'treasure'
  | 'sea_monster'

export interface FishingEvent {
  type: FishingEventType
  message: string
  emoji: string
}

export interface SeaMonster {
  name: string
  emoji: string
  hp: number
  attack: number
  goldReward: number
  xpReward: number
  description: string
}

export const seaMonsters: SeaMonster[] = [
  {
    name: '거대 문어',
    emoji: '🦑',
    hp: 50,
    attack: 15,
    goldReward: 200,
    xpReward: 50,
    description: '바다 속에서 거대한 촉수가 나타났다!',
  },
  {
    name: '해적 유령선',
    emoji: '👻',
    hp: 70,
    attack: 20,
    goldReward: 350,
    xpReward: 70,
    description: '안개 속에서 유령선이 나타났다!',
  },
  {
    name: '바다뽀',
    emoji: '🐍',
    hp: 40,
    attack: 25,
    goldReward: 180,
    xpReward: 40,
    description: '물 속에서 거대한 뽀이 뜨아올랐다!',
  },
  {
    name: '보석 거북',
    emoji: '🐢',
    hp: 100,
    attack: 8,
    goldReward: 500,
    xpReward: 80,
    description: '등께에 보석을 지닌 거대 거북이! 잡으면 대박!',
  },
  {
    name: '폭풍 상어',
    emoji: '🦈',
    hp: 80,
    attack: 30,
    goldReward: 400,
    xpReward: 60,
    description: '수면을 가르며 거대 상어가 나타났다!',
  },
  {
    name: '크라켄',
    emoji: '🦣',
    hp: 120,
    attack: 35,
    goldReward: 600,
    xpReward: 100,
    description: '전설의 해양 괴물 크라켄이 나타났다!!',
  },
  {
    name: '저주받은 닫',
    emoji: '⚓',
    hp: 30,
    attack: 10,
    goldReward: 100,
    xpReward: 30,
    description: '닛이 혼자 움직이고 있다...?!',
  },
  {
    name: '심해 용왕',
    emoji: '🐉',
    hp: 150,
    attack: 40,
    goldReward: 1000,
    xpReward: 150,
    description: '심해에서 전설의 용이 떠올랐다!!!',
  },
]

export function rollSeaMonster(): SeaMonster {
  return seaMonsters[Math.floor(Math.random() * seaMonsters.length)]
}

// ══════════════════════════════════════
//  TRASH ITEMS (caught during fishing)
// ══════════════════════════════════════

export const trashPool: TrashType[] = [
  {
    name: '빈 깡통',
    emoji: '🥫',
    disposalCost: 5,
    pollutionAmount: 2,
    description: '녹슨 깡통이다',
  },
  {
    name: '비닐봉지',
    emoji: '🛍️',
    disposalCost: 3,
    pollutionAmount: 3,
    description: '환경 오염의 주범',
  },
  {
    name: '오래된 장화',
    emoji: '👢',
    disposalCost: 8,
    pollutionAmount: 2,
    description: '누가 버린 걸까',
  },
  {
    name: '깨진 유리병',
    emoji: '🍾',
    disposalCost: 10,
    pollutionAmount: 4,
    description: '위험! 물고기들이 다칠 수 있다',
  },
  {
    name: '타이어',
    emoji: '🛞',
    disposalCost: 30,
    pollutionAmount: 8,
    description: '거대한 폐타이어',
  },
  {
    name: '폐배터리',
    emoji: '🔋',
    disposalCost: 25,
    pollutionAmount: 10,
    description: '수질을 심각하게 오염시킨다',
  },
  {
    name: '스티로폼',
    emoji: '📦',
    disposalCost: 5,
    pollutionAmount: 3,
    description: '잘게 부서져 미세플라스틱이 된다',
  },
  {
    name: '떠다니는 쓰레기 봉투',
    emoji: '🗑️',
    disposalCost: 4,
    pollutionAmount: 2,
    description: '거북이가 해파리로 착각한다',
  },
  {
    name: '녹슨 낚싯바늘 뭉치',
    emoji: '🪝',
    disposalCost: 7,
    pollutionAmount: 3,
    description: '이전 낚시꾼의 흔적',
  },
  {
    name: '폐유통',
    emoji: '🛢️',
    disposalCost: 50,
    pollutionAmount: 10,
    description: '기름이 새고 있다! 긴급 처리 필요!',
  },
  {
    name: '낡은 신발',
    emoji: '👟',
    disposalCost: 6,
    pollutionAmount: 2,
    description: '한 짝만 있다',
  },
  {
    name: '플라스틱 빨대',
    emoji: '🥤',
    disposalCost: 2,
    pollutionAmount: 2,
    description: '바다거북의 천적',
  },
  {
    name: '부서진 우산',
    emoji: '☂️',
    disposalCost: 8,
    pollutionAmount: 3,
    description: '강풍에 날아온 듯',
  },
  {
    name: '엉킨 낚싯줄',
    emoji: '🧵',
    disposalCost: 5,
    pollutionAmount: 4,
    description: '물고기가 감길 수 있어 위험하다',
  },
  {
    name: '침몰한 보트 조각',
    emoji: '🚣',
    disposalCost: 40,
    pollutionAmount: 6,
    description: '페인트 성분이 물에 녹고 있다',
  },
]

// ══════════════════════════════════════
//  FISH DATA — 200+ species
// ══════════════════════════════════════

export const fishPool: FishType[] = [
  // ═══════════════════════════════════
  //  COMMON (40 species)
  // ═══════════════════════════════════
  // -- 담수어 --
  {
    name: '붕어',
    emoji: '🐟',
    rarity: 'common',
    minSize: 5,
    maxSize: 25,
    baseValue: 2,
    description: '흔하디흔한 붕어',
    category: 'freshwater',
  },
  {
    name: '미꾸라지',
    emoji: '🐍',
    rarity: 'common',
    minSize: 8,
    maxSize: 20,
    baseValue: 2,
    description: '미끌미끌한 민물고기',
    category: 'freshwater',
  },
  {
    name: '잉어',
    emoji: '🐟',
    rarity: 'common',
    minSize: 15,
    maxSize: 50,
    baseValue: 3,
    description: '연못의 터줏대감',
    category: 'freshwater',
  },
  {
    name: '피라미',
    emoji: '🐠',
    rarity: 'common',
    minSize: 5,
    maxSize: 15,
    baseValue: 2,
    description: '개울에서 잡는 작은 물고기',
    category: 'freshwater',
  },
  {
    name: '송사리',
    emoji: '🐟',
    rarity: 'common',
    minSize: 2,
    maxSize: 8,
    baseValue: 1,
    description: '정말 작은 민물고기',
    category: 'freshwater',
  },
  {
    name: '빙어',
    emoji: '🐟',
    rarity: 'common',
    minSize: 5,
    maxSize: 15,
    baseValue: 2,
    description: '겨울 빙어낚시의 주인공',
    category: 'freshwater',
  },
  {
    name: '버들치',
    emoji: '🐟',
    rarity: 'common',
    minSize: 5,
    maxSize: 12,
    baseValue: 1,
    description: '맑은 계곡의 작은 물고기',
    category: 'freshwater',
  },
  {
    name: '납자루',
    emoji: '🐟',
    rarity: 'common',
    minSize: 4,
    maxSize: 10,
    baseValue: 1,
    description: '조개에 알을 낳는 신기한 물고기',
    category: 'freshwater',
  },
  {
    name: '참붕어',
    emoji: '🐟',
    rarity: 'common',
    minSize: 4,
    maxSize: 12,
    baseValue: 1,
    description: '흔한 민물 잡어',
    category: 'freshwater',
  },
  {
    name: '돌고기',
    emoji: '🐟',
    rarity: 'common',
    minSize: 5,
    maxSize: 15,
    baseValue: 2,
    description: '돌 틈에 사는 물고기',
    category: 'freshwater',
  },
  {
    name: '밀어',
    emoji: '🐟',
    rarity: 'common',
    minSize: 3,
    maxSize: 10,
    baseValue: 1,
    description: '바닥에 붙어 사는 작은 물고기',
    category: 'freshwater',
  },
  {
    name: '모래무지',
    emoji: '🐟',
    rarity: 'common',
    minSize: 5,
    maxSize: 18,
    baseValue: 2,
    description: '모래 바닥을 좋아한다',
    category: 'freshwater',
  },
  {
    name: '블루길',
    emoji: '🐠',
    rarity: 'common',
    minSize: 8,
    maxSize: 25,
    baseValue: 2,
    description: '외래종이지만 흔한 물고기',
    category: 'freshwater',
  },
  {
    name: '배스',
    emoji: '🐟',
    rarity: 'common',
    minSize: 15,
    maxSize: 40,
    baseValue: 3,
    description: '루어낚시의 대상어',
    category: 'freshwater',
  },
  {
    name: '올챙이',
    emoji: '🐸',
    rarity: 'common',
    minSize: 1,
    maxSize: 5,
    baseValue: 1,
    description: '이건 물고기가 아닌데...',
    category: 'freshwater',
  },
  // -- 해수어 --
  {
    name: '고등어',
    emoji: '🐟',
    rarity: 'common',
    minSize: 20,
    maxSize: 40,
    baseValue: 3,
    description: '구워 먹으면 맛있다',
    category: 'saltwater',
  },
  {
    name: '멸치',
    emoji: '🐟',
    rarity: 'common',
    minSize: 3,
    maxSize: 10,
    baseValue: 1,
    description: '작지만 영양가 높다',
    category: 'saltwater',
  },
  {
    name: '전어',
    emoji: '🐟',
    rarity: 'common',
    minSize: 15,
    maxSize: 30,
    baseValue: 2,
    description: '가을 바다의 별미',
    category: 'saltwater',
  },
  {
    name: '정어리',
    emoji: '🐟',
    rarity: 'common',
    minSize: 10,
    maxSize: 25,
    baseValue: 2,
    description: '통조림감',
    category: 'saltwater',
  },
  {
    name: '꽁치',
    emoji: '🐟',
    rarity: 'common',
    minSize: 20,
    maxSize: 35,
    baseValue: 2,
    description: '길쭉한 게 특징',
    category: 'saltwater',
  },
  {
    name: '학꽁치',
    emoji: '🐟',
    rarity: 'common',
    minSize: 15,
    maxSize: 35,
    baseValue: 2,
    description: '주둥이가 길고 날씬하다',
    category: 'saltwater',
  },
  {
    name: '전갱이',
    emoji: '🐟',
    rarity: 'common',
    minSize: 15,
    maxSize: 30,
    baseValue: 2,
    description: '방파제 낚시의 단골손님',
    category: 'saltwater',
  },
  {
    name: '숭어',
    emoji: '🐟',
    rarity: 'common',
    minSize: 20,
    maxSize: 60,
    baseValue: 3,
    description: '항구에서도 쉽게 볼 수 있다',
    category: 'saltwater',
  },
  {
    name: '망둥어',
    emoji: '🐟',
    rarity: 'common',
    minSize: 5,
    maxSize: 15,
    baseValue: 1,
    description: '갯벌의 작은 물고기',
    category: 'saltwater',
  },
  {
    name: '볼락',
    emoji: '🐟',
    rarity: 'common',
    minSize: 10,
    maxSize: 30,
    baseValue: 3,
    description: '바위틈에 사는 인기 어종',
    category: 'saltwater',
  },
  {
    name: '노래미',
    emoji: '🐟',
    rarity: 'common',
    minSize: 15,
    maxSize: 35,
    baseValue: 2,
    description: '방파제 단골 친구',
    category: 'saltwater',
  },
  {
    name: '쥐노래미',
    emoji: '🐟',
    rarity: 'common',
    minSize: 10,
    maxSize: 30,
    baseValue: 2,
    description: '갯바위에서 자주 낚인다',
    category: 'saltwater',
  },
  {
    name: '보리멸',
    emoji: '🐟',
    rarity: 'common',
    minSize: 10,
    maxSize: 25,
    baseValue: 2,
    description: '모래 해변의 작은 물고기',
    category: 'saltwater',
  },
  {
    name: '망상어',
    emoji: '🐟',
    rarity: 'common',
    minSize: 10,
    maxSize: 25,
    baseValue: 2,
    description: '잡어의 대명사',
    category: 'saltwater',
  },
  {
    name: '쏨뱅이',
    emoji: '🐟',
    rarity: 'common',
    minSize: 10,
    maxSize: 25,
    baseValue: 2,
    description: '가시가 많으니 조심',
    category: 'saltwater',
  },
  {
    name: '해초 뭉치',
    emoji: '🌿',
    rarity: 'common',
    minSize: 10,
    maxSize: 30,
    baseValue: 1,
    description: '물고기라고 부르기 민망하다',
    category: 'saltwater',
  },
  // -- 열대 --
  {
    name: '구피',
    emoji: '🐠',
    rarity: 'common',
    minSize: 2,
    maxSize: 6,
    baseValue: 2,
    description: '화려한 꼬리의 관상어',
    category: 'tropical',
  },
  {
    name: '네온테트라',
    emoji: '🐠',
    rarity: 'common',
    minSize: 2,
    maxSize: 4,
    baseValue: 2,
    description: '형광 파란줄이 빛난다',
    category: 'tropical',
  },
  {
    name: '엔젤피쉬',
    emoji: '🐠',
    rarity: 'common',
    minSize: 5,
    maxSize: 15,
    baseValue: 3,
    description: '천사 같은 지느러미',
    category: 'tropical',
  },
  {
    name: '몰리',
    emoji: '🐠',
    rarity: 'common',
    minSize: 3,
    maxSize: 10,
    baseValue: 2,
    description: '쉽게 번식하는 관상어',
    category: 'tropical',
  },
  {
    name: '소드테일',
    emoji: '🐠',
    rarity: 'common',
    minSize: 5,
    maxSize: 12,
    baseValue: 2,
    description: '칼 같은 꼬리를 가진 물고기',
    category: 'tropical',
  },
  {
    name: '플래티',
    emoji: '🐠',
    rarity: 'common',
    minSize: 3,
    maxSize: 7,
    baseValue: 2,
    description: '형형색색 작은 관상어',
    category: 'tropical',
  },
  {
    name: '제브라 다니오',
    emoji: '🐠',
    rarity: 'common',
    minSize: 3,
    maxSize: 5,
    baseValue: 1,
    description: '줄무늬 열대어',
    category: 'tropical',
  },
  {
    name: '코리도라스',
    emoji: '🐟',
    rarity: 'common',
    minSize: 3,
    maxSize: 8,
    baseValue: 2,
    description: '바닥 청소부 메기',
    category: 'tropical',
  },

  // ═══════════════════════════════════
  //  UNCOMMON (40 species)
  // ═══════════════════════════════════
  // -- 담수어 --
  {
    name: '쏘가리',
    emoji: '🐟',
    rarity: 'uncommon',
    minSize: 20,
    maxSize: 50,
    baseValue: 7,
    description: '민물 고급 어종, 매운탕 재료',
    category: 'freshwater',
  },
  {
    name: '메기',
    emoji: '🐟',
    rarity: 'uncommon',
    minSize: 30,
    maxSize: 80,
    baseValue: 5,
    description: '수염이 특징인 야행성 물고기',
    category: 'freshwater',
  },
  {
    name: '가물치',
    emoji: '🐟',
    rarity: 'uncommon',
    minSize: 30,
    maxSize: 80,
    baseValue: 6,
    description: '담수의 포식자',
    category: 'freshwater',
  },
  {
    name: '무지개송어',
    emoji: '🐠',
    rarity: 'uncommon',
    minSize: 20,
    maxSize: 60,
    baseValue: 6,
    description: '무지개빛 비늘이 아름답다',
    category: 'freshwater',
  },
  {
    name: '산천어',
    emoji: '🐟',
    rarity: 'uncommon',
    minSize: 15,
    maxSize: 30,
    baseValue: 7,
    description: '맑은 계곡의 귀한 물고기',
    category: 'freshwater',
  },
  {
    name: '쉬리',
    emoji: '🐟',
    rarity: 'uncommon',
    minSize: 5,
    maxSize: 12,
    baseValue: 5,
    description: '깨끗한 물에서만 사는 지표종',
    category: 'freshwater',
  },
  {
    name: '꾸구리',
    emoji: '🐟',
    rarity: 'uncommon',
    minSize: 5,
    maxSize: 15,
    baseValue: 6,
    description: '한국 고유종 민물고기',
    category: 'freshwater',
  },
  {
    name: '어름치',
    emoji: '🐟',
    rarity: 'uncommon',
    minSize: 15,
    maxSize: 40,
    baseValue: 8,
    description: '천연기념물급 민물고기',
    category: 'freshwater',
  },
  {
    name: '황어',
    emoji: '🐟',
    rarity: 'uncommon',
    minSize: 20,
    maxSize: 50,
    baseValue: 5,
    description: '봄에 금빛으로 변하는 물고기',
    category: 'freshwater',
  },
  {
    name: '자라',
    emoji: '🐢',
    rarity: 'uncommon',
    minSize: 15,
    maxSize: 40,
    baseValue: 8,
    description: '민물 거북이, 손가락 조심!',
    category: 'freshwater',
  },
  {
    name: '민물가재',
    emoji: '🦞',
    rarity: 'uncommon',
    minSize: 5,
    maxSize: 15,
    baseValue: 7,
    description: '깨끗한 하천의 지표종',
    category: 'freshwater',
  },
  // -- 해수어 --
  {
    name: '농어',
    emoji: '🐟',
    rarity: 'uncommon',
    minSize: 30,
    maxSize: 80,
    baseValue: 5,
    description: '바다낚시의 인기 어종',
    category: 'saltwater',
  },
  {
    name: '방어',
    emoji: '🐟',
    rarity: 'uncommon',
    minSize: 40,
    maxSize: 100,
    baseValue: 6,
    description: '겨울 횟감의 왕',
    category: 'saltwater',
  },
  {
    name: '도미',
    emoji: '🐠',
    rarity: 'uncommon',
    minSize: 20,
    maxSize: 60,
    baseValue: 7,
    description: '참돔이라고도 불린다',
    category: 'saltwater',
  },
  {
    name: '광어',
    emoji: '🐟',
    rarity: 'uncommon',
    minSize: 30,
    maxSize: 80,
    baseValue: 6,
    description: '넙적한 바닥 물고기',
    category: 'saltwater',
  },
  {
    name: '갈치',
    emoji: '🐟',
    rarity: 'uncommon',
    minSize: 50,
    maxSize: 150,
    baseValue: 5,
    description: '은빛 칼처럼 길고 날씬하다',
    category: 'saltwater',
  },
  {
    name: '문어',
    emoji: '🐙',
    rarity: 'uncommon',
    minSize: 30,
    maxSize: 80,
    baseValue: 6,
    description: '다리가 8개, 머리가 좋다',
    category: 'saltwater',
  },
  {
    name: '오징어',
    emoji: '🦑',
    rarity: 'uncommon',
    minSize: 20,
    maxSize: 60,
    baseValue: 5,
    description: '먹물을 쏘는 연체동물',
    category: 'saltwater',
  },
  {
    name: '새우',
    emoji: '🦐',
    rarity: 'uncommon',
    minSize: 5,
    maxSize: 25,
    baseValue: 7,
    description: '탱글탱글한 식감',
    category: 'saltwater',
  },
  {
    name: '꽃게',
    emoji: '🦀',
    rarity: 'uncommon',
    minSize: 10,
    maxSize: 25,
    baseValue: 8,
    description: '양념게장의 주인공',
    category: 'saltwater',
  },
  {
    name: '연어',
    emoji: '🐟',
    rarity: 'uncommon',
    minSize: 40,
    maxSize: 80,
    baseValue: 7,
    description: '회귀 본능의 상징',
    category: 'saltwater',
  },
  {
    name: '장어',
    emoji: '🐍',
    rarity: 'uncommon',
    minSize: 30,
    maxSize: 80,
    baseValue: 8,
    description: '보양식의 왕',
    category: 'saltwater',
  },
  {
    name: '복어',
    emoji: '🐡',
    rarity: 'uncommon',
    minSize: 10,
    maxSize: 40,
    baseValue: 10,
    description: '독이 있으니 조심!',
    category: 'saltwater',
  },
  {
    name: '가오리',
    emoji: '🐟',
    rarity: 'uncommon',
    minSize: 30,
    maxSize: 100,
    baseValue: 5,
    description: '날개처럼 헤엄치는 물고기',
    category: 'saltwater',
  },
  {
    name: '해마',
    emoji: '🐟',
    rarity: 'uncommon',
    minSize: 5,
    maxSize: 20,
    baseValue: 9,
    description: '말을 닮은 신기한 물고기',
    category: 'saltwater',
  },
  {
    name: '우럭',
    emoji: '🐟',
    rarity: 'uncommon',
    minSize: 20,
    maxSize: 50,
    baseValue: 6,
    description: '선상낚시 인기 어종',
    category: 'saltwater',
  },
  {
    name: '감성돔',
    emoji: '🐟',
    rarity: 'uncommon',
    minSize: 20,
    maxSize: 50,
    baseValue: 7,
    description: '갯바위 낚시의 꽃',
    category: 'saltwater',
  },
  {
    name: '삼치',
    emoji: '🐟',
    rarity: 'uncommon',
    minSize: 30,
    maxSize: 80,
    baseValue: 5,
    description: '구이로 인기 있는 생선',
    category: 'saltwater',
  },
  {
    name: '전복',
    emoji: '🐚',
    rarity: 'uncommon',
    minSize: 5,
    maxSize: 15,
    baseValue: 12,
    description: '해녀가 따는 고급 해산물',
    category: 'saltwater',
  },
  {
    name: '성게',
    emoji: '🦔',
    rarity: 'uncommon',
    minSize: 3,
    maxSize: 10,
    baseValue: 10,
    description: '가시투성이지만 속은 달콤',
    category: 'saltwater',
  },
  {
    name: '주꾸미',
    emoji: '🐙',
    rarity: 'uncommon',
    minSize: 10,
    maxSize: 25,
    baseValue: 7,
    description: '작은 문어, 볶음요리의 왕',
    category: 'saltwater',
  },
  // -- 열대 --
  {
    name: '흰동가리',
    emoji: '🐠',
    rarity: 'uncommon',
    minSize: 5,
    maxSize: 12,
    baseValue: 8,
    description: '니모를 찾아서의 주인공',
    category: 'tropical',
  },
  {
    name: '블루탱',
    emoji: '🐠',
    rarity: 'uncommon',
    minSize: 10,
    maxSize: 30,
    baseValue: 7,
    description: '도리를 찾아서의 주인공',
    category: 'tropical',
  },
  {
    name: '디스커스',
    emoji: '🐠',
    rarity: 'uncommon',
    minSize: 10,
    maxSize: 20,
    baseValue: 9,
    description: '열대어의 왕이라 불린다',
    category: 'tropical',
  },
  {
    name: '피라냐',
    emoji: '🐟',
    rarity: 'uncommon',
    minSize: 10,
    maxSize: 30,
    baseValue: 6,
    description: '무시무시한 이빨의 소유자',
    category: 'tropical',
  },
  {
    name: '아로와나',
    emoji: '🐟',
    rarity: 'uncommon',
    minSize: 30,
    maxSize: 80,
    baseValue: 10,
    description: '용을 닮은 고급 관상어',
    category: 'tropical',
  },
  {
    name: '구라미',
    emoji: '🐠',
    rarity: 'uncommon',
    minSize: 8,
    maxSize: 15,
    baseValue: 5,
    description: '입술로 공기를 마시는 물고기',
    category: 'tropical',
  },
  {
    name: '시클리드',
    emoji: '🐠',
    rarity: 'uncommon',
    minSize: 10,
    maxSize: 30,
    baseValue: 6,
    description: '아프리카 호수의 화려한 물고기',
    category: 'tropical',
  },
  {
    name: '베타',
    emoji: '🐠',
    rarity: 'uncommon',
    minSize: 5,
    maxSize: 8,
    baseValue: 8,
    description: '투쟁어, 화려한 지느러미',
    category: 'tropical',
  },

  // ═══════════════════════════════════
  //  RARE (30 species)
  // ═══════════════════════════════════
  {
    name: '참치',
    emoji: '🐟',
    rarity: 'rare',
    minSize: 80,
    maxSize: 200,
    baseValue: 12,
    description: '바다의 마라토너',
    category: 'saltwater',
  },
  {
    name: '황금 잉어',
    emoji: '✨',
    rarity: 'rare',
    minSize: 20,
    maxSize: 60,
    baseValue: 15,
    description: '황금빛으로 빛나는 행운의 잉어',
    category: 'freshwater',
  },
  {
    name: '상어',
    emoji: '🦈',
    rarity: 'rare',
    minSize: 100,
    maxSize: 300,
    baseValue: 10,
    description: '바다의 최상위 포식자',
    category: 'saltwater',
  },
  {
    name: '해파리',
    emoji: '🪼',
    rarity: 'rare',
    minSize: 10,
    maxSize: 50,
    baseValue: 8,
    description: '몽환적인 움직임',
    category: 'saltwater',
  },
  {
    name: '가재',
    emoji: '🦞',
    rarity: 'rare',
    minSize: 15,
    maxSize: 40,
    baseValue: 15,
    description: '민물의 랍스터',
    category: 'freshwater',
  },
  {
    name: '다랑어',
    emoji: '🐟',
    rarity: 'rare',
    minSize: 60,
    maxSize: 180,
    baseValue: 12,
    description: '고급 회의 재료',
    category: 'saltwater',
  },
  {
    name: '킹크랩',
    emoji: '🦀',
    rarity: 'rare',
    minSize: 30,
    maxSize: 80,
    baseValue: 18,
    description: '게의 왕',
    category: 'deep_sea',
  },
  {
    name: '전기 뱀장어',
    emoji: '⚡',
    rarity: 'rare',
    minSize: 50,
    maxSize: 150,
    baseValue: 12,
    description: '600볼트 감전 주의!',
    category: 'tropical',
  },
  {
    name: '만타레이',
    emoji: '🐟',
    rarity: 'rare',
    minSize: 200,
    maxSize: 500,
    baseValue: 8,
    description: '우아한 바다의 대형 가오리',
    category: 'saltwater',
  },
  {
    name: '철갑상어',
    emoji: '🐟',
    rarity: 'rare',
    minSize: 80,
    maxSize: 300,
    baseValue: 15,
    description: '캐비아를 생산하는 고급 어종',
    category: 'freshwater',
  },
  {
    name: '대게',
    emoji: '🦀',
    rarity: 'rare',
    minSize: 15,
    maxSize: 40,
    baseValue: 16,
    description: '영덕 대게로 유명한 고급 게',
    category: 'saltwater',
  },
  {
    name: '랍스터',
    emoji: '🦞',
    rarity: 'rare',
    minSize: 25,
    maxSize: 60,
    baseValue: 18,
    description: '고급 레스토랑의 메인 요리',
    category: 'saltwater',
  },
  {
    name: '귀상어',
    emoji: '🦈',
    rarity: 'rare',
    minSize: 100,
    maxSize: 400,
    baseValue: 10,
    description: 'T자 머리의 독특한 상어',
    category: 'saltwater',
  },
  {
    name: '돌돔',
    emoji: '🐟',
    rarity: 'rare',
    minSize: 30,
    maxSize: 70,
    baseValue: 14,
    description: '바위 사이의 고급 어종',
    category: 'saltwater',
  },
  {
    name: '붉바리',
    emoji: '🐟',
    rarity: 'rare',
    minSize: 30,
    maxSize: 80,
    baseValue: 16,
    description: '제주 앞바다의 최고급 어종',
    category: 'saltwater',
  },
  {
    name: '민어',
    emoji: '🐟',
    rarity: 'rare',
    minSize: 40,
    maxSize: 120,
    baseValue: 14,
    description: '보양식으로 유명한 고급 생선',
    category: 'saltwater',
  },
  {
    name: '눈볼대',
    emoji: '🐟',
    rarity: 'rare',
    minSize: 15,
    maxSize: 30,
    baseValue: 12,
    description: '큰 눈이 특징인 심해어',
    category: 'deep_sea',
  },
  {
    name: '피라루쿠',
    emoji: '🐟',
    rarity: 'rare',
    minSize: 100,
    maxSize: 300,
    baseValue: 12,
    description: '아마존의 거대 민물고기',
    category: 'tropical',
  },
  {
    name: '플라워혼',
    emoji: '🐠',
    rarity: 'rare',
    minSize: 20,
    maxSize: 40,
    baseValue: 14,
    description: '머리에 혹이 있는 관상어',
    category: 'tropical',
  },
  {
    name: '바다거북',
    emoji: '🐢',
    rarity: 'rare',
    minSize: 50,
    maxSize: 150,
    baseValue: 12,
    description: '보호종! 도감에만 등록',
    category: 'saltwater',
  },
  {
    name: '바다뱀',
    emoji: '🐍',
    rarity: 'rare',
    minSize: 50,
    maxSize: 200,
    baseValue: 10,
    description: '독이 있다! 조심히 다뤄야 한다',
    category: 'saltwater',
  },
  {
    name: '무지개 열대어',
    emoji: '🌈',
    rarity: 'rare',
    minSize: 5,
    maxSize: 15,
    baseValue: 18,
    description: '일곱 빛깔 무지개 물고기',
    category: 'tropical',
  },
  {
    name: '심해 빨간새우',
    emoji: '🦐',
    rarity: 'rare',
    minSize: 10,
    maxSize: 25,
    baseValue: 15,
    description: '깊은 바다의 붉은 보석',
    category: 'deep_sea',
  },
  {
    name: '열대 해마',
    emoji: '🐟',
    rarity: 'rare',
    minSize: 3,
    maxSize: 15,
    baseValue: 20,
    description: '화려한 색상의 열대 해마',
    category: 'tropical',
  },
  {
    name: '자이언트 구라미',
    emoji: '🐟',
    rarity: 'rare',
    minSize: 30,
    maxSize: 70,
    baseValue: 11,
    description: '입이 큰 동남아 대형 물고기',
    category: 'tropical',
  },
  {
    name: '넙치',
    emoji: '🐟',
    rarity: 'rare',
    minSize: 40,
    maxSize: 100,
    baseValue: 12,
    description: '자연산 넙치, 양식과는 차원이 다르다',
    category: 'saltwater',
  },
  {
    name: '아르마딜로 캣피쉬',
    emoji: '🐟',
    rarity: 'rare',
    minSize: 30,
    maxSize: 80,
    baseValue: 10,
    description: '갑옷을 입은 메기',
    category: 'tropical',
  },
  {
    name: '눈퉁멸',
    emoji: '🐟',
    rarity: 'rare',
    minSize: 10,
    maxSize: 20,
    baseValue: 10,
    description: '커다란 눈이 매력적인 심해어',
    category: 'deep_sea',
  },
  {
    name: '전기메기',
    emoji: '⚡',
    rarity: 'rare',
    minSize: 40,
    maxSize: 120,
    baseValue: 13,
    description: '아프리카의 전기를 내는 메기',
    category: 'tropical',
  },
  {
    name: '쥐가오리',
    emoji: '🐟',
    rarity: 'rare',
    minSize: 100,
    maxSize: 300,
    baseValue: 11,
    description: '독이 없는 대형 가오리',
    category: 'saltwater',
  },

  // ═══════════════════════════════════
  //  EPIC (25 species)
  // ═══════════════════════════════════
  {
    name: '대왕 오징어',
    emoji: '🦑',
    rarity: 'epic',
    minSize: 300,
    maxSize: 800,
    baseValue: 15,
    description: '심해의 거대한 괴물',
    category: 'deep_sea',
  },
  {
    name: '백상아리',
    emoji: '🦈',
    rarity: 'epic',
    minSize: 200,
    maxSize: 600,
    baseValue: 18,
    description: '바다의 공포, 최상위 포식자',
    category: 'saltwater',
  },
  {
    name: '개복치',
    emoji: '🐟',
    rarity: 'epic',
    minSize: 100,
    maxSize: 300,
    baseValue: 20,
    description: '가장 무거운 경골어류',
    category: 'saltwater',
  },
  {
    name: '심해 아귀',
    emoji: '🐟',
    rarity: 'epic',
    minSize: 30,
    maxSize: 100,
    baseValue: 22,
    description: '머리에 등불을 달고 다닌다',
    category: 'deep_sea',
  },
  {
    name: '황금 복어',
    emoji: '🐡',
    rarity: 'epic',
    minSize: 15,
    maxSize: 50,
    baseValue: 30,
    description: '온몸이 24K 순금빛',
    category: 'saltwater',
  },
  {
    name: '고대 실러캔스',
    emoji: '🐟',
    rarity: 'epic',
    minSize: 100,
    maxSize: 200,
    baseValue: 25,
    description: '살아있는 화석, 3억년 전부터',
    category: 'deep_sea',
  },
  {
    name: '크라켄의 촉수',
    emoji: '🦑',
    rarity: 'epic',
    minSize: 200,
    maxSize: 500,
    baseValue: 20,
    description: '크라켄의 일부분인 것 같다...',
    category: 'deep_sea',
  },
  {
    name: '용궁 거북이',
    emoji: '🐢',
    rarity: 'epic',
    minSize: 50,
    maxSize: 150,
    baseValue: 28,
    description: '용궁에서 온 거북이',
    category: 'mythical',
  },
  {
    name: '고래상어',
    emoji: '🦈',
    rarity: 'epic',
    minSize: 500,
    maxSize: 1800,
    baseValue: 8,
    description: '가장 큰 물고기, 성격은 온순',
    category: 'saltwater',
  },
  {
    name: '블루링 문어',
    emoji: '🐙',
    rarity: 'epic',
    minSize: 5,
    maxSize: 20,
    baseValue: 35,
    description: '아름답지만 치명적인 맹독',
    category: 'tropical',
  },
  {
    name: '범고래',
    emoji: '🐋',
    rarity: 'epic',
    minSize: 400,
    maxSize: 900,
    baseValue: 10,
    description: '바다의 최상위 포식자',
    category: 'saltwater',
  },
  {
    name: '심해 바이퍼피쉬',
    emoji: '🐟',
    rarity: 'epic',
    minSize: 15,
    maxSize: 35,
    baseValue: 25,
    description: '송곳니가 입 밖으로 삐져나온다',
    category: 'deep_sea',
  },
  {
    name: '오아피쉬',
    emoji: '🐟',
    rarity: 'epic',
    minSize: 300,
    maxSize: 800,
    baseValue: 12,
    description: '산갈치라고도 불리는 심해의 거인',
    category: 'deep_sea',
  },
  {
    name: '드래곤피쉬',
    emoji: '🐉',
    rarity: 'epic',
    minSize: 30,
    maxSize: 60,
    baseValue: 28,
    description: '심해에서 붉은 빛을 내는 용 같은 물고기',
    category: 'deep_sea',
  },
  {
    name: '나폴레옹 피쉬',
    emoji: '🐠',
    rarity: 'epic',
    minSize: 60,
    maxSize: 200,
    baseValue: 20,
    description: '이마에 혹이 있는 거대 놀래미',
    category: 'tropical',
  },
  {
    name: '뱀파이어 오징어',
    emoji: '🦑',
    rarity: 'epic',
    minSize: 15,
    maxSize: 30,
    baseValue: 30,
    description: '빛을 내며 심해에 사는 흡혈 오징어',
    category: 'deep_sea',
  },
  {
    name: '태평양 블루핀 참치',
    emoji: '🐟',
    rarity: 'epic',
    minSize: 150,
    maxSize: 300,
    baseValue: 25,
    description: '경매에서 수억에 낙찰되는 참치',
    category: 'saltwater',
  },
  {
    name: '진주조개',
    emoji: '🐚',
    rarity: 'epic',
    minSize: 10,
    maxSize: 30,
    baseValue: 35,
    description: '안에 진주가 들어있을지도...',
    category: 'saltwater',
  },
  {
    name: '환도상어',
    emoji: '🦈',
    rarity: 'epic',
    minSize: 200,
    maxSize: 550,
    baseValue: 16,
    description: '꼬리가 몸만큼 긴 독특한 상어',
    category: 'saltwater',
  },
  {
    name: '수정 해파리',
    emoji: '🪼',
    rarity: 'epic',
    minSize: 5,
    maxSize: 20,
    baseValue: 40,
    description: '완전히 투명한 유리 해파리',
    category: 'deep_sea',
  },
  {
    name: '알비노 철갑상어',
    emoji: '🐟',
    rarity: 'epic',
    minSize: 100,
    maxSize: 250,
    baseValue: 22,
    description: '하얀 철갑상어, 황금빛 캐비아',
    category: 'freshwater',
  },
  {
    name: '심해 대왕이빨고기',
    emoji: '🐟',
    rarity: 'epic',
    minSize: 80,
    maxSize: 200,
    baseValue: 20,
    description: '메로라고도 불리는 심해 고급어',
    category: 'deep_sea',
  },
  {
    name: '대왕조개',
    emoji: '🐚',
    rarity: 'epic',
    minSize: 50,
    maxSize: 130,
    baseValue: 22,
    description: '열대 바다의 거대한 조개',
    category: 'tropical',
  },
  {
    name: '거대 해파리',
    emoji: '🪼',
    rarity: 'epic',
    minSize: 50,
    maxSize: 200,
    baseValue: 18,
    description: '사람보다 큰 거대 해파리',
    category: 'deep_sea',
  },
  {
    name: '거대 가오리',
    emoji: '🐟',
    rarity: 'epic',
    minSize: 200,
    maxSize: 600,
    baseValue: 14,
    description: '날개폭이 6미터에 달하는 거인',
    category: 'saltwater',
  },

  // ═══════════════════════════════════
  //  LEGENDARY (15 species)
  // ═══════════════════════════════════
  {
    name: '용의 물고기',
    emoji: '🐉',
    rarity: 'legendary',
    minSize: 200,
    maxSize: 500,
    baseValue: 40,
    description: '용이 키우던 물고기라는 전설',
    category: 'mythical',
  },
  {
    name: '다이아몬드 물고기',
    emoji: '💎',
    rarity: 'legendary',
    minSize: 10,
    maxSize: 30,
    baseValue: 80,
    description: '비늘이 다이아몬드로 되어있다',
    category: 'mythical',
  },
  {
    name: '불사조 물고기',
    emoji: '🐦‍🔥',
    rarity: 'legendary',
    minSize: 30,
    maxSize: 80,
    baseValue: 60,
    description: '물속에서 불타는 불멸의 물고기',
    category: 'mythical',
  },
  {
    name: '시간의 물고기',
    emoji: '⏳',
    rarity: 'legendary',
    minSize: 20,
    maxSize: 50,
    baseValue: 70,
    description: '이 물고기를 잡으면 시간이 되감긴다',
    category: 'mythical',
  },
  {
    name: '메갈로돈 이빨',
    emoji: '🦈',
    rarity: 'legendary',
    minSize: 15,
    maxSize: 30,
    baseValue: 100,
    description: '고대 초대형 상어의 이빨 화석',
    category: 'mythical',
  },
  {
    name: '황금 고래',
    emoji: '🐋',
    rarity: 'legendary',
    minSize: 500,
    maxSize: 2000,
    baseValue: 35,
    description: '전설 속의 황금빛 고래',
    category: 'mythical',
  },
  {
    name: '일각고래',
    emoji: '🦄',
    rarity: 'legendary',
    minSize: 300,
    maxSize: 600,
    baseValue: 45,
    description: '유니콘 뿔을 가진 바다의 전설',
    category: 'mythical',
  },
  {
    name: '심해의 등불고기',
    emoji: '💡',
    rarity: 'legendary',
    minSize: 50,
    maxSize: 100,
    baseValue: 55,
    description: '깊은 바다를 밝히는 살아있는 등대',
    category: 'deep_sea',
  },
  {
    name: '얼음 물고기',
    emoji: '🧊',
    rarity: 'legendary',
    minSize: 30,
    maxSize: 80,
    baseValue: 65,
    description: '피가 투명하고 영하에서 사는 극한 물고기',
    category: 'deep_sea',
  },
  {
    name: '무지개빛 대왕 산호',
    emoji: '🌈',
    rarity: 'legendary',
    minSize: 100,
    maxSize: 300,
    baseValue: 50,
    description: '살아있는 무지개 산호, 그 자체로 보물',
    category: 'tropical',
  },
  {
    name: '황제 눈동자개',
    emoji: '👑',
    rarity: 'legendary',
    minSize: 30,
    maxSize: 60,
    baseValue: 75,
    description: '금관을 쓴 듯한 민물의 황제',
    category: 'freshwater',
  },
  {
    name: '크리스탈 새우',
    emoji: '💎',
    rarity: 'legendary',
    minSize: 3,
    maxSize: 8,
    baseValue: 120,
    description: '수정처럼 투명한 전설의 새우',
    category: 'deep_sea',
  },
  {
    name: '심연의 거대 문어',
    emoji: '🐙',
    rarity: 'legendary',
    minSize: 300,
    maxSize: 800,
    baseValue: 38,
    description: '지능이 인간에 필적한다는 심해 문어',
    category: 'deep_sea',
  },
  {
    name: '에메랄드 랍스터',
    emoji: '🦞',
    rarity: 'legendary',
    minSize: 30,
    maxSize: 60,
    baseValue: 90,
    description: '에메랄드빛 껍데기의 전설적 랍스터',
    category: 'saltwater',
  },
  {
    name: '바다신의 말',
    emoji: '🐴',
    rarity: 'legendary',
    minSize: 50,
    maxSize: 120,
    baseValue: 85,
    description: '포세이돈이 타던 해마의 후손',
    category: 'mythical',
  },

  // ═══════════════════════════════════
  //  MYTHIC (10 species)
  // ═══════════════════════════════════
  {
    name: '세계를 낚은 물고기',
    emoji: '🌍',
    rarity: 'mythic',
    minSize: 1,
    maxSize: 1,
    baseValue: 9999,
    description: '이 물고기가 세상을 만들었다',
    category: 'mythical',
  },
  {
    name: '시공간을 유영하는 고래',
    emoji: '🐋',
    rarity: 'mythic',
    minSize: 10000,
    maxSize: 99999,
    baseValue: 1,
    description: '차원 사이를 헤엄치는 신비의 존재',
    category: 'mythical',
  },
  {
    name: '무한의 문어',
    emoji: '🐙',
    rarity: 'mythic',
    minSize: 42,
    maxSize: 42,
    baseValue: 5000,
    description: '다리가 무한 개. 존재 자체가 모순이다.',
    category: 'mythical',
  },
  {
    name: '신이 잃어버린 금붕어',
    emoji: '🐠',
    rarity: 'mythic',
    minSize: 5,
    maxSize: 15,
    baseValue: 8888,
    description: '신이 키우다 놓친 금붕어',
    category: 'mythical',
  },
  {
    name: '리바이어던의 비늘',
    emoji: '🐲',
    rarity: 'mythic',
    minSize: 50,
    maxSize: 50,
    baseValue: 7777,
    description: '성경의 바다 괴물의 비늘 한 조각',
    category: 'mythical',
  },
  {
    name: '요르문간드의 이빨',
    emoji: '🐍',
    rarity: 'mythic',
    minSize: 100,
    maxSize: 100,
    baseValue: 6666,
    description: '세상을 감싼 거대 뱀의 이빨',
    category: 'mythical',
  },
  {
    name: '인어의 눈물',
    emoji: '🧜‍♀️',
    rarity: 'mythic',
    minSize: 1,
    maxSize: 3,
    baseValue: 10000,
    description: '인어가 흘린 결정화된 눈물',
    category: 'mythical',
  },
  {
    name: '용왕의 여의주',
    emoji: '🔮',
    rarity: 'mythic',
    minSize: 5,
    maxSize: 10,
    baseValue: 8000,
    description: '동해 용왕이 다스리던 여의주',
    category: 'mythical',
  },
  {
    name: '심연의 눈',
    emoji: '👁️',
    rarity: 'mythic',
    minSize: 30,
    maxSize: 30,
    baseValue: 6000,
    description: '심해 깊은 곳에서 올라온 거대한 눈',
    category: 'mythical',
  },
  {
    name: '태초의 물방울',
    emoji: '💧',
    rarity: 'mythic',
    minSize: 1,
    maxSize: 1,
    baseValue: 15000,
    description: '우주가 탄생할 때 생긴 최초의 물방울',
    category: 'mythical',
  },
]

// ══════════════════════════════════════
//  LABELS & COLORS
// ══════════════════════════════════════

export const fishRarityLabels: Record<string, string> = {
  common: '⬜ 일반',
  uncommon: '🟩 고급',
  rare: '🟦 희귀',
  epic: '🟪 영웅',
  legendary: '🟨 전설',
  mythic: '🟥 신화',
}

export const fishRarityColors: Record<string, number> = {
  common: 0x808080,
  uncommon: 0x2ecc71,
  rare: 0x3498db,
  epic: 0x9b59b6,
  legendary: 0xf39c12,
  mythic: 0xff0000,
}

// ══════════════════════════════════════
//  FISHING MECHANICS
// ══════════════════════════════════════

export function getAvailableFish(spotLevel: number): FishType[] {
  const allowedRarities: string[] = ['common']
  if (spotLevel >= 2) allowedRarities.push('uncommon')
  if (spotLevel >= 3) allowedRarities.push('rare')
  if (spotLevel >= 4) allowedRarities.push('epic')
  if (spotLevel >= 5) allowedRarities.push('legendary', 'mythic')
  return fishPool.filter((f) => allowedRarities.includes(f.rarity))
}

// Roll a fishing event based on pollution level
export function rollFishingEvent(
  spotLevel: number,
  pollutionLevel: number,
): FishingEvent {
  const roll = Math.random() * 100

  const trashChance = 10 + pollutionLevel * 3
  const lineBreakChance = 5 + pollutionLevel * 1.5
  const treasureChance = Math.max(0, 3 - pollutionLevel * 0.3)
  const doubleCatchChance = Math.max(0, 5 - pollutionLevel * 0.5)
  const goldenHourChance = 2
  const stormChance = 3

  if (roll < lineBreakChance) {
    return { type: 'line_break', message: '낚싯줄이 끊어졌다!', emoji: '💔' }
  } else if (roll < lineBreakChance + trashChance) {
    return { type: 'trash', message: '쓰레기가 걸렸다...', emoji: '🗑️' }
  } else if (roll < lineBreakChance + trashChance + stormChance) {
    return {
      type: 'storm',
      message: '폭풍이 몰아친다! 큰 물고기가 올라올 수도...',
      emoji: '🌊',
    }
  } else if (
    roll <
    lineBreakChance + trashChance + stormChance + goldenHourChance
  ) {
    return {
      type: 'golden_hour',
      message: '황금 시간! 물고기의 가치가 2배!',
      emoji: '✨',
    }
  } else if (
    roll <
    lineBreakChance +
      trashChance +
      stormChance +
      goldenHourChance +
      doubleCatchChance
  ) {
    return {
      type: 'double_catch',
      message: '대박! 한 번에 두 마리를 잡았다!',
      emoji: '🎉',
    }
  } else if (
    roll <
    lineBreakChance +
      trashChance +
      stormChance +
      goldenHourChance +
      doubleCatchChance +
      treasureChance
  ) {
    return { type: 'treasure', message: '보물 상자를 낚았다!', emoji: '🎁' }
  } else if (
    roll <
    lineBreakChance +
      trashChance +
      stormChance +
      goldenHourChance +
      doubleCatchChance +
      treasureChance +
      2
  ) {
    return {
      type: 'sea_monster',
      message: '바다 괴물이 나타났다!',
      emoji: '🦑',
    }
  } else {
    return { type: 'normal', message: '물고기가 걸렸다!', emoji: '🐟' }
  }
}

// Roll fish — pollution reduces rare chances, storm boosts them
export function rollFish(
  spotLevel: number,
  pollutionLevel: number = 0,
  isStorm: boolean = false,
): { fish: FishType; size: number; value: number } {
  const roll = Math.random() * 100

  const pollutionPenalty = pollutionLevel * 2
  const stormBonus = isStorm ? 10 : 0

  const mythicChance = Math.max(
    0,
    (spotLevel >= 5 ? 0.5 : 0) - pollutionPenalty * 0.05 + stormBonus * 0.1,
  )
  const legendaryChance = Math.max(
    0,
    (spotLevel >= 5 ? 2 : 0) - pollutionPenalty * 0.2 + stormBonus * 0.3,
  )
  const epicChance = Math.max(
    0,
    (spotLevel >= 4 ? 5 : 0) - pollutionPenalty * 0.3 + stormBonus * 1,
  )
  const rareChance = Math.max(
    0,
    (spotLevel >= 3 ? 12 : 0) - pollutionPenalty * 0.5 + stormBonus * 2,
  )
  const uncommonChance = Math.max(
    0,
    (spotLevel >= 2 ? 25 : 0) - pollutionPenalty * 0.5 + stormBonus * 2,
  )

  let rarity: string

  if (roll < mythicChance) rarity = 'mythic'
  else if (roll < mythicChance + legendaryChance) rarity = 'legendary'
  else if (roll < mythicChance + legendaryChance + epicChance) rarity = 'epic'
  else if (roll < mythicChance + legendaryChance + epicChance + rareChance)
    rarity = 'rare'
  else if (
    roll <
    mythicChance + legendaryChance + epicChance + rareChance + uncommonChance
  )
    rarity = 'uncommon'
  else rarity = 'common'

  const available = fishPool.filter((f) => f.rarity === rarity)
  if (available.length === 0) {
    const commons = fishPool.filter((f) => f.rarity === 'common')
    const fish = commons[Math.floor(Math.random() * commons.length)]
    const size =
      Math.round(
        (fish.minSize + Math.random() * (fish.maxSize - fish.minSize)) * 10,
      ) / 10
    return { fish, size, value: Math.round(size * fish.baseValue) }
  }

  const fish = available[Math.floor(Math.random() * available.length)]
  const size =
    Math.round(
      (fish.minSize + Math.random() * (fish.maxSize - fish.minSize)) * 10,
    ) / 10
  const value = Math.round(size * fish.baseValue)
  return { fish, size, value }
}

// Roll a random trash item
export function rollTrash(): TrashType {
  return trashPool[Math.floor(Math.random() * trashPool.length)]
}
