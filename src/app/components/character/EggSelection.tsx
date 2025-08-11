'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getWeightedRandomEggType, eggTypes } from '@/data/eggTypes'
import EggCard from './EggCard'

interface EggSelectionProps {
  onEggSelected?: (eggId: string) => void
  className?: string
}

const EggSelection: React.FC<EggSelectionProps> = ({ 
  onEggSelected,
  className = ''
}) => {
  // 初期値は最初の卵タイプを使用し、クライアントサイドでレアリティに基づいたランダム値に置き換える
  const [randomEgg, setRandomEgg] = useState(eggTypes[0])
  const [selectedEgg, setSelectedEgg] = useState<string | null>(null)
  const [showMessage, setShowMessage] = useState<string | null>(null)
  
  // クライアントサイドでのみレアリティに基づいたランダムな卵を設定
  useEffect(() => {
    setRandomEgg(getWeightedRandomEggType())
  }, [])

  const handleEggSelect = (eggId: string) => {
    setSelectedEgg(eggId)
    
    const messages = [
      '何かが動いている...',
      'まだ時期ではないようだ',
      '温かい鼓動を感じる',
      'もう少しコンテンツを集めよう',
      '神秘的な光を放っている'
    ]
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)]
    setShowMessage(randomMessage)
    
    setTimeout(() => setShowMessage(null), 3000)
  }

  const handleConfirmSelection = () => {
    if (selectedEgg && onEggSelected) {
      onEggSelected(selectedEgg)
    }
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-indigo-500 via-purple-600 to-blue-800 p-6 ${className}`}>
      {/* タイトル */}
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
          CoChara
        </h1>
        <p className="text-xl text-white/90 drop-shadow-md">
          キャラクター育成の始まり
        </p>
        <p className="text-sm text-white/80 mt-2">
          あなたの相棒となる卵を選んでください
        </p>
      </motion.div>

      {/* 卵表示 - ランダムな1つのみ */}
      <div className="max-w-xl mx-auto">
        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <EggCard
            key={randomEgg.id}
            eggType={randomEgg}
            isSelected={selectedEgg === randomEgg.id}
            onSelect={handleEggSelect}
            index={0}
          />
        </motion.div>
      </div>

      {/* メッセージトースト */}
      {showMessage && (
        <motion.div
          className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          key="message-toast"
        >
          <div className="bg-black/80 text-white px-6 py-3 rounded-full text-sm font-medium backdrop-blur-sm">
            {showMessage}
          </div>
        </motion.div>
      )}

      {/* 決定ボタン */}
      {selectedEgg && (
        <motion.div
          className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3 }}
          key="confirm-button"
        >
          <motion.button
            className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-8 py-3 rounded-full text-lg font-bold shadow-lg hover:shadow-xl transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleConfirmSelection}
          >
            この卵で始める 🥚✨
          </motion.button>
        </motion.div>
      )}

      {/* 選択状態表示 */}
      {selectedEgg && (
        <motion.div
          className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm">
            選択中: {randomEgg.name}
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default EggSelection