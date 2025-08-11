'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { EggType } from '@/types/character'
import EggSVG from './EggSVG'
import Sparkle from '../ui/Sparkle'

interface EggCardProps {
  eggType: EggType
  isSelected: boolean
  onSelect: (eggId: string) => void
  index: number
}

const EggCard: React.FC<EggCardProps> = ({ 
  eggType, 
  isSelected, 
  onSelect,
  index 
}) => {
  const getRarityColor = (rarity: EggType['rarity']) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 bg-gray-100'
      case 'rare': return 'text-blue-600 bg-blue-100'
      case 'legendary': return 'text-purple-600 bg-purple-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getRarityBorder = (rarity: EggType['rarity']) => {
    switch (rarity) {
      case 'common': return 'border-gray-200'
      case 'rare': return 'border-blue-200'
      case 'legendary': return 'border-purple-200'
      default: return 'border-gray-200'
    }
  }

  return (
    <motion.div
      className={`relative bg-gray-50/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border transition-all duration-300 hover:shadow-3xl w-80 h-[440px] ${getRarityBorder(eggType.rarity)} ${
        isSelected ? 'ring-4 ring-yellow-400 ring-opacity-60' : ''
      }`}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{ y: -5 }}
    >
      {/* レアリティバッジ */}
      <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold ${getRarityColor(eggType.rarity)}`}>
        {eggType.rarity.toUpperCase()}
      </div>

      {/* 卵SVG */}
      <div className="flex justify-center h-40">
        <EggSVG
          eggType={eggType}
          isSelected={isSelected}
          onClick={() => onSelect(eggType.id)}
          className="h-full"
        />
      </div>

      {/* 卵情報 */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-800 my-3">
          {eggType.name}
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          {eggType.description}
        </p>
        
        {/* 特徴タグ */}
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {eggType.characteristics.map((characteristic, i) => (
            <span
              key={i}
              className="px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 text-xs rounded-full font-medium"
            >
              {characteristic}
            </span>
          ))}
        </div>

        {/* 選択ボタン */}
        <motion.button
          className={`w-full py-3 rounded-xl font-bold transition-all duration-300 ${
            isSelected
              ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg'
              : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-blue-100 hover:to-purple-100'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(eggType.id)}
        >
          {isSelected ? '選択中' : '選択する'}
        </motion.button>
      </div>
    </motion.div>
  )
}

export default EggCard