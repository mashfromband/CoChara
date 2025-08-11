'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getWeightedRandomEggType, eggTypes } from '@/data/eggTypes'
import { EggType } from '@/types/character'
import EggCard from './EggCard'

interface EggSelectionProps {
  onEggSelected?: (eggId: string) => void
  className?: string
  excludeEggIds?: string[] // 表示しない卵IDのリスト
  isAfterThirdEgg?: boolean // 3つ目の卵選択後かどうか
}

const EggSelection: React.FC<EggSelectionProps> = ({ 
  onEggSelected,
  className = '',
  excludeEggIds = [],
  isAfterThirdEgg = false
}) => {
  // 3つのランダムな卵を保持する状態
  const [randomEggs, setRandomEggs] = useState(Array(3).fill(eggTypes[0]))
  const [selectedEgg, setSelectedEgg] = useState<string | null>(null)
  const [showMessage, setShowMessage] = useState<string | null>(null)
  const [rerollCount, setRerollCount] = useState(0)
  const [canReroll, setCanReroll] = useState(true)
  const [showGachaOption, setShowGachaOption] = useState(false)
  const [showDefaultEggs, setShowDefaultEggs] = useState(false)
  
  // クライアントサイドでのみレアリティに基づいたランダムな卵を設定
  // 取得済みの卵は表示しない
  useEffect(() => {
    if (!isAfterThirdEgg) {
      // 3つ目までは通常のランダム卵を表示
      generateRandomEggs()
    } else {
      // 4つ目以降は選択画面を表示
      setShowGachaOption(true)
    }
  }, [excludeEggIds, isAfterThirdEgg])
  
  // 3つのランダムな卵を生成する関数
  const generateRandomEggs = () => {
    const newEggs: EggType[] = []
    
    for (let i = 0; i < 3; i++) {
      let newEgg = getWeightedRandomEggType()
      
      // 取得済みの卵や、既に選ばれた卵が選ばれた場合は再抽選
      let attempts = 0
      const maxAttempts = 10 // 無限ループ防止
      
      while ((excludeEggIds.includes(newEgg.id) || newEggs.some(egg => egg?.id === newEgg.id)) && attempts < maxAttempts) {
        newEgg = getWeightedRandomEggType()
        attempts++
      }
      
      // 全ての卵が取得済みの場合や、maxAttemptsに達した場合は、取得済みでない卵をフィルタリングして選択
      if (attempts >= maxAttempts) {
        const availableEggs = eggTypes.filter(egg => 
          !excludeEggIds.includes(egg.id) && !newEggs.some(selectedEgg => selectedEgg?.id === egg.id)
        )
        if (availableEggs.length > 0) {
          newEgg = availableEggs[Math.floor(Math.random() * availableEggs.length)]
        }
      }
      
      newEggs.push(newEgg)
    }
    
    setRandomEggs(newEggs)
  }

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
  
  // 卵を再抽選する関数
  const handleReroll = () => {
    if (canReroll) {
      generateRandomEggs()
      setRerollCount(rerollCount + 1)
      setCanReroll(false)
      setSelectedEgg(null)
      
      setShowMessage('新しい卵が登場しました！')
      setTimeout(() => setShowMessage(null), 3000)
    }
  }

  const handleConfirmSelection = () => {
    if (selectedEgg && onEggSelected) {
      onEggSelected(selectedEgg)
    }
  }

  // ガチャを引く選択をした場合
  const handleChooseGacha = () => {
    setShowGachaOption(false)
    generateRandomEggs()
  }

  // デフォルト卵から選ぶ選択をした場合
  const handleChooseDefaultEggs = () => {
    setShowGachaOption(false)
    setShowDefaultEggs(true)
    // デフォルト卵のみを表示（取得済みの卵は除外）
    const defaultEggs = eggTypes.filter(egg => !excludeEggIds.includes(egg.id))
    setRandomEggs(defaultEggs.slice(0, 3)) // 最初の3つを表示
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

      {/* 4つ目以降の卵選択時の選択肢 */}
      {showGachaOption && isAfterThirdEgg && (
        <motion.div
          className="max-w-6xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold text-white mb-8">卵の入手方法を選択してください</h2>
          <div className="flex flex-col md:flex-row justify-center gap-8">
            <motion.div
              className="bg-gradient-to-br from-purple-500 to-indigo-600 p-8 rounded-xl shadow-lg cursor-pointer hover:shadow-xl transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleChooseGacha}
            >
              <h3 className="text-2xl font-bold text-white mb-4">卵ガチャを引く</h3>
              <p className="text-white/90 mb-6">ランダムな卵が出現します。レアな卵が出るかも！</p>
              <div className="bg-white/20 p-4 rounded-lg">
                <span className="text-white font-bold">ランダム性：★★★</span>
              </div>
            </motion.div>
            
            <motion.div
              className="bg-gradient-to-br from-blue-500 to-cyan-600 p-8 rounded-xl shadow-lg cursor-pointer hover:shadow-xl transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleChooseDefaultEggs}
            >
              <h3 className="text-2xl font-bold text-white mb-4">デフォルト卵から選ぶ</h3>
              <p className="text-white/90 mb-6">基本的な卵の中から好きなものを選べます。</p>
              <div className="bg-white/20 p-4 rounded-lg">
                <span className="text-white font-bold">選択肢：★★★</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
      
      {/* 卵表示 - 三角形配置の3つ */}
      {(!showGachaOption || !isAfterThirdEgg) && (
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center">
            {/* 最初の卵（頂点） */}
            <motion.div
              className="mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
            >
              <EggCard
                key={`${randomEggs[0].id}-0`}
                eggType={randomEggs[0]}
                isSelected={selectedEgg === randomEggs[0].id}
                onSelect={handleEggSelect}
                index={0}
              />
            </motion.div>
            
            {/* 下の2つの卵（底辺） */}
            <motion.div
              className="flex justify-center gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
            >
              {randomEggs.slice(1, 3).map((eggType, index) => (
                <EggCard
                  key={`${eggType.id}-${index + 1}`}
                  eggType={eggType}
                  isSelected={selectedEgg === eggType.id}
                  onSelect={handleEggSelect}
                  index={index + 1}
                />
              ))}
            </motion.div>
          </div>
        </div>
      )}
      
      {/* ボタン群 - 再抽選と決定ボタンを横並びに */}
      {(!showGachaOption || !isAfterThirdEgg) && (
        <motion.div
          className="flex justify-center items-center gap-4 mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
        >
          {/* 再抽選ボタン */}
          <motion.button
            className={`px-6 py-3 rounded-full text-white font-medium shadow-md transition-all ${canReroll ? 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:shadow-lg' : 'bg-gray-400 cursor-not-allowed'}`}
            whileHover={canReroll ? { scale: 1.05 } : {}}
            whileTap={canReroll ? { scale: 0.95 } : {}}
            onClick={handleReroll}
            disabled={!canReroll}
          >
            {canReroll ? '卵を再抽選する' : '再抽選は1回のみ可能です'}
          </motion.button>

          {/* 決定ボタン - 卵が選択されている場合のみ表示 */}
          {selectedEgg && (
            <motion.button
              className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-8 py-3 rounded-full text-lg font-bold shadow-lg hover:shadow-xl transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleConfirmSelection}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              この卵で始める 🥚✨
            </motion.button>
          )}
        </motion.div>
      )}

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

      {/* 決定ボタンは再抽選ボタンの右側に移動したため、ここでは表示しない */}

      {/* 選択状態表示 */}
      {selectedEgg && (
        <motion.div
          className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm">
            選択中: {randomEggs.find(egg => egg.id === selectedEgg)?.name}
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default EggSelection