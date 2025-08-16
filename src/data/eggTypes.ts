// data/eggTypes.ts

import { EggType } from '@/types/character'

export const eggTypes: EggType[] = [
  {
    id: 'classic',
    name: 'クラシック',
    description: 'シンプルで美しい白い卵。あらゆる可能性を秘めた純粋な始まり。どんなキャラクターにも進化できる万能タイプ。',
    gradient: 'from-white via-blue-50 to-blue-100',
    strokeColor: 'stroke-gray-300',
    pattern: 'simple',
    characteristics: ['バランス型', '万能', '安定成長'],
    rarity: 'common'
  },
  {
    id: 'pastel',
    name: 'パステル',
    description: '優しいピンクのグラデーションが美しい卵。愛らしく温かいキャラクターに進化しやすい傾向。',
    gradient: 'from-pink-100 via-pink-200 to-purple-200',
    strokeColor: 'stroke-pink-400',
    pattern: 'heart',
    characteristics: ['可愛い系', '癒し', '社交的'],
    rarity: 'common'
  },
  {
    id: 'cosmic',
    name: 'コズミック',
    description: '宇宙の神秘を宿した深い青紫の卵。星屑が散りばめられ、幻想的で知的なキャラクターへと導く。',
    gradient: 'from-indigo-900 via-purple-800 to-indigo-900',
    strokeColor: 'stroke-yellow-400',
    pattern: 'stars',
    characteristics: ['神秘的', '知的', '幻想'],
    rarity: 'rare'
  },
  {
    id: 'natural',
    name: 'ナチュラル',
    description: '自然の恵みを感じる緑の卵。葉っぱの模様が印象的で、癒し系や自然派のキャラクターに成長する傾向。',
    gradient: 'from-green-100 via-green-200 to-green-300',
    strokeColor: 'stroke-green-500',
    pattern: 'leaves',
    characteristics: ['自然派', '癒し系', '穏やか'],
    rarity: 'common'
  },
  {
    id: 'fire',
    name: 'ファイアー',
    description: '情熱的なオレンジから赤のグラデーション。炎のような模様が特性的で、エネルギッシュで活動的なキャラクターへ。',
    gradient: 'from-yellow-200 via-orange-400 to-red-600',
    strokeColor: 'stroke-red-600',
    pattern: 'flames',
    characteristics: ['情熱的', 'アクティブ', 'リーダー'],
    rarity: 'rare'
  },
  {
    id: 'aurora',
    name: 'オーロラ',
    description: '虹色に輝く神秘的な卵。オーロラのような美しい色彩で、創造的で芸術的なキャラクターに進化する特別なタイプ。',
    gradient: 'from-purple-400 via-blue-400 via-green-400 via-yellow-400 to-red-400',
    strokeColor: 'stroke-white',
    pattern: 'aurora',
    characteristics: ['創造的', '芸術的', '独創性'],
    rarity: 'legendary'
  }
]

// 卵タイプを取得するユーティリティ関数
export const getEggTypeById = (id: string): EggType | undefined => {
  return eggTypes.find(egg => egg.id === id)
}

// レアリティ別に卵タイプを取得
export const getEggTypesByRarity = (rarity: EggType['rarity']): EggType[] => {
  return eggTypes.filter(egg => egg.rarity === rarity)
}

// ランダムな卵タイプを取得
export const getRandomEggType = (): EggType => {
  return eggTypes[Math.floor(Math.random() * eggTypes.length)]
}

// レアリティを考慮したランダム選択（重み付き）
export const getWeightedRandomEggType = (): EggType => {
  const weights = {
    common: 75,   // 75%
    rare: 20,     // 20%  
    legendary: 5  // 5%
  }
  
  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0)
  const random = Math.random() * totalWeight
  
  let currentWeight = 0
  for (const [rarity, weight] of Object.entries(weights)) {
    currentWeight += weight
    if (random <= currentWeight) {
      const candidateEggs = getEggTypesByRarity(rarity as EggType['rarity'])
      return candidateEggs[Math.floor(Math.random() * candidateEggs.length)]
    }
  }
  
  // フォールバック
  return eggTypes[0]
}