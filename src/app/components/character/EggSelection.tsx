'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getWeightedRandomEggType, eggTypes } from '@/data/eggTypes'
import { EggType } from '@/types/character'
import EggCard from './EggCard'
import { useSession } from 'next-auth/react'
import { useLocalStorage } from '@/hooks/useLocalStorage'

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
  // セッション情報を取得（ユーザータイプの確認用）
  const { data: session } = useSession()
  // ユーザー名が「Admin」の場合、管理者権限を付与
  const isAdmin = session?.user?.name === 'Admin'
  // ユーザーごとにローカルストレージのキーを分離
  const storageKeySuffix = session?.user?.email ?? 'guest'
  
  // LocalStorageから現在のガチャ状態を取得（ユーザー別キー）
  const [currentGachaState, setCurrentGachaState] = useLocalStorage<{
    randomEggs: string[],
    selectedEgg: string | null,
    canReroll: boolean,
    rerollCount: number
  }>(`currentGachaState:${storageKeySuffix}`, {
    randomEggs: [],
    selectedEgg: null,
    canReroll: true,
    rerollCount: 0
  })
  
  // 3つのランダムな卵を保持する状態
  const [randomEggs, setRandomEggs] = useState<EggType[]>([])
  const [selectedEgg, setSelectedEgg] = useState<string | null>(currentGachaState.selectedEgg)
  const [showMessage, setShowMessage] = useState<string | null>(null)
  const [rerollCount, setRerollCount] = useState(currentGachaState.rerollCount)
  const [canReroll, setCanReroll] = useState(currentGachaState.canReroll)
  const [showGachaOption, setShowGachaOption] = useState(false)
  const [showDefaultEggs, setShowDefaultEggs] = useState(false)
  
  // クライアントサイドでのみレアリティに基づいたランダムな卵を設定
  // 取得済みの卵は表示しない
  useEffect(() => {
    if (!isAfterThirdEgg) {
      // LocalStorageに保存された卵IDがある場合はそれを使用
      if (currentGachaState.randomEggs.length > 0) {
        const savedEggs = currentGachaState.randomEggs
          .map(eggId => eggTypes.find(egg => egg.id === eggId))
          .filter((egg): egg is EggType => egg !== undefined);
        
        if (savedEggs.length === 3) {
          setRandomEggs(savedEggs);
          return;
        }
      }
      
      // 保存された状態がない場合は新しく生成
      const eggs = generateRandomEggs()
      setRandomEggs(eggs)
      
      // LocalStorageに保存
      setCurrentGachaState({
        ...currentGachaState,
        randomEggs: eggs.map(egg => egg.id)
      })
    } else {
      // 4つ目以降は選択画面を表示
      setShowGachaOption(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [excludeEggIds, isAfterThirdEgg, storageKeySuffix])

  // レアリティに基づいた卵を3つ生成（取得済みの卵は除外）
  const generateRandomEggs = () => {
    const eggs: EggType[] = []
    const excluded = new Set(excludeEggIds)

    while (eggs.length < 3) {
      const egg = getWeightedRandomEggType()
      if (!excluded.has(egg.id) && !eggs.some(e => e.id === egg.id)) {
        eggs.push(egg)
      }
    }

    return eggs
  }

  const handleEggSelect = (eggId: string) => {
    setSelectedEgg(eggId)
    
    // LocalStorageに選択状態を保存（ユーザー別キー）
    setCurrentGachaState({
      ...currentGachaState,
      selectedEgg: eggId
    })
    
    const messages = [
      '何かが動いている...',
      '温かい鼓動を感じる',
      '神秘的な光を放っている',
      '君に選ばれるのを待っているみたいだ！'
    ]
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)]
    setShowMessage(randomMessage)
    
    setTimeout(() => setShowMessage(null), 3000)
  }

  // 卵を再抽選する関数
  const handleReroll = () => {
    if (canReroll || isAdmin) {
      const newEggs = generateRandomEggs()
      setRandomEggs(newEggs)
      
      const newRerollCount = rerollCount + 1
      setRerollCount(newRerollCount)
      
      // Adminユーザーの場合は何度でも再抽選可能
      const newCanReroll = isAdmin ? true : false
      if (!isAdmin) {
        setCanReroll(false)
      }
      
      setSelectedEgg(null)
      
      // LocalStorageに状態を保存（ユーザー別キー）
      setCurrentGachaState({
        randomEggs: newEggs.map(egg => egg.id),
        selectedEgg: null,
        canReroll: newCanReroll,
        rerollCount: newRerollCount
      })
      
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
    const eggs = generateRandomEggs()
    setRandomEggs(eggs)
    
    // LocalStorageに状態を保存（ユーザー別キー）
    setCurrentGachaState({
      ...currentGachaState,
      randomEggs: eggs.map(egg => egg.id)
    })
  }

  // デフォルト卵から選ぶ選択をした場合
  const handleChooseDefaultEggs = () => {
    setShowGachaOption(false)
    setShowDefaultEggs(true)
    // デフォルト卵のみを表示（取得済みの卵は除外）
    const defaultEggs = eggTypes.filter(egg => !excludeEggIds.includes(egg.id))
    const eggs = defaultEggs.slice(0, 3) // 最初の3つを表示
    setRandomEggs(eggs)
    
    // LocalStorageに状態を保存（ユーザー別キー）
    setCurrentGachaState({
      ...currentGachaState,
      randomEggs: eggs.map(egg => egg.id)
    })
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
      
      {/* 卵表示 - レスポンシブ配置の3つ */}
      {(!showGachaOption || !isAfterThirdEgg) && (
        <div className="max-w-6xl mx-auto">
          {/* レスポンシブ配置 */}
          {/* lg (1024px以上): 横に3つ並べる */}
          {/* md (768px以上): 上に1つ、下に2つの三角形配置 */}
          {/* sm (640px未満): 縦に1列に並べる */}
          <div className="flex flex-col items-center">
            {/* 大画面では横に3つ並べる */}
            <motion.div
              className="hidden lg:flex lg:flex-row lg:justify-center lg:gap-6 lg:w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
            >
              {randomEggs.length > 0 && randomEggs.map((eggType, index) => (
                <EggCard
                  key={`${eggType.id}-row-${index}`}
                  eggType={eggType}
                  isSelected={selectedEgg === eggType.id}
                  onSelect={handleEggSelect}
                  index={index}
                />
              ))}
            </motion.div>
            
            {/* 中画面では三角形配置（現在の配置） */}
            <div className="hidden md:block lg:hidden">
              {/* 最初の卵（頂点） */}
              <motion.div
                className="mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.3 }}
              >
                {randomEggs.length > 0 && (
                  <EggCard
                    key={`${randomEggs[0].id}-triangle-0`}
                    eggType={randomEggs[0]}
                    isSelected={selectedEgg === randomEggs[0].id}
                    onSelect={handleEggSelect}
                    index={0}
                  />
                )}
              </motion.div>
              
              {/* 下の2つの卵（底辺） */}
              <motion.div
                className="flex justify-center gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
              >
                {randomEggs.length > 2 && randomEggs.slice(1, 3).map((eggType, index) => (
                  <div
                    key={`${eggType.id}-triangle-${index + 1}`}
                    className={index === 1 ? 'ml-4' : ''}
                  >
                    <EggCard
                      eggType={eggType}
                      isSelected={selectedEgg === eggType.id}
                      onSelect={handleEggSelect}
                      index={index + 1}
                    />
                  </div>
                ))}
              </motion.div>
            </div>
            
            {/* 小画面では縦に1列に並べる */}
            <motion.div
              className="flex flex-col items-center gap-6 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
            >
              {randomEggs.length > 0 && randomEggs.map((eggType, index) => (
                <EggCard
                  key={`${eggType.id}-column-${index}`}
                  eggType={eggType}
                  isSelected={selectedEgg === eggType.id}
                  onSelect={handleEggSelect}
                  index={index}
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
            className={`px-6 py-3 rounded-full text-white font-medium shadow-md transition-all ${canReroll || isAdmin ? 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:shadow-lg' : 'bg-gray-400 cursor-not-allowed'}`}
            whileHover={(canReroll || isAdmin) ? { scale: 1.05 } : {}}
            whileTap={(canReroll || isAdmin) ? { scale: 0.95 } : {}}
            onClick={handleReroll}
            disabled={!(canReroll || isAdmin)}
          >
            {isAdmin ? '卵を再抽選する (Admin)' : canReroll ? '卵を再抽選する' : '再抽選は1回のみ可能です'}
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