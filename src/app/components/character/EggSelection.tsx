'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { eggTypes } from '@/data/eggTypes'
import EggCard from './EggCard'

interface EggSelectionProps {
  onEggSelected?: (eggId: string) => void
  className?: string
}

const EggSelection: React.FC<EggSelectionProps> = ({ 
  onEggSelected,
  className = ''
}) => {
  const [selectedEgg, setSelectedEgg] = useState<string | null>(null)
  const [showMessage, setShowMessage] = useState<string | null>(null)

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

      {/* 卵グリッド */}
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          {eggTypes.map((egg, index) => (
            <EggCard
              key={egg.id}
              eggType={egg}
              isSelected={selectedEgg === egg.id}
              onSelect={handleEggSelect}
              index={index}
            />
          ))}
        </motion.div>
      </div>

      {/* メッセージトースト */}
      <AnimatePresence>
        {showMessage && (
          <motion.div
            className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-black/80 text-white px-6 py-3 rounded-full text-sm font-medium backdrop-blur-sm">
              {showMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 決定ボタン */}
      <AnimatePresence>
        {selectedEgg && (
          <motion.div
            className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.5 }}
          >
            <motion.button
              className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-8 py-4 rounded-full text-lg font-bold shadow-2xl hover:shadow-3xl transition-shadow duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleConfirmSelection}
            >
              この卵で始める 🥚✨
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 選択状態表示 */}
      {selectedEgg && (
        <motion.div
          className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm">
            選択中: {eggTypes.find(egg => egg.id === selectedEgg)?.name}
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default EggSelection