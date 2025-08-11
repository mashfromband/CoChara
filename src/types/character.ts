// types/character.ts

export interface EggType {
  id: string
  name: string
  description: string
  gradient: string
  strokeColor: string
  pattern: string
  characteristics: string[]
  rarity: 'common' | 'rare' | 'legendary'
}

export interface CharacterStats {
  level: number
  experience: number
  contentCount: number
  evolutionStage: number
}

export interface CharacterEvolution {
  id: string
  fromStage: number
  toStage: number
  triggeredAt: Date
  chosenOption: number
  availableOptions: EvolutionOption[]
  reason?: string
}

export interface EvolutionOption {
  id: string
  name: string
  description: string
  imageUrl: string
  characteristics: string[]
  rarity: 'common' | 'rare' | 'legendary'
}

export interface Character {
  id: string
  name: string
  eggType: EggType
  stats: CharacterStats
  evolutionHistory: CharacterEvolution[]
  createdAt: Date
  updatedAt: Date
  ownerId: string
  sharedWith: string[]
}

export interface ContentItem {
  id: string
  type: 'music' | 'video' | 'article' | 'image' | 'other'
  url: string
  title: string
  description?: string
  tags: string[]
  genre?: string
  addedAt: Date
  addedBy: string
  characterId: string
}

export type RarityType = 'common' | 'rare' | 'legendary'
export type ContentType = 'music' | 'video' | 'article' | 'image' | 'other'